#!/usr/bin/env python
"""
build_neuron_solid.py — the "real mesh" variant of the neuron viewer.

Unlike build_neuron_bin.py (light skeleton lines), this fetches each neuron's
actual reconstructed surface mesh from FlyWire and ships a decimated solid mesh,
so soma and neurites look like the Codex/Neuroglancer view. Heavier by nature
(real geometry), so it is an opt-in variant, not the default.

Pipeline: CloudVolume fetches the coarsest LOD of the public FAFB 783 draco mesh
(token-free, from gs://flywire_v141_m783) -> weld chunk-seam duplicate vertices
-> QEM decimate (pyfqmr) -> canonical FAFB transform (shared with the skeleton
build) -> pack into a compact multi-object .bin.

Needs: cloud-volume, pyfqmr, DracoPy, numpy. Run once, commit the .bin.
Data (c) Princeton University / FlyWire public release 783.

Usage:
    python scripts/build_neuron_solid.py 720575940615101747 720575940639278399 \
        720575940640749939 --out public/neurons/exr1_solid
"""
from __future__ import annotations
import argparse
import os
import struct
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
from build_neuron_bin import normalize  # canonical transform, shared

MESH_SRC = "precomputed://gs://flywire_v141_m783"
MAGIC_SOLID = 0x314D4D4E  # 'NMM1' little-endian (neuron mesh)
SOLID_VERSION = 1  # positions int16 (pos*32767), indices uint16 (verts < 65536)


def weld(v: np.ndarray, f: np.ndarray, nm: float):
    """Merge coincident vertices (LOD chunk seams) so decimation can proceed."""
    key = np.round(v / nm).astype(np.int64)
    uniq, inv = np.unique(key, axis=0, return_inverse=True)
    inv = inv.ravel()
    rep = np.zeros((len(uniq), 3)); cnt = np.zeros(len(uniq))
    np.add.at(rep, inv, v); np.add.at(cnt, inv, 1); rep /= cnt[:, None]
    f = inv[f]
    good = (f[:, 0] != f[:, 1]) & (f[:, 1] != f[:, 2]) & (f[:, 0] != f[:, 2])
    return rep, f[good]


def fetch_solid(cv, rid: int, lod: int, weld_nm: float, target_faces: int):
    import pyfqmr
    m = cv.mesh.get(rid, lod=lod)
    mesh = m[rid] if isinstance(m, dict) else m
    v = mesh.vertices.astype(np.float64)
    f = mesh.faces.astype(np.int64)
    raw_f = len(f)
    v, f = weld(v, f, weld_nm)
    s = pyfqmr.Simplify()
    s.setMesh(v, f)
    s.simplify_mesh(target_count=target_faces, aggressiveness=7, preserve_border=False, verbose=0)
    vv, ff, _ = s.getMesh()
    return vv.astype(np.float64), ff.astype(np.int64), raw_f


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("root_ids", nargs="+", type=int)
    ap.add_argument("--out", default="public/neurons/neurons_solid")
    ap.add_argument("--lod", type=int, default=3, help="coarsest LOD is usually 3")
    ap.add_argument("--weld-nm", type=float, default=30.0)
    ap.add_argument("--target-faces", type=int, default=40000, help="per-neuron decimation target")
    args = ap.parse_args()

    from cloudvolume import CloudVolume
    cv = CloudVolume(MESH_SRC, use_https=True, progress=False)

    neurons = []
    for rid in args.root_ids:
        print(f"fetch  {rid} (lod {args.lod}) ...", flush=True)
        vv, ff, raw_f = fetch_solid(cv, rid, args.lod, args.weld_nm, args.target_faces)
        print(f"       {raw_f:>7d} -> {len(ff):>6d} faces, {len(vv):>6d} verts", flush=True)
        neurons.append((vv, ff))

    os.makedirs(os.path.dirname(args.out) or ".", exist_ok=True)
    bin_path = args.out + ".bin"
    with open(bin_path, "wb") as fh:
        fh.write(struct.pack("<IIII", MAGIC_SOLID, SOLID_VERSION, len(neurons), 0))
        for vv, ff in neurons:
            if len(vv) >= 65536:
                raise SystemExit(f"neuron has {len(vv)} verts >= 65536; lower --target-faces for uint16 indices")
            npos = normalize(vv)  # canonical FAFB space, y-flipped, within [-1,1]
            q = np.clip(np.round(npos * 32767.0), -32767, 32767).astype("<i2")
            fh.write(struct.pack("<II", len(npos), len(ff)))
            fh.write(q.tobytes())
            fh.write(ff.astype("<u2").tobytes())

    size = os.path.getsize(bin_path)
    tv = sum(len(v) for v, _ in neurons)
    tf = sum(len(f) for _, f in neurons)
    print(f"\nwrote {bin_path}  ({size/1024:.0f} KB)  {tv} verts, {tf} faces", flush=True)


if __name__ == "__main__":
    main()

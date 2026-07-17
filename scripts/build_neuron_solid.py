#!/usr/bin/env python
"""
build_neuron_solid.py — data pipeline for the blog's <NeuronViewer>.

Fetches each neuron's real reconstructed surface mesh from FlyWire and ships a
decimated solid mesh, so soma and neurites look like the Codex/Neuroglancer view.
Optionally also builds the translucent whole-brain hull.

Pipeline (neurons): CloudVolume fetches the coarsest LOD of the public FAFB 783
draco mesh (token-free, from gs://flywire_v141_m783) -> weld chunk-seam duplicate
vertices -> QEM decimate (pyfqmr) -> canonical FAFB transform -> pack int16
positions + uint16 indices into a compact multi-object .bin ('NMM1').

Pipeline (--brain): the whole-brain neuroglancer legacy mesh (numpy only) ->
grid-cluster decimate -> same canonical transform -> 'BRN1' .bin.

Get root ids from Codex (https://codex.flywire.ai): search e.g. `label == ExR1`,
then "Copy IDs". Publishing a figure? Cite Dorkenwald et al. 2024 (FlyWire) and
Schlegel et al. 2024 (annotations). Data (c) Princeton University, release 783.

Needs: cloud-volume, pyfqmr, DracoPy, numpy. Run once, commit the .bin files.

Usage:
    python scripts/build_neuron_solid.py 720575940615101747 720575940639278399 \
        720575940640749939 --out public/neurons/exr1_solid --brain
"""
from __future__ import annotations
import argparse
import json
import os
import struct
import urllib.request

import numpy as np

MESH_SRC = "precomputed://gs://flywire_v141_m783"
BRAIN_BASE = "https://storage.googleapis.com/flywire_neuropil_meshes/whole_neuropil/brain_mesh_v3"
MAGIC_SOLID = 0x314D4D4E  # 'NMM1' little-endian (neuron mesh)
MAGIC_BRAIN = 0x314E5242  # 'BRN1' little-endian (brain hull mesh)
SOLID_VERSION = 1  # positions int16 (pos*32767), indices uint16 (verts < 65536)
BRAIN_VERSION = 1

# Canonical FAFB normalization, derived once from the whole-brain mesh bbox (nm).
# BOTH neurons and the brain hull are transformed by THIS, so they co-register in
# the viewer regardless of which file is built when. Y is flipped (EM y grows down).
FAFB_MIN = np.array([188790.0, 75002.0, 2007.0])
FAFB_MAX = np.array([854603.0, 399276.0, 271205.0])
FAFB_CENTER = (FAFB_MIN + FAFB_MAX) / 2.0
FAFB_SCALE = 1.0 / ((FAFB_MAX - FAFB_MIN).max() / 2.0)


def normalize(p: np.ndarray) -> np.ndarray:
    """Canonical FAFB nm -> viewer space (~[-1,1] on the widest axis, y-up)."""
    q = (p - FAFB_CENTER) * FAFB_SCALE
    q[:, 1] = -q[:, 1]
    return q


# --------------------------------------------------------------------------- #
# Neuron surface meshes (real geometry, via CloudVolume + draco)
# --------------------------------------------------------------------------- #
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


def build_solid(out_path: str, root_ids, lod: int, weld_nm: float, target_faces: int):
    from cloudvolume import CloudVolume
    cv = CloudVolume(MESH_SRC, use_https=True, progress=False)
    neurons = []
    for rid in root_ids:
        print(f"neuron {rid} (lod {lod}) ...", flush=True)
        vv, ff, raw_f = fetch_solid(cv, rid, lod, weld_nm, target_faces)
        print(f"       {raw_f:>7d} -> {len(ff):>6d} faces, {len(vv):>6d} verts", flush=True)
        neurons.append((vv, ff))

    os.makedirs(os.path.dirname(out_path) or ".", exist_ok=True)
    with open(out_path, "wb") as fh:
        fh.write(struct.pack("<IIII", MAGIC_SOLID, SOLID_VERSION, len(neurons), 0))
        for vv, ff in neurons:
            if len(vv) >= 65536:
                raise SystemExit(f"neuron has {len(vv)} verts >= 65536; lower --target-faces for uint16 indices")
            q = np.clip(np.round(normalize(vv) * 32767.0), -32767, 32767).astype("<i2")
            fh.write(struct.pack("<II", len(vv), len(ff)))
            fh.write(q.tobytes())
            fh.write(ff.astype("<u2").tobytes())

    size = os.path.getsize(out_path)
    tf = sum(len(f) for _, f in neurons)
    meta = {
        "source": "flywire_fafb_783_public_mesh",
        "url": MESH_SRC,
        "attribution": "FlyWire FAFB public release 783 (c) Princeton University. "
                       "Cite Dorkenwald et al. 2024 & Schlegel et al. 2024.",
        "root_ids": [str(r) for r in root_ids],
        "lod": lod, "target_faces": target_faces,
        "neurons": len(neurons), "faces": tf, "bytes": size,
    }
    with open(os.path.splitext(out_path)[0] + ".json", "w", encoding="utf-8") as fh:
        json.dump(meta, fh, indent=2)
    print(f"\nwrote {out_path}  ({size/1024:.0f} KB)  {tf} faces", flush=True)


# --------------------------------------------------------------------------- #
# Whole-brain hull (numpy only, neuroglancer legacy mesh)
# --------------------------------------------------------------------------- #
def fetch_brain_mesh():
    man = json.loads(urllib.request.urlopen(f"{BRAIN_BASE}/mesh/1:0", timeout=60).read())
    raw = urllib.request.urlopen(f"{BRAIN_BASE}/mesh/{man['fragments'][0]}", timeout=180).read()
    nv = struct.unpack_from("<I", raw, 0)[0]
    verts = np.frombuffer(raw, dtype="<f4", count=nv * 3, offset=4).reshape(nv, 3).astype(np.float64)
    ntri = (len(raw) - 4 - nv * 12) // 12
    faces = np.frombuffer(raw, dtype="<u4", count=ntri * 3, offset=4 + nv * 12).reshape(ntri, 3).astype(np.int64)
    return verts, faces


def decimate_grid(verts: np.ndarray, faces: np.ndarray, ncells: int):
    """Vertex-clustering decimation (fine for a big convex-ish hull, not thin tubes)."""
    lo = verts.min(0)
    s = (verts.max(0) - lo).max() / ncells
    cell = np.floor((verts - lo) / s).astype(np.int64)
    uniq, inv = np.unique(cell, axis=0, return_inverse=True)
    inv = inv.ravel()
    m = len(uniq)
    rep = np.zeros((m, 3)); cnt = np.zeros(m)
    np.add.at(rep, inv, verts); np.add.at(cnt, inv, 1); rep /= cnt[:, None]
    f = inv[faces]
    good = (f[:, 0] != f[:, 1]) & (f[:, 1] != f[:, 2]) & (f[:, 0] != f[:, 2])
    f = f[good]
    _, ui = np.unique(np.sort(f, axis=1), axis=0, return_index=True)
    f = f[ui]
    used = np.unique(f)
    remap = -np.ones(m, dtype=np.int64); remap[used] = np.arange(len(used))
    return rep[used], remap[f]


def build_brain(out_path: str, ncells: int):
    verts, faces = fetch_brain_mesh()
    rv, rf = decimate_grid(verts, faces, ncells)
    npos = normalize(rv).astype("<f4")
    os.makedirs(os.path.dirname(out_path) or ".", exist_ok=True)
    with open(out_path, "wb") as fh:
        fh.write(struct.pack("<IIII", MAGIC_BRAIN, BRAIN_VERSION, len(npos), len(rf)))
        fh.write(npos.tobytes())
        fh.write(rf.astype("<u4").tobytes())
    print(f"brain  {len(verts)} -> {len(rv)} verts, {len(faces)} -> {len(rf)} tris  "
          f"({os.path.getsize(out_path)/1024:.0f} KB)  -> {out_path}", flush=True)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("root_ids", nargs="+", type=int, help="FlyWire root ids (Codex Copy IDs)")
    ap.add_argument("--out", default="public/neurons/neurons_solid.bin", help="neuron mesh output (.bin)")
    ap.add_argument("--lod", type=int, default=3, help="coarsest LOD is usually 3")
    ap.add_argument("--weld-nm", type=float, default=30.0)
    ap.add_argument("--target-faces", type=int, default=40000, help="per-neuron decimation target")
    ap.add_argument("--brain", action="store_true", help="also build the whole-brain hull")
    ap.add_argument("--out-brain", default="public/neurons/brain.bin")
    ap.add_argument("--brain-grid", type=int, default=55, help="brain decimation cells along longest axis")
    args = ap.parse_args()

    if args.brain:
        build_brain(args.out_brain, args.brain_grid)
    build_solid(args.out, args.root_ids, args.lod, args.weld_nm, args.target_faces)


if __name__ == "__main__":
    main()

#!/usr/bin/env python
"""
build_neuron_bin.py — turn FlyWire (FAFB v783 public) neuron skeletons into a
compact binary the blog's <NeuronViewer> renders as 3D line skeletons.

Pipeline (all offline, run once per neuron set):
    root ids  ->  fetch neuroglancer skeleton  ->  topology-preserving
    simplify (per-branch Ramer-Douglas-Peucker)  ->  center + scale + Y-up
    ->  pack little-endian .bin  (+ a small .json with provenance)

Why no fafbseg / cloudvolume: FlyWire's public 783 skeletons are served as plain
'neuroglancer_skeletons' binaries over HTTPS, so urllib + numpy is all we need.
Source: https://flyem.mrc-lmb.cam.ac.uk/flyconnectome/flywire_skeletons_783/<root_id>

Data (c) FlyWire / Princeton University, public release 783. If you publish a
figure made from it, cite Dorkenwald et al. 2024 (FlyWire) and Schlegel et al.
2024 (annotations). See the emitted .json 'attribution' field.

Usage:
    python scripts/build_neuron_bin.py 720575940615101747 720575940639278399 \
        --out public/neurons/exr1 --eps 350
"""
from __future__ import annotations
import argparse
import json
import os
import struct
import sys
import urllib.request

import numpy as np

SKELETON_BASE = "https://flyem.mrc-lmb.cam.ac.uk/flyconnectome/flywire_skeletons_783"
# FlyWire whole-brain surface mesh (neuroglancer legacy mesh, single object id 1),
# in the same nm space as the skeletons -> the transparent hull Codex draws.
BRAIN_BASE = "https://storage.googleapis.com/flywire_neuropil_meshes/whole_neuropil/brain_mesh_v3"
MAGIC = 0x314E524E       # 'NRN1' little-endian (neuron line file)
MAGIC_BRAIN = 0x314E5242  # 'BRN1' little-endian (brain mesh file)
VERSION = 1
ATTRIBUTION = (
    "FlyWire FAFB public release 783 (c) Princeton University. "
    "Cite Dorkenwald et al. 2024 & Schlegel et al. 2024."
)

# Canonical FAFB normalization, derived once from the whole-brain mesh bbox (nm).
# BOTH the neurons and the brain hull are transformed by THIS, so they co-register
# in the viewer no matter which file is built when. Y is flipped because EM y grows
# downward. Values are the measured bounds of brain_mesh_v3.
FAFB_MIN = np.array([188790.0, 75002.0, 2007.0])
FAFB_MAX = np.array([854603.0, 399276.0, 271205.0])
FAFB_CENTER = (FAFB_MIN + FAFB_MAX) / 2.0
FAFB_SCALE = 1.0 / ((FAFB_MAX - FAFB_MIN).max() / 2.0)


def normalize(p: np.ndarray) -> np.ndarray:
    """Canonical FAFB nm -> viewer space (~[-1,1] on the widest axis, y-up)."""
    q = (p - FAFB_CENTER) * FAFB_SCALE
    q[:, 1] = -q[:, 1]
    return q.astype(np.float32)


def fetch_brain_mesh():
    """Download + decode the whole-brain legacy mesh -> (verts[V,3] nm, faces[T,3])."""
    man = json.loads(urllib.request.urlopen(f"{BRAIN_BASE}/mesh/1:0", timeout=60).read())
    raw = urllib.request.urlopen(f"{BRAIN_BASE}/mesh/{man['fragments'][0]}", timeout=180).read()
    nv = struct.unpack_from("<I", raw, 0)[0]
    verts = np.frombuffer(raw, dtype="<f4", count=nv * 3, offset=4).reshape(nv, 3).astype(np.float64)
    ntri = (len(raw) - 4 - nv * 12) // 12
    faces = np.frombuffer(raw, dtype="<u4", count=ntri * 3, offset=4 + nv * 12).reshape(ntri, 3).astype(np.int64)
    return verts, faces


def decimate_grid(verts: np.ndarray, faces: np.ndarray, ncells: int):
    """Vertex-clustering decimation: snap vertices to a coarse grid and merge.

    Dependency-free and gives the faceted low-poly hull look. `ncells` is the
    number of cells along the longest axis (higher = smoother/heavier).
    """
    lo = verts.min(0)
    s = (verts.max(0) - lo).max() / ncells
    cell = np.floor((verts - lo) / s).astype(np.int64)
    uniq, inv = np.unique(cell, axis=0, return_inverse=True)
    inv = inv.ravel()
    m = len(uniq)
    rep = np.zeros((m, 3)); cnt = np.zeros(m)
    np.add.at(rep, inv, verts); np.add.at(cnt, inv, 1)
    rep /= cnt[:, None]
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
    npos = normalize(rv)
    os.makedirs(os.path.dirname(out_path) or ".", exist_ok=True)
    with open(out_path, "wb") as fh:
        fh.write(struct.pack("<IIII", MAGIC_BRAIN, VERSION, len(npos), len(rf)))
        fh.write(npos.tobytes())
        fh.write(rf.astype("<u4").tobytes())
    print(f"brain  {len(verts)} -> {len(rv)} verts, {len(faces)} -> {len(rf)} tris  "
          f"({os.path.getsize(out_path)/1024:.0f} KB)  -> {out_path}", flush=True)


def fetch_skeleton(root_id: int, timeout: int = 120):
    """Download and decode a neuroglancer skeleton -> (pos[V,3] nm, edges[E,2])."""
    url = f"{SKELETON_BASE}/{root_id}"
    raw = urllib.request.urlopen(url, timeout=timeout).read()
    nv, ne = struct.unpack_from("<II", raw, 0)
    off = 8
    pos = np.frombuffer(raw, dtype="<f4", count=nv * 3, offset=off).reshape(nv, 3).astype(np.float64)
    off += nv * 3 * 4
    edges = np.frombuffer(raw, dtype="<u4", count=ne * 2, offset=off).reshape(ne, 2).astype(np.int64)
    # remaining bytes are the per-vertex radius attribute; unused for line rendering
    return pos, edges


def rdp(points: np.ndarray, eps: float) -> np.ndarray:
    """Ramer-Douglas-Peucker on an ordered polyline. Returns kept indices (0..n-1).

    Iterative (no recursion limit). Distance is point-to-segment, so it is stable
    even where a branch doubles back on itself.
    """
    n = len(points)
    if n < 3:
        return np.arange(n)
    keep = np.zeros(n, dtype=bool)
    keep[0] = keep[-1] = True
    stack = [(0, n - 1)]
    while stack:
        a, b = stack.pop()
        if b <= a + 1:
            continue
        pa, pb = points[a], points[b]
        ab = pb - pa
        seg = points[a + 1:b]
        L2 = float(ab @ ab)
        if L2 == 0.0:
            d = np.linalg.norm(seg - pa, axis=1)
        else:
            t = np.clip((seg - pa) @ ab / L2, 0.0, 1.0)
            proj = pa + t[:, None] * ab
            d = np.linalg.norm(seg - proj, axis=1)
        i = int(np.argmax(d))
        if d[i] > eps:
            k = a + 1 + i
            keep[k] = True
            stack.append((a, k))
            stack.append((k, b))
    return np.nonzero(keep)[0]


def simplify(pos: np.ndarray, edges: np.ndarray, eps: float):
    """Topology-preserving simplification of a tree skeleton.

    Split the tree into maximal chains between 'break' nodes (leaves and
    junctions, i.e. degree != 2), RDP each chain, then rebuild vertices/edges
    from the survivors. Branch points and tips are always kept.
    """
    n = len(pos)
    adj: list[list[int]] = [[] for _ in range(n)]
    for u, v in edges:
        adj[u].append(v)
        adj[v].append(u)
    deg = np.array([len(a) for a in adj])
    is_break = deg != 2

    visited = set()  # undirected edges we've already walked

    def ekey(a, b):
        return (a, b) if a < b else (b, a)

    kept = np.zeros(n, dtype=bool)
    new_edges: list[tuple[int, int]] = []

    break_nodes = np.nonzero(is_break)[0]
    for b in break_nodes:
        for nb in adj[b]:
            if ekey(b, nb) in visited:
                continue
            # walk the degree-2 chain b -> nb -> ... -> next break node
            chain = [b, nb]
            visited.add(ekey(b, nb))
            prev, cur = b, nb
            while not is_break[cur]:
                nxts = [x for x in adj[cur] if x != prev]
                if not nxts:
                    break
                nxt = nxts[0]
                if ekey(cur, nxt) in visited:
                    break
                visited.add(ekey(cur, nxt))
                chain.append(nxt)
                prev, cur = cur, nxt
            chain = np.array(chain)
            local_keep = rdp(pos[chain], eps)
            survivors = chain[local_keep]
            kept[survivors] = True
            for i in range(len(survivors) - 1):
                new_edges.append((int(survivors[i]), int(survivors[i + 1])))

    # remap surviving vertices to a dense 0..m-1 index space
    old_ids = np.nonzero(kept)[0]
    remap = -np.ones(n, dtype=np.int64)
    remap[old_ids] = np.arange(len(old_ids))
    new_pos = pos[old_ids]
    e = np.array(new_edges, dtype=np.int64)
    e = np.stack([remap[e[:, 0]], remap[e[:, 1]]], axis=1)
    return new_pos, e


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("root_ids", nargs="+", type=int, help="FlyWire root ids")
    ap.add_argument("--out", default="public/neurons/neurons", help="output path stem (no extension)")
    ap.add_argument("--eps", type=float, default=350.0, help="RDP tolerance in nm (higher = fewer points)")
    ap.add_argument("--brain", action="store_true", help="also build the whole-brain hull mesh")
    ap.add_argument("--out-brain", default="public/neurons/brain.bin", help="brain mesh output path")
    ap.add_argument("--brain-grid", type=int, default=90, help="brain decimation cells along longest axis")
    args = ap.parse_args()

    if args.brain:
        build_brain(args.out_brain, args.brain_grid)

    neurons = []  # (pos, edges) after simplify, still in nm
    raw_total = simp_total = 0
    for rid in args.root_ids:
        print(f"fetch  {rid} ...", flush=True)
        pos, edges = fetch_skeleton(rid)
        raw_v = len(pos)
        spos, sedges = simplify(pos, edges, args.eps)
        raw_total += raw_v
        simp_total += len(spos)
        pct = 100.0 * len(spos) / raw_v
        print(f"       {raw_v:>6d} -> {len(spos):>6d} verts ({pct:4.1f}%), {len(sedges):>6d} edges", flush=True)
        neurons.append((spos, sedges))

    # Canonical FAFB transform (shared with the brain hull) so neurons sit in the
    # right place inside the brain regardless of which files are built together.
    os.makedirs(os.path.dirname(args.out) or ".", exist_ok=True)
    bin_path = args.out + ".bin"
    with open(bin_path, "wb") as f:
        f.write(struct.pack("<IIII", MAGIC, VERSION, len(neurons), 0))
        for spos, sedges in neurons:
            npos = normalize(spos)
            f.write(struct.pack("<II", len(npos), len(sedges)))
            f.write(npos.tobytes())
            f.write(sedges.astype("<u4").tobytes())

    size = os.path.getsize(bin_path)
    meta = {
        "source": "flywire_fafb_783_public",
        "url": SKELETON_BASE,
        "attribution": ATTRIBUTION,
        "root_ids": [str(r) for r in args.root_ids],
        "eps_nm": args.eps,
        "neurons": len(neurons),
        "vertices_raw": raw_total,
        "vertices_simplified": simp_total,
        "bytes": size,
    }
    with open(args.out + ".json", "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)

    print(f"\nwrote {bin_path}  ({size/1024:.0f} KB)  "
          f"{simp_total}/{raw_total} verts ({100.0*simp_total/raw_total:.1f}%)")
    print(f"wrote {args.out}.json")


if __name__ == "__main__":
    main()

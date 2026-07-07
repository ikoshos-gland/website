import React, { useCallback, useEffect, useRef, useState } from 'react';

// A once-per-session cinematic when entering the blog: a small connectome grows
// (nodes wire up, signals fire) and geometric "synaptic flowers" bloom at the
// junctions. Two modes:
//   overlay  — full-screen opaque cover (blog index / thesis hub); runs its own
//              timeline, zooms out and dissolves to reveal the page.
//   backdrop — transparent field behind a post's title + deck; blooms and HOLDS,
//              then dissolves on the `dissolve` prop (driven by the deck's
//              decrypt finishing) to hand off to the full blog form.

const PALETTE = ['#FFD700', '#D6FF4F', '#F5F5F5', '#FFE9A8'];

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Also used by BlogPost to decide whether the intro will cover a post. The intro
// now plays on EVERY post load/refresh (not once per session) — reduced-motion
// is the only thing that skips it.
export const shouldPlay = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return !prefersReduced();
  } catch {
    return false;
  }
};

const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);
const easeInOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

interface Node {
  nx: number; ny: number;
  isFlower: boolean;
  reach: number;
  bloomStart: number;
  petals: number;
  color: string;
  rot: number;
  type: number;   // 0 pointed · 1 rounded · 2 double · 3 aster
  size: number;   // per-flower size multiplier (variety)
  exitAngle: number;
  exitDistance: number;
  exitDelay: number;
  exitSpin: number;
}
interface Edge { a: number; b: number; start: number; end: number; phase: number; breakAt: number; exitDelay: number; }

const EDGE_GROW = 460;
const BLOOM = 680;
const PHASE3 = 1500;
// Creature beats (backdrop posts): a Drosophila and a mouse grow among the
// flowers, then their brains are FFN-segmented as the field dissolves.
const FLY_APPEAR = 700, FLY_GROW = 800;
const MOUSE_APPEAR = 1000, MOUSE_GROW = 850;
const EXAM_DUR = 650, EXAM_STAGGER = 180;

interface BlogIntroProps {
  mode?: 'overlay' | 'backdrop';
  /** backdrop only: when it flips true, the field zooms out and dissolves. */
  dissolve?: boolean;
  onDone?: () => void;
}

export default function BlogIntro({ mode = 'overlay', dissolve = false, onDone }: BlogIntroProps) {
  const isOverlay = mode !== 'backdrop';
  // Overlay self-gates on the session flag; backdrop is gated by the parent
  // (BlogPost only renders it when the intro should play).
  const [play] = useState(() => (isOverlay ? shouldPlay() : true));
  const [gone, setGone] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startRef = useRef<number | null>(null);
  const dissolveRef = useRef(dissolve);
  dissolveRef.current = dissolve;
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const finishedRef = useRef(false);
  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onDoneRef.current?.();
    setGone(true);
  }, []);

  useEffect(() => {
    if (!play) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) { finish(); return; }

    const isMobile = window.innerWidth < 768;
    const baseA = isOverlay ? 1 : 0.72;   // backdrop sits quietly behind the text
    let W = window.innerWidth, H = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = () => {
      W = window.innerWidth; H = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    };
    size();

    // In backdrop mode, keep a clear reading zone over the post's title + deck
    // and cluster the network AROUND it — a scattered frame haloing the header,
    // rather than a field that runs through the text.
    let protect: { x0: number; y0: number; x1: number; y1: number } | null = null;
    if (!isOverlay) {
      const els = ['.blg-title', '.blg-deck'].map((s) => document.querySelector(s)).filter(Boolean) as Element[];
      if (els.length) {
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        els.forEach((el) => { const r = el.getBoundingClientRect(); x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom); });
        const padX = Math.max(90, W * 0.07), padY = 84;
        protect = { x0: x0 - padX, y0: y0 - padY, x1: x1 + padX, y1: y1 + padY };
      }
    }

    // ── Build the network ────────────────────────────────────────────────
    const N = isMobile ? 16 : 30;
    const nodes: Node[] = [];
    let guard = 0;
    const mk = (nx: number, ny: number): Node => ({
      nx, ny, isFlower: false, reach: 0, bloomStart: 0, petals: 5, color: '#FFD700', rot: 0, type: 0, size: 1,
      exitAngle: Math.random() * Math.PI * 2,
      exitDistance: (isMobile ? 34 : 58) * (0.7 + Math.random() * 0.9),
      exitDelay: Math.random() * 260,
      exitSpin: (Math.random() < 0.5 ? -1 : 1) * (0.55 + Math.random() * 1.35),
    });
    if (protect) {
      // ring placement around the header rectangle, weighted toward it
      const hcx = (protect.x0 + protect.x1) / 2, hcy = (protect.y0 + protect.y1) / 2;
      const hrx = (protect.x1 - protect.x0) / 2, hry = (protect.y1 - protect.y0) / 2;
      const reach = Math.max(W, H) * 0.62;
      const minDpx = isMobile ? 64 : 92;
      const mX = W * 0.04, mY = H * 0.05;
      while (nodes.length < N && guard++ < 7000) {
        const ang = Math.random() * Math.PI * 2;
        const ext = Math.pow(Math.random(), 0.85) * reach;   // denser near the header
        const x = hcx + Math.cos(ang) * (hrx + ext);
        const y = hcy + Math.sin(ang) * (hry + ext * 0.82);
        if (x < mX || x > W - mX || y < mY || y > H - mY) continue;
        if (x > protect.x0 && x < protect.x1 && y > protect.y0 && y < protect.y1) continue;
        const nx = x / W, ny = y / H;
        if (nodes.every((m) => Math.hypot((m.nx - nx) * W, (m.ny - ny) * H) >= minDpx)) nodes.push(mk(nx, ny));
      }
    } else {
      const minD = isMobile ? 0.17 : 0.13;
      while (nodes.length < N && guard++ < 3000) {
        const nx = 0.09 + Math.random() * 0.82;
        const ny = 0.13 + Math.random() * 0.74;
        if (nodes.every((m) => Math.hypot(m.nx - nx, m.ny - ny) >= minD)) nodes.push(mk(nx, ny));
      }
    }
    const n = nodes.length;
    const W0 = W || 1280, H0 = H || 800;
    const px = nodes.map((nd) => [nd.nx * W0, nd.ny * H0]);

    // Reject edges whose segment would cut through the reading zone.
    const crossesHeader = (ax: number, ay: number, bx: number, by: number) => {
      if (!protect) return false;
      const sx = ax / W0 * W, sy = ay / H0 * H, ex = bx / W0 * W, ey = by / H0 * H;
      for (let s = 1; s < 14; s++) {
        const t = s / 14, x = sx + (ex - sx) * t, y = sy + (ey - sy) * t;
        if (x > protect.x0 && x < protect.x1 && y > protect.y0 && y < protect.y1) return true;
      }
      return false;
    };

    const seen = new Set<string>();
    const edges: Edge[] = [];
    const K = 3;
    for (let i = 0; i < n; i++) {
      const d = nodes.map((_, j) => [j, Math.hypot(px[i][0] - px[j][0], px[i][1] - px[j][1])] as [number, number])
        .filter(([j]) => j !== i).sort((a, b) => a[1] - b[1]);
      for (let k = 0; k < K && k < d.length; k++) {
        const j = d[k][0];
        if (crossesHeader(px[i][0], px[i][1], px[j][0], px[j][1])) continue;
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (!seen.has(key)) {
          seen.add(key);
          edges.push({
            a: Math.min(i, j),
            b: Math.max(i, j),
            start: 0,
            end: 0,
            phase: Math.random() * 1500,
            breakAt: 0.38 + Math.random() * 0.24,
            exitDelay: Math.random() * 240,
          });
        }
      }
    }

    const adj: { to: number; idx: number }[][] = nodes.map(() => []);
    edges.forEach((e, idx) => { adj[e.a].push({ to: e.b, idx }); adj[e.b].push({ to: e.a, idx }); });
    let seed = 0, best = Infinity;
    for (let i = 0; i < n; i++) {
      const dx = px[i][0] - W0 / 2, dy = px[i][1] - H0 / 2, dd = dx * dx + dy * dy;
      if (dd < best) { best = dd; seed = i; }
    }
    const depth = nodes.map(() => -1); depth[seed] = 0;
    const edgeDepth = edges.map(() => Infinity);
    const queue = [seed];
    while (queue.length) {
      const u = queue.shift()!;
      for (const { to, idx } of adj[u]) {
        edgeDepth[idx] = Math.min(edgeDepth[idx], depth[u]);
        if (depth[to] < 0) { depth[to] = depth[u] + 1; queue.push(to); }
      }
    }
    edges.forEach((e, idx) => {
      const dep = isFinite(edgeDepth[idx]) ? edgeDepth[idx] : 0;
      e.start = dep * 120 + Math.random() * 70;
      e.end = e.start + EDGE_GROW;
    });

    const deg = nodes.map(() => 0);
    edges.forEach((e) => { deg[e.a]++; deg[e.b]++; });
    const edgeEndFor = (i: number) => { let m = 0; edges.forEach((e) => { if (e.a === i || e.b === i) m = Math.max(m, e.end); }); return m; };
    let lastActivity = 0;
    nodes.forEach((nd, i) => {
      let reach = i === seed ? 0 : Infinity;
      edges.forEach((e) => { if (e.a === i || e.b === i) reach = Math.min(reach, e.end); });
      nd.reach = isFinite(reach) ? reach : 0;
      nd.isFlower = i === seed || (deg[i] >= 1 && Math.random() < 0.74);
      nd.type = Math.floor(Math.random() * 4);
      nd.petals = nd.type === 3 ? 9 + Math.floor(Math.random() * 3) : 6 + Math.floor(Math.random() * 2);
      nd.size = 0.8 + Math.random() * 0.7;
      nd.color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      nd.rot = Math.random() * Math.PI * 2;
      nd.bloomStart = nd.reach + 150;
      lastActivity = Math.max(lastActivity, edgeEndFor(i));
      if (nd.isFlower) lastActivity = Math.max(lastActivity, nd.bloomStart + BLOOM);
    });
    // Overlay auto-exits after the bloom; backdrop waits for `dissolve`.
    const T_REVEAL = lastActivity + 240;

    // ── Creatures: the connectome's model organisms in the margins ────────
    // Fly (Drosophila — FlyWire/hemibrain) among the upper flowers, mouse
    // (MICrONS + the thesis's own organism) on a ground-line below. Backdrop
    // posts only; positions normalised so resize keeps them in place.
    const creatures: { kind: string; nx: number; ny: number; scale: number; flip: boolean; brain: any; appear: number; grow: number; examIdx: number }[] = [];
    const vessels: { pts: number[][]; depth: number; phase: number }[] = [];
    if (protect) {
      const pr = protect;
      const buildBrain = (kind: 'fly' | 'mouse') => {
        const isF = kind === 'fly';
        const cx = isF ? 0 : -3, cy = isF ? -6 : -9, rw = isF ? 4.2 : 7, rh = isF ? 3.4 : 4.6;
        const outline: number[][] = [];
        for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; outline.push([cx + Math.cos(a) * rw * (1 + 0.1 * Math.sin(a * 3)), cy + Math.sin(a) * rh]); }
        const segN = isMobile ? 4 : (isF ? 5 : 6);
        const segs: { col: string; cy: number; pts: number[][] }[] = [];
        for (let k = 0; k < segN; k++) {
          const sx = cx + (Math.random() - 0.5) * rw * 1.3, sy = cy + (Math.random() - 0.5) * rh * 1.3, br = isF ? 1.5 : 2.3;
          const pts: number[][] = [];
          for (let j = 0; j < 6; j++) { const a = j / 6 * Math.PI * 2, rr = br * (0.55 + Math.random() * 0.6); pts.push([sx + Math.cos(a) * rr, sy + Math.sin(a) * rr]); }
          segs.push({ col: PALETTE[k % PALETTE.length], cy: sy, pts });
        }
        segs.sort((a, b) => a.cy - b.cy);
        return { cx, cy, rw, rh, outline, segs };
      };
      const mX = W * 0.04, mY = H * 0.05;
      const upperBand = pr.y0 - mY, lowerBand = (H - mY) - pr.y1;

      // Flies (up to 2 desktop / 1 mobile) among the upper flowers — bigger now.
      const flyScale = isMobile ? 1.35 : 1.95;
      const flyHH = 12 * flyScale, flyHW = 10 * flyScale;
      const clearOfOthers = (fx: number, fy: number, d: number) => creatures.every((c) => Math.hypot(c.nx * W - fx, c.ny * H - fy) > d);
      const flyFits = (fx: number, fy: number) =>
        fx - flyHW > mX && fx + flyHW < W - mX && fy - flyHH > mY && fy + flyHH < H - mY &&
        !(fx + flyHW > pr.x0 && fx - flyHW < pr.x1 && fy + flyHH > pr.y0 && fy - flyHH < pr.y1) &&
        clearOfOthers(fx, fy, flyHW * 2.6);
      const flyCands: number[][] = [
        [Math.min(pr.x1 - W * 0.04, W - mX - flyHW), (mY + pr.y0) / 2],
        [(pr.x1 + (W - mX)) / 2, pr.y0 + (pr.y1 - pr.y0) * 0.2],
        [(mX + pr.x0) / 2, pr.y0 + (pr.y1 - pr.y0) * 0.24],
        [Math.max(pr.x0 + W * 0.06, mX + flyHW), (mY + pr.y0) / 2],
        [(mX + pr.x0) / 2, pr.y0 + (pr.y1 - pr.y0) * 0.56],
      ];
      const maxFlies = isMobile ? 1 : 2;
      let fCount = 0;
      for (const c of flyCands) {
        if (fCount >= maxFlies) break;
        if (flyFits(c[0], c[1])) { creatures.push({ kind: 'fly', nx: c[0] / W, ny: c[1] / H, scale: flyScale * (0.85 + Math.random() * 0.3), flip: false, brain: buildBrain('fly'), appear: FLY_APPEAR + fCount * 240, grow: FLY_GROW, examIdx: 0 }); fCount++; }
      }

      // Mice (up to 3 desktop / 2 mobile) — a small crowd on the ground-line.
      const mouseBase = isMobile ? 1.05 : 1.42;
      if (lowerBand > 15 * mouseBase + 34) {
        const groundBase = Math.min(pr.y1 + Math.max(46, H * 0.08), H - mY - 22);
        const maxMice = isMobile ? 2 : 3;
        const fracs = [0.26, 0.54, 0.8];
        for (let mi = 0; mi < maxMice; mi++) {
          const sc = mouseBase * (mi === 0 ? 1 : 0.66 + Math.random() * 0.34), mHW = 24 * sc;
          const lowX = mX + mHW, hiX = W - mX - mHW;
          const mx = Math.max(lowX, Math.min(lowX + (hiX - lowX) * fracs[mi], hiX));
          const gy = Math.min(groundBase + mi * 8, H - mY - 8);
          creatures.push({ kind: 'mouse', nx: mx / W, ny: gy / H, scale: sc, flip: mi % 2 === 1, brain: buildBrain('mouse'), appear: MOUSE_APPEAR + mi * 230, grow: MOUSE_GROW, examIdx: 0 });
        }
      }

      // Phones: drop the fly if the upper band is tight (mouse-led).
      if (isMobile && upperBand < flyHH * 2 + 28) { for (let i = creatures.length - 1; i >= 0; i--) if (creatures[i].kind === 'fly') creatures.splice(i, 1); }
      creatures.forEach((c, i) => (c.examIdx = i));

      // Vasculature: two vessel trees climbing the lower margins, blood corpuscles flowing.
      const buildVessel = (x: number, y: number, dir: number, len: number, depth: number) => {
        if (depth <= 0 || len < 15) return;
        const ex = x + Math.cos(dir) * len, ey = y + Math.sin(dir) * len, bow = (Math.random() - 0.5) * 0.5;
        const mxp = (x + ex) / 2 + Math.cos(dir + Math.PI / 2) * len * bow, myp = (y + ey) / 2 + Math.sin(dir + Math.PI / 2) * len * bow;
        const pts: number[][] = [];
        for (let s = 0; s <= 6; s++) { const tt = s / 6, it = 1 - tt; pts.push([(it * it * x + 2 * it * tt * mxp + tt * tt * ex) / W, (it * it * y + 2 * it * tt * myp + tt * tt * ey) / H]); }
        vessels.push({ pts, depth, phase: Math.random() * 1900 });
        const spread = 0.42 + Math.random() * 0.4;
        buildVessel(ex, ey, dir - spread, len * 0.7, depth - 1);
        buildVessel(ex, ey, dir + spread * 0.82, len * 0.72, depth - 1);
      };
      const rootLen = Math.min(H * 0.15, 135);
      buildVessel(W * 0.045, H * 0.94, -Math.PI / 2 + 0.5, rootLen, 4);
      buildVessel(W * 0.955, H * 0.92, -Math.PI / 2 - 0.5, rootLen, 4);
    }

    // ── Draw helpers ─────────────────────────────────────────────────────
    const drawFlower = (cx: number, cy: number, nd: Node, bloom: number, gA: number, disperse = 0) => {
      const base = (isMobile ? 15 : 24) * nd.size;
      const d = easeInOut(clamp01(disperse));
      const survive = Math.max(0, 1 - d);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(nd.rot + (1 - bloom) * 0.7 + nd.exitSpin * d * 0.45);
      const ring = (count: number, len: number, wid: number, round: boolean, phase: number, aMul: number) => {
        for (let k = 0; k < count; k++) {
          ctx.save();
          ctx.rotate((k / count) * Math.PI * 2 + phase);
          const variance = 0.7 + (((k * 37) % 13) / 20);
          ctx.translate(Math.sin(k * 12.989 + nd.rot) * base * 0.14 * d, -base * (0.45 + variance) * d);
          ctx.rotate(nd.exitSpin * d * (0.22 + k * 0.015));
          ctx.beginPath();
          ctx.moveTo(0, 0);
          if (round) {
            ctx.bezierCurveTo(wid * 1.5, -len * 0.28, wid * 0.7, -len, 0, -len);
            ctx.bezierCurveTo(-wid * 0.7, -len, -wid * 1.5, -len * 0.28, 0, 0);
          } else {
            ctx.quadraticCurveTo(wid, -len * 0.55, 0, -len);
            ctx.quadraticCurveTo(-wid, -len * 0.55, 0, 0);
          }
          ctx.strokeStyle = nd.color; ctx.lineWidth = 1.2;
          ctx.shadowColor = nd.color; ctx.shadowBlur = 8 * bloom;
          ctx.globalAlpha = gA * (0.5 + 0.45 * bloom) * aMul * survive;
          ctx.stroke();
          ctx.globalAlpha = gA * 0.13 * bloom * aMul * survive; ctx.fillStyle = nd.color; ctx.fill();
          ctx.restore();
        }
      };
      const L = base * bloom * (1 - 0.12 * d);
      if (nd.type === 0) {                 // pointed star
        ring(nd.petals, L, base * 0.3 * bloom, false, 0, 1);
      } else if (nd.type === 1) {          // rounded, full
        ring(nd.petals, L, base * 0.46 * bloom, true, 0, 1);
      } else if (nd.type === 2) {          // double-layered
        ring(nd.petals, L, base * 0.42 * bloom, true, 0, 1);
        ring(nd.petals - 1, L * 0.58, base * 0.28 * bloom, false, Math.PI / nd.petals, 0.9);
      } else {                             // aster (many thin)
        ring(nd.petals, L * 1.05, base * 0.16 * bloom, false, 0, 0.9);
      }
      ctx.globalAlpha = gA; ctx.shadowColor = nd.color; ctx.shadowBlur = 10 * bloom;
      if (survive > 0.02) {
        ctx.globalAlpha = gA * survive;
        ctx.beginPath(); ctx.arc(0, 0, (2.4 * bloom + 0.7) * survive, 0, 7); ctx.fillStyle = '#FFF6D5'; ctx.fill();
      }
      ctx.restore();
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    };

    // The thesis beat: a lime imaging reticle + scan line + FFN-style flood-fill
    // segmentation clipped to a tiny brain outline in the creature's skull.
    // `x` (0..1) is the exam progress; lime is reserved exclusively for this.
    const drawBrainExam = (brain: any, x: number, s: number, sA: number) => {
      if (x <= 0) return;
      const bx = brain.cx * s, by = brain.cy * s, rw = brain.rw * s, rh = brain.rh * s;
      const acq = clamp01(x / 0.3);
      ctx.strokeStyle = '#D6FF4F'; ctx.shadowColor = '#D6FF4F'; ctx.shadowBlur = 6; ctx.lineWidth = 1;
      ctx.globalAlpha = 0.85 * sA * acq;
      const tk = Math.max(rw, rh) * 1.4;
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([dx, dy]) => {
        ctx.beginPath(); ctx.moveTo(bx + dx * tk - dx * 4, by + dy * tk); ctx.lineTo(bx + dx * tk, by + dy * tk); ctx.lineTo(bx + dx * tk, by + dy * tk - dy * 4); ctx.stroke();
      });
      ctx.save();
      ctx.beginPath();
      brain.outline.forEach((o: number[], i: number) => { const X = o[0] * s, Y = o[1] * s; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
      ctx.closePath();
      ctx.clip();
      ctx.globalAlpha = 0.06 * sA * acq; ctx.fillStyle = '#F5F5F5'; ctx.shadowBlur = 0; ctx.fill();
      const scanY = by - rh + 2 * rh * x;
      if (x < 1) {
        ctx.strokeStyle = '#D6FF4F'; ctx.shadowColor = '#D6FF4F'; ctx.shadowBlur = 6; ctx.lineWidth = 1; ctx.globalAlpha = 0.85 * sA;
        ctx.beginPath(); ctx.moveTo(bx - rw, scanY); ctx.lineTo(bx + rw, scanY); ctx.stroke();
      }
      brain.segs.forEach((seg: any) => {
        if (scanY >= seg.cy * s || x >= 1) {
          ctx.beginPath();
          seg.pts.forEach((p: number[], i: number) => { const X = p[0] * s, Y = p[1] * s; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
          ctx.closePath();
          ctx.globalAlpha = 0.16 * sA; ctx.fillStyle = seg.col; ctx.shadowBlur = 0; ctx.fill();
          ctx.globalAlpha = 0.5 * sA; ctx.strokeStyle = seg.col; ctx.shadowColor = seg.col; ctx.shadowBlur = 6; ctx.lineWidth = 0.9; ctx.stroke();
        }
      });
      ctx.restore();
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    };

    // Drosophila: gold body, amber compound eyes, silver petal-shaped wings
    // (the same gesture as the flowers). Coords in a local frame scaled by g.
    const drawFly = (cx: number, cy: number, g: number, x: number, t: number, sA: number, data: any) => {
      const sc = data.scale, s = sc * g, bob = 0.6 * sc * Math.sin(t / 420) * (1 - x);
      ctx.save();
      ctx.translate(cx, cy + bob);
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#FFD700'; ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 5.5 * g; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.92 * sA;
      ctx.beginPath(); ctx.arc(0, -6 * s, 2.6 * s, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -3.6 * s); ctx.quadraticCurveTo(2.6 * s, -1 * s, 0, 1.5 * s); ctx.quadraticCurveTo(-2.6 * s, -1 * s, 0, -3.6 * s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 1.5 * s); ctx.quadraticCurveTo(2.4 * s, 4 * s, 0, 8.5 * s); ctx.quadraticCurveTo(-2.4 * s, 4 * s, 0, 1.5 * s); ctx.stroke();
      ctx.fillStyle = '#FFE9A8'; ctx.shadowColor = '#FFE9A8'; ctx.shadowBlur = 5 * g; ctx.globalAlpha = 0.9 * sA;
      ctx.beginPath(); ctx.arc(-1.8 * s, -6 * s, 1.3 * s, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(1.8 * s, -6 * s, 1.3 * s, 0, 7); ctx.fill();
      if (g > 0.5) {
        const wg = clamp01((g - 0.5) / 0.5), fl = 1 + 0.06 * Math.sin(t / 90) * (1 - x);
        ctx.strokeStyle = '#F5F5F5'; ctx.shadowColor = '#F5F5F5'; ctx.shadowBlur = 6 * g; ctx.lineWidth = 1.1;
        [1, -1].forEach((side) => {
          ctx.beginPath();
          ctx.moveTo(0.6 * s * side, -2 * s);
          ctx.quadraticCurveTo(9 * s * side * fl, -1 * s, 8.5 * s * side * fl, 6 * s);
          ctx.quadraticCurveTo(4 * s * side, 5.5 * s, 0.6 * s * side, -2 * s);
          ctx.globalAlpha = 0.5 * sA * wg; ctx.stroke();
          ctx.fillStyle = '#F5F5F5'; ctx.globalAlpha = 0.06 * sA * wg; ctx.fill();
        });
      }
      if (g > 0.6 && sc > 1.1) {
        ctx.strokeStyle = '#FFD700'; ctx.shadowBlur = 0; ctx.lineWidth = 0.7; ctx.globalAlpha = 0.45 * sA;
        [1, -1].forEach((side) => { for (let L = 0; L < 3; L++) { const ay = -2 * s + L * 2.2 * s; ctx.beginPath(); ctx.moveTo(1 * s * side, ay); ctx.lineTo(4 * s * side, ay + 1.5 * s); ctx.lineTo(5.6 * s * side, ay + 3.4 * s); ctx.stroke(); } });
        ctx.globalAlpha = 0.5 * sA;
        [1, -1].forEach((side) => { ctx.beginPath(); ctx.moveTo(0.8 * s * side, -7.4 * s); ctx.quadraticCurveTo(1.5 * s * side, -9 * s, 1 * s * side, -9.6 * s); ctx.stroke(); });
      }
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      drawBrainExam(data.brain, x, s, sA);
      ctx.restore();
    };

    // Mouse: one continuous silver contour, big thin ear, amber eye, a long
    // glowing gold tail (a filament echoing the network edges).
    const drawMouse = (cx: number, gy: number, g: number, x: number, t: number, sA: number, data: any) => {
      const sc = data.scale, s = sc * g, breathe = 1 + 0.02 * Math.sin(t / 700) * (1 - x);
      ctx.save();
      ctx.translate(cx, gy);
      if (data.flip) ctx.scale(-1, 1);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.globalAlpha = 0.07 * sA; ctx.fillStyle = '#B0B2BE'; ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.ellipse(0, 0, 15 * s, 2.4 * s, 0, 0, 7); ctx.fill();
      ctx.save(); ctx.scale(1, breathe);
      ctx.strokeStyle = '#F5F5F5'; ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 4.5 * g; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.85 * sA;
      ctx.beginPath();
      ctx.moveTo(-16 * s, -6 * s);
      ctx.quadraticCurveTo(-10 * s, -11 * s, -3 * s, -11 * s);
      ctx.bezierCurveTo(6 * s, -12 * s, 14 * s, -11 * s, 16 * s, -4 * s);
      ctx.quadraticCurveTo(15 * s, 0, 11 * s, 1 * s);
      ctx.quadraticCurveTo(0, 3 * s, -9 * s, 1 * s);
      ctx.quadraticCurveTo(-13 * s, -1 * s, -16 * s, -6 * s);
      ctx.stroke();
      ctx.globalAlpha = 0.04 * sA; ctx.fillStyle = '#FFD700'; ctx.fill();
      ctx.strokeStyle = '#F5F5F5'; ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 4 * g; ctx.globalAlpha = 0.7 * sA;
      ctx.beginPath(); ctx.moveTo(2 * s, -11 * s); ctx.quadraticCurveTo(5 * s, -15.5 * s, 7.5 * s, -10.5 * s); ctx.stroke();
      if (sc > 0.9) { ctx.globalAlpha = 0.55 * sA; ctx.beginPath(); ctx.moveTo(3.4 * s, -11 * s); ctx.quadraticCurveTo(5.2 * s, -13.8 * s, 6.4 * s, -10.8 * s); ctx.stroke(); }
      ctx.fillStyle = '#FFE9A8'; ctx.shadowColor = '#FFE9A8'; ctx.shadowBlur = 4 * g; ctx.globalAlpha = 0.9 * sA;
      ctx.beginPath(); ctx.arc(-11 * s, -8 * s, 1.3 * s, 0, 7); ctx.fill();
      ctx.fillStyle = '#FFD700'; ctx.shadowColor = '#FFD700'; ctx.beginPath(); ctx.arc(-16 * s, -6 * s, 1 * s, 0, 7); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = '#FFD700'; ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 4 * g; ctx.lineWidth = 1.1; ctx.globalAlpha = 0.5 * sA;
      ctx.beginPath(); ctx.moveTo(16 * s, -4 * s); ctx.bezierCurveTo(24 * s, -2 * s, 26 * s, 4 * s, 22 * s, 7 * s); ctx.stroke();
      ctx.lineWidth = 0.6; ctx.globalAlpha = 0.3 * sA;
      ctx.beginPath(); ctx.moveTo(16 * s, -4 * s); ctx.bezierCurveTo(24 * s, -2 * s, 26 * s, 4 * s, 22 * s, 7 * s); ctx.stroke();
      if (g > 0.7 && sc > 0.9) {
        ctx.strokeStyle = '#F5F5F5'; ctx.shadowBlur = 0; ctx.lineWidth = 0.6; ctx.globalAlpha = 0.4 * sA;
        [[-22, -5], [-22, -6.6], [-22, -3.6]].forEach((w) => { ctx.beginPath(); ctx.moveTo(-15 * s, -6 * s); ctx.lineTo(w[0] * s, w[1] * s); ctx.stroke(); });
      }
      ctx.strokeStyle = '#F5F5F5'; ctx.shadowBlur = 0; ctx.lineWidth = 1; ctx.globalAlpha = 0.5 * sA;
      [-9, 11].forEach((fx) => { ctx.beginPath(); ctx.moveTo(fx * s, -1 * s); ctx.lineTo(fx * s, 0); ctx.stroke(); });
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      drawBrainExam(data.brain, x, s, sA);
      ctx.restore();
    };

    const exitStartRef = { current: null as number | null };
    let raf = 0;

    const draw = (now: number) => {
      if (startRef.current == null) startRef.current = now;
      const t = now - startRef.current;

      // Exit timing: overlay is fixed; backdrop starts when dissolve flips true.
      let es: number | null;
      if (isOverlay) es = T_REVEAL;
      else {
        if (exitStartRef.current == null && dissolveRef.current) exitStartRef.current = t;
        es = exitStartRef.current;
      }

      let fade = 1, sScale = 1, bgA = isOverlay ? 1 : 0, exitP = 0;
      if (es != null && t >= es) {
        const rawExit = clamp01((t - es) / PHASE3);
        const e = easeInOut(rawExit);
        if (isOverlay) {
          fade = 1 - e; sScale = 1 - 0.16 * e; bgA = 1 - e;
        } else {
          exitP = rawExit;
        }
        canvas.style.pointerEvents = 'none';
        if (rawExit >= 1) {
          finish();
          return;
        }
      }
      const sA = baseA * fade;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (isOverlay) { ctx.fillStyle = `rgba(14,15,17,${bgA})`; ctx.fillRect(0, 0, W, H); }

      ctx.save();
      ctx.translate(W / 2, H / 2); ctx.scale(sScale, sScale); ctx.translate(-W / 2, -H / 2);
      ctx.lineCap = 'round';

      const P = nodes.map((nd) => [nd.nx * W, nd.ny * H]);
      const exitElapsed = exitP * PHASE3;
      const vesselA = sA * (isOverlay ? 1 : Math.max(0, 1 - easeInOut(clamp01((exitP - 0.08) / 0.58))));

      // Vasculature (deepest layer): vessels grow root-first, corpuscles flow.
      for (const v of vessels) {
        if (vesselA <= 0.01) continue;
        const gp = clamp01((t - (4 - v.depth) * 140) / 520);
        if (gp <= 0) continue;
        const vp = v.pts.map((p) => [p[0] * W, p[1] * H]);
        const segN = vp.length - 1, upto = gp * segN;
        ctx.beginPath(); ctx.moveTo(vp[0][0], vp[0][1]);
        for (let s = 1; s < vp.length; s++) {
          if (s <= upto) ctx.lineTo(vp[s][0], vp[s][1]);
          else { const f = upto - (s - 1); if (f > 0) ctx.lineTo(vp[s - 1][0] + (vp[s][0] - vp[s - 1][0]) * f, vp[s - 1][1] + (vp[s][1] - vp[s - 1][1]) * f); break; }
        }
        ctx.strokeStyle = `rgba(226,92,90,${0.32 * vesselA})`; ctx.lineWidth = 0.6 + v.depth * 0.55; ctx.shadowColor = '#E24B4A'; ctx.shadowBlur = 4; ctx.stroke(); ctx.shadowBlur = 0;
        if (gp >= 1) {
          const cyc = ((t + v.phase) % 1900) / 1900, fp = cyc * segN, si = Math.floor(fp), ff = fp - si;
          if (si < segN) {
            const bx = vp[si][0] + (vp[si + 1][0] - vp[si][0]) * ff, by = vp[si][1] + (vp[si + 1][1] - vp[si][1]) * ff;
            ctx.beginPath(); ctx.arc(bx, by, 1.7, 0, 7); ctx.fillStyle = `rgba(255,150,140,${0.9 * vesselA})`; ctx.shadowColor = '#FF8A80'; ctx.shadowBlur = 6; ctx.fill(); ctx.shadowBlur = 0;
          }
        }
      }

      for (const e of edges) {
        const gp = clamp01((t - e.start) / EDGE_GROW);
        if (gp <= 0) continue;
        const eg = easeOut(gp);
        const [ax, ay] = P[e.a], [bx, by] = P[e.b];
        const edgeExit = isOverlay ? 0 : easeInOut(clamp01((exitElapsed - e.exitDelay) / 760));
        const edgeA = sA * (1 - edgeExit * 0.28);
        const drawEdgePart = (from: number, to: number) => {
          if (to <= from) return;
          ctx.beginPath();
          ctx.moveTo(ax + (bx - ax) * from, ay + (by - ay) * from);
          ctx.lineTo(ax + (bx - ax) * to, ay + (by - ay) * to);
          ctx.stroke();
        };
        ctx.strokeStyle = `rgba(176,178,190,${0.3 * edgeA})`;
        ctx.lineWidth = 1; ctx.shadowBlur = 0;
        if (edgeExit > 0) {
          const gap = 0.015 + edgeExit * 0.58;
          const leftEnd = Math.min(eg, Math.max(0, e.breakAt - gap));
          const rightStart = Math.min(eg, Math.min(1, e.breakAt + gap));
          drawEdgePart(0, leftEnd);
          drawEdgePart(rightStart, eg);
          if (edgeExit < 0.86) {
            const crackA = (1 - edgeExit) * sA;
            [-1, 1].forEach((side) => {
              const p = e.breakAt + side * gap;
              if (p <= 0 || p >= eg) return;
              const sx = ax + (bx - ax) * p, sy = ay + (by - ay) * p;
              ctx.beginPath();
              ctx.arc(sx, sy, 1.2 + edgeExit * 2.4, 0, 7);
              ctx.fillStyle = `rgba(214,255,79,${0.36 * crackA})`;
              ctx.shadowColor = '#D6FF4F'; ctx.shadowBlur = 7; ctx.fill(); ctx.shadowBlur = 0;
            });
          }
        } else {
          drawEdgePart(0, eg);
        }
        if (gp >= 1 && edgeExit < 0.16) {
          const cyc = ((t - e.end + e.phase) % 1500) / 650;
          if (cyc > 0 && cyc < 1) {
            ctx.beginPath();
            ctx.arc(ax + (bx - ax) * cyc, ay + (by - ay) * cyc, 2, 0, 7);
            ctx.fillStyle = `rgba(214,255,79,${(1 - cyc) * 0.9 * sA * (1 - edgeExit / 0.16)})`;
            ctx.shadowColor = '#D6FF4F'; ctx.shadowBlur = 8; ctx.fill(); ctx.shadowBlur = 0;
          }
        }
      }

      for (let i = 0; i < n; i++) {
        if (t < nodes[i].reach) continue;
        const [x, y] = P[i];
        const nodeExit = isOverlay ? 0 : easeInOut(clamp01((exitElapsed - nodes[i].exitDelay) / 860));
        const drift = easeOut(nodeExit);
        const dx = Math.cos(nodes[i].exitAngle) * nodes[i].exitDistance * drift;
        const dy = Math.sin(nodes[i].exitAngle) * nodes[i].exitDistance * drift;
        const nx = x + dx, ny = y + dy;
        const nodeA = sA * Math.max(0, 1 - nodeExit);
        if (nodeA > 0.02) {
          ctx.beginPath(); ctx.arc(nx, ny, 1.6 * (1 - nodeExit * 0.7), 0, 7);
          ctx.fillStyle = `rgba(245,245,245,${0.5 * nodeA})`;
          ctx.shadowColor = 'rgba(255,215,0,.6)'; ctx.shadowBlur = 6; ctx.fill(); ctx.shadowBlur = 0;
        }
        if (nodes[i].isFlower) {
          const bp = clamp01((t - nodes[i].bloomStart) / BLOOM);
          if (bp > 0) drawFlower(nx, ny, nodes[i], easeOut(bp), sA, nodeExit);
        }
      }

      // Creatures + their brain exam — above the field, inside the same zoom/fade
      // transform so they dissolve with everything. The exam is gated on the
      // dissolve signal (exitStartRef) and cascades across the specimens.
      if (creatures.length) {
        const es = exitStartRef.current;
        const groundA = sA * (isOverlay ? 1 : Math.max(0, 1 - easeInOut(clamp01((exitP - 0.38) / 0.48))));
        const firstMouse = creatures.find((c) => c.kind === 'mouse');
        if (firstMouse) {
          const gyPx = firstMouse.ny * H, wipe = clamp01((t - (MOUSE_APPEAR - 240)) / 560);
          if (wipe > 0) {
            ctx.strokeStyle = '#B0B2BE'; ctx.shadowBlur = 0; ctx.lineWidth = 1; ctx.globalAlpha = 0.1 * groundA * wipe;
            ctx.beginPath(); ctx.moveTo(W * 0.05, gyPx); ctx.lineTo(W * 0.05 + W * 0.9 * wipe, gyPx); ctx.stroke(); ctx.globalAlpha = 1;
          }
        }
        for (const cr of creatures) {
          const g = easeOut(clamp01((t - cr.appear) / cr.grow));
          if (g <= 0) continue;
          const x = es == null ? 0 : clamp01((t - es - cr.examIdx * 120) / EXAM_DUR);
          const crExit = es == null ? 0 : easeInOut(clamp01((t - es - cr.examIdx * 120 - EXAM_DUR * 0.62) / 520));
          const crA = sA * Math.max(0, 1 - crExit);
          if (crA <= 0.02) continue;
          const crGrow = g * (1 - crExit * 0.16);
          if (cr.kind === 'fly') drawFly(cr.nx * W, cr.ny * H, crGrow, x, t, crA, cr);
          else drawMouse(cr.nx * W, cr.ny * H, crGrow, x, t, crA, cr);
        }
      }

      ctx.restore();
      raf = requestAnimationFrame(draw);
    };

    if (isOverlay) {
      // Paint an opaque dark frame immediately so the page never flashes.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#0E0F11'; ctx.fillRect(0, 0, W, H);
    }
    raf = requestAnimationFrame(draw);

    // Safety net: rAF is paused in background tabs. Overlay force-lifts after its
    // full timeline; backdrop force-lifts once dissolve is requested (see the
    // dissolve effect below) — either way the page is never trapped.
    const overlayFailsafe = isOverlay
      ? window.setTimeout(() => finish(), T_REVEAL + PHASE3 + 2000)
      : 0;

    const onResize = () => size();
    window.addEventListener('resize', onResize);
    const skip = () => {
      if (!isOverlay || startRef.current == null) return;
      const elapsed = performance.now() - startRef.current;
      if (elapsed < T_REVEAL) startRef.current = performance.now() - T_REVEAL;
    };
    if (isOverlay) canvas.addEventListener('pointerdown', skip);

    return () => {
      cancelAnimationFrame(raf);
      if (overlayFailsafe) clearTimeout(overlayFailsafe);
      window.removeEventListener('resize', onResize);
      if (isOverlay) canvas.removeEventListener('pointerdown', skip);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [play]);

  // Backdrop failsafe: once a dissolve is requested, guarantee unmount even if
  // rAF is throttled/paused.
  useEffect(() => {
    if (isOverlay || !dissolve) return;
    const id = window.setTimeout(() => finish(), PHASE3 + 1500);
    return () => clearTimeout(id);
  }, [isOverlay, dissolve, finish]);

  if (!play || gone) return null;
  return <canvas ref={canvasRef} className={'blg-intro' + (isOverlay ? '' : ' backdrop')} aria-hidden="true" />;
}

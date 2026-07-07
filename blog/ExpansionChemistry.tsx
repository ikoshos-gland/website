import React, { useEffect, useRef, useState } from 'react';
import { useLang } from '../i18n/LanguageContext';

// The molecular mechanism of expansion microscopy, in four steppable phases.
// The SAME protein dots keep their relative positions throughout — only the
// spacing changes — so the conserved geometry (the whole promise of the method)
// is visible. Anchor -> Gelate -> Denature -> Expand.

const STR = {
  en: {
    phases: [
      { t: 'Anchor', s: 'tether proteins to monomers' },
      { t: 'Gelate', s: 'polymer mesh locks the anchors' },
      { t: 'Denature', s: 'SDS + heat cut protein–protein bonds' },
      { t: 'Expand', s: 'water drives isotropic swelling' },
    ],
    phasesLabel: 'expansion phases',
    ariaPhase: (n: number, t: string, s: string) =>
      `Expansion microscopy phase ${n} of 4: ${t}. ${s}.`,
    prev: '‹ Prev',
    next: 'Next ›',
    swell: '↻ Swell',
    hideRuler: 'hide ruler',
    measure: 'measure',
    ratio: (r: string) => `ratio long : short = ${r} — constant before & after`,
    caption: (
      <><b>Four links in a chain.</b> <i>Anchor</i> tethers proteins to gel monomers; <i>gelate</i> grows a polymer mesh that traps them; <i>denature</i> cuts the protein–protein bonds so nothing resists; <i>expand</i> lets the charged network drink water and swell ~18.5×. The same dots hold the same relative positions in every panel — only the spacing grows. That conserved geometry is the entire promise of the method.</>
    ),
  },
  tr: {
    phases: [
      { t: 'Bağla', s: 'proteinleri monomerlere bağla' },
      { t: 'Jelleştir', s: 'polimer ağı bağlantı noktalarını kilitler' },
      { t: 'Denatüre Et', s: 'SDS + ısı protein–protein bağlarını keser' },
      { t: 'Genişlet', s: 'su izotropik şişmeyi tetikler' },
    ],
    phasesLabel: 'genişleme aşamaları',
    ariaPhase: (n: number, t: string, s: string) =>
      `Genişleme mikroskobisi aşama ${n} / 4: ${t}. ${s}.`,
    prev: '‹ Önceki',
    next: 'Sonraki ›',
    swell: '↻ Şişir',
    hideRuler: 'cetveli gizle',
    measure: 'ölç',
    ratio: (r: string) => `oran uzun : kısa = ${r} — önce ve sonra sabit`,
    caption: (
      <><b>Bir zincirde dört halka.</b> <i>Bağla</i> proteinleri jel monomerlerine tutturur; <i>jelleştir</i> onları hapseden bir polimer ağı büyütür; <i>denatüre et</i> protein–protein bağlarını keser, böylece hiçbir şey direnmez; <i>genişlet</i> yüklü ağın su çekip ~18,5× şişmesini sağlar. Aynı noktalar her panelde aynı göreli konumlarını korur — yalnızca aralık büyür. Bu korunan geometri, yöntemin tüm vaadidir.</>
    ),
  },
  de: {
    phases: [
      { t: 'Verankern', s: 'Proteine an Monomere koppeln' },
      { t: 'Gelieren', s: 'Polymernetz fixiert die Anker' },
      { t: 'Denaturieren', s: 'SDS + Hitze trennen Protein–Protein-Bindungen' },
      { t: 'Expandieren', s: 'Wasser treibt isotrope Quellung an' },
    ],
    phasesLabel: 'Expansionsphasen',
    ariaPhase: (n: number, t: string, s: string) =>
      `Expansionsmikroskopie Phase ${n} von 4: ${t}. ${s}.`,
    prev: '‹ Zurück',
    next: 'Weiter ›',
    swell: '↻ Quellen',
    hideRuler: 'Lineal ausblenden',
    measure: 'messen',
    ratio: (r: string) => `Verhältnis lang : kurz = ${r} — konstant vor & nach`,
    caption: (
      <><b>Vier Glieder einer Kette.</b> <i>Verankern</i> koppelt Proteine an Gel-Monomere; <i>Gelieren</i> lässt ein Polymernetz wachsen, das sie einschließt; <i>Denaturieren</i> trennt die Protein–Protein-Bindungen, sodass nichts mehr Widerstand leistet; <i>Expandieren</i> lässt das geladene Netzwerk Wasser aufnehmen und ~18,5× quellen. Dieselben Punkte behalten in jedem Bild dieselben relativen Positionen — nur der Abstand wächst. Diese erhaltene Geometrie ist das gesamte Versprechen der Methode.</>
    ),
  },
};

const CX = 320, CY = 150;

// protein cluster (a crowded synapse), base offsets from centre
const PROT = [
  [-58, -34], [-30, 18], [-6, -42], [16, 30], [44, -16], [62, 22], [-44, 40], [30, -30],
] as [number, number][];
const LINKS: [number, number][] = [[0, 6], [2, 4], [3, 5], [1, 7]];
// a short pair and a long pair to measure
const SHORT: [number, number] = [2, 4];
const LONG: [number, number] = [0, 5];

const GX = Array.from({ length: 11 }, (_, i) => i - 5); // -5..5
const GY = Array.from({ length: 5 }, (_, i) => i - 2);  // -2..2
const STEP = 32;

export default function ExpansionChemistry() {
  const t = STR[useLang().lang] || STR.en;
  const PHASES = t.phases;
  const [phase, setPhase] = useState(0);
  const [grow, setGrow] = useState(0);
  const [measure, setMeasure] = useState(false);
  const reduced = useRef(false);
  const raf = useRef<number | undefined>(undefined);

  useEffect(() => { reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches; }, []);

  const runSwell = () => {
    if (reduced.current) { setGrow(1); return; }
    if (raf.current) cancelAnimationFrame(raf.current);
    const t0 = performance.now(), dur = 1500;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / dur);
      setGrow(1 - Math.pow(1 - k, 3));
      if (k < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    if (phase === 3) runSwell(); else { if (raf.current) cancelAnimationFrame(raf.current); setGrow(0); }
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const spacing = 1 + (phase === 3 ? grow * 0.62 : 0);
  const px = (o: [number, number]) => [CX + o[0] * spacing, CY + o[1] * spacing] as [number, number];

  const showMesh = phase >= 1;
  const showWater = phase === 3;

  // mesh lines (non-scaling stroke; positions scale with spacing)
  const meshLines: React.ReactNode[] = [];
  if (showMesh) {
    for (const gy of GY) for (const gx of GX) {
      const x = CX + gx * STEP * spacing, y = CY + gy * STEP * spacing;
      if (gx < 5) meshLines.push(<line key={`h${gx}-${gy}`} x1={x} y1={y} x2={CX + (gx + 1) * STEP * spacing} y2={y} />);
      if (gy < 2) meshLines.push(<line key={`v${gx}-${gy}`} x1={x} y1={y} x2={x} y2={CY + (gy + 1) * STEP * spacing} />);
    }
  }

  const water = showWater ? Array.from({ length: 26 }, (_, i) => {
    const a = i * 2.39996, r = 18 + (i % 9) * 16;
    return [CX + Math.cos(a) * r * (0.6 + grow * 1.0), CY + Math.sin(a) * r * (0.6 + grow * 0.7)];
  }) : [];

  const sp = px(PROT[SHORT[0]]), sq = px(PROT[SHORT[1]]);
  const lp = px(PROT[LONG[0]]), lq = px(PROT[LONG[1]]);
  const dist = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const NM = 0.78; // px -> display nm scale
  const dShort = dist(sp, sq) * NM, dLong = dist(lp, lq) * NM;

  return (
    <figure className="blg-viz">
      <div className="blg-viz-stage">
        <div className="blg-ec-head">
          <h3>{PHASES[phase].t}</h3>
          <span>{PHASES[phase].s}</span>
        </div>
        <svg viewBox="0 0 640 300" role="img" aria-label={t.ariaPhase(phase + 1, PHASES[phase].t, PHASES[phase].s)}>
          {showWater && <g className="blg-ec-water">{water.map((w, i) => <circle key={i} cx={w[0]} cy={w[1]} r={2.4} />)}</g>}
          {showMesh && <g className="blg-ec-mesh">{meshLines}</g>}

          {/* protein-protein bonds: intact in 0-1, cut (red, gapped) in 2, gone in 3 */}
          {phase <= 2 && LINKS.map(([a, b], i) => {
            const p = px(PROT[a]), q = px(PROT[b]);
            const cut = phase === 2;
            if (!cut) return <line key={i} className="blg-ec-bond" x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} />;
            const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, ux = (q[0] - p[0]), uy = (q[1] - p[1]);
            const L = Math.hypot(ux, uy), nx = ux / L, ny = uy / L, g = 7;
            return (
              <g key={i} className="blg-ec-bond cut">
                <line x1={p[0]} y1={p[1]} x2={mx - nx * g} y2={my - ny * g} />
                <line x1={mx + nx * g} y1={my + ny * g} x2={q[0]} y2={q[1]} />
              </g>
            );
          })}

          {/* COO- charges on the mesh (expand phase) */}
          {showWater && GX.filter((_, i) => i % 2 === 0).map((gx) => GY.filter((_, j) => j % 2 === 0).map((gy) => (
            <text key={`c${gx}-${gy}`} className="blg-ec-coo" x={CX + gx * STEP * spacing} y={CY + gy * STEP * spacing - 4} textAnchor="middle">–</text>
          )))}

          {/* proteins + anchor handles (same dots every phase) */}
          {PROT.map((o, i) => {
            const p = px(o);
            return (
              <g key={i}>
                <rect className="blg-ec-handle" x={p[0] + 5} y={p[1] - 11} width={6} height={6} rx={1} />
                <circle className="blg-ec-prot" cx={p[0]} cy={p[1]} r={6.5} />
              </g>
            );
          })}

          {/* measurement rulers (expand phase, toggle) */}
          {showWater && measure && (
            <g className="blg-ec-ruler">
              <line x1={sp[0]} y1={sp[1]} x2={sq[0]} y2={sq[1]} />
              <line x1={lp[0]} y1={lp[1]} x2={lq[0]} y2={lq[1]} />
              <text x={(sp[0] + sq[0]) / 2} y={(sp[1] + sq[1]) / 2 - 7} textAnchor="middle">{Math.round(dShort)}</text>
              <text x={(lp[0] + lq[0]) / 2} y={(lp[1] + lq[1]) / 2 - 7} textAnchor="middle">{Math.round(dLong)}</text>
            </g>
          )}
        </svg>

        <div className="blg-ec-dots" role="tablist" aria-label={t.phasesLabel}>
          {PHASES.map((p, i) => (
            <button key={i} role="tab" aria-selected={i === phase} aria-current={i === phase ? 'step' : undefined} className={'blg-ec-dot' + (i === phase ? ' on' : '')} onClick={() => setPhase(i)}><i /> {p.t}</button>
          ))}
        </div>
      </div>

      <div className="blg-viz-controls">
        <button className="blg-btn" onClick={() => setPhase((p) => (p + 3) % 4)}>{t.prev}</button>
        <button className="blg-btn" onClick={() => setPhase((p) => (p + 1) % 4)}>{t.next}</button>
        {phase === 3 && <button className="blg-btn" onClick={runSwell}>{t.swell}</button>}
        {phase === 3 && <button className="blg-btn" onClick={() => setMeasure((m) => !m)}>{measure ? t.hideRuler : t.measure}</button>}
        {phase === 3 && measure && <span className="blg-ec-ratio">{t.ratio((dLong / dShort).toFixed(2))}</span>}
      </div>

      <figcaption>{t.caption}</figcaption>
    </figure>
  );
}

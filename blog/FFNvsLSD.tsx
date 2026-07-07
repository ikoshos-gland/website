import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLang } from '../i18n/LanguageContext';

// The thesis's central comparison. FFN: one recurrent network floods ONE object
// at a time — a field-of-view marches from a seed, a predicted object map (POM)
// grows, fed back each step (sequential). LSD: a feed-forward U-Net predicts the
// whole volume at once — affinities plus a jointly-trained auxiliary 10-D shape
// descriptor head — then watershed -> agglomeration (parallel).

const STR = {
  en: {
    archLabel: 'architecture',
    badgeFFN: 'sequential · one object at a time',
    badgeLSD: 'parallel · whole volume at once',
    auxLabel: 'auxiliary 10-D shape descriptor',
    voxelDesc: 'voxel descriptor',
    grpSize: 'size ×1',
    grpOffset: 'mean offset ×3 — displacement vector',
    grpCov: 'covariance ×6 — extent & orientation',
    ariaFFN: 'FFN floods one neuron at a time from a seed with a marching field of view.',
    ariaLSD: 'LSD processes the whole field at once into affinities, supervoxels, then agglomerated objects.',
    step: '▸ Step',
    pause: '❚❚ Pause',
    play: '▶ Play',
    reset: '↻ Reset',
    runVolume: '▸ Run whole volume',
    stageNext: 'stage ›',
    statusFFN: (seed: number, steps: number, done: boolean) =>
      `seed → neuron ${seed} · step ${steps}/7 · ${done ? 'object complete — click another strand to reseed' : 'click a strand to reseed'}`,
    stages: ['raw voxels', 'affinities + auxiliary 10-D descriptor', 'watershed supervoxels', 'agglomerated objects'],
    statusLSDStaged: 'click a voxel for its descriptor',
    statusLSDStart: 'one parallel pass',
    tradeTitle: 'the trade-off',
    tradeAccuracy: 'accuracy',
    tradeCost: 'compute cost',
    tradeParity: '≈ parity',
    tradeCostNote: '~100× cheaper',
    tradeAria: 'Accuracy is roughly at parity between FFN and LSD; LSD is about 100 times cheaper to compute.',
    expFFN: (
      <>A seed drops inside one neuron. A small <b>field of view</b> marches outward; the <b>predicted object map</b> floods that one cell and is fed back each step — recurrence. Then it freezes and starts again elsewhere.</>
    ),
    expLSD: (
      <>The whole field is read at once by a U-Net: per-voxel <b>affinities</b>, plus a parallel <b>auxiliary head</b> that predicts a 10-D local shape descriptor to sharpen them. Then watershed → agglomeration.</>
    ),
    caption: (
      <><b>Two minds for one maze.</b> FFN crawls a field of view out from a single seed, flooding one neuron at a time — sequential, recurrent, accurate. LSD hits the whole volume in one feed-forward pass: affinities trained alongside a jointly-predicted <b>10-D shape descriptor</b> (1 size + 3 mean offset + 6 covariance), then watershed supervoxels and agglomeration. Accuracy is at parity — LSD's edge is being ~100× cheaper, which is what petabyte volumes demand.</>
    ),
  },
  tr: {
    archLabel: 'mimari',
    badgeFFN: 'ardışık · seferde tek nesne',
    badgeLSD: 'paralel · seferde tüm hacim',
    auxLabel: 'yardımcı 10-D şekil tanımlayıcısı',
    voxelDesc: 'voxel tanımlayıcısı',
    grpSize: 'boyut ×1',
    grpOffset: 'ortalama ofset ×3 — yer değiştirme vektörü',
    grpCov: 'kovaryans ×6 — yayılım & yönelim',
    ariaFFN: 'FFN, ilerleyen bir görüş alanıyla bir tohumdan başlayarak seferde tek bir nöronu doldurur.',
    ariaLSD: 'LSD, tüm alanı tek seferde önce affinity\'lere, supervoxel\'lere, ardından birleştirilmiş nesnelere işler.',
    step: '▸ Adım',
    pause: '❚❚ Duraklat',
    play: '▶ Oynat',
    reset: '↻ Sıfırla',
    runVolume: '▸ Tüm hacmi çalıştır',
    stageNext: 'aşama ›',
    statusFFN: (seed: number, steps: number, done: boolean) =>
      `tohum → nöron ${seed} · adım ${steps}/7 · ${done ? 'nesne tamam — yeniden tohumlamak için başka bir life tıkla' : 'yeniden tohumlamak için bir life tıkla'}`,
    stages: ['ham voxel\'ler', 'affinity\'ler + yardımcı 10-D tanımlayıcı', 'watershed supervoxel\'leri', 'birleştirilmiş nesneler'],
    statusLSDStaged: 'tanımlayıcısı için bir voxel\'e tıkla',
    statusLSDStart: 'tek paralel geçiş',
    tradeTitle: 'ödünleşim',
    tradeAccuracy: 'isabet',
    tradeCost: 'hesaplama maliyeti',
    tradeParity: '≈ eşdeğer',
    tradeCostNote: '~100× daha ucuz',
    tradeAria: 'FFN ile LSD arasında isabet kabaca eşdeğerdir; LSD hesaplama açısından yaklaşık 100 kat daha ucuzdur.',
    expFFN: (
      <>Bir nöronun içine bir tohum bırakılır. Küçük bir <b>görüş alanı (FoV)</b> dışa doğru ilerler; <b>tahmini nesne haritası (POM)</b> o tek hücreyi doldurur ve her adımda geri beslenir — yineleme. Sonra donar ve başka bir yerde yeniden başlar.</>
    ),
    expLSD: (
      <>Tüm alan bir U-Net tarafından tek seferde okunur: voxel başına <b>affinity\'ler</b>, artı bunları keskinleştirmek için 10-D yerel şekil tanımlayıcısını tahmin eden paralel bir <b>yardımcı kafa</b>. Ardından watershed → agglomeration.</>
    ),
    caption: (
      <><b>Bir labirent için iki zihin.</b> FFN, tek bir tohumdan bir görüş alanını dışa doğru sürür ve seferde tek bir nöronu doldurur — ardışık, yinelemeli, isabetli. LSD ise tüm hacme tek bir ileri-besleme geçişiyle vurur: ortaklaşa tahmin edilen bir <b>10-D şekil tanımlayıcısı</b> (1 boyut + 3 ortalama ofset + 6 kovaryans) ile birlikte eğitilen affinity\'ler, ardından watershed supervoxel\'leri ve agglomeration. İsabet eşdeğer düzeyde — LSD\'nin üstünlüğü ~100× daha ucuz olması ve petabayt hacimlerin tam da bunu gerektirmesi.</>
    ),
  },
  de: {
    archLabel: 'Architektur',
    badgeFFN: 'sequenziell · ein Objekt nach dem anderen',
    badgeLSD: 'parallel · gesamtes Volumen auf einmal',
    auxLabel: 'zusätzlicher 10-D-Formdeskriptor',
    voxelDesc: 'Voxel-Deskriptor',
    grpSize: 'Größe ×1',
    grpOffset: 'mittlerer Offset ×3 — Verschiebungsvektor',
    grpCov: 'Kovarianz ×6 — Ausdehnung & Orientierung',
    ariaFFN: 'FFN flutet von einem Seed aus mit einem wandernden Field of View ein Neuron nach dem anderen.',
    ariaLSD: 'LSD verarbeitet das gesamte Feld auf einmal zu Affinities, Supervoxeln und dann agglomerierten Objekten.',
    step: '▸ Schritt',
    pause: '❚❚ Pause',
    play: '▶ Abspielen',
    reset: '↻ Zurücksetzen',
    runVolume: '▸ Gesamtes Volumen ausführen',
    stageNext: 'Stufe ›',
    statusFFN: (seed: number, steps: number, done: boolean) =>
      `Seed → Neuron ${seed} · Schritt ${steps}/7 · ${done ? 'Objekt fertig — auf einen anderen Strang klicken zum Neu-Seeden' : 'auf einen Strang klicken zum Neu-Seeden'}`,
    stages: ['rohe Voxel', 'Affinities + zusätzlicher 10-D-Deskriptor', 'Watershed-Supervoxel', 'agglomerierte Objekte'],
    statusLSDStaged: 'auf ein Voxel klicken für seinen Deskriptor',
    statusLSDStart: 'ein paralleler Durchlauf',
    tradeTitle: 'der Kompromiss',
    tradeAccuracy: 'Genauigkeit',
    tradeCost: 'Rechenkosten',
    tradeParity: '≈ gleichauf',
    tradeCostNote: '~100× günstiger',
    tradeAria: 'Die Genauigkeit von FFN und LSD ist ungefähr gleichauf; LSD ist rund 100-mal günstiger zu berechnen.',
    expFFN: (
      <>Ein Seed wird in ein Neuron gesetzt. Ein kleines <b>Field of View (FoV)</b> wandert nach außen; die <b>vorhergesagte Objektkarte (POM)</b> flutet diese eine Zelle und wird bei jedem Schritt zurückgeführt — Rekurrenz. Dann friert es ein und beginnt anderswo erneut.</>
    ),
    expLSD: (
      <>Das gesamte Feld wird von einem U-Net auf einmal gelesen: <b>Affinities</b> pro Voxel, plus ein paralleler <b>Hilfskopf</b>, der einen 10-D lokalen Formdeskriptor vorhersagt, um sie zu schärfen. Dann Watershed → Agglomeration.</>
    ),
    caption: (
      <><b>Zwei Denkweisen für ein Labyrinth.</b> FFN treibt von einem einzelnen Seed aus ein Field of View nach außen und flutet ein Neuron nach dem anderen — sequenziell, rekurrent, präzise. LSD trifft das gesamte Volumen in einem einzigen Feed-Forward-Durchlauf: Affinities, die gemeinsam mit einem <b>10-D-Formdeskriptor</b> (1 Größe + 3 mittlerer Offset + 6 Kovarianz) trainiert werden, dann Watershed-Supervoxel und Agglomeration. Die Genauigkeit ist gleichauf — LSDs Vorteil liegt darin, ~100× günstiger zu sein, was Petabyte-Volumen verlangen.</>
    ),
  },
};

const SAMPLES = 16;
const COLORS = ['#FFD700', '#D6FF4F', '#F5F5F5', '#5BC8C0', '#B89CE8'];
const BASES = [40, 80, 122, 166, 206];
const FREQ = [0.018, 0.022, 0.015, 0.024, 0.019];
const AMP = [11, 13, 15, 12, 14];
const PH = [0.4, 2.1, 3.4, 1.2, 5.0];

function smooth(pts: number[][]) {
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += ` C ${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6}, ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}
function descriptor(x: number, y: number) {
  const r = (s: number) => { let v = Math.sin(x * 12.9898 + y * 78.233 + s * 37.71) * 43758.5453; return v - Math.floor(v); };
  return {
    size: [0.45 + 0.5 * r(1)],
    off: [0, 1, 2].map((k) => 0.2 + 0.65 * r(k + 2)),
    cov: [0, 1, 2, 3, 4, 5].map((k) => 0.15 + 0.75 * r(k + 10)),
  };
}

export default function FFNvsLSD() {
  const t = STR[useLang().lang] || STR.en;
  const [mode, setMode] = useState<'ffn' | 'lsd'>('ffn');
  const [seed, setSeed] = useState(1);
  const [prog, setProg] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [steps, setSteps] = useState(0);
  const [stage, setStage] = useState(0);          // LSD: 0 raw,1 aff,2 watershed,3 agglo
  const [running, setRunning] = useState(false);
  const [pick, setPick] = useState<{ x: number; y: number } | null>(null);
  const reduced = useRef(false);
  const raf = useRef<number | undefined>(undefined);

  useEffect(() => { reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches; }, []);

  const pts = useMemo(() => BASES.map((b, n) => Array.from({ length: SAMPLES + 1 }, (_, i) => {
    const x = 14 + 382 * (i / SAMPLES);
    const y = b + Math.sin(x * FREQ[n] + PH[n]) * AMP[n] + Math.sin(x * 0.012 + PH[n]) * 4;
    return [x, y];
  })), []);

  // FFN auto-play
  useEffect(() => {
    if (mode !== 'ffn' || !playing) return;
    let last = 0;
    const tick = (t: number) => {
      if (last) setProg((p) => { const np = Math.min(1, p + (t - last) / 1400); if (np >= 1) setPlaying(false); return np; });
      last = t; raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [mode, playing]);

  useEffect(() => { setSteps(Math.round(prog * 7)); }, [prog]);

  // LSD auto-advance through stages
  useEffect(() => {
    if (mode !== 'lsd' || !running || stage >= 3 || reduced.current) return;
    const id = setTimeout(() => setStage((s) => Math.min(3, s + 1)), 950);
    return () => clearTimeout(id);
  }, [mode, running, stage]);

  const step = () => { setPlaying(false); setProg((p) => Math.min(1, p + 0.15)); };
  const reseed = (n: number) => { setSeed(n); setProg(0); setPlaying(false); };
  const runLSD = () => { setRunning(true); setStage(reduced.current ? 3 : 1); setPick(null); };
  const resetLSD = () => { setRunning(false); setStage(0); setPick(null); };

  // FFN frontier
  const f = Math.max(0, Math.min(SAMPLES, prog * SAMPLES));
  const fi = Math.floor(f), fj = Math.min(SAMPLES, fi + 1), fu = f - fi;
  const fp = [pts[seed][fi][0] + (pts[seed][fj][0] - pts[seed][fi][0]) * fu, pts[seed][fi][1] + (pts[seed][fj][1] - pts[seed][fi][1]) * fu];

  const desc = pick ? descriptor(pick.x, pick.y) : null;

  return (
    <figure className="blg-viz">
      <div className="blg-viz-stage blg-fl">
        <div className="blg-fl-rail">
          <div className="blg-fl-toggle" role="radiogroup" aria-label={t.archLabel}>
            {(['ffn', 'lsd'] as const).map((m) => (
              <button key={m} role="radio" aria-checked={mode === m} className={'blg-btn' + (mode === m ? ' on' : '')} onClick={() => setMode(m)}>{m.toUpperCase()}</button>
            ))}
          </div>
          <div className={'blg-fl-badge ' + mode}>{mode === 'ffn' ? t.badgeFFN : t.badgeLSD}</div>
          {mode === 'ffn' ? (
            <p className="blg-fl-exp">{t.expFFN}</p>
          ) : (
            <>
              <p className="blg-fl-exp">{t.expLSD}</p>
              <div className={'blg-fl-aux' + (stage >= 1 ? ' on' : '')}>
                <span>{t.auxLabel}</span>
                <div className="bars">{Array.from({ length: 10 }, (_, i) => <i key={i} style={{ height: (5 + (i % 4) * 4) + 'px' }} />)}</div>
              </div>
              {desc && (
                <div className="blg-fl-desc">
                  <b>{t.voxelDesc}</b>
                  <div className="grp"><span>{t.grpSize}</span>{desc.size.map((v, i) => <em key={i} style={{ width: v * 100 + '%' }} className="s" />)}</div>
                  <div className="grp"><span>{t.grpOffset}</span>{desc.off.map((v, i) => <em key={i} style={{ width: v * 100 + '%' }} className="o" />)}</div>
                  <div className="grp"><span>{t.grpCov}</span>{desc.cov.map((v, i) => <em key={i} style={{ width: v * 100 + '%' }} className="c" />)}</div>
                </div>
              )}
            </>
          )}
        </div>

        <svg viewBox="0 0 410 248" className="blg-fl-stage" role="img" aria-label={mode === 'ffn' ? t.ariaFFN : t.ariaLSD} onClick={(e) => { if (mode === 'lsd' && stage >= 1) { const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect(); if (r.width && r.height) setPick({ x: (e.clientX - r.left) / r.width * 410, y: (e.clientY - r.top) / r.height * 248 }); } }}>
          {/* base strands (gray) */}
          {pts.map((P, n) => <path key={n} d={smooth(P)} className="blg-fl-base" />)}

          {/* FFN mode */}
          {mode === 'ffn' && (
            <>
              <path d={smooth(pts[seed])} className="blg-fl-pom" pathLength={1} strokeDasharray={`${prog} 1`} />
              {prog > 0 && prog < 1 && <rect className="blg-fl-fov" x={fp[0] - 18} y={fp[1] - 18} width={36} height={36} rx={4} />}
              <circle className="blg-fl-seed" cx={pts[seed][0][0]} cy={pts[seed][0][1]} r={5} />
              {/* invisible hit targets for reseeding */}
              {pts.map((P, n) => <path key={n} d={smooth(P)} className="blg-fl-hit" onClick={() => reseed(n)} />)}
            </>
          )}

          {/* LSD mode */}
          {mode === 'lsd' && stage >= 1 && (
            <>
              {pts.map((P, n) => <path key={n} d={smooth(P)} className="blg-fl-aff" stroke={stage >= 3 ? COLORS[n] : '#5BC8C0'} />)}
              {stage === 1 && pts.map((P, n) => P.filter((_, i) => i % 2 === 0).map((p, i) => <line key={n + '-' + i} className="blg-fl-tick" x1={p[0]} y1={p[1] - 6} x2={p[0]} y2={p[1] + 6} />))}
              {stage === 2 && pts.map((P, n) => P.filter((_, i) => i % 2 === 1).map((p, i) => <circle key={n + '-' + i} className="blg-fl-svx" cx={p[0]} cy={p[1]} r={5} />))}
            </>
          )}
          {pick && mode === 'lsd' && <circle className="blg-fl-pick" cx={pick.x} cy={pick.y} r={7} />}
        </svg>
      </div>

      <div className="blg-viz-controls">
        {mode === 'ffn' ? (
          <>
            <button className="blg-btn" onClick={step}>{t.step}</button>
            <button className="blg-btn" onClick={() => setPlaying((p) => !p)}>{playing ? t.pause : t.play}</button>
            <button className="blg-btn" onClick={() => reseed(seed)}>{t.reset}</button>
            <span className="blg-fl-status">{t.statusFFN(seed + 1, steps, prog >= 1)}</span>
          </>
        ) : (
          <>
            <button className="blg-btn" onClick={runLSD} disabled={running && stage >= 1}>{t.runVolume}</button>
            {running && !reduced.current && <button className="blg-btn" onClick={() => setStage((s) => (s >= 3 ? 1 : s + 1))}>{t.stageNext}</button>}
            <button className="blg-btn" onClick={resetLSD}>{t.reset}</button>
            <span className="blg-fl-status">{t.stages[stage]} · {stage >= 1 ? t.statusLSDStaged : t.statusLSDStart}</span>
          </>
        )}
      </div>

      <div className="blg-fl-trade" role="img" aria-label={t.tradeAria}>
        <b>{t.tradeTitle}</b>
        <div className="tr">
          <span className="k">{t.tradeAccuracy}</span>
          <div className="pair">
            <div className="bl"><span className="tag">FFN</span><div className="bar"><i className="ffn" style={{ width: '95%' }} /></div></div>
            <div className="bl"><span className="tag">LSD</span><div className="bar"><i className="lsd" style={{ width: '93%' }} /></div></div>
          </div>
          <span className="n">{t.tradeParity}</span>
        </div>
        <div className="tr">
          <span className="k">{t.tradeCost}</span>
          <div className="pair">
            <div className="bl"><span className="tag">FFN</span><div className="bar"><i className="ffn" style={{ width: '100%' }} /></div></div>
            <div className="bl"><span className="tag">LSD</span><div className="bar"><i className="lsd" style={{ width: '2%' }} /></div></div>
          </div>
          <span className="n hi">{t.tradeCostNote}</span>
        </div>
      </div>

      <figcaption>{t.caption}</figcaption>
    </figure>
  );
}

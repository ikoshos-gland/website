import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLang } from '../i18n/LanguageContext';

// A proofreader's two corrections on living EM tissue. An automated FFN
// segmentation is painted as translucent colour over a procedurally-drawn
// electron-microscopy cross-section (packed neurite profiles, dark double-
// membranes, mitochondria). Two staged mistakes: a MERGE (two profiles flooded
// as one colour across a membrane the network FAILED TO DETECT) and a SPLIT (one
// profile chopped into two ids by a phantom border). Toggle to proofread: the
// merge fix is multi-step (restore the missed membrane, then separate) — visibly
// costlier than the split's single stitch.

const RAMP = ['#1a1c20', '#202327', '#26292e', '#2b2e34', '#1d2024', '#23262b'];
const ACCENT = ['#5BC8C0', '#B89CE8', '#9FE870', '#E8C66A', '#78AAEB'];
const SPLIT_ID = 2, MERGE_A = 12, MERGE_B = 13, FLOOD_ID = 5;
const MITO = [0, 7, 10];

const STR = {
  en: {
    svgAria: 'An electron-microscopy cross-section of brain tissue: a packed mosaic of neurite profiles bounded by dark membranes, with a translucent automated segmentation on top carrying one merge error and one split error; a toggle proofreads them.',
    modeLabel: 'segmentation state', modeAuto: 'automated', modeFixed: 'proofread',
    hoverHint: 'hover a profile to read its object id',
    idMerge: '2 profiles → 1 id (wrong)', idSplit: '1 profile → 2 ids (wrong)', idClean: (n: number) => `profile ${n} · 1 object id`,
    edits: 'edits to fix:', edits2: '2 — 1 merge · 1 split', editsNone: 'none ✓',
    legend: 'error = red · restored membrane = teal · seed = amber',
    capTitle: 'A proofreader’s two corrections.',
    capBody1: 'An automated FFN segmentation, painted as translucent colour over a raw EM cross-section — the way it looks in a real proofreading tool. Two characteristic mistakes are staged on the same tissue: a',
    capMerge: 'merge', capBody2: '(two profiles flooded as one colour across a membrane the network', capMissed: 'failed to detect', capBody3: '), and a',
    capSplit: 'split', capBody4: '(one profile chopped into two ids by a phantom border). Flip to',
    capProofread: 'proofread', capBody5: 'and a human does what the next paragraph describes — restore the missed membrane to separate the merged cells, then stitch the broken neuron — until edits read',
    capNone: 'none', capBody6: '. Separating a merge takes restore-membrane → re-check; a split is one local join — which is why merges cost more.',
  },
  tr: {
    svgAria: 'Beyin dokusunun elektron-mikroskobu kesiti: koyu membranlarla sınırlanmış sıkışık bir nörit profili mozaiği; üstte bir merge ve bir split hatası taşıyan saydam otomatik segmentasyon; bir anahtar bunları gözden geçirir.',
    modeLabel: 'segmentasyon durumu', modeAuto: 'otomatik', modeFixed: 'gözden geçir',
    hoverHint: 'nesne kimliğini okumak için bir profilin üstüne gel',
    idMerge: '2 profil → 1 kimlik (yanlış)', idSplit: '1 profil → 2 kimlik (yanlış)', idClean: (n: number) => `profil ${n} · 1 nesne kimliği`,
    edits: 'düzeltilecek:', edits2: '2 — 1 merge · 1 split', editsNone: 'yok ✓',
    legend: 'hata = kırmızı · onarılan membran = teal · tohum = amber',
    capTitle: 'Bir gözden geçirenin iki düzeltmesi.',
    capBody1: 'Ham bir EM kesiti üzerine saydam renkle boyanmış otomatik bir FFN segmentasyonu — gerçek bir gözden geçirme (proofreading) aracında göründüğü gibi. Aynı doku üzerinde iki tipik hata sahnelendi: bir',
    capMerge: 'merge', capBody2: '(ağın', capMissed: 'tespit edemediği', capBody3: 'bir membranı aşarak iki profilin tek renge boyanması) ve bir',
    capSplit: 'split', capBody4: '(bir profilin hayalet bir sınırla iki kimliğe bölünmesi). Şuna geç:',
    capProofread: 'gözden geçir', capBody5: 've bir insan, sonraki paragrafın anlattığını yapar — birleşmiş hücreleri ayırmak için kaçırılan membranı onarır, sonra kırık nöronu diker — düzeltmeler şuna inene dek:',
    capNone: 'yok', capBody6: '. Bir merge’i ayırmak membran-onar → yeniden-kontrol gerektirir; split tek bir yerel birleştirmedir — merge’in daha pahalı olmasının nedeni budur.',
  },
  de: {
    svgAria: 'Ein elektronenmikroskopischer Querschnitt von Hirngewebe: ein dichtes Mosaik von Neuriten-Profilen mit dunklen Membranen, darüber eine durchscheinende automatische Segmentierung mit einem Merge- und einem Split-Fehler; ein Schalter korrigiert sie.',
    modeLabel: 'Segmentierungszustand', modeAuto: 'automatisch', modeFixed: 'korrigieren',
    hoverHint: 'über ein Profil fahren, um seine Objekt-ID zu lesen',
    idMerge: '2 Profile → 1 ID (falsch)', idSplit: '1 Profil → 2 IDs (falsch)', idClean: (n: number) => `Profil ${n} · 1 Objekt-ID`,
    edits: 'zu korrigieren:', edits2: '2 — 1 Merge · 1 Split', editsNone: 'keine ✓',
    legend: 'Fehler = rot · restaurierte Membran = teal · Saat = amber',
    capTitle: 'Zwei Korrekturen eines Proofreaders.',
    capBody1: 'Eine automatische FFN-Segmentierung, als durchscheinende Farbe über einen rohen EM-Querschnitt gemalt — so, wie es in einem echten Proofreading-Werkzeug aussieht. Auf demselben Gewebe sind zwei typische Fehler inszeniert: ein',
    capMerge: 'Merge', capBody2: '(zwei Profile als eine Farbe über eine Membran geflutet, die das Netz', capMissed: 'nicht erkannt hat', capBody3: '), und ein',
    capSplit: 'Split', capBody4: '(ein Profil von einer Phantomgrenze in zwei IDs zerteilt). Wechsle zu',
    capProofread: 'korrigieren', capBody5: 'und ein Mensch tut, was der nächste Absatz beschreibt — stellt die fehlende Membran wieder her, um die verschmolzenen Zellen zu trennen, und näht dann das zerbrochene Neuron — bis die Korrekturen',
    capNone: 'keine', capBody6: 'anzeigen. Einen Merge zu trennen erfordert Membran-Wiederherstellung → Prüfung; ein Split ist eine einzige lokale Naht — deshalb kosten Merges mehr.',
  },
};

function jit(a: number, b: number) { return Math.sin((a * 7 + b * 13) * 2.39) * 0.5; }
function smoothClosed(pts: number[][]) {
  const n = pts.length;
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + ' Z';
}

export default function FFNFlood() {
  const t = STR[useLang().lang] || STR.en;
  const [mode, setMode] = useState<'auto' | 'fixed'>('auto');
  const [hover, setHover] = useState<number | null>(null);
  const [floodR, setFloodR] = useState(0);
  const reduced = useRef(false);
  const raf = useRef<number | undefined>(undefined);

  const profiles = useMemo(() => Array.from({ length: 16 }, (_, id) => {
    const r = Math.floor(id / 4), c = id % 4;
    const sx = 26 + c * 132 + jit(r, c) * 34, sy = 26 + r * 70 + jit(c, r) * 30;
    const rad = 62 + (id % 3) * 6;
    const pts: number[][] = [];
    for (let k = 0; k < 6; k++) {
      const ang = (k / 6) * Math.PI * 2 + jit(id, k) * 0.5;
      const rr = rad * (0.78 + 0.34 * (0.5 + jit(k, id)));
      pts.push([sx + Math.cos(ang) * rr, sy + Math.sin(ang) * rr * 0.82]);
    }
    return { id, d: smoothClosed(pts), cx: sx, cy: sy };
  }), []);

  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced.current) { setFloodR(120); return; }
    const f = profiles[FLOOD_ID];
    const t0 = performance.now();
    const step = (ts: number) => {
      const k = Math.min(1, (ts - t0) / 900);
      setFloodR((1 - Math.pow(1 - k, 3)) * 120);
      if (k < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [profiles]);

  const fixed = mode === 'fixed';
  const segColor = (id: number) => {
    if (id === SPLIT_ID) return '#E8C66A';
    if (id === MERGE_A) return fixed ? '#B89CE8' : '#5BC8C0';
    if (id === MERGE_B) return fixed ? '#9FE870' : '#5BC8C0';
    return ACCENT[id % ACCENT.length];
  };
  const mA = profiles[MERGE_A], mB = profiles[MERGE_B], sp = profiles[SPLIT_ID], fl = profiles[FLOOD_ID];
  const seamX = (mA.cx + mB.cx) / 2, seamY = (mA.cy + mB.cy) / 2;
  const idReadout = hover == null ? t.hoverHint
    : (!fixed && (hover === MERGE_A || hover === MERGE_B)) ? t.idMerge
      : (!fixed && hover === SPLIT_ID) ? t.idSplit : t.idClean(hover + 1);

  return (
    <figure className="blg-viz">
      <div className="blg-viz-stage">
        <svg viewBox="0 0 440 300" role="img" aria-label={t.svgAria}>
          <defs>
            <pattern id="emspeck" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.5" fill="#fff" fillOpacity="0.05" /></pattern>
            <clipPath id="emFlood"><circle cx={fl.cx} cy={fl.cy} r={floodR} /></clipPath>
            <clipPath id="emSplitTop"><rect x="0" y="0" width="440" height={sp.cy} /></clipPath>
            <clipPath id="emSplitBot"><rect x="0" y={sp.cy} width="440" height={300 - sp.cy} /></clipPath>
          </defs>

          <rect x="0" y="0" width="440" height="300" fill="#15171B" />
          <rect x="0" y="0" width="440" height="300" fill="url(#emspeck)" />

          {/* gray cytoplasm fills */}
          {profiles.map((p) => <path key={'f' + p.id} d={p.d} fill={RAMP[p.id % RAMP.length]} />)}
          {/* mitochondria */}
          {MITO.map((id) => { const p = profiles[id]; return (
            <g key={'m' + id} transform={`translate(${p.cx + 9} ${p.cy - 6}) rotate(22)`}>
              <ellipse className="blg-em-mito" rx="9" ry="5" />
              <line className="blg-em-cristae" x1="-6" y1="-2" x2="6" y2="-1" /><line className="blg-em-cristae" x1="-6" y1="1" x2="6" y2="2" />
            </g>
          ); })}
          {/* double membranes on top of all fills */}
          {profiles.map((p) => <path key={'mem' + p.id} className={'blg-em-mem' + (hover === p.id ? ' hl' : '')} d={p.d} />)}
          {profiles.map((p) => <path key={'h' + p.id} className="blg-em-mem-hair" d={p.d} />)}

          {/* segmentation overlay (clean cells) */}
          {profiles.filter((p) => p.id !== SPLIT_ID).map((p) => (
            <path key={'o' + p.id} className="blg-em-seg" d={p.d} fill={segColor(p.id)}
              clipPath={p.id === FLOOD_ID ? 'url(#emFlood)' : undefined}
              style={(p.id === MERGE_A || p.id === MERGE_B) ? { transition: 'fill .55s', transitionDelay: fixed ? '.5s' : '0s' } : undefined} />
          ))}
          {/* split cell: two clipped halves */}
          <path className="blg-em-seg" d={sp.d} fill={fixed ? '#E8C66A' : '#E8C66A'} clipPath="url(#emSplitTop)" />
          <path className="blg-em-seg" d={sp.d} fill={fixed ? '#E8C66A' : '#C9A227'} clipPath="url(#emSplitBot)" style={{ transition: 'fill .5s' }} />

          {/* seed ring on the flood profile */}
          <circle className="blg-em-seed" cx={fl.cx} cy={fl.cy} r="5" />

          {/* SPLIT markers: phantom border + stitch glyph */}
          <g style={{ opacity: fixed ? 0 : 1, transition: 'opacity .5s' }}>
            <line className="blg-em-phantom" x1={sp.cx - 42} y1={sp.cy} x2={sp.cx + 42} y2={sp.cy} />
            <g className="blg-em-stitch">{[-16, 0, 16].map((dx) => <line key={dx} x1={sp.cx + dx} y1={sp.cy - 5} x2={sp.cx + dx + 4} y2={sp.cy + 5} />)}</g>
          </g>

          {/* MERGE marker: red chevrons on the missed seam (pulses in auto) */}
          <g className={'blg-em-mark' + (!fixed ? ' arm' : '')} style={{ opacity: fixed ? 0 : 1 }}>
            <polyline points={`${seamX - 9},${seamY - 12} ${seamX - 2},${seamY - 4} ${seamX - 9},${seamY + 4}`} />
            <polyline points={`${seamX + 9},${seamY - 12} ${seamX + 2},${seamY - 4} ${seamX + 9},${seamY + 4}`} />
          </g>
          {/* restored ground-truth membrane (draws in on fix) */}
          <line className="blg-em-truth" x1={seamX} y1={seamY - 30} x2={seamX} y2={seamY + 30} pathLength={1}
            style={{ opacity: fixed ? 1 : 0, strokeDasharray: 1, strokeDashoffset: fixed ? 0 : 1, transition: 'stroke-dashoffset .6s ease, opacity .3s' }} />

          {/* hover hit areas */}
          {profiles.map((p) => <path key={'hit' + p.id} d={p.d} fill="transparent" style={{ cursor: 'pointer' }} onMouseEnter={() => setHover(p.id)} onMouseLeave={() => setHover(null)} />)}
        </svg>

        <div className="blg-sm-read">
          <span>{idReadout}</span>
          <span className="ed">{t.edits} <b>{fixed ? t.editsNone : t.edits2}</b></span>
        </div>
      </div>

      <div className="blg-viz-controls">
        <div className="blg-sm-seg" role="radiogroup" aria-label={t.modeLabel}>
          <button role="radio" aria-checked={!fixed} className={'blg-btn' + (!fixed ? ' on' : '')} onClick={() => setMode('auto')}>{t.modeAuto}</button>
          <button role="radio" aria-checked={fixed} className={'blg-btn' + (fixed ? ' on' : '')} onClick={() => setMode('fixed')}>{t.modeFixed}</button>
        </div>
        <span className="blg-em-legend">{t.legend}</span>
      </div>

      <figcaption><b>{t.capTitle}</b> {t.capBody1} <b style={{ color: '#E24B4A' }}>{t.capMerge}</b> {t.capBody2} <i>{t.capMissed}</i>{t.capBody3} <b style={{ color: '#E24B4A' }}>{t.capSplit}</b> {t.capBody4} <b>{t.capProofread}</b> {t.capBody5} <b>{t.capNone}</b>{t.capBody6}</figcaption>
    </figure>
  );
}

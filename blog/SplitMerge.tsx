import React, { useMemo, useState } from 'react';
import { useLang } from '../i18n/LanguageContext';

// The two segmentation errors that matter. A SPLIT chops one neuron into pieces
// (annoying but locally stitchable). A MERGE fuses two neurons under one label —
// a phantom wire in the circuit, far harder to find and cut. Colour is never the
// only cue: each neuron also carries its own dash pattern.

const STR = {
  en: {
    svgAria: 'A bundle of five neurons. Toggle shows the correct segmentation, a split error breaking one neuron into pieces, or a merge error fusing two neurons.',
    modes: { correct: 'correct', split: 'split', merge: 'merge' },
    modeLabel: 'error mode',
    neuron: (n: number, count: number | string, plural: boolean) =>
      `neuron ${n}: ${count} object id${plural ? 's' : ''}`,
    hoverHint: 'hover a strand to inspect its id',
    editsToFix: 'edits to fix:',
    editsNone: 'none',
    editsOne: '1 (local)',
    editsSeveral: 'several (buried)',
    timeLabel: 'time per error:',
    timeSplit: '≈ 2 min · one stitch',
    timeMerge: '≈ 30 min · hunt & cut',
    stitched: '✓ stitched',
    fixSplit: 'fix split (1 click)',
    confirmCut: '⚠ confirm cut?',
    fixMerge: 'fix merge…',
    bridgeCut: '✓ bridge found & cut',
    chipMerge: 'merge: expensive to fix',
    chipSplit: 'split: cheap to fix',
    chipCorrect: 'ground truth · 5 neurons',
    caption: (
      <><b>Split vs. merge.</b> A split chops one neuron into fragments — a single local stitch puts it back. A merge fuses two different neurons into one label, a connection biology never made; you must hunt the false bridge down inside the volume and cut it. That asymmetry — merges are catastrophic, splits merely tedious — shapes every algorithm that follows.</>
    ),
  },
  tr: {
    svgAria: 'Beş nörondan oluşan bir demet. Anahtar; doğru segmentasyonu, bir nöronu parçalara ayıran bir split hatasını veya iki nöronu birleştiren bir merge hatasını gösterir.',
    modes: { correct: 'doğru', split: 'split', merge: 'merge' },
    modeLabel: 'hata modu',
    neuron: (n: number, count: number | string, _plural: boolean) =>
      `nöron ${n}: ${count} nesne id'si`,
    hoverHint: "id'sini incelemek için bir lif üzerine gelin",
    editsToFix: 'düzeltme için:',
    editsNone: 'yok',
    editsOne: '1 (yerel)',
    editsSeveral: 'birkaç (gömülü)',
    timeLabel: 'hata başına süre:',
    timeSplit: '≈ 2 dk · tek dikiş',
    timeMerge: '≈ 30 dk · avla & kes',
    stitched: '✓ dikildi',
    fixSplit: 'split düzelt (1 tık)',
    confirmCut: '⚠ kesmeyi onayla?',
    fixMerge: 'merge düzelt…',
    bridgeCut: '✓ köprü bulundu & kesildi',
    chipMerge: 'merge: düzeltmesi pahalı',
    chipSplit: 'split: düzeltmesi ucuz',
    chipCorrect: 'temel gerçek · 5 nöron',
    caption: (
      <><b>Split vs. merge.</b> Bir split, bir nöronu parçalara böler — tek bir yerel dikiş onu geri birleştirir. Bir merge, iki farklı nöronu tek bir etiket altında birleştirir; biyolojinin asla kurmadığı bir bağlantı. Sahte köprüyü hacmin içinde avlayıp kesmeniz gerekir. Bu asimetri — merge'ler felaket, split'ler yalnızca sıkıcı — sonrasında gelen her algoritmayı şekillendirir.</>
    ),
  },
  de: {
    svgAria: 'Ein Bündel aus fünf Neuronen. Der Umschalter zeigt die korrekte Segmentierung, einen Split-Fehler, der ein Neuron in Stücke zerteilt, oder einen Merge-Fehler, der zwei Neuronen verschmilzt.',
    modes: { correct: 'korrekt', split: 'split', merge: 'merge' },
    modeLabel: 'Fehlermodus',
    neuron: (n: number, count: number | string, plural: boolean) =>
      `Neuron ${n}: ${count} Objekt-ID${plural ? 's' : ''}`,
    hoverHint: 'über einen Strang fahren, um seine ID zu prüfen',
    editsToFix: 'Korrekturen:',
    editsNone: 'keine',
    editsOne: '1 (lokal)',
    editsSeveral: 'mehrere (vergraben)',
    timeLabel: 'Zeit pro Fehler:',
    timeSplit: '≈ 2 Min · eine Naht',
    timeMerge: '≈ 30 Min · suchen & trennen',
    stitched: '✓ vernäht',
    fixSplit: 'Split beheben (1 Klick)',
    confirmCut: '⚠ Schnitt bestätigen?',
    fixMerge: 'Merge beheben…',
    bridgeCut: '✓ Brücke gefunden & getrennt',
    chipMerge: 'Merge: teuer zu beheben',
    chipSplit: 'Split: billig zu beheben',
    chipCorrect: 'Grundwahrheit · 5 Neuronen',
    caption: (
      <><b>Split vs. Merge.</b> Ein Split zerteilt ein Neuron in Fragmente — eine einzige lokale Naht setzt es wieder zusammen. Ein Merge verschmilzt zwei verschiedene Neuronen unter einem Label, eine Verbindung, die die Biologie nie geknüpft hat; man muss die falsche Brücke im Volumen aufspüren und durchtrennen. Diese Asymmetrie — Merges sind katastrophal, Splits bloß mühsam — prägt jeden nachfolgenden Algorithmus.</>
    ),
  },
};

const SAMPLES = 16;
const NEUR = [
  { base: 46, f: 0.016, a: 12, p: 0.4, c: '#FFD700', dash: '' },
  { base: 88, f: 0.020, a: 14, p: 2.1, c: '#D6FF4F', dash: '7 5' },
  { base: 130, f: 0.014, a: 16, p: 3.4, c: '#F5F5F5', dash: '2 5' },
  { base: 172, f: 0.022, a: 13, p: 1.2, c: '#5BC8C0', dash: '11 6' },
  { base: 206, f: 0.018, a: 15, p: 5.0, c: '#B89CE8', dash: '4 4' },
];

function smooth(pts: number[][]) {
  if (pts.length < 2) return '';
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

export default function SplitMerge() {
  const t = STR[useLang().lang] || STR.en;
  const [mode, setMode] = useState<'correct' | 'split' | 'merge'>('correct');
  const [splitFixed, setSplitFixed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [mergeFixed, setMergeFixed] = useState(false);
  const [hover, setHover] = useState<number | null>(null);

  const pts = useMemo(() => NEUR.map((n) => Array.from({ length: SAMPLES + 1 }, (_, i) => {
    const x = 16 + 408 * (i / SAMPLES);
    const y = n.base + Math.sin(x * n.f + n.p) * n.a + Math.sin(x * 0.012 + n.p) * 5;
    return [x, y];
  })), []);

  const setM = (m: typeof mode) => { setMode(m); setSplitFixed(false); setConfirming(false); setMergeFixed(false); };

  // merge bridge: closest pair between neuron 3 and neuron 4
  const bridge = useMemo(() => {
    let best = { d: 1e9, a: pts[3][0], b: pts[4][0] };
    for (const p of pts[3]) for (const q of pts[4]) { const d = Math.hypot(p[0] - q[0], p[1] - q[1]); if (d < best.d) best = { d, a: p, b: q }; }
    return best;
  }, [pts]);

  const idCount = (i: number) => {
    if (mode === 'split' && i === 2) return splitFixed ? 1 : 3;
    if (mode === 'merge' && (i === 3 || i === 4)) return mergeFixed ? 1 : '½';
    return 1;
  };
  const edits = mode === 'correct' ? 0 : mode === 'split' ? (splitFixed ? 0 : 1) : (mergeFixed ? 0 : 3);

  const renderNeuron = (i: number) => {
    const n = NEUR[i], P = pts[i];
    // SPLIT: neuron 2 broken into 3 fragments unless fixed
    if (mode === 'split' && i === 2 && !splitFixed) {
      const segs: [number, number, string][] = [[0, 6, '#F5F5F5'], [6, 11, '#9A9A9A'], [11, SAMPLES, '#C9A227']];
      return (
        <g key={i}>
          {segs.map(([a, b, col], k) => <path key={k} d={smooth(P.slice(a, b + 1))} stroke={col} className="blg-sm-n" strokeDasharray={n.dash} />)}
          {[6, 11].map((ci) => { const p = P[ci]; return <line key={ci} className="blg-sm-cut" x1={p[0]} y1={p[1] - 11} x2={p[0]} y2={p[1] + 11} />; })}
        </g>
      );
    }
    // MERGE: neurons 3 and 4 share one colour unless fixed
    let col = n.c;
    if (mode === 'merge' && !mergeFixed && (i === 3 || i === 4)) col = '#5BC8C0';
    return <path key={i} d={smooth(P)} stroke={col} className={'blg-sm-n' + (hover === i ? ' hl' : '')} strokeDasharray={n.dash} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />;
  };

  return (
    <figure className="blg-viz">
      <div className="blg-viz-stage">
        <svg viewBox="0 0 440 252" role="img" aria-label={t.svgAria}>
          {NEUR.map((_, i) => renderNeuron(i))}
          {mode === 'merge' && !mergeFixed && (
            <g className="blg-sm-bridge">
              <line x1={bridge.a[0]} y1={bridge.a[1]} x2={bridge.b[0]} y2={bridge.b[1]} />
              <circle cx={(bridge.a[0] + bridge.b[0]) / 2} cy={(bridge.a[1] + bridge.b[1]) / 2} r={9} className={confirming ? 'arm' : ''} />
            </g>
          )}
        </svg>
        <div className="blg-sm-read">
          <span>{hover !== null ? t.neuron(hover + 1, idCount(hover), idCount(hover) !== 1) : t.hoverHint}</span>
          <span className="ed">{t.editsToFix} <b>{edits === 0 ? t.editsNone : edits === 1 ? t.editsOne : t.editsSeveral}</b></span>
          {mode !== 'correct' && (
            <span className="tm">{t.timeLabel} <b>{mode === 'split' ? t.timeSplit : t.timeMerge}</b></span>
          )}
        </div>
      </div>

      <div className="blg-viz-controls">
        <div className="blg-sm-seg" role="radiogroup" aria-label={t.modeLabel}>
          {(['correct', 'split', 'merge'] as const).map((m) => (
            <button key={m} role="radio" aria-checked={mode === m} className={'blg-btn' + (mode === m ? ' on' : '')} onClick={() => setM(m)}>{t.modes[m]}</button>
          ))}
        </div>
        {mode === 'split' && <button className="blg-btn" onClick={() => setSplitFixed(true)} disabled={splitFixed}>{splitFixed ? t.stitched : t.fixSplit}</button>}
        {mode === 'merge' && !mergeFixed && <button className="blg-btn danger" onClick={() => { if (confirming) { setMergeFixed(true); setConfirming(false); } else setConfirming(true); }}>{confirming ? t.confirmCut : t.fixMerge}</button>}
        {mode === 'merge' && mergeFixed && <span className="blg-sm-done">{t.bridgeCut}</span>}
        <span className={'blg-sm-chip ' + mode}>{mode === 'merge' ? t.chipMerge : mode === 'split' ? t.chipSplit : t.chipCorrect}</span>
      </div>

      <figcaption>{t.caption}</figcaption>
    </figure>
  );
}

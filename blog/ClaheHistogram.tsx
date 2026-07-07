import React, { useMemo, useState } from 'react';
import { useLang } from '../i18n/LanguageContext';

// CLAHE, the step where the wet lab hands the sample to the algorithms. Clip the
// intensity range to 120-350, then adaptive-equalise with clip_limit = 0.03 (the
// cap that redistributes tall bins so background noise can't explode), then scale
// x255 into uint8. The slider makes the contrast-vs-noise trade-off visceral.

const STR = {
  en: {
    histAria: (n: number) => `CLAHE histogram, stage ${n} of 3.`,
    prevAria: 'A faint dendrite over a noisy background, before and after CLAHE.',
    axisIntensity: 'pixel intensity',
    axisUint: '×255 → uint8  (0 … 255)',
    tagAfter: 'after CLAHE',
    tagBefore: 'before',
    segAria: 'CLAHE stage',
    stClip: 'clip',
    stEqualize: 'equalize',
    stScale: 'scale',
    sliderAria: 'clip limit',
    showBefore: 'show before',
    showAfter: 'show after',
    capTitle: 'CLAHE, bin by bin.',
    capFirst: 'First',
    capClip: 'clip',
    capAfterClip: 'the intensities to 120–350 (everything outside piles onto the bounds). Then',
    capEqualise: 'equalise',
    capAfterEq: ', but cap each bin at',
    capAfterCode: 'and spread the excess — high enough to lift faint dendrites and axons, low enough that the homogeneous background doesn’t erupt into noise the segmenter would chase. Finally scale ×255 into',
    capEnd: '. Push the slider up and watch the background grain return.',
  },
  tr: {
    histAria: (n: number) => `CLAHE histogramı, aşama ${n} / 3.`,
    prevAria: 'Gürültülü bir arka plan üzerinde soluk bir dendrit, CLAHE öncesi ve sonrası.',
    axisIntensity: 'piksel yoğunluğu',
    axisUint: '×255 → uint8  (0 … 255)',
    tagAfter: 'CLAHE sonrası',
    tagBefore: 'öncesi',
    segAria: 'CLAHE aşaması',
    stClip: 'clip',
    stEqualize: 'equalize',
    stScale: 'scale',
    sliderAria: 'clip limit',
    showBefore: 'öncesini göster',
    showAfter: 'sonrasını göster',
    capTitle: 'CLAHE, bölme bölme.',
    capFirst: 'Önce yoğunlukları',
    capClip: 'clip',
    capAfterClip: 'ile 120–350 aralığına kırp (dışarıda kalan her şey sınırlara yığılır). Sonra',
    capEqualise: 'eşitle',
    capAfterEq: ', ancak her bölmeyi şununla sınırla:',
    capAfterCode: 've fazlalığı yay — soluk dendrit ve aksonları kaldıracak kadar yüksek, homojen arka planın segmentleyicinin peşine düşeceği bir gürültüye dönüşmeyeceği kadar düşük. Son olarak ×255 ölçekle:',
    capEnd: '. Kaydırıcıyı yukarı it ve arka plan grenliğinin geri dönüşünü izle.',
  },
  de: {
    histAria: (n: number) => `CLAHE-Histogramm, Stufe ${n} von 3.`,
    prevAria: 'Ein schwacher Dendrit über einem verrauschten Hintergrund, vor und nach CLAHE.',
    axisIntensity: 'Pixelintensität',
    axisUint: '×255 → uint8  (0 … 255)',
    tagAfter: 'nach CLAHE',
    tagBefore: 'vorher',
    segAria: 'CLAHE-Stufe',
    stClip: 'clip',
    stEqualize: 'equalize',
    stScale: 'scale',
    sliderAria: 'clip limit',
    showBefore: 'vorher zeigen',
    showAfter: 'nachher zeigen',
    capTitle: 'CLAHE, Bin für Bin.',
    capFirst: 'Zuerst die Intensitäten',
    capClip: 'beschneiden',
    capAfterClip: 'auf 120–350 (alles außerhalb häuft sich an den Grenzen). Dann',
    capEqualise: 'ausgleichen',
    capAfterEq: ', aber jeden Bin deckeln bei',
    capAfterCode: 'und den Überschuss verteilen — hoch genug, um schwache Dendriten und Axone hervorzuheben, niedrig genug, dass der homogene Hintergrund nicht in Rauschen ausbricht, dem der Segmentierer folgen würde. Zuletzt ×255 skalieren in',
    capEnd: '. Schieben Sie den Regler hoch und beobachten Sie, wie die Hintergrundkörnung zurückkehrt.',
  },
};

const BINS = 32, IMAX = 512, CW = 384, CH = 150;
const center = (i: number) => (i + 0.5) * (IMAX / BINS);

// a typical fluorescence histogram: a broad dim-background hump + a bright soma hump
const RAW = Array.from({ length: BINS }, (_, i) => {
  const x = center(i);
  return Math.exp(-Math.pow((x - 80) / 55, 2)) + 0.42 * Math.exp(-Math.pow((x - 300) / 42, 2));
});
const RAWMAX = Math.max(...RAW);

// numpy.clip(120,350): mass below 120 piles onto the 120 bin, mass above 350 onto the 350 bin
const LO = Math.round(120 / (IMAX / BINS)), HI = Math.round(350 / (IMAX / BINS));
const CLIP = (() => {
  const a = RAW.map((v, i) => (i < LO || i > HI ? 0 : v));
  a[LO] += RAW.slice(0, LO).reduce((s, v) => s + v, 0);
  a[HI] += RAW.slice(HI + 1).reduce((s, v) => s + v, 0);
  return a;
})();

// seeded noise dots for the preview (deterministic)
const NOISE = Array.from({ length: 90 }, (_, i) => {
  const r = (s: number) => { let v = Math.sin(i * 12.9898 + s * 78.233) * 43758.5; return v - Math.floor(v); };
  return { x: 6 + r(1) * 244, y: 6 + r(2) * 150, s: 0.6 + r(3) * 1.2 };
});

export default function ClaheHistogram() {
  const t = STR[useLang().lang] || STR.en;
  const [stage, setStage] = useState(0); // 0 clip, 1 equalize, 2 scale
  const [clipLimit, setClipLimit] = useState(0.03);
  const [after, setAfter] = useState(false);

  const bars = useMemo(() => {
    if (stage === 0) return RAW.map((v) => v / RAWMAX);
    // equalize: cap bins, redistribute excess
    const cap = (clipLimit / 0.1) * (Math.max(...CLIP) / RAWMAX);
    const norm = CLIP.map((v) => v / RAWMAX);
    let excess = 0;
    const capped = norm.map((v) => { if (v > cap) { excess += v - cap; return cap; } return v; });
    return capped.map((v) => v + excess / BINS);
  }, [stage, clipLimit]);

  const capFrac = (clipLimit / 0.1) * (Math.max(...CLIP) / RAWMAX);
  const bw = CW / BINS;
  const px = (intensity: number) => (intensity / IMAX) * CW;
  const noiseOpacity = after ? Math.min(0.7, clipLimit * 6) : 0;
  const filamentOpacity = after ? 0.92 : 0.22;

  const segs: [string, string][] = [[t.stClip, 'clip'], [t.stEqualize, 'equalize'], [t.stScale, 'scale']];

  return (
    <figure className="blg-viz">
      <div className="blg-viz-stage blg-cl">
        <div className="blg-cl-hist">
          <svg viewBox={`0 0 ${CW} ${CH + 30}`} role="img" aria-label={t.histAria(stage + 1)}>
            {/* clipped regions shaded */}
            {stage === 0 && <>
              <rect className="blg-cl-clipzone" x={0} y={0} width={px(120)} height={CH} />
              <rect className="blg-cl-clipzone" x={px(350)} y={0} width={CW - px(350)} height={CH} />
            </>}
            {/* bars */}
            {bars.map((v, i) => {
              const h = Math.min(CH, v * CH);
              const cl = stage === 0 && (i < LO || i > HI);
              return <rect key={i} className={'blg-cl-bar' + (cl ? ' dim' : '')} x={i * bw + 1} y={CH - h} width={bw - 2} height={h} />;
            })}
            {/* clip guides */}
            {stage === 0 && <g className="blg-cl-guide">
              <line x1={px(120)} y1={0} x2={px(120)} y2={CH} /><text x={px(120)} y={CH + 13} textAnchor="middle">120</text>
              <line x1={px(350)} y1={0} x2={px(350)} y2={CH} /><text x={px(350)} y={CH + 13} textAnchor="middle">350</text>
            </g>}
            {/* clip_limit cap */}
            {stage === 1 && <g className="blg-cl-cap">
              <line x1={0} y1={CH - capFrac * CH} x2={CW} y2={CH - capFrac * CH} />
              <text x={CW - 4} y={CH - capFrac * CH - 5} textAnchor="end">clip_limit = {clipLimit.toFixed(2)}</text>
            </g>}
            {/* axis */}
            <line className="blg-cl-axis" x1={0} y1={CH} x2={CW} y2={CH} />
            {stage === 2 && <text className="blg-cl-uint" x={CW / 2} y={CH + 20} textAnchor="middle">{t.axisUint}</text>}
            {stage !== 2 && <text className="blg-cl-uint" x={CW / 2} y={CH + 20} textAnchor="middle">{t.axisIntensity}</text>}
          </svg>
        </div>

        <div className="blg-cl-prev">
          <svg viewBox="0 0 256 162" role="img" aria-label={t.prevAria}>
            <rect x="0" y="0" width="256" height="162" className="blg-cl-bg" />
            <g style={{ opacity: noiseOpacity }}>{NOISE.map((n, i) => <circle key={i} cx={n.x} cy={n.y} r={n.s} className="blg-cl-noise" />)}</g>
            <g style={{ opacity: filamentOpacity }} className="blg-cl-fil">
              <path d="M 18 130 C 80 110, 110 60, 150 40 C 180 26, 210 22, 240 18" />
              <path d="M 150 40 C 156 70, 168 96, 196 120" />
              <path d="M 110 64 C 96 92, 86 118, 70 150" />
              <circle cx="150" cy="40" r="9" className="soma" />
            </g>
            <text x="8" y="154" className="blg-cl-tag">{after ? t.tagAfter : t.tagBefore}</text>
          </svg>
        </div>
      </div>

      <div className="blg-viz-controls">
        <div className="blg-sm-seg" role="radiogroup" aria-label={t.segAria}>
          {segs.map(([label, key], i) => (
            <button key={key} role="radio" aria-checked={stage === i} className={'blg-btn' + (stage === i ? ' on' : '')} onClick={() => setStage(i)}>{label}</button>
          ))}
        </div>
        <label className="blg-cl-slider">clip_limit <b>{clipLimit.toFixed(2)}</b>
          <input type="range" min={0} max={0.1} step={0.005} value={clipLimit} onChange={(e) => { setStage(1); setClipLimit(+e.target.value); }} aria-label={t.sliderAria} />
        </label>
        <button className="blg-btn" onClick={() => setAfter((a) => !a)}>{after ? t.showBefore : t.showAfter}</button>
      </div>

      <figcaption><b>{t.capTitle}</b> {t.capFirst} <i>{t.capClip}</i> {t.capAfterClip} <i>{t.capEqualise}</i>{t.capAfterEq} <code>clip_limit = 0.03</code> {t.capAfterCode} <code>uint8</code>{t.capEnd}</figcaption>
    </figure>
  );
}

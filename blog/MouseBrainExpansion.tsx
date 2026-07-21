import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useLang } from '../i18n/LanguageContext';

// Deliberately schematic approximation of a mid-posterior coronal mouse-brain
// section centred around Bregma ≈ -2.0 mm (not a traced atlas contour). Every anatomical landmark and the gel mesh
// share one scalar transform: screenScale = BASE_SCALE * E. The full 1x -> 4.5x
// motion is therefore shown without a hidden camera zoom or visual clamp.

const MAX_E = 4.5;
const BASE_SCALE = 0.218;
const D_OPT = 300;
const PAIR_NM = 70;
const RESOLVE_AT = D_OPT / PAIR_NM;
const CX = 340;
const CY = 214;

const OUTLINE = 'M340 94 C326 67 304 47 274 37 C228 22 176 33 135 65 C93 98 72 151 77 211 C82 272 111 328 159 358 C203 386 259 383 302 357 C320 347 329 360 340 389 C351 360 360 347 378 357 C421 383 477 386 521 358 C569 328 598 272 603 211 C608 151 587 98 545 65 C504 33 452 22 406 37 C376 47 354 67 340 94 Z';

const SIGNALS: Array<[number, number, number]> = [
  [116, 139, 1.7], [137, 105, 1.4], [164, 87, 1.5], [199, 74, 1.2], [237, 70, 1.5],
  [274, 82, 1.2], [299, 111, 1.5], [93, 181, 1.3], [116, 225, 1.6], [147, 268, 1.2],
  [181, 306, 1.5], [224, 328, 1.3], [270, 316, 1.5], [205, 196, 1.4], [229, 226, 1.8],
  [250, 247, 1.2], [281, 205, 1.3], [294, 270, 1.5], [564, 139, 1.7], [543, 105, 1.4],
  [516, 87, 1.5], [481, 74, 1.2], [443, 70, 1.5], [406, 82, 1.2], [381, 111, 1.5],
  [587, 181, 1.3], [564, 225, 1.6], [533, 268, 1.2], [499, 306, 1.5], [456, 328, 1.3],
  [410, 316, 1.5], [475, 196, 1.4], [451, 226, 1.8], [430, 247, 1.2], [399, 205, 1.3],
  [386, 270, 1.5], [326, 173, 1.2], [354, 173, 1.2], [323, 236, 1.4], [357, 236, 1.4],
  [340, 290, 1.6],
];

const STR = {
  en: {
    aria: 'Schematic coronal mouse-brain section expanding isotropically from one to four point five times. Cortex, corpus callosum, ventricles, hippocampus, thalamus and the hydrogel mesh preserve their geometry while a fixed-objective inset resolves two fluorescent points.',
    model: 'coronal section · Bregma ≈ −2 mm',
    exactScale: 'ideal isotropic · full 1x → 4.5x linear scale',
    original: '1x original footprint',
    cortex: 'cortex', hippocampus: 'hippocampus', thalamus: 'thalamus',
    roi: 'hippocampal ROI', inset: 'same ROI · fixed objective',
    unresolved: 'one blur · unresolved', resolved: 'two signals · resolved',
    linear: 'linear expansion', geometry: 'area / volume', resolution: 'effective resolution',
    area: 'area', volume: 'volume', optical: 'assumed optical limit',
    play: 'Continue', pause: 'Pause', replay: 'Replay', compare: 'Switch state',
    range: 'Expansion factor', rangeAria: 'Expansion factor from one to four point five times',
    captionTitle: 'One brain section, one expansion factor.',
    captionBody: 'The smooth outer contour and every internal landmark use the same factor E, so their relative anatomy does not change. The dashed silhouette is the original 1x section, kept at the same screen scale while the specimen grows by the full 4.5x.',
    captionLens: 'In the fixed-objective view, the fluorophore blur width stays constant while the anchored pair moves apart. With the assumed 300 nm optical resolution, effective resolution referred back to the original tissue improves as 300/E nm.',
    captionCaveat: 'This is an ideal isotropic model; local distortion still has to be measured in a real specimen.',
  },
  tr: {
    aria: 'Şematik koronal fare beyni kesiti bir kattan dört buçuk kata izotropik olarak genişliyor. Korteks, korpus kallozum, ventriküller, hipokampüs, talamus ve hidrojel ağı geometrilerini korurken sabit objektif penceresinde iki floresan nokta birbirinden ayrılıyor.',
    model: 'koronal kesit · Bregma ≈ −2 mm',
    exactScale: 'ideal izotropik · 1× → 4,5× tam lineer oran',
    original: '1× özgün kesit',
    cortex: 'korteks', hippocampus: 'hipokampüs', thalamus: 'talamus',
    roi: 'hipokampal ROI', inset: 'aynı ROI · sabit objektif',
    unresolved: 'tek leke · çözülmedi', resolved: 'iki sinyal · çözüldü',
    linear: 'lineer genişleme', geometry: 'alan / hacim', resolution: 'efektif çözünürlük',
    area: 'alan', volume: 'hacim', optical: 'varsayılan optik sınır',
    play: 'Devam et', pause: 'Duraklat', replay: 'Baştan oynat', compare: 'Durumu değiştir',
    range: 'Genişleme faktörü', rangeAria: 'Bir kat ile dört buçuk kat arasında genişleme faktörü',
    captionTitle: 'Tek beyin kesiti, tek genişleme faktörü.',
    captionBody: 'Pürüzsüz dış kontur ve bütün iç yapılar aynı E faktörünü kullanır. Bu nedenle göreli anatomi değişmez. Kesik çizgili siluet, numune tam 4,5 kat büyürken ekranda sabit tutulan 1× özgün kesittir.',
    captionLens: 'Sabit objektif görünümünde floresan bulanıklığının genişliği değişmez, jele bağlı çift birbirinden uzaklaşır. Varsayılan 300 nm optik çözünürlükle özgün dokuya göre efektif çözünürlük 300/E nm olarak iyileşir.',
    captionCaveat: 'Bu ideal bir izotropik modeldir. Gerçek numunede yerel distorsiyon ayrıca ölçülmelidir.',
  },
  de: {
    aria: 'Ein schematischer koronaler Maushirnschnitt expandiert isotrop von eins auf das Vierkommafünffache. Kortex, Corpus callosum, Ventrikel, Hippocampus, Thalamus und Hydrogelnetz behalten ihre Geometrie, während zwei Fluoreszenzpunkte im Fenster mit festem Objektiv getrennt werden.',
    model: 'Koronalschnitt · Bregma ≈ −2 mm',
    exactScale: 'ideal isotrop · 1× → 4,5× im echten Verhältnis',
    original: 'ursprünglicher 1×-Schnitt',
    cortex: 'Kortex', hippocampus: 'Hippocampus', thalamus: 'Thalamus',
    roi: 'hippocampale ROI', inset: 'gleiche ROI · festes Objektiv',
    unresolved: 'ein Fleck · unaufgelöst', resolved: 'zwei Signale · aufgelöst',
    linear: 'lineare Expansion', geometry: 'Fläche / Volumen', resolution: 'effektive Auflösung',
    area: 'Fläche', volume: 'Volumen', optical: 'angenommene optische Grenze',
    play: 'Weiter', pause: 'Pause', replay: 'Neu abspielen', compare: 'Zustand wechseln',
    range: 'Expansionsfaktor', rangeAria: 'Expansionsfaktor von eins bis vier Komma fünf',
    captionTitle: 'Ein Hirnschnitt, ein Expansionsfaktor.',
    captionBody: 'Die glatte Außenkontur und alle inneren Strukturen verwenden denselben Faktor E, daher bleibt ihre relative Anatomie erhalten. Die gestrichelte Silhouette zeigt den ursprünglichen 1×-Schnitt im gleichen Bildschirmmaßstab, während die Probe vollständig auf 4,5× wächst.',
    captionLens: 'Beim festen Objektiv bleibt die Breite der Fluoreszenzunschärfe konstant, während das verankerte Paar auseinandergetragen wird. Bei der angenommenen optischen Auflösung von 300 nm verbessert sich die auf das Originalgewebe bezogene effektive Auflösung auf 300/E nm.',
    captionCaveat: 'Dies ist ein ideales isotropes Modell; lokale Verzerrungen müssen in realen Proben gemessen werden.',
  },
};

const ease = (k: number) => 1 - Math.pow(1 - k, 3);

export default function MouseBrainExpansion() {
  const { lang } = useLang();
  const t = STR[lang] || STR.en;
  const id = useId().replace(/:/g, '');
  const clipId = `mbe-clip-${id}`;
  const meshId = `mbe-mesh-${id}`;
  const tissueId = `mbe-tissue-${id}`;
  const psfId = `mbe-psf-${id}`;
  const outputId = `mbe-output-${id}`;
  const figureRef = useRef<HTMLElement | null>(null);
  const raf = useRef<number | undefined>(undefined);
  const expansionRef = useRef(1);
  const reducedRef = useRef(false);
  const autoPlayed = useRef(false);
  const [expansion, setExpansion] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(false);

  const stop = useCallback(() => {
    if (raf.current !== undefined) cancelAnimationFrame(raf.current);
    raf.current = undefined;
    setPlaying(false);
  }, []);

  const animateFrom = useCallback((from: number) => {
    if (raf.current !== undefined) cancelAnimationFrame(raf.current);
    if (reducedRef.current) {
      const next = from >= MAX_E - 0.02 ? 1 : MAX_E;
      expansionRef.current = next;
      setExpansion(next);
      setPlaying(false);
      return;
    }

    const startValue = Math.max(1, Math.min(MAX_E, from));
    const started = performance.now();
    const duration = 3600 * ((MAX_E - startValue) / (MAX_E - 1));
    let lastPaint = 0;
    expansionRef.current = startValue;
    setExpansion(startValue);
    setPlaying(true);

    const tick = (now: number) => {
      const k = duration <= 0 ? 1 : Math.min(1, (now - started) / duration);
      const next = startValue + (MAX_E - startValue) * ease(k);
      if (now - lastPaint >= 30 || k === 1) {
        expansionRef.current = next;
        setExpansion(next);
        lastPaint = now;
      }
      if (k < 1) raf.current = requestAnimationFrame(tick);
      else {
        raf.current = undefined;
        setPlaying(false);
      }
    };

    raf.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedRef.current = media.matches;
    setReduced(media.matches);
    if (media.matches) {
      expansionRef.current = MAX_E;
      setExpansion(MAX_E);
      return;
    }

    const node = figureRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      animateFrom(1);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (!autoPlayed.current && entries.some((entry) => entry.isIntersecting)) {
        autoPlayed.current = true;
        observer.disconnect();
        animateFrom(1);
      }
    }, { threshold: 0.34 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [animateFrom]);

  useEffect(() => () => {
    if (raf.current !== undefined) cancelAnimationFrame(raf.current);
  }, []);

  const p = (expansion - 1) / (MAX_E - 1);
  const sampleScale = BASE_SCALE * expansion;
  const tissueOpacity = 0.7 - p * 0.28;
  const meshOpacity = 0.2 + p * 0.45;
  const labelOpacity = Math.min(1, Math.max(0, (p - 0.54) / 0.25));
  const resolved = expansion >= RESOLVE_AT;
  const area = expansion * expansion;
  const volume = area * expansion;
  const dEff = D_OPT / expansion;
  const locale = lang === 'en' ? 'en-US' : lang === 'de' ? 'de-DE' : 'tr-TR';
  const oneFormatter = useMemo(() => new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }), [locale]);
  const wholeFormatter = useMemo(() => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }), [locale]);
  const one = (v: number) => oneFormatter.format(v);
  const whole = (v: number) => wholeFormatter.format(v);
  const pairGap = expansion * (60 / RESOLVE_AT);
  const pairLeft = 112 - pairGap / 2;
  const pairRight = 112 + pairGap / 2;
  const coreOpacity = Math.max(0, Math.min(1, (expansion - RESOLVE_AT) / 0.16));
  const project = (x: number, y: number) => [CX + (x - CX) * sampleScale, CY + (y - CY) * sampleScale] as const;
  const cortexPoint = project(153, 110);
  const hippocampusPoint = project(205, 273);
  const thalamusPoint = project(408, 248);

  const handleButton = () => {
    if (reduced) {
      const next = expansion >= MAX_E - 0.02 ? 1 : MAX_E;
      expansionRef.current = next;
      setExpansion(next);
      return;
    }
    if (playing) {
      stop();
      return;
    }
    animateFrom(expansion >= MAX_E - 0.02 ? 1 : expansionRef.current);
  };

  const buttonText = reduced
    ? t.compare
    : playing
      ? t.pause
      : expansion >= MAX_E - 0.02
        ? t.replay
        : t.play;
  const buttonIcon = reduced ? '↔ ' : playing ? '❚❚ ' : expansion >= MAX_E - 0.02 ? '↻ ' : '▷ ';

  return (
    <figure className="blg-viz blg-mbe" ref={figureRef}>
      <div className="blg-mbe-shell">
        <div className="blg-mbe-head">
          <span className="blg-mbe-model"><i />{t.model}</span>
          <span>{t.exactScale}</span>
        </div>

        <div className="blg-mbe-stage">
          <div className="blg-mbe-brain">
            <svg viewBox="0 0 680 420" role="img" aria-label={t.aria}>
              <defs>
                <clipPath id={clipId}><path d={OUTLINE} /></clipPath>
                <linearGradient id={tissueId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#B8C2C8" stopOpacity=".66" />
                  <stop offset="1" stopColor="#72838B" stopOpacity=".34" />
                </linearGradient>
                <pattern id={meshId} width="28" height="28" patternUnits="userSpaceOnUse">
                  <path d="M0 0H28M0 0V28" className="blg-mbe-mesh-line" />
                  <circle cx="0" cy="0" r="1.25" className="blg-mbe-mesh-node" />
                  <circle cx="28" cy="28" r="1.25" className="blg-mbe-mesh-node" />
                </pattern>
              </defs>

              <g className="blg-mbe-reference">
                <line x1="340" y1="22" x2="340" y2="398" />
                <line x1="42" y1="214" x2="638" y2="214" />
                <text x="340" y="18" textAnchor="middle">D</text>
                <text x="340" y="414" textAnchor="middle">V</text>
                <text x="36" y="218" textAnchor="end">L</text>
                <text x="644" y="218">R</text>
              </g>

              <g className="blg-mbe-original" transform={`translate(${CX} ${CY}) scale(${BASE_SCALE}) translate(${-CX} ${-CY})`} style={{ opacity: p > 0.035 ? Math.min(0.72, p * 1.5) : 0 }}>
                <path d={OUTLINE} />
              </g>

              <g className="blg-mbe-sample" transform={`translate(${CX} ${CY}) scale(${sampleScale}) translate(${-CX} ${-CY})`}>
                <path className="blg-mbe-tissue" d={OUTLINE} fill={`url(#${tissueId})`} style={{ opacity: tissueOpacity }} />
                <rect x="45" y="28" width="590" height="348" clipPath={`url(#${clipId})`} fill={`url(#${meshId})`} style={{ opacity: meshOpacity }} />

                <path className="blg-mbe-cortex" d="M326 102 C293 68 247 57 203 65 C151 74 108 108 91 157 C77 204 85 263 116 307 M354 102 C387 68 433 57 477 65 C529 74 572 108 589 157 C603 204 595 263 564 307" />
                <path className="blg-mbe-callosum" d="M198 161 C239 132 289 126 340 137 C391 126 441 132 482 161" />

                <path className="blg-mbe-ventricle" d="M286 158 C268 154 249 164 243 181 C253 174 269 177 281 189 C282 176 284 166 286 158 Z" />
                <path className="blg-mbe-ventricle" d="M394 158 C412 154 431 164 437 181 C427 174 411 177 399 189 C398 176 396 166 394 158 Z" />

                <path className="blg-mbe-striatum" d="M133 166 C166 133 221 132 253 166 C267 193 252 232 213 250 C174 258 137 233 128 202 C126 189 128 176 133 166 Z" />
                <path className="blg-mbe-striatum" d="M547 166 C514 133 459 132 427 166 C413 193 428 232 467 250 C506 258 543 233 552 202 C554 189 552 176 547 166 Z" />

                <path className="blg-mbe-hippocampus" d="M165 260 C181 218 222 196 270 203 C296 207 311 222 315 242 C292 224 264 221 238 232 C211 243 196 263 194 288" />
                <path className="blg-mbe-hippocampus" d="M515 260 C499 218 458 196 410 203 C384 207 369 222 365 242 C388 224 416 221 442 232 C469 243 484 263 486 288" />
                <path className="blg-mbe-dg" d="M205 277 C217 251 242 241 268 247 C278 249 287 254 293 263 C271 258 248 266 234 283" />
                <path className="blg-mbe-dg" d="M475 277 C463 251 438 241 412 247 C402 249 393 254 387 263 C409 258 432 266 446 283" />

                <path className="blg-mbe-thalamus" d="M274 193 C297 174 327 177 339 205 L339 274 C316 284 286 273 270 250 C258 231 260 209 274 193 Z" />
                <path className="blg-mbe-thalamus" d="M406 193 C383 174 353 177 341 205 L341 274 C364 284 394 273 410 250 C422 231 420 209 406 193 Z" />
                <path className="blg-mbe-third" d="M340 190 C334 211 334 246 340 266 C346 246 346 211 340 190 Z" />
                <path className="blg-mbe-hypothalamus" d="M302 278 C321 267 359 267 378 278 C373 309 359 327 340 334 C321 327 307 309 302 278 Z" />

                <g className="blg-mbe-signals">
                  {SIGNALS.map(([x, y, r], index) => <circle key={index} cx={x} cy={y} r={r / sampleScale} />)}
                </g>
                <g className="blg-mbe-roi">
                  <circle cx="235" cy="244" r="32" />
                  <text x="235" y="204" textAnchor="middle">ROI</text>
                </g>
              </g>

              <g className="blg-mbe-atlas-labels" style={{ opacity: labelOpacity }}>
                <path d={`M106 87 L${cortexPoint[0]} ${cortexPoint[1]}`} /><text x="101" y="84" textAnchor="end">{t.cortex}</text>
                <path d={`M122 323 L${hippocampusPoint[0]} ${hippocampusPoint[1]}`} /><text x="117" y="327" textAnchor="end">{t.hippocampus}</text>
                <path d={`M555 315 L${thalamusPoint[0]} ${thalamusPoint[1]}`} /><text x="560" y="319">{t.thalamus}</text>
              </g>

              <g className="blg-mbe-original-key" style={{ opacity: p > 0.12 ? Math.min(1, p * 1.7) : 0 }}>
                <line x1="46" y1="386" x2="74" y2="386" />
                <text x="81" y="390">{t.original}</text>
              </g>
            </svg>
          </div>

          <div className="blg-mbe-lens" role="group" aria-label={t.inset}>
            <div className="blg-mbe-lens-head"><span>{t.roi}</span><b>{t.inset}</b></div>
            <svg viewBox="0 0 224 204" aria-hidden="true">
              <defs>
                <radialGradient id={psfId}>
                  <stop offset="0" stopColor="#FFD700" stopOpacity=".86" />
                  <stop offset=".28" stopColor="#E8C66A" stopOpacity=".5" />
                  <stop offset="1" stopColor="#E8C66A" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect className="blg-mbe-lens-field" x="8" y="8" width="208" height="150" rx="12" />
              <g className="blg-mbe-psf">
                <circle cx={pairLeft} cy="82" r="42" fill={`url(#${psfId})`} />
                <circle cx={pairRight} cy="82" r="42" fill={`url(#${psfId})`} />
                <circle className="blg-mbe-core" cx={pairLeft} cy="82" r="3.5" opacity={coreOpacity} />
                <circle className="blg-mbe-core" cx={pairRight} cy="82" r="3.5" opacity={coreOpacity} />
              </g>
              <g className="blg-mbe-gap">
                <line x1={pairLeft} y1="132" x2={pairRight} y2="132" />
                <line x1={pairLeft} y1="128" x2={pairLeft} y2="136" />
                <line x1={pairRight} y1="128" x2={pairRight} y2="136" />
                <text x="112" y="147" textAnchor="middle">{whole(expansion * PAIR_NM)} nm</text>
              </g>
              <g className="blg-mbe-limit">
                <line x1="82" y1="178" x2="142" y2="178" />
                <line x1="82" y1="174" x2="82" y2="182" />
                <line x1="142" y1="174" x2="142" y2="182" />
                <text x="112" y="196" textAnchor="middle">{t.optical} · {D_OPT} nm</text>
              </g>
            </svg>
            <div className={`blg-mbe-lens-state ${resolved ? 'ok' : ''}`}>
              <i>{resolved ? '✓' : '≈'}</i>{resolved ? t.resolved : t.unresolved}
            </div>
            <output id={outputId} className="blg-mbe-sr">
              {t.inset}. {whole(expansion * PAIR_NM)} nm. {resolved ? t.resolved : t.unresolved}. {t.resolution}: {whole(dEff)} nm.
            </output>
          </div>
        </div>

        <div className="blg-mbe-readouts">
          <div><span>{t.linear}</span><b>{one(expansion)}×</b></div>
          <div><span>{t.geometry}</span><b>{one(area)}× <i>/</i> {whole(volume)}×</b><small>{t.area} / {t.volume}</small></div>
          <div><span>{t.resolution}</span><b>≈ {whole(dEff)} nm</b></div>
        </div>
      </div>

      <div className="blg-viz-controls blg-mbe-controls">
        <button className="blg-btn" type="button" onClick={handleButton}>{buttonIcon}{buttonText}</button>
        <label>
          <span>{t.range} <b>{one(expansion)}×</b></span>
          <input
            type="range"
            min={1}
            max={MAX_E}
            step={0.05}
            value={expansion}
            aria-label={t.rangeAria}
            aria-describedby={outputId}
            onChange={(event) => {
              stop();
              const next = Number(event.target.value);
              expansionRef.current = next;
              setExpansion(next);
            }}
          />
        </label>
      </div>

      <figcaption>
        <b>{t.captionTitle}</b> {t.captionBody} {t.captionLens} {t.captionCaveat}
      </figcaption>
    </figure>
  );
}

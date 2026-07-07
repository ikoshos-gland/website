import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLang } from '../i18n/LanguageContext';

// Expansion microscopy — the textbook two-point resolution picture. Each
// fluorophore carries its OWN fixed-width point-spread (the optics never change).
// A swelling hydrogel mesh carries the anchored pair apart; the intensity profile
// below goes from ONE merged peak (unresolved) to TWO peaks with a dip (resolved)
// once their separation passes the fixed resolution limit (≈ d_opt). The lens
// never improves — d_eff = d_opt/E only because the sample is enlarged.

const D_OPT = 270;        // nm, fixed optical resolution
const D_TRUE = 65;        // nm, fixed true pair separation
const NM_PER_PX = 1.8;    // 1.8 nm/px  → d_opt = 150 px (the fixed caliper length)
const E_STAR = D_OPT / D_TRUE;       // ≈ 4.15× — separation reaches d_opt
const CX = 340, EY = 116;
const GAP_MAX_PX = 360;   // on-screen clamp only; readouts stay true
const SIGMA = 75;         // px PSF width: 2σ = 150 px = d_opt → profile splits exactly at E*
const LOBE = [{ r: 13, o: 0.4 }, { r: 24, o: 0.24 }, { r: 36, o: 0.14 }, { r: 50, o: 0.07 }, { r: 66, o: 0.03 }];

const STR = {
  en: {
    aria: 'Expansion microscopy: each fluorophore keeps a fixed-width blur while a hydrogel swells and carries the pair apart; the intensity profile below splits from one peak into two once their separation passes the fixed resolution limit.',
    meshLabel: 'swelling hydrogel', pairLabel: 'anchored pair · d_true = 65 nm',
    limitLabel: 'resolution limit · d_opt = 270 nm', profLabel: 'intensity profile',
    onePeak: 'one peak — unresolved', twoPeak: 'two peaks — resolved',
    kExpansion: 'expansion', kResolution: 'eff. resolution', kStatus: 'two points',
    vUnresolved: 'unresolved', vResolved: '✓ RESOLVED',
    pause: 'Pause', play: 'Swell', truthOn: 'true positions', truthOff: 'optical view',
    rangeAria: 'expansion factor, 1× to 20×',
    regimes: 'resolves ≈4.15×  ·  proExM ~4×  ·  X10 ~10×  ·  iExM / LICONN ~16–20×',
    capTitle: 'Two points, one swelling sample.',
    capBody: 'Each fluorophore keeps a fixed blur — the optics never improve. One shared factor E swells the hydrogel and carries the anchored pair apart; their true separation stays 65 nm, so apparent separation grows as E × 65 nm.',
    capResolve: 'The intensity profile tells the truth: one merged peak while they sit closer than the fixed ~270 nm limit, splitting into two peaks once they pass it — at ≈4.15×. Standard ~4× ExM leaves a 65 nm pair right at the edge; iterative protocols (X10 ~10×, iExM / LICONN ~16–20×) push well past it.',
    capFormula: 'Effective resolution, referred to the original sample, is d_eff = d_opt / E (270 nm at 1× → 27 nm at 10×). Drag it back and the two peaks re-merge — resolution is bookkeeping on a fixed ruler, not a change in the sample.',
  },
  tr: {
    aria: 'Expansion microscopy: her fluorofor sabit genişlikte bir bulanıklık taşır; hidrojel şişerken çifti birbirinden ayırır ve alttaki yoğunluk profili, ayrım sabit çözünürlük sınırını aştığında tek tepeden iki tepeye bölünür.',
    meshLabel: 'şişen hidrojel', pairLabel: 'anchored çift · d_true = 65 nm',
    limitLabel: 'çözünürlük sınırı · d_opt = 270 nm', profLabel: 'yoğunluk profili',
    onePeak: 'tek tepe — çözülmedi', twoPeak: 'iki tepe — çözüldü',
    kExpansion: 'expansion', kResolution: 'efektif çöz.', kStatus: 'iki nokta',
    vUnresolved: 'çözülmedi', vResolved: '✓ ÇÖZÜLDÜ',
    pause: 'Duraklat', play: 'Şişir', truthOn: 'gerçek konum', truthOff: 'optik görünüm',
    rangeAria: 'genişleme faktörü, 1× – 20×',
    regimes: 'çözünme ≈4.15×  ·  proExM ~4×  ·  X10 ~10×  ·  iExM / LICONN ~16–20×',
    capTitle: 'İki nokta, şişen tek bir örnek.',
    capBody: 'Her fluorofor sabit bir bulanıklık taşır — optik iyileşmez. Tek bir ortak faktör E hidrojeli şişirir ve anchored çifti ayırır; gerçek ayrımları 65 nm sabit kalır, görünür ayrım E × 65 nm ile büyür.',
    capResolve: 'Gerçeği yoğunluk profili söyler: sabit ~270 nm sınırından yakındayken tek birleşik tepe, sınırı geçince iki tepe — ≈4.15×’te. Standart ~4× ExM 65 nm’lik çifti tam sınırda bırakır; iteratif protokoller (X10 ~10×, iExM / LICONN ~16–20×) bunu rahatça aşar.',
    capFormula: 'Orijinal örneğe göre efektif çözünürlük d_eff = d_opt / E (1×’te 270 nm → 10×’te 27 nm). Geri çek, iki tepe yeniden birleşir — çözünürlük örnekteki bir değişiklik değil, sabit bir cetvel üzerindeki defter tutmadır.',
  },
  de: {
    aria: 'Expansion microscopy: Jedes Fluorophor behält eine feste Unschärfebreite, während ein Hydrogel quillt und das Paar auseinanderträgt; das Intensitätsprofil darunter spaltet sich von einem Gipfel in zwei, sobald ihr Abstand die feste Auflösungsgrenze überschreitet.',
    meshLabel: 'quellendes Hydrogel', pairLabel: 'verankertes Paar · d_true = 65 nm',
    limitLabel: 'Auflösungsgrenze · d_opt = 270 nm', profLabel: 'Intensitätsprofil',
    onePeak: 'ein Gipfel — ungelöst', twoPeak: 'zwei Gipfel — aufgelöst',
    kExpansion: 'expansion', kResolution: 'eff. Auflösung', kStatus: 'zwei Punkte',
    vUnresolved: 'ungelöst', vResolved: '✓ AUFGELÖST',
    pause: 'Pause', play: 'Quellen', truthOn: 'wahre Positionen', truthOff: 'optische Ansicht',
    rangeAria: 'Expansionsfaktor, 1× bis 20×',
    regimes: 'löst ≈4,15×  ·  proExM ~4×  ·  X10 ~10×  ·  iExM / LICONN ~16–20×',
    capTitle: 'Zwei Punkte, eine quellende Probe.',
    capBody: 'Jedes Fluorophor behält eine feste Unschärfe — die Optik verbessert sich nie. Ein gemeinsamer Faktor E lässt das Hydrogel quellen und trägt das verankerte Paar auseinander; ihr wahrer Abstand bleibt 65 nm, der scheinbare wächst mit E × 65 nm.',
    capResolve: 'Das Intensitätsprofil sagt die Wahrheit: ein verschmolzener Gipfel, solange sie näher als die feste ~270-nm-Grenze liegen, und zwei Gipfel, sobald sie sie überschreiten — bei ≈4,15×. Standard-~4×-ExM lässt ein 65-nm-Paar genau an der Grenze; iterative Protokolle (X10 ~10×, iExM / LICONN ~16–20×) gehen deutlich darüber hinaus.',
    capFormula: 'Die effektive Auflösung, auf die ursprüngliche Probe bezogen, ist d_eff = d_opt / E (270 nm bei 1× → 27 nm bei 10×). Zieht man zurück, verschmelzen die zwei Gipfel wieder — Auflösung ist Buchführung auf einem festen Maßstab, keine Änderung der Probe.',
  },
};

export default function ExpansionMicro() {
  const t = STR[useLang().lang] || STR.en;
  const [e, setE] = useState(1);
  const [playing, setPlaying] = useState(true);
  const [truth, setTruth] = useState(false);
  const [ping, setPing] = useState(0);
  const reduced = useRef(false);
  const raf = useRef<number | undefined>(undefined);
  const dir = useRef(1);
  const wasResolved = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced.current) { setPlaying(false); setE(10); }
  }, []);

  useEffect(() => {
    if (!playing) return;
    let last = 0;
    const tick = (ts: number) => {
      if (last) {
        const dt = Math.min(0.05, (ts - last) / 1000);
        setE((v) => { let nv = v + dir.current * dt * 3.0; if (nv >= 11) { nv = 11; dir.current = -1; } if (nv <= 1) { nv = 1; dir.current = 1; } return nv; });
      }
      last = ts; raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [playing]);

  const resolved = e >= E_STAR;
  useEffect(() => { if (resolved && !wasResolved.current && !reduced.current) setPing((p) => p + 1); wasResolved.current = resolved; }, [resolved]);

  const meshScale = 1 + (e - 1) * 0.18;
  const gapPx = e * D_TRUE / NM_PER_PX;
  const gapDisp = Math.min(gapPx, GAP_MAX_PX);
  const xl = CX - gapDisp / 2, xr = CX + gapDisp / 2;
  const sepNm = Math.round(e * D_TRUE);
  const dEff = Math.round(D_OPT / e);
  const lobeOp = truth ? 0 : 1;

  const mesh = useMemo(() => {
    const L: React.ReactNode[] = [], D: React.ReactNode[] = [];
    const x0 = 56, x1 = 604, y0 = 8, y1 = 196, p = 26;
    for (let x = x0; x <= x1; x += p) L.push(<line key={'v' + x} x1={x} y1={y0} x2={x} y2={y1} vectorEffect="non-scaling-stroke" />);
    for (let y = y0; y <= y1; y += p) L.push(<line key={'h' + y} x1={x0} y1={y} x2={x1} y2={y} vectorEffect="non-scaling-stroke" />);
    for (let x = x0; x <= x1; x += p * 2) for (let y = y0; y <= y1; y += p * 2) D.push(<circle key={x + '-' + y} cx={x} cy={y} r={1.6} vectorEffect="non-scaling-stroke" />);
    return { L, D };
  }, []);

  // intensity profile: sum of two fixed-width Gaussians at xl, xr
  const base = 332, top = 236, H = base - top, px0 = 56, px1 = 624;
  const profPath = useMemo(() => {
    let d = `M ${px0} ${base}`;
    for (let x = px0; x <= px1; x += 4) {
      const v = Math.exp(-((x - xl) ** 2) / (2 * SIGMA * SIGMA)) + Math.exp(-((x - xr) ** 2) / (2 * SIGMA * SIGMA));
      d += ` L ${x.toFixed(0)} ${(base - (v / 2) * H * 0.96).toFixed(1)}`;
    }
    d += ` L ${px1} ${base} Z`;
    return d;
  }, [xl, xr]);

  return (
    <figure className="blg-viz">
      <div className="blg-viz-stage">
        <svg viewBox="0 0 680 360" role="img" aria-label={t.aria}>
          <defs><clipPath id="exm-clip"><rect x="50" y="6" width="560" height="196" rx="12" /></clipPath></defs>

          {/* swelling hydrogel mesh */}
          <g className="blg-exm-mesh" clipPath="url(#exm-clip)" transform={`translate(${CX} ${EY}) scale(${meshScale}) translate(${-CX} ${-EY})`}>
            <g className="ln">{mesh.L}</g><g className="dt">{mesh.D}</g>
          </g>

          {/* per-emitter fixed-width PSF halos (the optics never change) */}
          <g className="blg-exm-lobes" style={{ mixBlendMode: 'screen', opacity: lobeOp, transition: 'opacity .3s' }}>
            {[xl, xr].map((cxp, i) => <g key={i}>{LOBE.map((l, j) => <circle key={j} className="blg-exm-lobe" cx={cxp} cy={EY} r={l.r} fillOpacity={l.o} />)}</g>)}
          </g>
          {[xl, xr].map((cxp, i) => (
            <g key={i}>
              <circle className="blg-exm-core" cx={cxp} cy={EY} r={4.5} />
              {ping > 0 && resolved && <circle key={ping} className="blg-exm-pinground" cx={cxp} cy={EY} />}
            </g>
          ))}

          {/* live ruler: apparent separation */}
          <g className="blg-exm-ruler">
            <line x1={xl} y1={EY - 40} x2={xr} y2={EY - 40} />
            <line x1={xl} y1={EY - 44} x2={xl} y2={EY - 36} /><line x1={xr} y1={EY - 44} x2={xr} y2={EY - 36} />
            <text x={CX} y={EY - 48} textAnchor="middle">{sepNm} nm</text>
          </g>

          {/* fixed resolution-limit caliper (the unchanging ruler — never exceeded by a disk) */}
          <g className="blg-exm-caliper">
            <line x1={72} y1={186} x2={222} y2={186} />
            <line x1={72} y1={182} x2={72} y2={190} /><line x1={222} y1={182} x2={222} y2={190} />
            <text x={147} y={200} textAnchor="middle">{t.limitLabel}</text>
          </g>

          {/* annotations */}
          <text className="blg-exm-tag mesh" x="58" y="22">{t.meshLabel}</text>
          <text className="blg-exm-tag pair" x={CX} y="16" textAnchor="middle">{t.pairLabel}</text>

          {/* intensity profile */}
          <g className="blg-exm-prof">
            <line className="axis" x1={px0} y1={base} x2={px1} y2={base} />
            <path className="curve" d={profPath} />
            <text className="lbl" x={px0} y={base + 14} textAnchor="start">{t.profLabel}</text>
            <text className={'state ' + (resolved ? 'ok' : 'no')} x={px1} y={base + 14} textAnchor="end">{resolved ? t.twoPeak : t.onePeak}</text>
          </g>
        </svg>

        <div className="blg-exm-readout">
          <div><span className="k">{t.kExpansion}</span><span className="v">{e.toFixed(1)}×</span></div>
          <div><span className="k">{t.kResolution}</span><span className="v gold">≈ {dEff} nm</span></div>
          <div><span className="k">{t.kStatus}</span><span className={'v ' + (resolved ? 'lime' : 'muted')}>{resolved ? t.vResolved : t.vUnresolved}</span></div>
        </div>
      </div>

      <div className="blg-viz-controls">
        <button className="blg-btn" onClick={() => setPlaying((p) => !p)}>{playing ? '❚❚ ' + t.pause : '▸ ' + t.play}</button>
        <input type="range" min={1} max={20} step={0.1} value={e} onChange={(ev) => { setPlaying(false); setE(parseFloat(ev.target.value)); }} style={{ flex: 1 }} aria-label={t.rangeAria} />
        <button className="blg-btn" onClick={() => setTruth((s) => !s)}>{truth ? t.truthOff : t.truthOn}</button>
      </div>
      <p className="blg-exm-regime">{t.regimes}</p>

      <figcaption><b>{t.capTitle}</b> {t.capBody} {t.capResolve} {t.capFormula}</figcaption>
    </figure>
  );
}

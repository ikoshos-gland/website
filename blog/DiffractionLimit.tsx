import React, { useEffect, useRef, useState } from 'react';
import { useLang } from '../i18n/LanguageContext';

// Abbe's wall. Two glowing points blur into one below d = lambda/(2 NA). You
// cannot out-engineer it — so instead of sharpening the lens, you swell the
// SAMPLE by a factor E, physically walking the two points apart until the same
// microscope resolves them. Effective resolution d_eff = d_opt / E.

const STR = {
  en: {
    svgAria: 'Two point emitters seen through a microscope; below the Abbe diffraction limit they merge into one blob, and expanding the sample walks them apart so the same lens resolves them.',
    abbeLimit: 'Abbe limit ≈',
    statusOk: '● resolved — two points',
    statusNo: '● not resolved — one blur',
    readAbbe: 'Abbe d = λ/2NA',
    readExpansion: 'expansion E',
    readDeff: 'd_eff = d/E',
    note: 'd/E is an idealized lower bound. The achieved effective resolution is ≈ 20 nm (theory 13.5–16.2 nm in xy, 30–40 nm in z).',
    sepLabel: 'separation',
    wavelengthLabel: 'wavelength λ',
    apertureLabel: 'aperture NA',
    expansionLabel: 'expansion E',
    sepAria: 'true emitter separation in nanometres',
    wavelengthAria: 'wavelength in nanometres',
    apertureAria: 'numerical aperture',
    expansionAria: 'expansion factor',
    jumpBack: '↺ E = 1×',
    jumpTo: '▸ Jump to E = 18.5×',
    hidePins: 'hide truth pins',
    showPins: 'show truth pins',
    capTitle: 'The diffraction wall.',
    capBody: 'Two glowing points blur into one below the ~196 nm Abbe limit (d = λ ⁄ 2NA). Stretching the sample 18.5× physically walks them apart — the lens never moves — so the same microscope resolves features down to an effective ≈ 20 nm. The crosshairs prove the true geometry is preserved; only the spacing grows.',
  },
  tr: {
    svgAria: 'Bir mikroskoptan görülen iki nokta yayıcı; Abbe kırınım sınırının altında tek bir lekede birleşirler ve örneği genişletmek onları birbirinden uzaklaştırarak aynı merceğin onları çözmesini sağlar.',
    abbeLimit: 'Abbe sınırı ≈',
    statusOk: '● çözüldü — iki nokta',
    statusNo: '● çözülmedi — tek leke',
    readAbbe: 'Abbe d = λ/2NA',
    readExpansion: 'genişleme E',
    readDeff: 'd_eff = d/E',
    note: 'd/E ideal bir alt sınırdır. Elde edilen etkin çözünürlük ≈ 20 nm’dir (teorik olarak xy’de 13,5–16,2 nm, z’de 30–40 nm).',
    sepLabel: 'ayrım',
    wavelengthLabel: 'dalga boyu λ',
    apertureLabel: 'açıklık NA',
    expansionLabel: 'genişleme E',
    sepAria: 'gerçek yayıcı ayrımı, nanometre cinsinden',
    wavelengthAria: 'dalga boyu, nanometre cinsinden',
    apertureAria: 'sayısal açıklık',
    expansionAria: 'genişleme faktörü',
    jumpBack: '↺ E = 1×',
    jumpTo: '▸ E = 18.5×’e atla',
    hidePins: 'gerçek pinlerini gizle',
    showPins: 'gerçek pinlerini göster',
    capTitle: 'Kırınım duvarı.',
    capBody: 'İki parlak nokta, ~196 nm’lik Abbe sınırının altında tek bir lekede bulanıklaşır (d = λ ⁄ 2NA). Örneği 18,5× germek onları fiziksel olarak birbirinden uzaklaştırır — mercek hiç kıpırdamaz — böylece aynı mikroskop, ayrıntıları etkin ≈ 20 nm’ye kadar çözer. Artılar gerçek geometrinin korunduğunu kanıtlar; yalnızca aradaki boşluk büyür.',
  },
  de: {
    svgAria: 'Zwei punktförmige Emitter durch ein Mikroskop betrachtet; unterhalb der Abbe-Beugungsgrenze verschmelzen sie zu einem Fleck, und das Expandieren der Probe zieht sie auseinander, sodass dieselbe Linse sie auflöst.',
    abbeLimit: 'Abbe-Grenze ≈',
    statusOk: '● aufgelöst — zwei Punkte',
    statusNo: '● nicht aufgelöst — ein Fleck',
    readAbbe: 'Abbe d = λ/2NA',
    readExpansion: 'Expansion E',
    readDeff: 'd_eff = d/E',
    note: 'd/E ist eine idealisierte untere Grenze. Die erreichte effektive Auflösung beträgt ≈ 20 nm (theoretisch 13,5–16,2 nm in xy, 30–40 nm in z).',
    sepLabel: 'Abstand',
    wavelengthLabel: 'Wellenlänge λ',
    apertureLabel: 'Apertur NA',
    expansionLabel: 'Expansion E',
    sepAria: 'tatsächlicher Emitterabstand in Nanometern',
    wavelengthAria: 'Wellenlänge in Nanometern',
    apertureAria: 'numerische Apertur',
    expansionAria: 'Expansionsfaktor',
    jumpBack: '↺ E = 1×',
    jumpTo: '▸ Sprung zu E = 18.5×',
    hidePins: 'Wahrheits-Pins ausblenden',
    showPins: 'Wahrheits-Pins anzeigen',
    capTitle: 'Die Beugungswand.',
    capBody: 'Zwei leuchtende Punkte verschwimmen unterhalb der ~196 nm Abbe-Grenze zu einem (d = λ ⁄ 2NA). Die Probe um das 18,5-Fache zu dehnen, zieht sie physisch auseinander — die Linse bewegt sich nie —, sodass dasselbe Mikroskop Strukturen bis zu effektiv ≈ 20 nm auflöst. Die Fadenkreuze beweisen, dass die wahre Geometrie erhalten bleibt; nur der Abstand wächst.',
  },
};

const VW = 640, CX = 320, CY = 96;

export default function DiffractionLimit() {
  const t = STR[useLang().lang] || STR.en;
  const [lam, setLam] = useState(550);   // wavelength, nm
  const [na, setNa] = useState(1.4);     // numerical aperture
  const [sep, setSep] = useState(150);   // true emitter separation, nm
  const [E, setE] = useState(1);         // expansion factor
  const [pins, setPins] = useState(true);
  const reduced = useRef(false);
  const raf = useRef<number | undefined>(undefined);

  useEffect(() => { reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches; }, []);

  // animate E toward target when the preset is pressed
  const animateE = (target: number) => {
    if (reduced.current) { setE(target); return; }
    if (raf.current) cancelAnimationFrame(raf.current);
    const t0 = performance.now(), start = E, dur = 1100;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      setE(start + (target - start) * e);
      if (k < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  };
  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current); }, []);

  const d = lam / (2 * na);              // Abbe limit, nm
  const apparent = sep * E;              // separation the optics actually see
  const resolved = apparent >= d;
  const dEff = d / E;

  // nm -> px so both blobs and the limit bar always fit
  const spanNm = Math.max(d * 5, apparent * 1.5 + d * 1.5, 520);
  const pxPerNm = 600 / spanNm;
  const R = 0.5 * d * pxPerNm;            // Rayleigh radius in px: centres >= 2R apart <=> resolved
  const off = (apparent / 2) * pxPerNm;
  const xl = CX - off, xr = CX + off;
  const dPx = d * pxPerNm;

  return (
    <figure className="blg-viz">
      <div className="blg-viz-stage">
        <svg viewBox={`0 0 ${VW} 200`} role="img" aria-label={t.svgAria}>
          <defs>
            <radialGradient id="dl-blob" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#9BE9E0" stopOpacity="0.95" />
              <stop offset="55%" stopColor="#5BC8C0" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#5BC8C0" stopOpacity="0" />
            </radialGradient>
            <filter id="dl-soft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation={Math.max(0.6, R * 0.34)} /></filter>
          </defs>

          <rect x="6" y="6" width={VW - 12} height="160" rx="10" className="blg-df-field" />
          <g filter="url(#dl-soft)">
            <circle cx={xl} cy={CY} r={R} fill="url(#dl-blob)" />
            <circle cx={xr} cy={CY} r={R} fill="url(#dl-blob)" />
          </g>
          {pins && (
            <g className="blg-df-pin">
              <line x1={xl} y1={CY - 9} x2={xl} y2={CY + 9} /><line x1={xl - 9} y1={CY} x2={xl + 9} y2={CY} />
              <line x1={xr} y1={CY - 9} x2={xr} y2={CY + 9} /><line x1={xr - 9} y1={CY} x2={xr + 9} y2={CY} />
            </g>
          )}

          {/* Abbe limit bar */}
          <g className="blg-df-limit">
            <line x1={CX - dPx / 2} y1={150} x2={CX + dPx / 2} y2={150} />
            <line x1={CX - dPx / 2} y1={145} x2={CX - dPx / 2} y2={155} />
            <line x1={CX + dPx / 2} y1={145} x2={CX + dPx / 2} y2={155} />
            <text x={CX} y={140} textAnchor="middle">{t.abbeLimit} {Math.round(d)} nm</text>
          </g>

          <text x={20} y={26} className={'blg-df-status ' + (resolved ? 'ok' : 'no')}>{resolved ? t.statusOk : t.statusNo}</text>
        </svg>

        <div className="blg-exm-readout">
          <div><span className="k">{t.readAbbe}</span><span className="v">{Math.round(d)} nm</span></div>
          <div><span className="k">{t.readExpansion}</span><span className="v">{E.toFixed(1)}×</span></div>
          <div><span className="k">{t.readDeff}</span><span className="v gold">{dEff < 1 ? dEff.toFixed(1) : Math.round(dEff)} nm</span></div>
        </div>
        <p className="blg-df-note">{t.note}</p>
      </div>

      <div className="blg-viz-controls blg-df-ctl">
        <label><span>{t.sepLabel} <b>{Math.round(sep)} nm</b></span><input type="range" min={0} max={400} step={5} value={sep} onChange={(e) => setSep(+e.target.value)} aria-label={t.sepAria} /></label>
        <label><span>{t.wavelengthLabel} <b>{lam} nm</b></span><input type="range" min={400} max={700} step={10} value={lam} onChange={(e) => setLam(+e.target.value)} aria-label={t.wavelengthAria} /></label>
        <label><span>{t.apertureLabel} <b>{na.toFixed(2)}</b></span><input type="range" min={0.5} max={1.4} step={0.05} value={na} onChange={(e) => setNa(+e.target.value)} aria-label={t.apertureAria} /></label>
        <label><span>{t.expansionLabel} <b>{E.toFixed(1)}×</b></span><input type="range" min={1} max={18.5} step={0.5} value={E} onChange={(e) => { if (raf.current) cancelAnimationFrame(raf.current); setE(+e.target.value); }} aria-label={t.expansionAria} /></label>
        <div className="blg-df-btns">
          <button className="blg-btn" onClick={() => animateE(E >= 18 ? 1 : 18.5)}>{E >= 18 ? t.jumpBack : t.jumpTo}</button>
          <button className="blg-btn" onClick={() => setPins((p) => !p)}>{pins ? t.hidePins : t.showPins}</button>
        </div>
      </div>

      <figcaption><b>{t.capTitle}</b> {t.capBody}</figcaption>
    </figure>
  );
}

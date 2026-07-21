import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLang } from '../i18n/LanguageContext';

// Expansion microscopy with the real thing on the left. The clip is a timelapse of
// the expansion step: a mouse coronal section at hippocampal level, anchored into a
// polyelectrolyte gel and dialysed in water, physically swelling in the dish.
//
// The video's playhead is the only input. Progress p drives the expansion factor E
// across one proExM round (1x -> 4.5x), and E drives everything on the right: the
// window there is what the objective sees, and its point-spread function is a
// Gaussian of FIXED width in screen space. Only the tissue scales under it, so a
// pre-/postsynaptic pair 150 nm apart is one merged punctum until E*150 nm passes
// the ~300 nm limit at E = 2, then two. Effective resolution is d_opt / E.
//
// public/video/exm-expansion.mp4 is a trimmed screen capture. Credit it by passing
// children from MDX — they are markdown-processed, so [@key] citations work there:
//   <ExpansionSlice>Kayit: ... [@NextgenerationExpansionMicroscopy].</ExpansionSlice>

const E_MIN = 1, E_MAX = 4.5;
const D_OPT = 300;        // nm, fixed optical resolution (2 sigma of the PSF)
const PAIR_NM = 150;      // nm, pre-/postsynaptic centre separation

const VIDEO = '/video/exm-expansion.mp4';

// ---- the objective's window ----------------------------------------------
const BOX = 220;                      // px, the window is square
const FOV_UM = 5.0;                   // µm of tissue across it at 1x
const PX_UM = BOX / FOV_UM;           // px per µm at 1x
const PSF = (D_OPT / 2000) * PX_UM;   // fixed blur sigma; 2 sigma = d_opt -> splits at E = 2
const C = BOX / 2;

// ---- synaptic neuropil, in µm --------------------------------------------
const SHAFT = { x0: -1.30, x1: -0.75 };
const SPINES = [
  { y: -2.28, len: 0.40, head: 0.145, tilt: -0.16 },
  { y: -1.14, len: 0.34, head: 0.155, tilt: 0.09 },
  { y: 0.00, len: 0.36, head: 0.150, tilt: 0.00 },
  { y: 1.16, len: 0.44, head: 0.135, tilt: -0.10 },
  { y: 2.32, len: 0.32, head: 0.160, tilt: 0.14 },
];
const SYN = SPINES.map((s) => {
  const nx = SHAFT.x1 + s.len, ny = s.y + s.tilt;
  const hx = nx + s.head * 0.75, hy = ny + s.tilt * 0.25;
  const cx = hx + s.head + 0.02;                       // cleft centre
  return { ...s, nx, ny, hx, hy, cx, cy: hy, post: cx - PAIR_NM / 2000, pre: cx + PAIR_NM / 2000 };
});
const ANCHOR = { x: -0.15, y: 0 };                     // the window zooms into this synapse

// packed neuropil around the shaft — deterministic, so hydration never shifts it
const NEURO = (() => {
  let s = 20250719;
  const rnd = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const out: { x: number; y: number; r: number }[] = [];
  for (let i = 0; i < 54; i++) {
    const x = -3.0 + rnd() * 5.6, y = -2.9 + rnd() * 5.8, r = 0.045 + rnd() * 0.10;
    if (Math.abs(x + 0.1) < 0.6 && Math.abs(y) < 0.45) continue;   // keep the target synapse legible
    out.push({ x, y, r });
  }
  return out;
})();

const STR = {
  en: {
    aria: 'Left: a timelapse of a mouse coronal section physically swelling in a hydrogel. Right: what the objective sees, where the blur keeps exactly the same width while the tissue scales, so a pre- and postsynaptic pair 150 nanometres apart splits from one merged punctum into two once the expansion factor passes two.',
    specimen: 'specimen · real timelapse', objective: 'through the objective · fixed field',
    merged: 'one punctum — unresolved', split: 'two puncta — resolved',
    kExp: 'expansion', kSep: 'apparent separation', kRes: 'eff. resolution', kVol: 'volume',
    play: 'Play', pause: 'Pause', replay: 'Replay',
    rawOn: 'raw tissue', rawOff: 'optical view',
    range: 'timeline, 1× to 4.5× expansion',
    cap: (
      <><b>The tissue grows; the microscope never does.</b> On the left, the expansion step itself: a mouse coronal section at hippocampal level, anchored into a sodium-acrylate hydrogel, digested until nothing resists, then dialysed in pure water. The charged network drinks and the section swells in the dish — the clip is a timelapse of that swelling, so nothing about the shape is drawn or simulated. The readout follows one full proExM round, 1× to 4.5×, which is where a section of this kind ends up once dialysis has run to completion. The window on the right is what an objective would see, and its blur never changes width: a pre-/postsynaptic pair sitting 150 nm apart is a single merged punctum until E·150 nm passes the ~300 nm limit at E = 2, and two distinct puncta after. Effective resolution, referred back to the original sample, is simply d_opt / E — 300 nm at 1×, ≈ 67 nm at 4.5×. Nothing about the optics improved; the specimen was rebuilt at a scale the optics could already handle.</>
    ),
  },
  tr: {
    aria: 'Solda: hidrojel içinde fiziksel olarak şişen fare koronal kesitinin hızlandırılmış kaydı. Sağda: objektifin gördüğü alan; doku büyürken bulanıklığın genişliği hiç değişmez, bu yüzden 150 nanometre aralıklı presinaptik ve postsinaptik çift, genişleme faktörü ikiyi geçtiğinde tek birleşik noktadan iki noktaya ayrılır.',
    specimen: 'numune · gerçek zaman serisi', objective: 'objektiften · sabit alan',
    merged: 'tek nokta — çözülmedi', split: 'iki nokta — çözüldü',
    kExp: 'genişleme', kSep: 'görünür ayrım', kRes: 'efektif çöz.', kVol: 'hacim',
    play: 'Oynat', pause: 'Duraklat', replay: 'Baştan',
    rawOn: 'ham doku', rawOff: 'optik görünüm',
    range: 'zaman çizgisi, 1× – 4,5× genişleme',
    cap: (
      <><b>Büyüyen dokudur, mikroskop değil.</b> Solda genişleme adımının kendisi var: hipokampüs düzeyindeki bir fare koronal kesiti sodyum akrilat hidrojeline bağlanır, hiçbir şey direnmeyene kadar sindirilir ve saf suda diyaliz edilir. Yüklü ağ suyu çeker ve kesit kabın içinde şişer — klip bu şişmenin hızlandırılmış kaydıdır, yani buradaki hiçbir biçim çizilmiş ya da benzetilmiş değildir. Sayaçlar tam bir proExM turunu, 1×'ten 4,5×'e, izler; diyaliz sonuna kadar sürdüğünde bu tür bir kesitin vardığı yer burasıdır. Sağdaki pencere bir objektifin göreceği alandır ve bulanıklığının genişliği hiç değişmez: 150 nm aralıkta duran presinaptik–postsinaptik çift, E·150 nm ~300 nm sınırını E = 2'de aşana kadar tek birleşik noktadır, sonra iki ayrı nokta. Orijinal örneğe göre efektif çözünürlük yalnızca d_opt / E'dir — 1×'te 300 nm, 4,5×'te ≈ 67 nm. Optikte hiçbir şey iyileşmedi; numune, optiğin zaten baş edebildiği bir ölçekte yeniden kuruldu.</>
    ),
  },
  de: {
    aria: 'Links: eine Zeitrafferaufnahme eines koronalen Mausschnitts, der in einem Hydrogel physisch quillt. Rechts: was das Objektiv sieht; die Unschärfe behält exakt dieselbe Breite, während das Gewebe skaliert, sodass ein prä- und postsynaptisches Paar mit 150 Nanometern Abstand von einem verschmolzenen Punkt in zwei aufspaltet, sobald der Expansionsfaktor zwei überschreitet.',
    specimen: 'Probe · echte Zeitrafferaufnahme', objective: 'durch das Objektiv · festes Feld',
    merged: 'ein Punkt — ungelöst', split: 'zwei Punkte — aufgelöst',
    kExp: 'Expansion', kSep: 'scheinbarer Abstand', kRes: 'eff. Auflösung', kVol: 'Volumen',
    play: 'Abspielen', pause: 'Pause', replay: 'Neu starten',
    rawOn: 'rohes Gewebe', rawOff: 'optische Ansicht',
    range: 'Zeitleiste, 1× bis 4,5× Expansion',
    cap: (
      <><b>Das Gewebe wächst, das Mikroskop nie.</b> Links der Expansionsschritt selbst: ein koronaler Mausschnitt auf Hippocampus-Höhe, in ein Natriumacrylat-Hydrogel verankert, verdaut, bis nichts mehr Widerstand leistet, und in reinem Wasser dialysiert. Das geladene Netzwerk nimmt Wasser auf und der Schnitt quillt in der Schale — der Clip ist eine Zeitrafferaufnahme genau dieses Quellens, nichts an der Form ist gezeichnet oder simuliert. Die Anzeige folgt einer vollen proExM-Runde, 1× bis 4,5×, wo ein solcher Schnitt nach vollständiger Dialyse landet. Das Fenster rechts zeigt, was ein Objektiv sähe, und seine Unschärfe bleibt exakt gleich breit: ein prä-/postsynaptisches Paar mit 150 nm Abstand ist ein einzelner verschmolzener Punkt, bis E·150 nm bei E = 2 die ~300-nm-Grenze überschreitet, danach zwei. Die effektive Auflösung, auf die ursprüngliche Probe bezogen, ist schlicht d_opt / E — 300 nm bei 1×, ≈ 67 nm bei 4,5×. An der Optik hat sich nichts verbessert; die Probe wurde in einem Maßstab neu aufgebaut, den die Optik längst beherrschte.</>
    ),
  },
};

export default function ExpansionSlice({ children }: { children?: React.ReactNode }) {
  const t = STR[useLang().lang] || STR.en;
  const vid = useRef<HTMLVideoElement | null>(null);
  const [p, setP] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [optics, setOptics] = useState(true);
  const [ended, setEnded] = useState(false);

  // the playhead is the only input: everything below is a function of it
  useEffect(() => {
    const v = vid.current;
    if (!v) return;
    let raf = 0;
    const read = () => { if (v.duration) setP(Math.min(1, v.currentTime / v.duration)); };
    const loop = () => { read(); raf = requestAnimationFrame(loop); };
    const onPlay = () => { setPlaying(true); setEnded(false); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); };
    const onPause = () => { setPlaying(false); cancelAnimationFrame(raf); read(); };
    const onEnded = () => { setEnded(true); setPlaying(false); };
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('ended', onEnded);
    v.addEventListener('timeupdate', read);
    v.addEventListener('seeked', read);
    v.addEventListener('loadedmetadata', read);

    // a reader who asked for less motion gets the finished state, held still
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      v.autoplay = false; v.loop = false;
      const settle = () => { v.currentTime = v.duration * 0.995; };
      if (v.readyState >= 1) settle(); else v.addEventListener('loadedmetadata', settle, { once: true });
    } else if (!v.paused) onPlay();

    return () => {
      cancelAnimationFrame(raf);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('ended', onEnded);
      v.removeEventListener('timeupdate', read);
      v.removeEventListener('seeked', read);
      v.removeEventListener('loadedmetadata', read);
    };
  }, []);

  const e = E_MIN + p * (E_MAX - E_MIN);
  const dEff = D_OPT / e;
  const sepNm = PAIR_NM * e;
  const resolved = e >= D_OPT / PAIR_NM;            // E >= 2
  const k = PX_UM * e;                              // px per µm of tissue in the window
  const ux = (mx: number) => C + (mx - ANCHOR.x) * k;
  const uy = (my: number) => C + (my - ANCHOR.y) * k;
  const centre = SYN[2];

  const seek = (frac: number) => {
    const v = vid.current;
    if (!v || !v.duration) return;
    v.currentTime = Math.min(v.duration * 0.999, Math.max(0, frac * v.duration));
    setP(frac);
  };
  const toggle = () => {
    const v = vid.current;
    if (!v) return;
    if (v.paused) { if (ended || v.currentTime >= v.duration - 0.05) v.currentTime = 0; v.play(); }
    else v.pause();
  };

  const motif = useMemo(() => (
    <g transform={`translate(${C} ${C}) scale(${k}) translate(${-ANCHOR.x} ${-ANCHOR.y})`}>
      <g className="blg-xs-neuro">
        {NEURO.map((c, i) => <circle key={i} cx={c.x} cy={c.y} r={c.r} />)}
      </g>
      <g className="blg-xs-cell">
        <rect x={SHAFT.x0} y={-3.4} width={SHAFT.x1 - SHAFT.x0} height={6.8} rx={0.3} />
        {SYN.map((s, i) => (
          <g key={i}>
            <line x1={SHAFT.x1} y1={s.y} x2={s.nx} y2={s.ny} strokeWidth={PAIR_NM / 1000} strokeLinecap="round" />
            <circle cx={s.hx} cy={s.hy} r={s.head} />
          </g>
        ))}
      </g>
      <g className="blg-xs-axon">
        {SYN.map((s, i) => <ellipse key={i} cx={s.cx + 0.20} cy={s.cy} rx={0.20} ry={0.24} />)}
      </g>
      {/* the two-colour synaptic pair — the thing the resolution limit decides */}
      {SYN.map((s, i) => (
        <g key={i}>
          <circle className="blg-xs-post" cx={s.post} cy={s.cy} r={0.056} />
          <circle className="blg-xs-pre" cx={s.pre} cy={s.cy} r={0.056} />
        </g>
      ))}
    </g>
  ), [k]);

  return (
    <figure className="blg-viz">
      <div className="blg-viz-stage">
        <div className="blg-xs-split">
          {/* ---------- the specimen, filmed ---------- */}
          <div className="blg-xs-col">
            <div className="blg-xs-head">
              <span className="blg-xs-tag">{t.specimen}</span>
              <span className="blg-xs-tag dim">{e.toFixed(2)}×</span>
            </div>
            <div className="blg-xs-videoframe">
              <video
                ref={vid} src={VIDEO} autoPlay muted loop playsInline preload="auto"
                aria-label={t.aria}
              />
              <span className="blg-xs-vprog"><i style={{ width: `${p * 100}%` }} /></span>
            </div>
          </div>

          {/* ---------- what the objective sees ---------- */}
          <div className="blg-xs-col">
            <div className="blg-xs-head">
              <span className="blg-xs-tag">{t.objective}</span>
            </div>
            <svg viewBox={`0 0 ${BOX} ${BOX + 30}`} role="img" aria-label={t.aria}>
              <defs>
                <clipPath id="xs-fov"><rect x={0} y={0} width={BOX} height={BOX} rx={10} /></clipPath>
                <filter id="xs-psf" filterUnits="userSpaceOnUse"
                  x={-24} y={-24} width={BOX + 48} height={BOX + 48}>
                  <feGaussianBlur stdDeviation={PSF} />
                </filter>
              </defs>

              <g clipPath="url(#xs-fov)">
                <rect className="blg-xs-dark" x={0} y={0} width={BOX} height={BOX} />
                <g filter={optics ? 'url(#xs-psf)' : undefined}>{motif}</g>
              </g>
              <rect className="blg-xs-panel" x={0} y={0} width={BOX} height={BOX} rx={10} />

              {/* live caliper across the central pair, never blurred */}
              {resolved && (
                <g className="blg-xs-pair" opacity={Math.min(1, (e - 2) / 0.4)}>
                  <line x1={ux(centre.post)} y1={uy(centre.cy) - 20} x2={ux(centre.pre)} y2={uy(centre.cy) - 20} />
                  <line x1={ux(centre.post)} y1={uy(centre.cy) - 24} x2={ux(centre.post)} y2={uy(centre.cy) - 16} />
                  <line x1={ux(centre.pre)} y1={uy(centre.cy) - 24} x2={ux(centre.pre)} y2={uy(centre.cy) - 16} />
                  <text x={(ux(centre.post) + ux(centre.pre)) / 2} y={uy(centre.cy) - 28} textAnchor="middle" paintOrder="stroke fill">{PAIR_NM} nm</text>
                </g>
              )}

              <text className={'blg-xs-state ' + (resolved ? 'ok' : 'no')} x={BOX - 11} y={19}
                textAnchor="end" paintOrder="stroke fill">{resolved ? t.split : t.merged}</text>

              {/* the fixed ruler: same length on screen at every E, shrinking meaning */}
              <g className="blg-xs-res">
                <line x1={2} y1={BOX + 18} x2={2 + D_OPT / 1000 * PX_UM} y2={BOX + 18} />
                <line x1={2} y1={BOX + 14} x2={2} y2={BOX + 22} />
                <line x1={2 + D_OPT / 1000 * PX_UM} y1={BOX + 14} x2={2 + D_OPT / 1000 * PX_UM} y2={BOX + 22} />
                <text x={8 + D_OPT / 1000 * PX_UM} y={BOX + 21}>≈ {Math.round(dEff)} nm</text>
              </g>
            </svg>
          </div>
        </div>

        <div className="blg-xs-readout">
          <div><span className="k">{t.kExp}</span><span className="v">{e.toFixed(2)}×</span></div>
          <div><span className="k">{t.kSep}</span><span className="v">{Math.round(sepNm)} nm</span></div>
          <div><span className="k">{t.kRes}</span><span className="v gold">≈ {Math.round(dEff)} nm</span></div>
          <div><span className="k">{t.kVol}</span><span className="v">{(e ** 3).toFixed(0)}×</span></div>
        </div>
      </div>

      <div className="blg-viz-controls">
        <button className="blg-btn" onClick={toggle}>
          {playing ? '❚❚ ' + t.pause : (ended ? '↻ ' + t.replay : '▸ ' + t.play)}
        </button>
        <input type="range" min={0} max={1} step={0.001} value={p}
          onChange={(ev) => { vid.current?.pause(); seek(parseFloat(ev.target.value)); }}
          style={{ flex: 1 }} aria-label={t.range} />
        <button className="blg-btn" onClick={() => setOptics((o) => !o)}>{optics ? t.rawOn : t.rawOff}</button>
      </div>
      <figcaption>{t.cap}{children ? <span className="blg-xs-credit">{children}</span> : null}</figcaption>
    </figure>
  );
}

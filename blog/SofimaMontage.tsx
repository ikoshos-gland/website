import React, { useState } from 'react';
import { useLang } from '../i18n/LanguageContext';

// SOFIMA montaging: two overlapping tiles, the right one shot slightly low. A
// single masked cross-correlation gives one global offset (coarse), then each
// tile becomes a deformable mesh of Hooke springs and a dense field of 120x120
// optical-flow matches relaxes the seam away (fine). Trim 50 px, project, done.

const STR = {
  en: {
    stages: [
      { t: 'Tiles acquired', s: 'right tile shot ~26 px low — the seam mismatches' },
      { t: 'Coarse', s: 'masked cross-correlation → one global offset, snap via springs' },
      { t: 'Fine', s: '120×120 px optical-flow patches relax the mesh elastically' },
      { t: 'Trim & project', s: 'cut the 50 px margin → one seamless canvas' },
    ],
    ariaStage: (n: number, ttl: string) => `SOFIMA montaging, stage ${n} of 4: ${ttl}.`,
    globalOffset: 'global offset',
    capFine: '120×120 px patches → optical-flow springs',
    capTrim: '50 px margin trimmed · seamless canvas',
    tileA: 'tile A',
    tileB: 'tile B',
    dotsAria: 'montage stages',
    prev: '‹ Prev',
    next: 'Next ›',
    reset: '↻ Reset',
    hint: "tissue isn't rigid — a stitcher that only slides tiles can't follow the warp",
    capTitle: 'Stitching with springs.',
    capBody: 'The right tile was acquired ~26 px low. A single masked cross-correlation over the overlap gives one global offset that snaps it into place via Hooke springs (coarse). Then each tile becomes a deformable mesh, and a dense field of 120×120 px optical-flow matches — modelled as zero-length springs — relaxes the seam away elastically (fine). Trim the 50 px margin, project to a common canvas, and the seam disappears.',
  },
  tr: {
    stages: [
      { t: 'Karolar alındı', s: 'sağ karo ~26 px aşağıda çekildi — dikiş hizalanmıyor' },
      { t: 'Kaba', s: 'maskeli çapraz korelasyon → tek bir global ofset, yaylarla yerine otur' },
      { t: 'İnce', s: '120×120 px optik-akış yamaları ağı esnek biçimde gevşetir' },
      { t: 'Kırp ve yansıt', s: '50 px kenar boşluğunu kes → tek kusursuz tuval' },
    ],
    ariaStage: (n: number, ttl: string) => `SOFIMA montajı, aşama ${n} / 4: ${ttl}.`,
    globalOffset: 'global ofset',
    capFine: '120×120 px yamalar → optik-akış yayları',
    capTrim: '50 px kenar boşluğu kırpıldı · kusursuz tuval',
    tileA: 'karo A',
    tileB: 'karo B',
    dotsAria: 'montaj aşamaları',
    prev: '‹ Önceki',
    next: 'Sonraki ›',
    reset: '↻ Sıfırla',
    hint: 'doku katı değildir — yalnızca karoları kaydıran bir birleştirici çarpılmayı izleyemez',
    capTitle: 'Yaylarla dikiş.',
    capBody: 'Sağ karo ~26 px aşağıda alındı. Örtüşme üzerindeki tek bir maskeli çapraz korelasyon, onu Hooke yaylarıyla yerine oturtan tek bir global ofset verir (kaba). Sonra her karo deformlanabilir bir ağa dönüşür ve sıfır-uzunluklu yaylar olarak modellenen yoğun bir 120×120 px optik-akış eşleşmeleri alanı, dikişi esnek biçimde gevşetir (ince). 50 px kenar boşluğunu kırp, ortak bir tuvale yansıt ve dikiş kaybolur.',
  },
  de: {
    stages: [
      { t: 'Kacheln aufgenommen', s: 'rechte Kachel ~26 px zu tief — die Naht passt nicht' },
      { t: 'Grob', s: 'maskierte Kreuzkorrelation → ein globaler Offset, Einrasten über Federn' },
      { t: 'Fein', s: '120×120 px Optical-Flow-Patches entspannen das Netz elastisch' },
      { t: 'Beschneiden & projizieren', s: 'den 50 px Rand abschneiden → eine nahtlose Leinwand' },
    ],
    ariaStage: (n: number, ttl: string) => `SOFIMA-Montage, Stufe ${n} von 4: ${ttl}.`,
    globalOffset: 'globaler Offset',
    capFine: '120×120 px Patches → Optical-Flow-Federn',
    capTrim: '50 px Rand beschnitten · nahtlose Leinwand',
    tileA: 'Kachel A',
    tileB: 'Kachel B',
    dotsAria: 'Montagestufen',
    prev: '‹ Zurück',
    next: 'Weiter ›',
    reset: '↻ Zurücksetzen',
    hint: 'Gewebe ist nicht starr — ein Stitcher, der Kacheln nur verschiebt, kann der Verzerrung nicht folgen',
    capTitle: 'Zusammenfügen mit Federn.',
    capBody: 'Die rechte Kachel wurde ~26 px zu tief aufgenommen. Eine einzige maskierte Kreuzkorrelation über die Überlappung liefert einen globalen Offset, der sie über Hooke-Federn einrasten lässt (grob). Dann wird jede Kachel zu einem deformierbaren Netz, und ein dichtes Feld aus 120×120 px Optical-Flow-Übereinstimmungen — modelliert als Federn der Länge null — entspannt die Naht elastisch (fein). Beschneiden Sie den 50 px Rand, projizieren Sie auf eine gemeinsame Leinwand, und die Naht verschwindet.',
  },
};

// content lines that should run continuously across the seam
const LINES = [78, 116, 154, 192, 230];
const line = (y: number) => {
  let d = `M 30 ${y}`;
  for (let x = 30; x <= 540; x += 18) d += ` L ${x} ${y + Math.sin(x * 0.03 + y) * 7}`;
  return d;
};

export default function SofimaMontage() {
  const t = STR[useLang().lang] || STR.en;
  const STAGES = t.stages;
  const [ph, setPh] = useState(0);
  const yOff = ph === 0 ? 26 : 0;
  const merged = ph === 3;

  // fine-stage patch boxes across the overlap band (x 250..330)
  const patches = [] as React.ReactNode[];
  if (ph === 2) for (let x = 252; x < 326; x += 24) for (let y = 70; y < 250; y += 30) patches.push(
    <g key={x + '-' + y}><rect className="blg-mo-patch" x={x} y={y} width={22} height={22} /><line className="blg-mo-flow" x1={x + 11} y1={y + 11} x2={x + 17} y2={y + 6} /></g>
  );

  return (
    <figure className="blg-viz">
      <div className="blg-viz-stage">
        <div className="blg-ec-head">
          <h3>{STAGES[ph].t}</h3>
          <span>{STAGES[ph].s}</span>
        </div>
        <svg viewBox="0 0 570 300" role="img" aria-label={t.ariaStage(ph + 1, STAGES[ph].t)}>
          <defs>
            <clipPath id="mo-clipL"><rect x="30" y="40" width="270" height="220" /></clipPath>
            <clipPath id="mo-clipR"><rect x="270" y="40" width="270" height="220" /></clipPath>
          </defs>

          {/* tile frames */}
          <rect className="blg-mo-tile" x="30" y="40" width="270" height="220" rx="4" />
          {!merged && <rect className="blg-mo-tile" x="270" y={40 + yOff} width="270" height="220" rx="4" style={{ transition: 'y .8s cubic-bezier(.34,1.2,.5,1)' }} />}
          {merged && <rect className="blg-mo-canvas" x="80" y="40" width="440" height="220" rx="4" />}

          {/* overlap band */}
          {ph < 3 && <rect className="blg-mo-overlap" x="270" y="40" width="30" height="220" />}

          {/* content lines */}
          <g clipPath="url(#mo-clipL)" className="blg-mo-line">{LINES.map((y) => <path key={y} d={line(y)} />)}</g>
          {!merged && <g clipPath="url(#mo-clipR)" className="blg-mo-line" style={{ transform: `translateY(${yOff}px)`, transition: 'transform .8s cubic-bezier(.34,1.2,.5,1)' }}>{LINES.map((y) => <path key={y} d={line(y)} />)}</g>}
          {merged && <g className="blg-mo-line"><g clipPath="url(#mo-clipL)">{LINES.map((y) => <path key={y} d={line(y)} />)}</g><g clipPath="url(#mo-clipR)">{LINES.map((y) => <path key={y} d={line(y)} />)}</g></g>}

          {/* coarse offset vector */}
          {ph === 1 && (
            <g className="blg-mo-vec">
              <line x1="405" y1="170" x2="405" y2="140" markerEnd="url(#mo-arrow)" />
              <text x="414" y="160">{t.globalOffset}</text>
              <marker id="mo-arrow" markerWidth="9" markerHeight="9" refX="4" refY="7" orient="auto"><path d="M0,0 L8,0 L4,8 Z" fill="#FFD700" /></marker>
            </g>
          )}

          {/* fine: mesh + patches */}
          {ph === 2 && (
            <>
              <g className="blg-mo-mesh">
                {[0, 1, 2, 3, 4, 5].map((r) => [0, 1, 2, 3].map((c) => <circle key={r + '-' + c} cx={258 + c * 22} cy={70 + r * 30} r={1.6} />))}
              </g>
              {patches}
              <text className="blg-mo-cap" x="288" y="282" textAnchor="middle">{t.capFine}</text>
            </>
          )}

          {/* trim margin */}
          {ph === 3 && <rect className="blg-mo-margin" x="92" y="52" width="416" height="196" rx="3" />}
          {ph === 3 && <text className="blg-mo-cap" x="300" y="282" textAnchor="middle">{t.capTrim}</text>}

          <text className="blg-mo-tilelbl" x="100" y="32">{t.tileA}</text>
          {!merged && <text className="blg-mo-tilelbl" x="430" y="32">{t.tileB}</text>}
        </svg>

        <div className="blg-ec-dots" role="tablist" aria-label={t.dotsAria}>
          {STAGES.map((s, i) => (
            <button key={i} role="tab" aria-selected={i === ph} aria-current={i === ph ? 'step' : undefined} className={'blg-ec-dot' + (i === ph ? ' on' : '')} onClick={() => setPh(i)}><i /> {s.t}</button>
          ))}
        </div>
      </div>

      <div className="blg-viz-controls">
        <button className="blg-btn" onClick={() => setPh((p) => (p + 3) % 4)}>{t.prev}</button>
        <button className="blg-btn" onClick={() => setPh((p) => (p + 1) % 4)}>{t.next}</button>
        <button className="blg-btn" onClick={() => setPh(0)}>{t.reset}</button>
        <span className="blg-lp-hint">{t.hint}</span>
      </div>

      <figcaption><b>{t.capTitle}</b> {t.capBody}</figcaption>
    </figure>
  );
}

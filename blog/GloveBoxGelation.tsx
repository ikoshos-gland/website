import React, { useState } from 'react';
import { useLang } from '../i18n/LanguageContext';

// The most physical moment in the protocol: casting a swellable gel in an
// atmosphere deliberately made lifeless to chemistry. Oxygen scavenges the
// growing radical chains, so a gel cast in air sets soft or not at all — hence
// the nitrogen sparge, the triple purge, and only then the initiator.

const STR = {
  en: {
    stages: [
      { t: 'Build the chamber', s: 'parafilm walls on a hydrophobic slide' },
      { t: 'Deoxygenate', s: 'bubble N₂ ~50 s — O₂ quenches the radicals' },
      { t: 'Purge the glove box', s: 'fill & empty with N₂, three times' },
      { t: 'Mix & cast', s: '411 µl gel + 4 µl KPS · 50 µl per sample' },
      { t: 'Polymerise', s: 'dark, ~24 °C, 16–20 h' },
    ],
    ariaStage: (n: number, ttl: string, sub: string) => `Anaerobic gelation, stage ${n} of 5: ${ttl}. ${sub}.`,
    purgeBadge: 'N₂ ×3 purge',
    n2in: 'N₂ in →',
    deoxCap: '~50 s · O₂ quenches radical polymerisation',
    dim45: '4.5 cm',
    dimGap: '0.1 cm gap',
    dim02: '0.2 cm',
    pipCap: '411 µl gel + 4 µl KPS · invert ×5 · 50 µl drop',
    readout: '🌡 ~24 °C · ⏱ 16–20 h · dark',
    dotsAria: 'gelation stages',
    prev: '‹ Prev',
    next: 'Next ›',
    reset: '↻ Reset',
    hint: 'the gel only cures (glow, stage 5) once O₂ is near zero',
    capTitle: 'Killing the oxygen.',
    capBody: 'Build the parafilm chamber (a 0.1 cm gap on a hydrophobic slide), bubble nitrogen through the gel for ~50 s, purge the glove box three times, then mix 411 µl gel with 4 µl KPS initiator and cast 50 µl per sample. Only with the O₂ meter near zero does the gel polymerise cleanly, in the dark at ~24 °C over 16–20 hours.',
  },
  tr: {
    stages: [
      { t: 'Hazneyi kur', s: 'hidrofobik lam üzerine parafilm duvarlar' },
      { t: 'Oksijeni gider', s: 'N₂ ile ~50 s köpürt — O₂ radikalleri söndürür' },
      { t: 'Glove-box’ı temizle', s: 'N₂ ile doldur ve boşalt, üç kez' },
      { t: 'Karıştır ve dök', s: '411 µl jel + 4 µl KPS · örnek başına 50 µl' },
      { t: 'Polimerize et', s: 'karanlık, ~24 °C, 16–20 sa' },
    ],
    ariaStage: (n: number, ttl: string, sub: string) => `Anaerobik jelasyon, aşama ${n} / 5: ${ttl}. ${sub}.`,
    purgeBadge: 'N₂ ×3 temizleme',
    n2in: 'N₂ giriş →',
    deoxCap: '~50 s · O₂ radikal polimerizasyonu söndürür',
    dim45: '4.5 cm',
    dimGap: '0.1 cm boşluk',
    dim02: '0.2 cm',
    pipCap: '411 µl jel + 4 µl KPS · ×5 ters çevir · 50 µl damla',
    readout: '🌡 ~24 °C · ⏱ 16–20 sa · karanlık',
    dotsAria: 'jelasyon aşamaları',
    prev: '‹ Önceki',
    next: 'Sonraki ›',
    reset: '↻ Sıfırla',
    hint: 'jel ancak O₂ sıfıra yakınken kürlenir (parlama, aşama 5)',
    capTitle: 'Oksijeni öldürmek.',
    capBody: 'Parafilm hazneyi kurun (hidrofobik lam üzerinde 0.1 cm boşluk), jelin içinden ~50 s azot köpürtün, glove-box’ı üç kez temizleyin, ardından 411 µl jeli 4 µl KPS başlatıcıyla karıştırın ve örnek başına 50 µl dökün. Yalnızca O₂ ölçer sıfıra yakınken jel temiz biçimde polimerize olur; karanlıkta, ~24 °C’de, 16–20 saat boyunca.',
  },
  de: {
    stages: [
      { t: 'Die Kammer bauen', s: 'Parafilm-Wände auf einem hydrophoben Objektträger' },
      { t: 'Sauerstoff entfernen', s: 'N₂ ~50 s durchblasen — O₂ löscht die Radikale' },
      { t: 'Glovebox spülen', s: 'mit N₂ füllen und entleeren, dreimal' },
      { t: 'Mischen & gießen', s: '411 µl Gel + 4 µl KPS · 50 µl pro Probe' },
      { t: 'Polymerisieren', s: 'dunkel, ~24 °C, 16–20 h' },
    ],
    ariaStage: (n: number, ttl: string, sub: string) => `Anaerobe Gelierung, Stufe ${n} von 5: ${ttl}. ${sub}.`,
    purgeBadge: 'N₂ ×3 Spülung',
    n2in: 'N₂ ein →',
    deoxCap: '~50 s · O₂ löscht die radikalische Polymerisation',
    dim45: '4,5 cm',
    dimGap: '0,1 cm Spalt',
    dim02: '0,2 cm',
    pipCap: '411 µl Gel + 4 µl KPS · ×5 invertieren · 50 µl Tropfen',
    readout: '🌡 ~24 °C · ⏱ 16–20 h · dunkel',
    dotsAria: 'Gelierungsstufen',
    prev: '‹ Zurück',
    next: 'Weiter ›',
    reset: '↻ Zurücksetzen',
    hint: 'das Gel härtet erst aus (Leuchten, Stufe 5), wenn O₂ nahe null ist',
    capTitle: 'Den Sauerstoff töten.',
    capBody: 'Bauen Sie die Parafilm-Kammer (ein 0,1 cm Spalt auf einem hydrophoben Objektträger), blasen Sie ~50 s Stickstoff durch das Gel, spülen Sie die Glovebox dreimal, mischen Sie dann 411 µl Gel mit 4 µl KPS-Initiator und gießen Sie 50 µl pro Probe. Nur wenn das O₂-Messgerät nahe null steht, polymerisiert das Gel sauber — im Dunkeln bei ~24 °C über 16–20 Stunden.',
  },
};

export default function GloveBoxGelation() {
  const t = STR[useLang().lang] || STR.en;
  const STAGES = t.stages;
  const [st, setSt] = useState(0);
  const o2 = [1, 0.5, 0.12, 0.05, 0.02][st];

  return (
    <figure className="blg-viz">
      <div className="blg-viz-stage">
        <div className="blg-ec-head">
          <h3>{st + 1}. {STAGES[st].t}</h3>
          <span>{STAGES[st].s}</span>
        </div>
        <svg viewBox="0 0 640 320" role="img" aria-label={t.ariaStage(st + 1, STAGES[st].t, STAGES[st].s)}>
          {/* glove-box outline */}
          <rect className={'blg-gb-box' + (st === 2 ? ' purge' : '')} x="12" y="14" width="592" height="292" rx="16" />
          {st >= 2 && <text className="blg-gb-badge" x="34" y="42">{t.purgeBadge}</text>}

          {/* N2 inlet + bubbles (deoxygenate) */}
          {st === 1 && (
            <g>
              <text className="blg-gb-note" x="34" y="40">{t.n2in}</text>
              <line className="blg-gb-inlet" x1="40" y1="150" x2="120" y2="150" />
              {[0, 1, 2, 3, 4, 5, 6].map((i) => <circle key={i} className="blg-gb-bub" cx={130 + i * 38} cy={180} r={4 + (i % 3)} style={{ animationDelay: (i * 0.22) + 's' }} />)}
              {[0, 1, 2, 3, 4].map((i) => <circle key={'o' + i} className="blg-gb-o2" cx={160 + i * 70} cy={120 - (i % 2) * 30} r={3.5} />)}
              <text className="blg-gb-cap" x="320" y="96" textAnchor="middle">{t.deoxCap}</text>
            </g>
          )}

          {/* slide + parafilm chamber */}
          <rect className="blg-gb-slide" x="150" y="228" width="340" height="14" rx="3" />
          <rect className="blg-gb-para" x="168" y="214" width="128" height="14" />
          <rect className="blg-gb-para" x="344" y="214" width="128" height="14" />
          <rect className={'blg-gb-tissue' + (st >= 4 ? ' gel' : '')} x="300" y="206" width="40" height="22" rx="2" />
          {/* polymerised glow only once O2 ~ 0 */}
          {st === 4 && <ellipse className="blg-gb-glow" cx="320" cy="217" rx="46" ry="20" />}
          {st >= 3 && <rect className="blg-gb-cover" x="296" y="200" width="48" height="5" rx="2" />}

          {/* dimension callouts (build stage) */}
          {st === 0 && (
            <g className="blg-gb-dim">
              <text x="232" y="206" textAnchor="middle">{t.dim45}</text>
              <text x="320" y="262" textAnchor="middle">{t.dimGap}</text>
              <line x1="296" y1="248" x2="344" y2="248" />
              <text x="506" y="224" textAnchor="start">{t.dim02}</text>
            </g>
          )}

          {/* pipette + cast (mix stage) */}
          {st === 3 && (
            <g className="blg-gb-pip">
              <rect x="312" y="70" width="16" height="80" rx="3" />
              <polygon points="312,150 328,150 322,168 318,168" />
              <circle className="blg-gb-drop" cx="320" cy="186" r="6" />
              <text className="blg-gb-cap" x="320" y="60" textAnchor="middle">{t.pipCap}</text>
            </g>
          )}

          {/* polymerise readouts */}
          {st === 4 && (
            <g className="blg-gb-read">
              <text x="320" y="70" textAnchor="middle">{t.readout}</text>
            </g>
          )}

          {/* O2 meter */}
          <g className="blg-gb-meter">
            <rect x="582" y="60" width="18" height="220" rx="4" className="track" />
            <rect x="582" y={60 + (1 - o2) * 220} width="18" height={o2 * 220} rx="4" className={'fill' + (o2 <= 0.12 ? ' low' : '')} />
            <text x="591" y="52" textAnchor="middle">O₂</text>
            <text x="591" y="296" textAnchor="middle">{Math.round(o2 * 100)}%</text>
          </g>
        </svg>

        <div className="blg-ec-dots" role="tablist" aria-label={t.dotsAria}>
          {STAGES.map((s, i) => (
            <button key={i} role="tab" aria-selected={i === st} aria-current={i === st ? 'step' : undefined} className={'blg-ec-dot' + (i === st ? ' on' : '')} onClick={() => setSt(i)}><i /> {s.t}</button>
          ))}
        </div>
      </div>

      <div className="blg-viz-controls">
        <button className="blg-btn" onClick={() => setSt((s) => (s + 4) % 5)}>{t.prev}</button>
        <button className="blg-btn" onClick={() => setSt((s) => (s + 1) % 5)}>{t.next}</button>
        <button className="blg-btn" onClick={() => setSt(0)}>{t.reset}</button>
        <span className="blg-lp-hint">{t.hint}</span>
      </div>

      <figcaption><b>{t.capTitle}</b> {t.capBody}</figcaption>
    </figure>
  );
}

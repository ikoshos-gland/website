import React, { useState } from 'react';
import { useLang } from '../i18n/LanguageContext';

// The whole Chapter-3 protocol as one clickable pipeline, from two mouse brains
// to a reconstruction on a supercomputer. Steps 1-3 (through glove-box gelation)
// were actually done; 4-11 (denaturation onward) are the planned route. The
// divider between node 3 and 4 is the honesty boundary, made spatial.

const STR = {
  en: {
    railAria: 'protocol steps',
    optDone: ' (done)',
    optPlanned: ' (planned)',
    dDone: 'done',
    dPlan: 'planned',
    badgeDone: '● done',
    badgePlan: '○ planned',
    prev: '‹ Prev',
    next: 'Next ›',
    reset: '↻ Reset',
    hint: 'steps 1–3 were done at the bench · 4–11 are the planned route',
    capTitle: 'The protocol, end to end.',
    capBody: 'Eleven steps from two mouse brains to a reconstruction. Solid nodes (fix → anchor → glove-box gelation) are bench work actually completed; dashed nodes (denaturation through FFN agglomeration) are the planned path. The divider between step 3 and step 4 is the honesty boundary made spatial — click any step for its recipe.',
    steps: {
      1: { short: 'Fix', title: 'Fixation & sectioning', role: 'lock the molecular architecture in place', recipe: ['4% PFA transcardial perfusion', 'post-fix overnight, +4 °C', '100 mM glycine, 6 h (quench aldehydes)', 'VT1000S vibratome: 50 µm ×10, 100 µm ×10', 'store 1× PBS + 0.015% NaN₃, +4 °C'] },
      2: { short: 'Anchor', title: 'AcX incubation — the anchor', role: 'give every protein a handle for the gel', recipe: ['AcX 10 mg/mL in anhydrous DMSO', 'diluted 1:200 in MES buffer (pH 6)', 'overnight, 4 °C'] },
      3: { short: 'Gelate', title: 'Glove-box gelation', role: 'cast the swellable mesh, oxygen-free', recipe: ['gel: 0.522 g SA + 7.5 µl TEMED + 900 µl DMAA', 'N₂ sparge ~50 s · glove-box purge ×3', '411 µl gel + 4 µl KPS · 50 µl per sample', 'polymerise dark, ~24 °C, 16–20 h'] },
      4: { short: 'Denature', title: 'Denaturation', role: 'soften so the gel can swell evenly', recipe: ['5% SDS, 200 mM NaCl, 50 mM Tris pH 8', '+10 mg DTT per mL', '95 °C, 1 h · wash 2× PBS, 15 min'] },
      5: { short: 'Stain', title: 'Staining', role: 'label protein density wholesale', recipe: ['Alexa Fluor 488 NHS-ester, 1:50 in PBS', 'overnight 12–24 h, 4 °C'] },
      6: { short: 'Expand', title: 'Expansion', role: 'drink water, swell ~20×', recipe: ['≥10 mL ddH₂O · DAPI in the first water', '20 min, no shaking · exchange ×3–5', 'full swell ≈ 20×'] },
      7: { short: 'Image', title: 'Imaging', role: 'read the swollen tissue out', recipe: ['IXplore IX85 SR + LUPLAPO25XS', 'LEICA SP8 to compare LSCM vs SDCM', 'export n5 / TIFF / zarr / wk'] },
      8: { short: 'CLAHE', title: 'CLAHE contrast', role: 'lift faint structure from background', recipe: ['numpy.clip → 120–350', 'equalize_adapthist, clip_limit 0.03', '×255 → uint8'] },
      9: { short: 'Montage', title: 'SOFIMA montaging', role: 'stitch overlapping tiles seamlessly', recipe: ['coarse: masked cross-correlation → 1 offset / pair', 'fine: 120×120 px optical-flow springs', 'trim 50 px → common canvas'] },
      10: { short: 'Segment', title: 'FFN segmentation', role: 'trace every neurite through the volume', recipe: ['FoV 33×33×33 voxels', 'base pass minimises merge errors (over-split)', 'TRUBA Akya HPC · V100 GPUs'] },
      11: { short: 'Agglom.', title: 'Agglomeration', role: 'fragments back into whole neurons', recipe: ['resegmentation.py + segment_recovery_fraction'] },
    },
  },
  tr: {
    railAria: 'protokol adımları',
    optDone: ' (tamamlandı)',
    optPlanned: ' (planlanan)',
    dDone: 'tamamlandı',
    dPlan: 'planlanan',
    badgeDone: '● tamamlandı',
    badgePlan: '○ planlanan',
    prev: '‹ Önceki',
    next: 'Sonraki ›',
    reset: '↻ Sıfırla',
    hint: 'adım 1–3 laboratuvarda yapıldı · 4–11 planlanan rota',
    capTitle: 'Protokol, baştan sona.',
    capBody: 'İki fare beyninden bir rekonstrüksiyona uzanan on bir adım. Dolu düğümler (fiksasyon → ankraj → glove-box jelasyonu) gerçekten tamamlanmış laboratuvar işidir; kesik çizgili düğümler (denatürasyondan FFN aglomerasyonuna) planlanan yoldur. Adım 3 ile adım 4 arasındaki ayraç, mekânsallaştırılmış dürüstlük sınırıdır — herhangi bir adıma tıklayarak reçetesini görün.',
    steps: {
      1: { short: 'Fiksasyon', title: 'Fiksasyon ve kesit alma', role: 'moleküler mimariyi yerinde sabitle', recipe: ['%4 PFA transkardiyak perfüzyon', 'gece boyu post-fiksasyon, +4 °C', '100 mM glisin, 6 sa (aldehitleri söndür)', 'VT1000S vibratom: 50 µm ×10, 100 µm ×10', '1× PBS + %0.015 NaN₃ içinde sakla, +4 °C'] },
      2: { short: 'Ankraj', title: 'AcX inkübasyonu — ankraj', role: 'her proteine jel için bir tutamak ver', recipe: ['susuz DMSO içinde AcX 10 mg/mL', 'MES tamponunda 1:200 seyreltilmiş (pH 6)', 'gece boyu, 4 °C'] },
      3: { short: 'Jelasyon', title: 'Glove-box jelasyonu', role: 'şişebilen ağı oksijensiz ortamda dök', recipe: ['jel: 0.522 g SA + 7.5 µl TEMED + 900 µl DMAA', 'N₂ ile köpürtme ~50 s · glove-box temizleme ×3', '411 µl jel + 4 µl KPS · örnek başına 50 µl', 'karanlıkta polimerize et, ~24 °C, 16–20 sa'] },
      4: { short: 'Denatürasyon', title: 'Denatürasyon', role: 'jelin eşit şişebilmesi için yumuşat', recipe: ['%5 SDS, 200 mM NaCl, 50 mM Tris pH 8', 'mL başına +10 mg DTT', '95 °C, 1 sa · 2× PBS ile yıka, 15 dk'] },
      5: { short: 'Boyama', title: 'Boyama', role: 'protein yoğunluğunu toptan işaretle', recipe: ['Alexa Fluor 488 NHS-ester, PBS içinde 1:50', 'gece boyu 12–24 sa, 4 °C'] },
      6: { short: 'Genleşme', title: 'Genleşme', role: 'su çek, ~20× şiş', recipe: ['≥10 mL ddH₂O · ilk suda DAPI', '20 dk, çalkalamadan · ×3–5 değiştir', 'tam şişme ≈ 20×'] },
      7: { short: 'Görüntüleme', title: 'Görüntüleme', role: 'şişmiş dokuyu oku', recipe: ['IXplore IX85 SR + LUPLAPO25XS', 'LSCM ile SDCM kıyaslamak için LEICA SP8', 'n5 / TIFF / zarr / wk olarak dışa aktar'] },
      8: { short: 'CLAHE', title: 'CLAHE kontrastı', role: 'soluk yapıyı arka plandan kaldır', recipe: ['numpy.clip → 120–350', 'equalize_adapthist, clip_limit 0.03', '×255 → uint8'] },
      9: { short: 'Montaj', title: 'SOFIMA montajı', role: 'örtüşen karoları kusursuz birleştir', recipe: ['kaba: maskeli çapraz korelasyon → çift başına 1 ofset', 'ince: 120×120 px optik-akış yayları', '50 px kırp → ortak tuval'] },
      10: { short: 'Segment.', title: 'FFN segmentasyonu', role: 'her nöriti hacim boyunca izle', recipe: ['FoV 33×33×33 voksel', 'temel geçiş birleşme hatalarını en aza indirir (aşırı bölme)', 'TRUBA Akya HPC · V100 GPU’ları'] },
      11: { short: 'Aglom.', title: 'Aglomerasyon', role: 'parçaları yeniden bütün nöronlara birleştir', recipe: ['resegmentation.py + segment_recovery_fraction'] },
    },
  },
  de: {
    railAria: 'Protokollschritte',
    optDone: ' (erledigt)',
    optPlanned: ' (geplant)',
    dDone: 'erledigt',
    dPlan: 'geplant',
    badgeDone: '● erledigt',
    badgePlan: '○ geplant',
    prev: '‹ Zurück',
    next: 'Weiter ›',
    reset: '↻ Zurücksetzen',
    hint: 'Schritte 1–3 wurden im Labor durchgeführt · 4–11 sind der geplante Weg',
    capTitle: 'Das Protokoll, von Anfang bis Ende.',
    capBody: 'Elf Schritte von zwei Mäusehirnen bis zur Rekonstruktion. Durchgezogene Knoten (Fixierung → Verankerung → Glovebox-Gelierung) sind tatsächlich abgeschlossene Laborarbeit; gestrichelte Knoten (Denaturierung bis FFN-Agglomeration) sind der geplante Weg. Der Trenner zwischen Schritt 3 und Schritt 4 ist die räumlich gemachte Ehrlichkeitsgrenze — klicken Sie auf einen beliebigen Schritt für sein Rezept.',
    steps: {
      1: { short: 'Fixierung', title: 'Fixierung & Schnittpräparation', role: 'die molekulare Architektur an Ort und Stelle fixieren', recipe: ['4% PFA transkardiale Perfusion', 'Nachfixierung über Nacht, +4 °C', '100 mM Glycin, 6 h (Aldehyde abfangen)', 'VT1000S-Vibratom: 50 µm ×10, 100 µm ×10', 'in 1× PBS + 0,015% NaN₃ lagern, +4 °C'] },
      2: { short: 'Verankerung', title: 'AcX-Inkubation — die Verankerung', role: 'jedem Protein einen Griff für das Gel geben', recipe: ['AcX 10 mg/mL in wasserfreiem DMSO', '1:200 in MES-Puffer verdünnt (pH 6)', 'über Nacht, 4 °C'] },
      3: { short: 'Gelierung', title: 'Glovebox-Gelierung', role: 'das quellbare Netz sauerstofffrei gießen', recipe: ['Gel: 0,522 g SA + 7,5 µl TEMED + 900 µl DMAA', 'N₂-Begasung ~50 s · Glovebox-Spülung ×3', '411 µl Gel + 4 µl KPS · 50 µl pro Probe', 'im Dunkeln polymerisieren, ~24 °C, 16–20 h'] },
      4: { short: 'Denaturierung', title: 'Denaturierung', role: 'erweichen, damit das Gel gleichmäßig quellen kann', recipe: ['5% SDS, 200 mM NaCl, 50 mM Tris pH 8', '+10 mg DTT pro mL', '95 °C, 1 h · 2× PBS waschen, 15 min'] },
      5: { short: 'Färbung', title: 'Färbung', role: 'die Proteindichte pauschal markieren', recipe: ['Alexa Fluor 488 NHS-Ester, 1:50 in PBS', 'über Nacht 12–24 h, 4 °C'] },
      6: { short: 'Expansion', title: 'Expansion', role: 'Wasser aufnehmen, ~20× quellen', recipe: ['≥10 mL ddH₂O · DAPI im ersten Wasser', '20 min, ohne Schütteln · ×3–5 wechseln', 'volle Quellung ≈ 20×'] },
      7: { short: 'Bildgebung', title: 'Bildgebung', role: 'das gequollene Gewebe auslesen', recipe: ['IXplore IX85 SR + LUPLAPO25XS', 'LEICA SP8 zum Vergleich von LSCM und SDCM', 'als n5 / TIFF / zarr / wk exportieren'] },
      8: { short: 'CLAHE', title: 'CLAHE-Kontrast', role: 'schwache Strukturen vom Hintergrund abheben', recipe: ['numpy.clip → 120–350', 'equalize_adapthist, clip_limit 0,03', '×255 → uint8'] },
      9: { short: 'Montage', title: 'SOFIMA-Montage', role: 'überlappende Kacheln nahtlos zusammenfügen', recipe: ['grob: maskierte Kreuzkorrelation → 1 Offset / Paar', 'fein: 120×120 px Optical-Flow-Federn', '50 px beschneiden → gemeinsame Leinwand'] },
      10: { short: 'Segment.', title: 'FFN-Segmentierung', role: 'jeden Neuriten durch das Volumen verfolgen', recipe: ['FoV 33×33×33 Voxel', 'Basisdurchlauf minimiert Verschmelzungsfehler (Übersegmentierung)', 'TRUBA Akya HPC · V100-GPUs'] },
      11: { short: 'Agglom.', title: 'Agglomeration', role: 'Fragmente zurück zu ganzen Neuronen', recipe: ['resegmentation.py + segment_recovery_fraction'] },
    },
  },
};

const STEP_NS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;

export default function LabPipeline() {
  const t = STR[useLang().lang] || STR.en;
  const [sel, setSel] = useState(3);
  const step = t.steps[sel as keyof typeof t.steps];
  const done = sel <= 3;

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') { setSel((s) => Math.min(11, s + 1)); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { setSel((s) => Math.max(1, s - 1)); e.preventDefault(); }
  };

  return (
    <figure className="blg-viz">
      <div className="blg-viz-stage">
        <div className="blg-lp-rail" role="listbox" aria-label={t.railAria} aria-activedescendant={'lp-' + sel} onKeyDown={onKey} tabIndex={0}>
          {STEP_NS.map((n, i) => {
            const s = t.steps[n];
            return (
              <React.Fragment key={n}>
                {i === 3 && (
                  <div className="blg-lp-divider" aria-hidden="true">
                    <span className="d-done">{t.dDone}</span>
                    <span className="d-line" />
                    <span className="d-plan">{t.dPlan}</span>
                  </div>
                )}
                <button id={'lp-' + n} role="option" aria-selected={sel === n} className={'blg-lp-node' + (n <= 3 ? ' done' : ' plan') + (sel === n ? ' sel' : '')} onClick={() => setSel(n)} aria-label={n + '. ' + s.title + (n <= 3 ? t.optDone : t.optPlanned)}>
                  <span className="dot">{n <= 3 ? '✓' : n}</span>
                  <span className="lbl">{s.short}</span>
                </button>
              </React.Fragment>
            );
          })}
        </div>

        <div className="blg-lp-panel">
          <div className="hd">
            <span className={'badge ' + (done ? 'done' : 'plan')}>{done ? t.badgeDone : t.badgePlan}</span>
            <b>{sel}. {step.title}</b>
          </div>
          <p className="role">{step.role}</p>
          <ul className="recipe">{step.recipe.map((r, i) => <li key={i}>{r}</li>)}</ul>
        </div>
      </div>

      <div className="blg-viz-controls">
        <button className="blg-btn" onClick={() => setSel((s) => Math.max(1, s - 1))}>{t.prev}</button>
        <button className="blg-btn" onClick={() => setSel((s) => Math.min(11, s + 1))}>{t.next}</button>
        <button className="blg-btn" onClick={() => setSel(3)}>{t.reset}</button>
        <span className="blg-lp-hint">{t.hint}</span>
      </div>

      <figcaption><b>{t.capTitle}</b> {t.capBody}</figcaption>
    </figure>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { useLang } from '../i18n/LanguageContext';

// The data wall. Neuron/cell count on a log axis (so H01 is honestly SHORTER
// than FlyWire), but the climax is the data shock: half a grain of rice of
// human cortex overflows into 1.4 petabytes.

type Milestone = {
  year: string; name: string; neurons: number; syn: number; synLabel: string; note: string; h01?: boolean;
};
const M: Milestone[] = [
  { year: '1986', name: 'C. elegans', neurons: 302, syn: 7000, synLabel: '~7,000 connections', note: 'first complete connectome · 1 mm worm' },
  { year: '2013', name: 'Retina (IPL)', neurons: 950, syn: 580000, synLabel: '~580,000 contacts', note: 'synapses estimated from contact area' },
  { year: '2020', name: 'Fly hemibrain', neurons: 25000, syn: 20000000, synLabel: '~20M synapses', note: 'ML segmentation enters' },
  { year: '2024', name: 'FlyWire', neurons: 139255, syn: 54500000, synLabel: '54.5M synapses', note: 'whole adult fly brain' },
  { year: 'H01', name: 'Human cortex', neurons: 57000, syn: 150000000, synLabel: '150M synapses', note: '~1 mm³ · half a grain of rice', h01: true },
];

const STR = {
  en: {
    chartAria: 'Connectomics milestones by neuron count on a log scale, from 302 to 139,255, with H01 carrying a 1.4 petabyte data shock.',
    axis: 'neurons / cells (log scale)',
    rowNeurons: 'neurons / cells',
    rowSynapses: 'synapses',
    leadPre: '…yet that',
    leadStrong: 'half-rice-grain',
    leadPost: 'of cortex overflows into',
    petabyte: 'PETABYTE',
    days: ' · 326 days just to image',
    capTitle: 'From one worm to half a rice grain.',
    capBody1: "Neuron counts climb (302 → 139,255) but don't even rise monotonically — H01's ~57,000 cells sit",
    capBelow: 'below',
    capBody2: "FlyWire's. The real shock isn't the count; it's that ~1 mm³ of human cortex is",
    capPetabyte: '1.4 petabytes',
    capBody3: '. Click a milestone.',
    names: ['C. elegans', 'Retina (IPL)', 'Fly hemibrain', 'FlyWire', 'Human cortex'],
    synLabels: ['~7,000 connections', '~580,000 contacts', '~20M synapses', '54.5M synapses', '150M synapses'],
    notes: [
      'first complete connectome · 1 mm worm',
      'synapses estimated from contact area',
      'ML segmentation enters',
      'whole adult fly brain',
      '~1 mm³ · half a grain of rice',
    ],
  },
  tr: {
    chartAria: 'Konnektomik kilometre taşları, nöron sayısına göre logaritmik ölçekte, 302’den 139.255’e; H01 ise 1,4 petabaytlık veri şokunu taşıyor.',
    axis: 'nöron / hücre (log ölçek)',
    rowNeurons: 'nöron / hücre',
    rowSynapses: 'sinaps',
    leadPre: '…yine de korteksin o',
    leadStrong: 'yarım pirinç tanesi',
    leadPost: 'kadarı şuna taşar:',
    petabyte: 'PETABAYT',
    days: ' · yalnızca görüntülemek için 326 gün',
    capTitle: 'Bir solucandan yarım pirinç tanesine.',
    capBody1: 'Nöron sayıları tırmanıyor (302 → 139.255) ama tekdüze (monoton) bile artmıyor — H01’in ~57.000 hücresi FlyWire’ınkinin',
    capBelow: 'altında',
    capBody2: 'kalıyor. Asıl şok sayı değil; insan korteksinin ~1 mm³’ünün',
    capPetabyte: '1,4 petabayt',
    capBody3: 'olması. Bir kilometre taşına tıklayın.',
    names: ['C. elegans', 'Retina (IPL)', 'Sinek hemibrain', 'FlyWire', 'İnsan korteksi'],
    synLabels: ['~7.000 bağlantı', '~580.000 temas', '~20M sinaps', '54,5M sinaps', '150M sinaps'],
    notes: [
      'ilk tam konnektom · 1 mm’lik solucan',
      'sinapslar temas alanından tahmin edildi',
      'ML segmentasyonu sahneye giriyor',
      'tüm yetişkin sinek beyni',
      '~1 mm³ · yarım pirinç tanesi',
    ],
  },
  de: {
    chartAria: 'Meilensteine der Konnektomik nach Neuronenzahl auf logarithmischer Skala, von 302 bis 139.255, wobei H01 einen Datenschock von 1,4 Petabyte trägt.',
    axis: 'Neuronen / Zellen (log. Skala)',
    rowNeurons: 'Neuronen / Zellen',
    rowSynapses: 'Synapsen',
    leadPre: '…und doch quillt dieses',
    leadStrong: 'halbe Reiskorn',
    leadPost: 'an Kortex über zu',
    petabyte: 'PETABYTE',
    days: ' · 326 Tage allein zum Bildgeben',
    capTitle: 'Von einem Wurm zum halben Reiskorn.',
    capBody1: 'Die Neuronenzahlen steigen (302 → 139.255), aber nicht einmal monoton — die ~57.000 Zellen von H01 liegen',
    capBelow: 'unter',
    capBody2: 'denen von FlyWire. Der wahre Schock ist nicht die Zahl, sondern dass ~1 mm³ menschlicher Kortex',
    capPetabyte: '1,4 Petabyte',
    capBody3: 'sind. Klicken Sie auf einen Meilenstein.',
    names: ['C. elegans', 'Retina (IPL)', 'Fliegen-Hemibrain', 'FlyWire', 'Menschlicher Kortex'],
    synLabels: ['~7.000 Verbindungen', '~580.000 Kontakte', '~20M Synapsen', '54,5M Synapsen', '150M Synapsen'],
    notes: [
      'erstes vollständiges Konnektom · 1-mm-Wurm',
      'Synapsen aus Kontaktfläche geschätzt',
      'ML-Segmentierung tritt ein',
      'ganzes adultes Fliegengehirn',
      '~1 mm³ · halbes Reiskorn',
    ],
  },
};

const minLog = Math.log10(302), maxLog = Math.log10(139255);
const barH = (n: number) => 16 + ((Math.log10(n) - minLog) / (maxLog - minLog)) * 132;
const fmt = (n: number) => n.toLocaleString('en-US');

export default function ScaleEscalation() {
  const t = STR[useLang().lang] || STR.en;
  const [sel, setSel] = useState(4);
  const [disp, setDisp] = useState(M[4].syn);
  const reduced = useRef(false);
  const raf = useRef<number | undefined>(undefined);

  useEffect(() => { reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches; }, []);

  useEffect(() => {
    const target = M[sel].syn;
    if (reduced.current) { setDisp(target); return; }
    const start = disp, t0 = performance.now(), dur = 900;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      setDisp(Math.round(start + (target - start) * e));
      if (k < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel]);

  const m = M[sel];
  return (
    <figure className="blg-viz">
      <div className="blg-viz-stage">
        <div className="blg-sc-chart" role="img" aria-label={t.chartAria}>
          {M.map((d, i) => (
            <button key={i} className={'blg-sc-bar' + (i === sel ? ' sel' : '') + (d.h01 ? ' h01' : '')} onClick={() => setSel(i)} aria-label={t.names[i]}>
              <span className="cnt">{d.neurons >= 1000 ? Math.round(d.neurons / 1000) + 'k' : d.neurons}</span>
              <span className="bar" style={{ height: barH(d.neurons) + 'px' }} />
              <span className="yr">{d.year}</span>
            </button>
          ))}
        </div>
        <div className="blg-sc-axis">{t.axis}</div>

        <div className="blg-sc-card">
          <div className="hd"><b>{t.names[sel]}</b><span>{m.year}</span></div>
          <div className="rows">
            <span><i>{t.rowNeurons}</i>{fmt(m.neurons)}</span>
            <span><i>{t.rowSynapses}</i>{fmt(disp)}</span>
            <span className="note">{t.notes[sel]}</span>
          </div>
        </div>

        {m.h01 && (
          <div className="blg-sc-wall">
            <div className="lead">{t.leadPre} <b>{t.leadStrong}</b> {t.leadPost}</div>
            <div className="big"><span className="pb">1.4</span> {t.petabyte}<span className="days">{t.days}</span></div>
            <div className="tiles">{Array.from({ length: 48 }, (_, i) => <span key={i} className={'t' + (i % 7 === 0 ? ' hot' : '')} style={{ animationDelay: (i * 22) + 'ms' }} />)}</div>
          </div>
        )}
      </div>
      <figcaption><b>{t.capTitle}</b> {t.capBody1} <i>{t.capBelow}</i> {t.capBody2} <b>{t.capPetabyte}</b>{t.capBody3}</figcaption>
    </figure>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { useLang } from '../i18n/LanguageContext';

// "Which queue do you stand in?" — a small squeue/sinfo board. Pick a partition
// and watch where your job lands: instant R on debug, days of PD on a full
// akya-cuda. Drives home why you iterate on debug and let the real run wait.

type Part = 'akya-cuda' | 'debug' | 'hamsi';

type Def = {
  key: Part;
  nodes: number;   // total nodes drawn
  busy: number;    // occupied nodes
  drain?: number;  // draining nodes (count from the end)
  kind: 'gpu' | 'cpu';
  start: Record<'en' | 'tr' | 'de', string>; // what happens when you submit here
  state: 'R' | 'PD';
};

const PARTS: Def[] = [
  { key: 'akya-cuda', nodes: 16, busy: 15, drain: 1, kind: 'gpu', state: 'PD',
    start: { en: 'PD · est. start in ~5 days', tr: 'PD · tahmini başlangıç ~5 gün', de: 'PD · geschätzter Start in ~5 Tagen' } },
  { key: 'debug', nodes: 8, busy: 2, kind: 'gpu', state: 'R',
    start: { en: 'R · starts in ~2 min (max 4 h)', tr: 'R · ~2 dk’da başlar (maks 4 sa)', de: 'R · startet in ~2 Min (max 4 h)' } },
  { key: 'hamsi', nodes: 12, busy: 5, kind: 'cpu', state: 'R',
    start: { en: 'R · CPU only, long jobs welcome', tr: 'R · sadece CPU, uzun işlere uygun', de: 'R · nur CPU, lange Jobs willkommen' } },
];

const STR = {
  en: {
    title: 'squeue: pick a line to stand in',
    submit: 'submit here',
    gpu: 'GPU', cpu: 'CPU',
    free: 'free', full: 'full',
    hint: 'akya-cuda is where the real training runs — and where you wait. debug barely has a line.',
    picked: (p: string) => `You submitted to ${p}.`,
    capA: 'The GPU queue', capB: 'is contended on a national cluster — a full', capC: 'can mean a multi-day wait. So I smoke-test everything on', capD: 'and only the long real run waits its turn on', capE: '.',
  },
  tr: {
    title: 'squeue: hangi sıraya gireceksin?',
    submit: 'buraya gönder',
    gpu: 'GPU', cpu: 'CPU',
    free: 'boş', full: 'dolu',
    hint: 'Gerçek eğitim akya-cuda’da koşar — ve orada beklersin. debug’ta neredeyse sıra yok.',
    picked: (p: string) => `${p} kuyruğuna gönderdin.`,
    capA: 'GPU kuyruğu', capB: 'ulusal bir kümede rekabetlidir — dolu bir', capC: 'günlerce bekleme demek olabilir. O yüzden her şeyi', capD: '’ta denerim ve yalnızca uzun gerçek koşu', capE: '’da sırasını bekler.',
  },
  de: {
    title: 'squeue: in welcher Schlange stehst du?',
    submit: 'hier abschicken',
    gpu: 'GPU', cpu: 'CPU',
    free: 'frei', full: 'voll',
    hint: 'Auf akya-cuda läuft das echte Training — und da wartest du. debug hat kaum eine Schlange.',
    picked: (p: string) => `Du hast an ${p} abgeschickt.`,
    capA: 'Die GPU-Queue', capB: 'ist auf einem nationalen Cluster umkämpft — ein volles', capC: 'kann Tage Wartezeit bedeuten. Also teste ich alles auf', capD: 'und nur der lange echte Lauf wartet auf', capE: '.',
  },
};

export default function PartitionQueue() {
  const lang = (useLang().lang || 'en') as 'en' | 'tr' | 'de';
  const t = STR[lang];
  const [picked, setPicked] = useState<Part | null>(null);
  const reduced = useRef(false);
  useEffect(() => { reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches; }, []);

  return (
    <figure className="blg-pq">
      <div className="blg-pq-board">
        <div className="blg-pq-title">{t.title}</div>
        {PARTS.map((p) => {
          const free = p.nodes - p.busy - (p.drain || 0);
          const on = picked === p.key;
          return (
            <div key={p.key} className={'blg-pq-row' + (on ? ' on' : '') + (p.state === 'R' ? ' ok' : ' wait')}>
              <div className="blg-pq-head">
                <b>{p.key}</b>
                <span className={'blg-pq-kind ' + p.kind}>{p.kind === 'gpu' ? t.gpu : t.cpu}</span>
              </div>
              <div className="blg-pq-nodes" aria-hidden="true">
                {Array.from({ length: p.nodes }, (_, i) => {
                  const state = i < p.busy ? 'busy' : i < p.busy + (p.drain || 0) ? 'drain' : 'free';
                  return <span key={i} className={'nd ' + state} />;
                })}
              </div>
              <div className="blg-pq-foot">
                <span className="blg-pq-occ">{free > 0 ? `${free} ${t.free}` : t.full}</span>
                <button className="blg-btn" onClick={() => setPicked(p.key)}>▸ {t.submit}</button>
              </div>
              {on && (
                <div className={'blg-pq-job ' + (p.state === 'R' ? 'run' : 'pend')}>
                  <span className="tok" /> {t.picked(p.key)} <b>{p.start[lang]}</b>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <figcaption>
        <b>{t.capA}</b> {t.capB} <code>akya-cuda</code> {t.capC} <code>debug</code> {t.capD} <code>akya-cuda</code>{t.capE}
      </figcaption>
    </figure>
  );
}

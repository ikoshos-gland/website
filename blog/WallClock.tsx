import React, { useEffect, useRef, useState } from 'react';
import { useLang } from '../i18n/LanguageContext';

// The --time guillotine. Your job needs a fixed amount of wall-clock to finish.
// Set the budget too low and SLURM kills it mid-step (TIMEOUT); set it high
// enough and it COMPLETES. This is the compute_partitions timeout, made tactile.

const NEEDED = 270; // minutes the job actually needs (~4.5 h)
const MIN = 30, MAX = 360, STEP = 15;

const fmt = (m: number) => {
  const h = Math.floor(m / 60), mm = m % 60;
  return h ? `${h}h${mm ? ' ' + mm + 'm' : ''}` : `${mm}m`;
};

const STR = {
  en: {
    label: '--time budget',
    run: 'run job',
    running: 'running…',
    needLbl: 'job needs',
    done: 'COMPLETED',
    killed: 'TIMEOUT,killed mid-step',
    idle: 'set a budget, then run',
    capA: 'SLURM kills your job the instant it passes',
    capB: ', no mercy, mid-step. My',
    capC: 'prep needed ~4.5 h but I asked for 40 minutes, so it died at the mark. Give it honest headroom.',
  },
  tr: {
    label: '--time bütçesi',
    run: 'işi çalıştır',
    running: 'çalışıyor…',
    needLbl: 'işin ihtiyacı',
    done: 'TAMAMLANDI',
    killed: 'TIMEOUT,adımın ortasında öldürüldü',
    idle: 'bir bütçe seç, sonra çalıştır',
    capA: 'SLURM işini',
    capB: '’ı geçtiği an öldürür,acımadan, adımın ortasında.',
    capC: 'prep’im ~4,5 sa istiyordu ama ben 40 dk istemiştim, o yüzden çizgide öldü. Dürüst bir pay bırak.',
  },
  de: {
    label: '--time-Budget',
    run: 'Job starten',
    running: 'läuft…',
    needLbl: 'Job braucht',
    done: 'ABGESCHLOSSEN',
    killed: 'TIMEOUT,mitten im Schritt beendet',
    idle: 'Budget setzen, dann starten',
    capA: 'SLURM beendet deinen Job, sobald er',
    capB: 'überschreitet,gnadenlos, mitten im Schritt. Mein',
    capC: 'Prep brauchte ~4,5 h, ich bat aber um 40 Minuten,also starb er an der Marke. Gib ehrlichen Puffer.',
  },
};

type Status = 'idle' | 'run' | 'done' | 'killed';

export default function WallClock() {
  const lang = (useLang().lang || 'en') as 'en' | 'tr' | 'de';
  const t = STR[lang];
  const [budget, setBudget] = useState(40);
  const [status, setStatus] = useState<Status>('idle');
  const [pct, setPct] = useState(0);
  const raf = useRef<number | undefined>(undefined);
  const reduced = useRef(false);
  useEffect(() => { reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches; }, []);
  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current); }, []);

  const survives = budget >= NEEDED;
  const cap = Math.min(1, budget / NEEDED); // progress fraction reached if killed

  const run = () => {
    if (raf.current) cancelAnimationFrame(raf.current);
    const target = survives ? 1 : cap;
    if (reduced.current) { setPct(target * 100); setStatus(survives ? 'done' : 'killed'); return; }
    setStatus('run'); setPct(0);
    const t0 = performance.now(), dur = 1500;
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      setPct(target * k * 100);
      if (k < 1) { raf.current = requestAnimationFrame(tick); }
      else setStatus(survives ? 'done' : 'killed');
    };
    raf.current = requestAnimationFrame(tick);
  };

  const deadlineLeft = Math.min(100, (budget / NEEDED) * 100);

  return (
    <figure className="blg-wc">
      <div className="blg-wc-stage">
        <div className="blg-wc-track">
          <div className={'blg-wc-fill ' + status} style={{ width: pct + '%' }} />
          {/* the guillotine: where --time cuts, relative to needed work */}
          {budget < NEEDED && (
            <div className="blg-wc-dead" style={{ left: deadlineLeft + '%' }}>
              <span className="blade" /><span className="lbl">--time</span>
            </div>
          )}
          <span className="blg-wc-need">{t.needLbl} · {fmt(NEEDED)}</span>
        </div>

        <div className="blg-wc-ctl">
          <label>{t.label}<b>{fmt(budget)}</b></label>
          <input type="range" min={MIN} max={MAX} step={STEP} value={budget}
            onChange={(e) => { setBudget(+e.target.value); setStatus('idle'); setPct(0); }} />
          <button className="blg-btn" onClick={run} disabled={status === 'run'}>▸ {status === 'run' ? t.running : t.run}</button>
        </div>

        <div className={'blg-wc-status ' + status}>
          {status === 'idle' && t.idle}
          {status === 'run' && t.running}
          {status === 'done' && '✓ ' + t.done}
          {status === 'killed' && '✕ ' + t.killed}
        </div>
      </div>
      <figcaption>
        <b>{t.capA}</b> <code>--time</code> {t.capB} <code>compute_partitions</code> {t.capC}
      </figcaption>
    </figure>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { Laptop, Server, Cpu } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';

// An animated picture of what actually happens when you submit a SLURM job:
// the job hops laptop -> login node -> the queue (pending) -> a compute node
// (running, GPU glows). Loops on its own; the reader can re-fire it.

type Phase = 'idle' | 'ssh' | 'queue' | 'run' | 'done';

const CYCLE: Array<[Phase, number]> = [
  ['idle', 700],
  ['ssh', 1100],
  ['queue', 1400],
  ['run', 2200],
  ['done', 1500],
];
const LEFT: Record<Phase, number> = { idle: 12, ssh: 46, queue: 67, run: 85, done: 85 };

const STR = {
  en: {
    arrowSsh: 'SSH',
    arrowSlurm: 'SLURM',
    laptopTitle: 'your laptop',
    laptopSub: 'edit · ssh',
    loginTitle: 'login node',
    loginSub: 'arf-ui* · submit',
    gate: 'queue',
    computeTitle: 'compute node',
    computeSub: 'the GPUs',
    submit: 'Submit a job',
    statusIdle: 'idle',
    statusSsh: 'ssh · connecting',
    statusQueue: 'PD · pending in queue',
    statusRun: 'R · running',
    statusDone: 'completed',
    capBody1: 'You never run training on the login node — you hand the job to SLURM, it waits in the',
    capQueue: 'queue',
    capBody2: '(PD), then runs on a',
    capCompute: 'compute node',
    capBody3: '(R). Hit submit to send one through.',
  },
  tr: {
    arrowSsh: 'SSH',
    arrowSlurm: 'SLURM',
    laptopTitle: 'dizüstün',
    laptopSub: 'edit · ssh',
    loginTitle: 'login node',
    loginSub: 'arf-ui* · submit',
    gate: 'queue',
    computeTitle: 'compute node',
    computeSub: 'GPU\'lar',
    submit: 'İş gönder',
    statusIdle: 'idle',
    statusSsh: 'ssh · bağlanıyor',
    statusQueue: 'PD · queue\'da bekliyor',
    statusRun: 'R · çalışıyor',
    statusDone: 'tamamlandı',
    capBody1: 'Eğitimi asla login node üzerinde çalıştırmazsın — işi SLURM\'a verirsin, iş',
    capQueue: 'queue',
    capBody2: 'içinde bekler (PD), sonra bir',
    capCompute: 'compute node',
    capBody3: 'üzerinde çalışır (R). Bir tane göndermek için submit\'e bas.',
  },
  de: {
    arrowSsh: 'SSH',
    arrowSlurm: 'SLURM',
    laptopTitle: 'dein Laptop',
    laptopSub: 'edit · ssh',
    loginTitle: 'login node',
    loginSub: 'arf-ui* · submit',
    gate: 'queue',
    computeTitle: 'compute node',
    computeSub: 'die GPUs',
    submit: 'Job abschicken',
    statusIdle: 'idle',
    statusSsh: 'ssh · verbindet',
    statusQueue: 'PD · wartet in der queue',
    statusRun: 'R · läuft',
    statusDone: 'abgeschlossen',
    capBody1: 'Auf dem login node läufst du nie das Training — du übergibst den Job an SLURM, er wartet in der',
    capQueue: 'queue',
    capBody2: '(PD) und läuft dann auf einem',
    capCompute: 'compute node',
    capBody3: '(R). Klick auf Submit, um einen durchzuschicken.',
  },
};

export default function SlurmFlow() {
  const t = STR[useLang().lang] || STR.en;
  const STATUS: Record<Phase, string> = {
    idle: t.statusIdle,
    ssh: t.statusSsh,
    queue: t.statusQueue,
    run: t.statusRun,
    done: t.statusDone,
  };
  const [phase, setPhase] = useState<Phase>('idle');
  const timer = useRef<number | undefined>(undefined);
  const reduced = useRef(false);

  const stop = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = undefined;
  };

  const play = (i: number) => {
    const [ph, dur] = CYCLE[i % CYCLE.length];
    setPhase(ph);
    timer.current = window.setTimeout(() => play(i + 1), dur);
  };

  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced.current) {
      setPhase('run');
      return;
    }
    play(0);
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = () => {
    if (reduced.current) {
      setPhase('run');
      return;
    }
    stop();
    play(1); // (re)start from the SSH hop
  };

  const live = phase === 'run' || phase === 'done';

  return (
    <figure className="blg-slurmflow">
      <div className="blg-sf">
        <div className="blg-sf-rail">
          <div className="blg-sf-line" />
          <span className="blg-sf-arrow" style={{ left: '29%' }}>{t.arrowSsh}</span>
          <span className="blg-sf-arrow" style={{ left: '66%' }}>{t.arrowSlurm}</span>

          <div className={'blg-sf-node' + (phase === 'idle' ? ' active' : '')} style={{ left: '12%' }}>
            <span className="ic"><Laptop size={17} /></span>
            <b>{t.laptopTitle}</b>
            <small>{t.laptopSub}</small>
          </div>
          <div className={'blg-sf-node' + (phase === 'ssh' || phase === 'queue' ? ' active' : '')} style={{ left: '46%' }}>
            <span className="ic"><Server size={17} /></span>
            <b>{t.loginTitle}</b>
            <small>{t.loginSub}</small>
          </div>
          <div className="blg-sf-gate" style={{ left: '67%' }}>{t.gate}</div>
          <div className={'blg-sf-node gpu' + (live ? ' live' : '')} style={{ left: '85%' }}>
            <span className="ic"><Cpu size={17} /></span>
            <b>{t.computeTitle}</b>
            <small>{t.computeSub}</small>
          </div>

          <span
            className={
              'blg-sf-token' +
              (phase === 'idle' ? ' snap' : '') +
              (phase === 'queue' ? ' pending' : '') +
              (live ? ' hot' : '')
            }
            style={{ left: LEFT[phase] + '%' }}
          />
        </div>

        <div className="blg-sf-controls">
          <button className="blg-btn" onClick={submit}>▸ {t.submit}</button>
          <span className={'blg-sf-status s-' + phase}>{STATUS[phase]}</span>
        </div>
      </div>
      <figcaption>
        {t.capBody1} <b>{t.capQueue}</b> {t.capBody2} <b>{t.capCompute}</b> {t.capBody3}
      </figcaption>
    </figure>
  );
}

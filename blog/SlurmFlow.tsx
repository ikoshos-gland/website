import React, { useEffect, useRef, useState } from 'react';
import { Laptop, Server, Cpu } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';

// The life of a SLURM job, told in two layers at once: a mini terminal that
// types the real commands, and a stage where the job travels as a chip:
// laptop -> login node -> queue -> compute node. The story includes TRUBA's
// real rule: jobs run from /arf/scratch, not from home. The first sbatch
// attempt from ~ gets a warning annotation (SLURM itself would accept it,
// but the admins would not), the script moves to scratch, and only then does
// the job enter the queue. The queue actually drains: two jobs ahead of
// yours launch first, then yours runs (GPU bars + progress) and completes.

type Phase = 'idle' | 'ssh' | 'try' | 'warn' | 'mv' | 'sb2' | 'q3' | 'q2' | 'q1' | 'run' | 'done';

const CYCLE: Array<[Phase, number]> = [
  ['idle', 1000],
  ['ssh', 1500],
  ['try', 1500],
  ['warn', 1700],
  ['mv', 1900],
  ['sb2', 1500],
  ['q3', 1000],
  ['q2', 1000],
  ['q1', 1000],
  ['run', 2800],
  ['done', 2000],
];
const IDX = Object.fromEntries(CYCLE.map(([p], i) => [p, i])) as Record<Phase, number>;

// Horizontal position (%) of each actor per phase. While your job is still at
// the laptop / login node it rides below the card (DIP) so it never covers the
// label. During 'try' it noses toward the queue and gets bounced back on
// 'warn'; only after the move to scratch does it glide up onto the rail.
const YOU: Record<Phase, number> = { idle: 9, ssh: 34, try: 46, warn: 34, mv: 34, sb2: 34, q3: 53, q2: 63, q1: 73, run: 90, done: 90 };
const DIP: Record<Phase, number> = { idle: 48, ssh: 48, try: 48, warn: 48, mv: 48, sb2: 48, q3: 0, q2: 0, q1: 0, run: 0, done: 0 };
const GA: Record<Phase, number> = { idle: 63, ssh: 63, try: 63, warn: 63, mv: 63, sb2: 63, q3: 63, q2: 73, q1: 92, run: 92, done: 92 };
const GB: Record<Phase, number> = { idle: 73, ssh: 73, try: 73, warn: 73, mv: 73, sb2: 73, q3: 73, q2: 92, q1: 92, run: 92, done: 92 };

const STR = {
  en: {
    laptopTitle: 'your laptop',
    laptopSub: 'edit · ssh',
    loginTitle: 'login node',
    loginSub: 'arf-ui* · sbatch',
    gate: 'queue · PD',
    computeTitle: 'compute node',
    submit: 'Submit a job',
    warnLine: '⚠ home is for files — run jobs from scratch',
    status: {
      idle: 'idle',
      ssh: 'ssh · connecting',
      try: 'sbatch · from $HOME…',
      warn: '⚠ wrong place — use scratch',
      mv: 'moving the script to scratch',
      sb2: 'sbatch · from scratch',
      q3: 'PD · 2 jobs ahead',
      q2: 'PD · 1 job ahead',
      q1: 'PD · you are next',
      run: 'R · running on the GPU',
      done: 'COMPLETED ✓',
    },
    capBody1: 'You never run training on the login node and the job itself lives in',
    capScratch: 'scratch',
    capBody2: ', not home. SLURM takes it, it waits in the',
    capQueue: 'queue',
    capBody3: '(PD) behind other jobs, then runs on a',
    capCompute: 'compute node',
    capBody4: '(R). Hit submit to send one through.',
  },
  tr: {
    laptopTitle: 'dizüstün',
    laptopSub: 'edit · ssh',
    loginTitle: 'login node',
    loginSub: 'arf-ui* · sbatch',
    gate: 'queue · PD',
    computeTitle: 'compute node',
    submit: 'İş gönder',
    warnLine: '⚠ home dosyalar için — işi scratch\'tan çalıştır',
    status: {
      idle: 'boşta',
      ssh: 'ssh · bağlanıyor',
      try: 'sbatch · $HOME içinden…',
      warn: '⚠ yanlış yer — scratch kullan',
      mv: 'script scratch\'a taşınıyor',
      sb2: 'sbatch · scratch\'tan',
      q3: 'PD · önünde 2 iş var',
      q2: 'PD · önünde 1 iş var',
      q1: 'PD · sıra sende',
      run: 'R · GPU üzerinde çalışıyor',
      done: 'TAMAMLANDI ✓',
    },
    capBody1: 'Eğitimi asla login node üzerinde çalıştırmazsın ve işin kendisi',
    capScratch: 'scratch',
    capBody2: ' içinde yaşar, home\'da değil. SLURM işi alır, iş',
    capQueue: 'queue',
    capBody3: 'içinde diğer işlerin arkasında bekler (PD), sonra bir',
    capCompute: 'compute node',
    capBody4: 'üzerinde çalışır (R). Bir tane göndermek için submit\'e bas.',
  },
  de: {
    laptopTitle: 'dein Laptop',
    laptopSub: 'edit · ssh',
    loginTitle: 'login node',
    loginSub: 'arf-ui* · sbatch',
    gate: 'queue · PD',
    computeTitle: 'compute node',
    submit: 'Job abschicken',
    warnLine: '⚠ home ist für Dateien — Jobs laufen aus scratch',
    status: {
      idle: 'bereit',
      ssh: 'ssh · verbindet',
      try: 'sbatch · aus $HOME…',
      warn: '⚠ falscher Ort — nutz scratch',
      mv: 'Skript zieht nach scratch um',
      sb2: 'sbatch · aus scratch',
      q3: 'PD · 2 Jobs davor',
      q2: 'PD · 1 Job davor',
      q1: 'PD · du bist dran',
      run: 'R · läuft auf der GPU',
      done: 'ABGESCHLOSSEN ✓',
    },
    capBody1: 'Auf dem login node läufst du nie das Training und der Job selbst lebt in',
    capScratch: 'scratch',
    capBody2: ', nicht in home. SLURM nimmt ihn an, er wartet in der',
    capQueue: 'queue',
    capBody3: '(PD) hinter anderen Jobs und läuft dann auf einem',
    capCompute: 'compute node',
    capBody4: '(R). Klick auf Submit, um einen durchzuschicken.',
  },
};

export default function SlurmFlow() {
  const t = STR[useLang().lang] || STR.en;
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

  const i = IDX[phase];
  const inQ = i >= IDX.q3 && i <= IDX.q1;
  const live = phase === 'run';
  const done = phase === 'done';

  return (
    <figure className="blg-slurmflow">
      <div className="blg-sf">
        {/* Mini terminal: the same story, told in real commands. */}
        <div className="blg-sf-term" aria-hidden="true">
          <div className="ln">
            <span className="pr">[laptop ~]$&nbsp;</span>
            {i >= IDX.ssh
              ? <span className={'cmd' + (phase === 'ssh' ? ' typed t9' : '')}>ssh truba</span>
              : <span className="cur" />}
          </div>
          <div className="ln">
            {i >= IDX.try && (
              <>
                <span className="pr">[arf-ui1 ~]$&nbsp;</span>
                <span className={'cmd' + (phase === 'try' ? ' typed t18' : '')}>sbatch train.slurm</span>
              </>
            )}
            {i < IDX.try && <>&nbsp;</>}
          </div>
          <div className="ln">
            {i >= IDX.warn ? <span className="warn">{t.warnLine}</span> : <>&nbsp;</>}
          </div>
          <div className="ln">
            {i >= IDX.mv && (
              <>
                <span className="pr">[arf-ui1 ~]$&nbsp;</span>
                <span className={'cmd' + (phase === 'mv' ? ' typed t32' : '')}>mv train.slurm /arf/scratch/mert</span>
              </>
            )}
            {i < IDX.mv && <>&nbsp;</>}
          </div>
          <div className="ln">
            {i >= IDX.sb2 && (
              <>
                <span className="pr">[arf-ui1 scratch]$&nbsp;</span>
                <span className={'cmd' + (phase === 'sb2' ? ' typed t18' : '')}>sbatch train.slurm</span>
              </>
            )}
            {i < IDX.sb2 && <>&nbsp;</>}
          </div>
          <div className="ln">
            {inQ && <>Submitted batch job 2847391 · <span className="pd">PD</span></>}
            {live && <>2847391 · <span className="r">R</span> · gpu allocated</>}
            {done && <span className="r">2847391 · COMPLETED ✓</span>}
            {!inQ && !live && !done && <>&nbsp;</>}
          </div>
        </div>

        {/* The stage: laptop -> login -> queue -> compute. */}
        <div className="blg-sf-stage">
          <div className="blg-sf-line" />
          <span className={'blg-sf-lab' + (phase === 'ssh' ? ' on' : '')}>ssh</span>

          <div className={'blg-sf-node lap' + (phase === 'idle' ? ' active' : '')}>
            <span className="ic"><Laptop size={17} /></span>
            <b>{t.laptopTitle}</b>
            <small>{t.laptopSub}</small>
          </div>

          <div className={'blg-sf-node log' + (i >= IDX.ssh && i <= IDX.sb2 ? ' active' : '')}>
            <span className="ic"><Server size={17} /></span>
            <b>{t.loginTitle}</b>
            <small>{t.loginSub}</small>
          </div>

          <div className={'blg-sf-queue' + (inQ ? ' hot' : '')}>
            <span>{t.gate}</span>
          </div>

          <div className={'blg-sf-node comp' + (live ? ' live' : '') + (done ? ' fin' : '')}>
            <span className="ic"><Cpu size={17} /></span>
            <b>{t.computeTitle}</b>
            <span className="blg-sf-gpu"><i /><i /><i /><i /></span>
            <span className="blg-sf-prog"><i /></span>
            <span className="blg-sf-check">✓</span>
          </div>

          {/* Jobs already waiting ahead of yours; they launch first. */}
          <span
            className={'blg-sf-chip ghost' + (i >= IDX.q1 && !done ? ' gone' : '') + (done ? ' gone' : '') + (phase === 'idle' ? ' snap' : '')}
            style={{ left: GA[phase] + '%' }}
          >#390</span>
          <span
            className={'blg-sf-chip ghost' + (i >= IDX.q2 ? ' gone' : '') + (phase === 'idle' ? ' snap' : '')}
            style={{ left: GB[phase] + '%' }}
          >#389</span>

          {/* Your job. */}
          <span
            className={
              'blg-sf-chip you' +
              (phase === 'idle' ? ' snap' : '') +
              (phase === 'warn' ? ' rej' : '') +
              (inQ ? ' pd' : '') +
              (live || done ? ' gone' : '')
            }
            style={{ left: YOU[phase] + '%', top: `calc(50% + ${DIP[phase]}px)` }}
          >#391</span>
        </div>

        <div className="blg-sf-controls">
          <button className="blg-btn" onClick={submit}>▸ {t.submit}</button>
          <span className={'blg-sf-status' + (inQ ? ' lime' : '') + (phase === 'warn' || live || done ? ' gold' : '')}>
            {t.status[phase]}
          </span>
        </div>
      </div>
      <figcaption>
        {t.capBody1} <b>{t.capScratch}</b>{t.capBody2} <b>{t.capQueue}</b> {t.capBody3} <b>{t.capCompute}</b> {t.capBody4}
      </figcaption>
    </figure>
  );
}

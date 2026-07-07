import React, { useEffect, useRef, useState } from 'react';
import { useLang } from '../i18n/LanguageContext';

// Why every job runs inside a .sif. On /arf the quota that bites is the INODE
// count (number of files), not the size. A pip/conda env is ~50,000 tiny files;
// one container is a single file. Toggle and watch the inode meter.

const QUOTA = 20000;      // pretend inode quota
const PIP_FILES = 52000;  // a fresh env
const DOTS = 84;          // dots drawn for the pip flood

const STR = {
  en: {
    pip: 'pip install', sif: 'one .sif',
    inodes: 'inodes used', quota: 'quota',
    overA: 'quota blown', fits: 'fits — 1 file',
    pipNote: '~50,000 tiny files: every .py, .pyc, every dependency',
    sifNote: 'JAX, ffn, every dep — baked into a single file',
    capA: 'On shared HPC the', capB: 'quota (file count) bites before the size quota does. One',
    capC: 'is one inode; one conda env is tens of thousands. Put the environment in the container.',
  },
  tr: {
    pip: 'pip install', sif: 'tek .sif',
    inodes: 'kullanılan inode', quota: 'kota',
    overA: 'kota patladı', fits: 'sığar — 1 dosya',
    pipNote: '~50.000 minik dosya: her .py, .pyc, her bağımlılık',
    sifNote: 'JAX, ffn, tüm bağımlılıklar — tek bir dosyaya gömülü',
    capA: 'Paylaşımlı HPC’de', capB: 'kotası (dosya sayısı) boyut kotasından önce ısırır. Bir',
    capC: 'tek inode’dur; bir conda ortamı on binlerce. Ortamı konteynere koy.',
  },
  de: {
    pip: 'pip install', sif: 'ein .sif',
    inodes: 'genutzte Inodes', quota: 'Quota',
    overA: 'Quota gesprengt', fits: 'passt — 1 Datei',
    pipNote: '~50.000 winzige Dateien: jede .py, .pyc, jede Abhängigkeit',
    sifNote: 'JAX, ffn, jede Abhängigkeit — in eine Datei gebacken',
    capA: 'Auf geteiltem HPC beißt die', capB: 'Quota (Dateianzahl) vor der Größen-Quota. Ein',
    capC: 'ist ein Inode; eine Conda-Umgebung Zehntausende. Pack die Umgebung in den Container.',
  },
};

export default function InodeContainer() {
  const lang = (useLang().lang || 'en') as 'en' | 'tr' | 'de';
  const t = STR[lang];
  const [mode, setMode] = useState<'pip' | 'sif'>('pip');
  const [count, setCount] = useState(PIP_FILES);
  const raf = useRef<number | undefined>(undefined);
  const reduced = useRef(false);
  useEffect(() => { reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches; }, []);

  useEffect(() => {
    const target = mode === 'pip' ? PIP_FILES : 1;
    if (raf.current) cancelAnimationFrame(raf.current);
    if (reduced.current) { setCount(target); return; }
    const start = count, t0 = performance.now(), dur = 800;
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      setCount(Math.round(start + (target - start) * e));
      if (k < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const over = count > QUOTA;
  const meter = Math.min(100, (count / QUOTA) * 100);
  const litDots = mode === 'pip' ? DOTS : 1;

  return (
    <figure className="blg-ino">
      <div className="blg-ino-stage">
        <div className="blg-ino-seg">
          <button className={'blg-btn' + (mode === 'pip' ? ' on' : '')} onClick={() => setMode('pip')}>{t.pip}</button>
          <button className={'blg-btn' + (mode === 'sif' ? ' on' : '')} onClick={() => setMode('sif')}>{t.sif}</button>
        </div>

        <div className={'blg-ino-field ' + mode}>
          {mode === 'sif' ? (
            <div className="blg-ino-blob">.sif</div>
          ) : (
            Array.from({ length: litDots }, (_, i) => (
              <span key={i} className={'fd' + (i % 9 === 0 ? ' hot' : '')} style={{ animationDelay: (i * 8) + 'ms' }} />
            ))
          )}
        </div>

        <div className="blg-ino-note">{mode === 'pip' ? t.pipNote : t.sifNote}</div>

        <div className="blg-ino-meter">
          <div className="lbl"><span>{t.inodes}</span><b className={over ? 'over' : 'ok'}>{count.toLocaleString('en-US')}</b></div>
          <div className="track">
            <div className={'fill ' + (over ? 'over' : 'ok')} style={{ width: meter + '%' }} />
            <span className="quota" />
          </div>
          <div className="foot"><span>{t.quota}: {QUOTA.toLocaleString('en-US')}</span><b className={over ? 'over' : 'ok'}>{over ? '✕ ' + t.overA : '✓ ' + t.fits}</b></div>
        </div>
      </div>
      <figcaption>
        <b>{t.capA}</b> <em>inode</em> {t.capB} <code>.sif</code> {t.capC}
      </figcaption>
    </figure>
  );
}

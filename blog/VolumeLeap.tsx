import React, { useEffect, useRef, useState } from 'react';

// İki konnektom, bin kat hacim. Retinanın 132 × 114 × 80 µm³’ü ≈ 106 µm’lik bir
// küp; kortikal sütunun ~1 mm³’ü ≈ 1,06 mm’lik bir küp. Her kenar on kat, hacim
// bin kat — yani 10 × 10 × 10 = 1000 küçük küp. Retina, büyük küpün köşesindeki
// tek bir hücre olarak yerinde kalır: animasyonun bütün iddiası bu.

const S = 25;          // küçük küpün kenarı (px)
const ZK = 0.8;        // izometrik dikey kısaltma
const N = 10;          // kenar başına küçük küp
const OX = 225, OY = 210;
const HOLD = 1150;     // retina küpü tek başına dururken
const BUILD = 2100;    // büyük küp dolarken

const P = (x: number, y: number, z: number): [number, number] => [
  OX + (x - y) * 0.866 * S,
  OY + (x + y) * 0.5 * S - z * S * ZK,
];
const poly = (pts: [number, number][]) => pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
const face = (corners: [number, number, number][]) => poly(corners.map(c => P(c[0], c[1], c[2])));

type Cell = { pts: string; f: 'top' | 'left' | 'right'; d: number };

// Görünen kabuk: üst (z=N), sağ (x=N) ve sol (y=N) yüzler. Küpün içi çizilmez.
// Retina küpünün dış yüzleriyle çakışan iki hücre atlanır; onları altta duran
// altın "tohum" küp doldurur.
function shell(): Cell[] {
  const out: Cell[] = [];
  const seed: [number, number, number] = [N - 0.5, N - 0.5, 0.5];
  const add = (f: Cell['f'], c: [number, number, number][], mid: [number, number, number]) =>
    out.push({ pts: face(c), f, d: Math.hypot(mid[0] - seed[0], mid[1] - seed[1], mid[2] - seed[2]) });

  for (let x = 0; x < N; x++) for (let y = 0; y < N; y++)
    add('top', [[x, y, N], [x + 1, y, N], [x + 1, y + 1, N], [x, y + 1, N]], [x + 0.5, y + 0.5, N - 0.5]);
  for (let y = 0; y < N; y++) for (let z = 0; z < N; z++) {
    if (y === N - 1 && z === 0) continue;               // retinanın sağ yüzü
    add('right', [[N, y, z], [N, y + 1, z], [N, y + 1, z + 1], [N, y, z + 1]], [N - 0.5, y + 0.5, z + 0.5]);
  }
  for (let x = 0; x < N; x++) for (let z = 0; z < N; z++) {
    if (x === N - 1 && z === 0) continue;               // retinanın sol yüzü
    add('left', [[x, N, z], [x + 1, N, z], [x + 1, N, z + 1], [x, N, z + 1]], [x + 0.5, N - 0.5, z + 0.5]);
  }
  const max = Math.max(...out.map(c => c.d));
  return out.map(c => ({ ...c, d: (c.d / max) * BUILD }));
}
const CELLS = shell();

// Retina küpü: köşedeki tek hücre. Üst yüzü büyük küp dolunca iç yüzey hâline
// gelir ve sönerken, iki dış yüzü kabukta altın olarak kalır.
const SEED = {
  top: face([[N - 1, N - 1, 1], [N, N - 1, 1], [N, N, 1], [N - 1, N, 1]]),
  right: face([[N, N - 1, 0], [N, N, 0], [N, N, 1], [N, N - 1, 1]]),
  left: face([[N - 1, N, 0], [N, N, 0], [N, N, 1], [N - 1, N, 1]]),
};

const RAIL_X0 = 60, RAIL_X1 = 390, RAIL_Y = 505;

export default function VolumeLeap() {
  const [p, setP] = useState(0);          // 0 = 2013 · retina, 1 = 2024 · sütun
  const [run, setRun] = useState(false);
  const wrap = useRef<HTMLElement | null>(null);
  const raf = useRef<number | undefined>(undefined);
  const timer = useRef<number | undefined>(undefined);
  const reduced = useRef(false);

  const start = () => {
    if (reduced.current) { setRun(true); setP(1); return; }
    window.clearTimeout(timer.current);
    if (raf.current) cancelAnimationFrame(raf.current);
    setRun(false);
    setP(0);
    timer.current = window.setTimeout(() => {
      setRun(true);
      const t0 = performance.now();
      const step = (t: number) => {
        const k = Math.min(1, (t - t0) / BUILD);
        setP(k);
        if (k < 1) raf.current = requestAnimationFrame(step);
      };
      raf.current = requestAnimationFrame(step);
    }, HOLD);
  };

  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const el = wrap.current;
    if (!el) return;
    if (reduced.current) { setRun(true); setP(1); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { start(); io.disconnect(); } }, { threshold: 0.3 });
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(timer.current);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const year = Math.round(2013 + 11 * p);
  const mult = Math.max(1, Math.round(1 + 999 * p));
  const done = p >= 1;

  return (
    <figure className="blg-vl" ref={wrap as any}>
      <div className={'blg-vl-stage' + (run ? ' build' : '') + (done ? ' done' : '')}>
        <div className="blg-vl-side">
          <p className="blg-vl-eyebrow">Konnektomik sınır</p>
          <div className="blg-vl-read">
            <span className="cell"><i>yıl</i><b>{year}</b></span>
            <span className="cell"><i>hacim</i><b>×{mult.toLocaleString('tr-TR')}</b></span>
          </div>

          {/* 2013 kartı baştan yanar: altın küp zaten sahnede */}
          <div className="blg-vl-card a on">
            <span className="yr">2013</span>
            <b>Fare retinası</b>
            <span className="vol">132 × 114 × 80 µm³</span>
            <span className="sub">≈ 106 µm’lik küp · 950 nöron, ~580.000 hücre-hücre teması</span>
            <span className="tag">İlk memeli konnektomu</span>
          </div>

          <div className={'blg-vl-card b' + (done ? ' on' : '')}>
            <span className="yr">2024</span>
            <b>Fare kortikal sütunu (S1)</b>
            <span className="vol">≈ 1 mm³</span>
            <span className="sub">≈ 1,06 mm’lik küp · retinanın tam bin katı</span>
            <span className="tag">İlk kortikal sütun konnektomu</span>
          </div>

          <button type="button" className="blg-vl-replay" onClick={start}>↻ Yeniden oynat</button>
        </div>

        <div className="blg-vl-cube">
          <svg
            viewBox="0 0 450 540"
            role="img"
            aria-label="İzometrik bir küp animasyonu: 2013’te haritalanan fare retinasının hacmi, 2024’te haritalanan fare kortikal sütununun köşesindeki tek bir küçük küp kadardır. Büyük küp 10 × 10 × 10, yani 1000 küçük küpten oluşur: hacim bin kat, her kenar on kat büyümüştür."
          >
            {/* retina küpü — altta durur, büyük küp üstüne dolar */}
            <polygon className="blg-vl-seed top" points={SEED.top} />
            <polygon className="blg-vl-seed left" points={SEED.left} />
            <polygon className="blg-vl-seed right" points={SEED.right} />

            {/* kortikal sütun: 1000 küçük küpün görünen kabuğu */}
            <g className="blg-vl-shell">
              {CELLS.map((c, i) => (
                <polygon key={i} className={'blg-vl-cell ' + c.f} points={c.pts} style={{ ['--d' as any]: c.d.toFixed(0) + 'ms' }} />
              ))}
            </g>

            {/* zaman rayı */}
            <line className="blg-vl-rail" x1={RAIL_X0} y1={RAIL_Y} x2={RAIL_X1} y2={RAIL_Y} />
            <line className="blg-vl-rail lit" x1={RAIL_X0} y1={RAIL_Y} x2={RAIL_X0 + (RAIL_X1 - RAIL_X0) * p} y2={RAIL_Y} />
            <circle className="blg-vl-mark" cx={RAIL_X0 + (RAIL_X1 - RAIL_X0) * p} cy={RAIL_Y} r="4.5" />
            <text className="blg-vl-railtxt" x={RAIL_X0} y={RAIL_Y + 20} textAnchor="start">2013</text>
            <text className="blg-vl-railtxt" x={RAIL_X1} y={RAIL_Y + 20} textAnchor="end">2024</text>
          </svg>
        </div>
      </div>

      <figcaption>
        <b>İki konnektom, on bir yıl, bin kat.</b> 2013’te fare retinasının ~1,2 × 10⁶ µm³’ü sinaptik çözünürlükte
        çıkarıldı; 2024’te fare birincil somatosensoriyel korteksinde tam bir kortikal sütun, yani ~1 mm³ haritalandı.
        Her kenar on kat, hacim bin kat: retina, büyük küpün köşesinde duran tek bir hücre kadar kalıyor. Yirmi yıla
        yaklaşan kesintisiz konnektomik yatırıma ve görüntülenen hacimdeki bu bin katlık artışa rağmen, milimetre
        ölçeğindeki beyin hacimlerinin rutin olarak sinaps çözünürlüğünde analiz edilmesine giden kilit adım ancak
        şimdi, konnektomik sınırda atılıyor [30].
      </figcaption>
    </figure>
  );
}

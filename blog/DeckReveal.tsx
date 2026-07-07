import React, { useEffect, useRef } from 'react';

// Soft cipher glyphs — a calm shimmer, not the old spiky $^#{} churn.
const CIPHER = '·:~-+=*°.,;∴';
const PLACEHOLDER = '·';
const WINDOW = 10;   // only a small leading edge shimmers
const REROLL = 3;    // reroll that edge every N frames (gentle, not 60/s)
const WARMUP_MS = 720;

interface DeckRevealProps {
  text: string;
  /** When false, renders `text` immediately and fires onDone once. */
  animate: boolean;
  onDone?: () => void;
}

// A same-length dotted placeholder so the paragraph reserves its FULL height/
// wrapping from the first frame (letters only — whitespace is preserved). This
// is what lets the backdrop measure the real reading zone instead of an empty box.
const placeholderFor = (text: string) => text.replace(/\S/g, PLACEHOLDER);

/**
 * Gentle "decode" reveal for the post deck. The paragraph shows as a calm dotted
 * placeholder; real text resolves left-to-right with a small shimmering edge.
 * Same length every frame (stable wrapping + reserved height); written straight
 * to a ref'd span to avoid re-rendering React 60×/s.
 */
const DeckReveal: React.FC<DeckRevealProps> = ({ text, animate, onDone }) => {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const wrap = wrapRef.current;
    const el = spanRef.current;

    if (!animate) {
      wrap?.classList.remove('is-warmup');
      if (el) el.textContent = text;
      onDoneRef.current?.();
      return;
    }

    const total = text.length;
    // Bound the whole reveal to roughly 2–3.4s regardless of deck length.
    const perChar = Math.max(14, Math.min(42, Math.round(2900 / Math.max(1, total))));
    let settled = 0, acc = 0, last: number | null = null, raf = 0, frame = 0, finished = false;
    let edge = '';

    const reroll = () => {
      let s = '';
      for (let k = 0; k < WINDOW; k++) s += CIPHER[(Math.random() * CIPHER.length) | 0];
      edge = s;
    };
    reroll();

    const build = () => {
      let out = '';
      for (let i = 0; i < total; i++) {
        const ch = text[i];
        if (/\s/.test(ch)) out += ch;
        else if (i < settled) out += ch;                       // resolved
        else if (i < settled + WINDOW) out += edge[i - settled] || PLACEHOLDER; // shimmer edge
        else out += PLACEHOLDER;                                // calm dotted placeholder
      }
      return out;
    };

    wrap?.classList.add('is-warmup');
    if (el) el.textContent = build();

    const tick = (t: number) => {
      if (last == null) last = t;
      acc += t - last; last = t; frame++;
      // Cap catch-up so a stalled first frame can't snap the whole line at once.
      if (acc > perChar * 3) acc = perChar * 3;
      while (acc >= perChar && settled < total) { acc -= perChar; settled++; }
      if (frame % REROLL === 0) reroll();
      if (settled >= total) {
        if (el) el.textContent = text;
        finished = true;
        onDoneRef.current?.();
        return;
      }
      if (el) el.textContent = build();
      raf = requestAnimationFrame(tick);
    };
    const warmup = window.setTimeout(() => {
      wrap?.classList.remove('is-warmup');
      raf = requestAnimationFrame(tick);
    }, WARMUP_MS);

    // Safety net: rAF is paused in background tabs — force-finish so the article
    // can never stay hidden waiting on a stalled reveal.
    const failsafe = window.setTimeout(() => {
      if (finished) return;
      finished = true;
      wrap?.classList.remove('is-warmup');
      if (el) el.textContent = text;
      onDoneRef.current?.();
    }, WARMUP_MS + 5000);

    return () => {
      clearTimeout(warmup);
      cancelAnimationFrame(raf);
      clearTimeout(failsafe);
      wrap?.classList.remove('is-warmup');
      if (!finished && el) el.textContent = text;
    };
  }, [animate, text]);

  return (
    <span ref={wrapRef} className={'blg-deck-reveal' + (animate ? ' is-warmup' : '')} aria-label={text}>
      <span ref={spanRef} className="blg-deck-text" aria-hidden="true">{animate ? placeholderFor(text) : text}</span>
    </span>
  );
};

export default DeckReveal;

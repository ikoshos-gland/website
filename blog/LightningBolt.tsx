import React, { useEffect, useRef } from 'react';

// A lightning bolt that cracks straight down the middle of the "choose a shelf"
// page, splitting it into two halves. Strikes on mount; re-strikes when `run`
// changes (the cards bump it on hover). Purely decorative — pointer-events:none
// so the card links underneath stay clickable.

export default function LightningBolt({ run = 0 }: { run?: number }) {
  const reduced = useRef(false);
  useEffect(() => { reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches; }, []);

  // A jagged vertical bolt with one short fork, in a 56×440 box.
  const d = 'M32 0 L20 132 L38 144 L24 272 L42 284 L28 440 M24 272 L13 330';

  return (
    <div className="blg-bolt" aria-hidden="true">
      <span className="blg-bolt-flash" key={'f' + run} />
      <svg className="blg-bolt-svg" key={'s' + run} viewBox="0 0 56 440" preserveAspectRatio="xMidYMid meet">
        <path className="glow" d={d} />
        <path className="core" d={d} />
      </svg>
    </div>
  );
}

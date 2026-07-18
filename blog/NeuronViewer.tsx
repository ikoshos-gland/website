import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { useLang } from '../i18n/LanguageContext';

// Lightweight wrapper around the WebGL <NeuronScene>. Two jobs:
//   1. Keep three.js off the initial load — the scene is React.lazy'd, so its
//      chunk downloads only when this figure first scrolls near the viewport.
//   2. Bound the GPU cost — the scene is mounted only while in view and
//      unmounted when scrolled well away (freeing the WebGL context), mirroring
//      how Hero.tsx unloads its Spline scene. Idle-when-visible is already cheap:
//      with autoRotate off the scene uses frameloop="demand" (0 frames at rest).

const NeuronScene = lazy(() => import('./NeuronScene'));

const STR = {
  en: { hint: 'drag to rotate · scroll to zoom', fail: '3D view unavailable' },
  tr: { hint: 'döndürmek için sürükle · yakınlaştırmak için kaydır', fail: '3D görünüm kullanılamıyor' },
  de: { hint: 'ziehen zum Drehen · scrollen zum Zoomen', fail: '3D-Ansicht nicht verfügbar' },
};

class GLBoundary extends React.Component<{ fallback: React.ReactNode; children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export interface NeuronViewerProps {
  /** path to a neuron mesh .bin built by scripts/build_neuron_solid.py */
  src?: string;
  /** translucent brain hull; pass false to hide, or a path to another mesh */
  brain?: string | false;
  /** stage height in px */
  height?: number;
  /** per-neuron colors (cycled) */
  colors?: string[];
  /** gentle auto-spin; forced off under prefers-reduced-motion */
  autoRotate?: boolean;
  /** framing multiplier: >1 starts closer, <1 pulls back */
  zoom?: number;
  /** small badge in the stage corner, e.g. the dataset name */
  label?: React.ReactNode;
  /** render only the stage (no <figure>/caption), so it can be composed,
      e.g. side by side inside <NeuronCompare> */
  bare?: boolean;
  /** optional caption shown under the stage */
  caption?: React.ReactNode;
  children?: React.ReactNode;
}

export default function NeuronViewer({
  src = '/neurons/exr1_solid.bin',
  brain = '/neurons/brain.bin',
  height = 460,
  colors,
  autoRotate = true,
  zoom = 1,
  label,
  bare = false,
  caption,
  children,
}: NeuronViewerProps) {
  const t = STR[useLang().lang] || STR.en;
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Deterministic first mount: if the stage already sits within (or near) the
    // viewport, mount right away instead of waiting for the observer — some
    // embedded/preview browsers never fire IntersectionObserver while their tab
    // is backgrounded, which would otherwise pin the viewer on its spinner.
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight + 250 && r.bottom > -250) setInView(true);
    // Thereafter the observer mounts ahead of the viewport and unmounts once
    // the stage is well clear of it, bounding GPU cost like Hero's Spline scene.
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => setInView(e.isIntersecting)),
      { rootMargin: '250px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const fail = <div className="blg-neuron-msg">{t.fail}</div>;

  const stage = (
    <div ref={ref} className="blg-neuron-stage" style={{ height }}>
      {inView ? (
        <GLBoundary fallback={fail}>
          <Suspense fallback={<div className="blg-neuron-spin" aria-label="loading" />}>
            <NeuronScene src={src} brain={brain === false ? null : brain} colors={colors} zoom={zoom} autoRotate={autoRotate && !reduced} />
          </Suspense>
        </GLBoundary>
      ) : (
        <div className="blg-neuron-spin" aria-label="loading" />
      )}
      {label && <span className="blg-neuron-label">{label}</span>}
      <span className="blg-neuron-hint" aria-hidden="true">{t.hint}</span>
    </div>
  );

  if (bare) return stage;

  return (
    <figure className="blg-viz">
      {stage}
      {(caption || children) && <figcaption>{caption || children}</figcaption>}
    </figure>
  );
}

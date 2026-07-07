import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';

// Lazy load Spline for better performance - only on desktop
const Spline = lazy(() => import('@splinetool/react-spline'));
import ScrambleText from './ScrambleText';
import { useContent } from '../i18n/LanguageContext';

// Mobile detection hook for performance optimization
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

// Helper to interpolate colors
const interpolateColor = (start: number[], end: number[], factor: number) => {
  const result = start.map((startVal, i) => {
    const endVal = end[i];
    return Math.round(startVal + (endVal - startVal) * factor);
  });
  return `rgb(${result.join(',')})`;
};

const Hero: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [shouldLoadSpline, setShouldLoadSpline] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { hero } = useContent();

  useEffect(() => {
    // Desktop only — and defer the ~4MB Spline engine to idle AFTER first paint
    // so its parse/WASM-init never fights the loader-dismissal frame.
    if (isMobile) return;
    const load = () => setShouldLoadSpline(true);
    const w = window as any;
    if (typeof w.requestIdleCallback === 'function') {
      const id = w.requestIdleCallback(load, { timeout: 2500 });
      return () => w.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(load, 1500);
    return () => window.clearTimeout(id);
  }, [isMobile]);

  useEffect(() => {
    // Use Intersection Observer to detect when hero is out of view
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const silverStart = [245, 245, 245];
    const silverEnd = [160, 160, 160];
    const goldStart = [255, 215, 0];
    const goldEnd = [184, 134, 11];

    const applyFactor = (factor: number) => {
      // Main Text: Default (0) = Gold, Hover (1) = Silver
      const mainStart = interpolateColor(goldStart, silverStart, factor);
      const mainEnd = interpolateColor(goldEnd, silverEnd, factor);
      // Machina Text: Default (0) = Silver, Hover (1) = Gold
      const machinaStart = interpolateColor(silverStart, goldStart, factor);
      const machinaEnd = interpolateColor(silverEnd, goldEnd, factor);
      const currentShadow = interpolateColor([0, 0, 0], [139, 69, 19], factor * 0.5);

      hero.style.setProperty('--main-gradient-start', mainStart);
      hero.style.setProperty('--main-gradient-end', mainEnd);
      hero.style.setProperty('--machina-gradient-start', machinaStart);
      hero.style.setProperty('--machina-gradient-end', machinaEnd);
      hero.style.setProperty('--text-shadow-color', `rgba(${currentShadow}, 0.6)`);
    };

    // Paint the default gold state immediately (also the only state on touch / reduced-motion)
    applyFactor(0);

    // Skip the per-pointer hover work where it can't be seen or isn't wanted
    const fine = window.matchMedia('(pointer: fine)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduced) return;

    const headline = hero.querySelector('h1');
    if (!headline) return;

    // Cache the headline rect; refresh only when it can actually change
    // (scroll/resize, and ResizeObserver for the ScrambleText / font-load reflow).
    let rect = headline.getBoundingClientRect();
    const refreshRect = () => { rect = headline.getBoundingClientRect(); };
    const ro = new ResizeObserver(refreshRect);
    ro.observe(headline);

    // Coalesce pointer moves to one update per animation frame — no per-event
    // getBoundingClientRect (which forced a synchronous layout every move).
    let rafId = 0;
    let pending: { x: number; y: number } | null = null;
    const flush = () => {
      rafId = 0;
      if (!pending) return;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = pending.x - cx;
      const dy = pending.y - cy;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const factor = Math.max(0, 1 - distance / 300); // 300px radius
      applyFactor(factor);
      pending = null;
    };
    const handleMouseMove = (e: MouseEvent) => {
      pending = { x: e.clientX, y: e.clientY };
      if (!rafId) rafId = requestAnimationFrame(flush);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', refreshRect, { passive: true });
    window.addEventListener('resize', refreshRect);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', refreshRect);
      window.removeEventListener('resize', refreshRect);
      ro.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div ref={heroRef} className="relative w-full min-h-screen bg-black overflow-hidden flex flex-col p-4 sm:p-6 md:p-12 text-[#F5F5F5] font-sans">

      {/* Background Layer - Video on mobile, Spline on desktop */}
      <div className="absolute inset-0 z-0" style={{ visibility: isVisible ? 'visible' : 'hidden' }}>
        {isMobile ? (
          /* Mobile: Video loop for performance - WebM primary, MP4 fallback */
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            style={{ filter: 'brightness(1.3)', objectPosition: '51.5% center' }}
          >
            <source src="/spline-mobile.webm" type="video/webm" />
            <source src="/spline-mobile.mp4" type="video/mp4" />
          </video>
        ) : (
          /* Desktop: Full Spline 3D experience */
          shouldLoadSpline && (
            <Suspense fallback={
              <div className="w-full h-full bg-gradient-to-br from-[#0E0F11] via-[#1a1b1e] to-[#0E0F11] animate-pulse" />
            }>
              <Spline
                scene="https://prod.spline.design/rZPCbrvNCWCkozOI/scene.splinecode"
                style={{ width: '100%', height: '100%', filter: 'brightness(1.3)' }}
              />
            </Suspense>
          )
        )}

        {/* Dark Gradients for Depth & Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-full h-2/3 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none"></div>

        {/* Spline Watermark Cover Patch - only needed on desktop */}
        {!isMobile && (
          <div className="absolute bottom-0 right-0 w-40 sm:w-60 md:w-80 h-20 sm:h-28 md:h-32 bg-black z-10 pointer-events-none"></div>
        )}
      </div>

      {/* Top Left Logo */}
      <div className="relative z-20 pointer-events-none">
        <span className="font-great-vibes text-2xl sm:text-3xl md:text-5xl text-white tracking-wide">Mertoshi</span>
      </div>



      {/* Center Content: Headline */}
      <div className="flex-1 flex flex-col pt-12 sm:pt-16 md:pt-32 z-10 relative items-center justify-start pointer-events-none">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl leading-[1.1] font-normal tracking-wide font-instrument text-center px-2">
          {/* First Line */}
          <span className="block italic opacity-90 pb-2">
            <span className="text-premium-shadow" style={{ '--text-gradient-start': 'var(--main-gradient-start)', '--text-gradient-end': 'var(--main-gradient-end)' } as React.CSSProperties}>
              Mens in{' '}
            </span>
            <span className="text-premium-shadow" style={{ '--text-gradient-start': 'var(--machina-gradient-start)', '--text-gradient-end': 'var(--machina-gradient-end)' } as React.CSSProperties}>
              <ScrambleText text="Machina" delay={300} duration={1000} className="inline-block" />
            </span>
            <span className="text-premium-shadow" style={{ '--text-gradient-start': 'var(--main-gradient-start)', '--text-gradient-end': 'var(--main-gradient-end)' } as React.CSSProperties}>,</span>
          </span>

          {/* Second Line */}
          <span className="block mt-2 sm:mt-4 italic opacity-90 pb-2">
            <span className="text-premium-shadow" style={{ '--text-gradient-start': 'var(--machina-gradient-start)', '--text-gradient-end': 'var(--machina-gradient-end)' } as React.CSSProperties}>
              <ScrambleText text="Machina" delay={800} duration={1000} className="inline-block" />
            </span>
            <span className="text-premium-shadow" style={{ '--text-gradient-start': 'var(--main-gradient-start)', '--text-gradient-end': 'var(--main-gradient-end)' } as React.CSSProperties}>
              {' '}in Mente
            </span>
          </span>
        </h1>
        <p className="mt-4 sm:mt-6 md:mt-8 text-xs sm:text-sm md:text-base lg:text-lg text-gray-400 tracking-[0.2em] sm:tracking-[0.3em] uppercase font-mono text-center px-4">
          {hero.tagline}
        </p>
      </div>

      {/* Bottom Content */}
      <div className="relative z-20 flex flex-col items-center mt-8 sm:mt-12 md:mt-0 mb-16 sm:mb-24 md:mb-32 w-full pointer-events-none">
        {/* Center Info with Name aligned right */}
        <div className="w-full max-w-2xl pointer-events-auto">
          <div className="text-center mb-4 sm:mb-6">
            <span className="font-great-vibes text-2xl sm:text-3xl md:text-4xl text-white/80 tracking-wide">
              Mert Koca
            </span>
          </div>
          <div className="font-mono text-xs sm:text-sm text-gray-400 space-y-3 sm:space-y-4 leading-relaxed tracking-wide text-center">
            <p>
              {hero.bio}
            </p>
            <a href="https://www.instagram.com/augst.von.mackenss/" target="_blank" rel="noopener noreferrer" className="inline-block underline underline-offset-4 decoration-gray-600 hover:decoration-white hover:text-white transition-all pt-2">
              @augst.von.mackenss
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';

// Lazy load Spline for better performance - only on desktop
const Spline = lazy(() => import('@splinetool/react-spline'));
import ScrambleText from './ScrambleText';

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

  useEffect(() => {
    // Only load Spline on desktop for performance
    if (!isMobile) {
      setShouldLoadSpline(true);
    }
  }, [isMobile]);

  // Preconnect to Spline CDN for faster loading
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = 'https://prod.spline.design';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

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
    const updateColors = (factor: number) => {
      if (!heroRef.current) return;

      // Silver/Metallic
      const silverStart = [245, 245, 245];
      const silverEnd = [160, 160, 160];

      // Gold/Premium
      const goldStart = [255, 215, 0];
      const goldEnd = [184, 134, 11];

      // Main Text: Default (factor 0) = Gold, Hover (factor 1) = Silver
      const mainStart = interpolateColor(goldStart, silverStart, factor);
      const mainEnd = interpolateColor(goldEnd, silverEnd, factor);

      // Machina Text: Default (factor 0) = Silver, Hover (factor 1) = Gold
      const machinaStart = interpolateColor(silverStart, goldStart, factor);
      const machinaEnd = interpolateColor(silverEnd, goldEnd, factor);

      const currentShadow = interpolateColor([0, 0, 0], [139, 69, 19], factor * 0.5);

      heroRef.current.style.setProperty('--main-gradient-start', mainStart);
      heroRef.current.style.setProperty('--main-gradient-end', mainEnd);
      heroRef.current.style.setProperty('--machina-gradient-start', machinaStart);
      heroRef.current.style.setProperty('--machina-gradient-end', machinaEnd);
      heroRef.current.style.setProperty('--text-shadow-color', `rgba(${currentShadow}, 0.6)`);
    };

    // Initialize immediately
    updateColors(0);

    let lastUpdate = 0;
    const throttleMs = 33; // ~30fps

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastUpdate < throttleMs) return;
      lastUpdate = now;

      if (!heroRef.current) return;

      // Get the headline element's position
      const headline = heroRef.current.querySelector('h1');
      if (!headline) return;

      const rect = headline.getBoundingClientRect();
      const textCenterX = rect.left + rect.width / 2;
      const textCenterY = rect.top + rect.height / 2;

      // Calculate distance from mouse to text center
      const dx = e.clientX - textCenterX;
      const dy = e.clientY - textCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Max distance for effect (300px radius)
      const maxDistance = 300;

      // Factor: 1 when on text, 0 when far away
      const factor = Math.max(0, 1 - distance / maxDistance);

      // Silver/Metallic
      const silverStart = [245, 245, 245];
      const silverEnd = [160, 160, 160];

      // Gold/Premium
      const goldStart = [255, 215, 0];
      const goldEnd = [184, 134, 11];

      // Interpolate based on proximity
      // Main Text: Default (factor 0) = Gold, Hover (factor 1) = Silver
      const mainStart = interpolateColor(goldStart, silverStart, factor);
      const mainEnd = interpolateColor(goldEnd, silverEnd, factor);

      // Machina Text: Default (factor 0) = Silver, Hover (factor 1) = Gold
      const machinaStart = interpolateColor(silverStart, goldStart, factor);
      const machinaEnd = interpolateColor(silverEnd, goldEnd, factor);

      const currentShadow = interpolateColor([0, 0, 0], [139, 69, 19], factor * 0.5);

      heroRef.current.style.setProperty('--main-gradient-start', mainStart);
      heroRef.current.style.setProperty('--main-gradient-end', mainEnd);
      heroRef.current.style.setProperty('--machina-gradient-start', machinaStart);
      heroRef.current.style.setProperty('--machina-gradient-end', machinaEnd);
      heroRef.current.style.setProperty('--text-shadow-color', `rgba(${currentShadow}, 0.6)`);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div ref={heroRef} className="relative w-full min-h-screen bg-black overflow-hidden flex flex-col p-4 sm:p-6 md:p-12 text-[#F5F5F5] font-sans">

      {/* Background Layer - Video on mobile, Spline on desktop */}
      <div className="absolute inset-0 z-0" style={{ visibility: isVisible ? 'visible' : 'hidden' }}>
        {isMobile ? (
          /* Mobile: Video loop for performance */
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            style={{ filter: 'brightness(1.3)' }}
          >
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
          Mind in the Machine, Machine in the Mind
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
              Molecular Biotechnology student and future neuroscientist, balancing relentless discipline with a boundless imagination. I strive to push the boundaries of the visible—merging scientific precision with a photographer's eye to illuminate the unseen wonders of the neural world.
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
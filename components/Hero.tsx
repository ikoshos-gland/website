import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';

// Lazy load Spline for better performance
const Spline = lazy(() => import('@splinetool/react-spline'));

const Hero: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [shouldLoadSpline, setShouldLoadSpline] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Delay Spline loading until after initial page load
    const timer = setTimeout(() => setShouldLoadSpline(true), 500);
    return () => clearTimeout(timer);
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

  return (
    <div ref={heroRef} className="relative w-full min-h-screen bg-black overflow-hidden flex flex-col p-4 sm:p-6 md:p-12 text-[#F5F5F5] font-sans">

      {/* Background Layer - Only render Spline when hero is visible */}
      <div className="absolute inset-0 z-0">
        {shouldLoadSpline && isVisible && (
          <Suspense fallback={
            <div className="w-full h-full bg-gradient-to-br from-[#0E0F11] via-[#1a1b1e] to-[#0E0F11] animate-pulse" />
          }>
            <Spline
              scene="https://prod.spline.design/rZPCbrvNCWCkozOI/scene.splinecode"
              style={{ width: '100%', height: '100%', filter: 'brightness(1.3)' }}
            />
          </Suspense>
        )}

        {/* Dark Gradients for Depth & Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-full h-2/3 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none"></div>

        {/* Spline Watermark Cover Patch */}
        <div className="absolute bottom-0 right-0 w-40 sm:w-60 md:w-80 h-20 sm:h-28 md:h-32 bg-black z-10 pointer-events-none"></div>
      </div>

      {/* Top Left Logo */}
      <div className="relative z-20 pointer-events-none">
        <span className="font-great-vibes text-2xl sm:text-3xl md:text-5xl text-white tracking-wide">Mertoshi</span>
      </div>

      {/* Center Content: Headline */}
      <div className="flex-1 flex flex-col pt-12 sm:pt-16 md:pt-32 z-10 relative items-center justify-start pointer-events-none">
        <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-7xl xl:text-8xl leading-[1.1] font-normal text-white tracking-wide font-instrument text-center drop-shadow-2xl px-2">
          <span className="block italic opacity-90">Mens in Machina,</span>
          <span className="block mt-2 sm:mt-4 italic opacity-90">Machina in Mente</span>
        </h1>
        <p className="mt-4 sm:mt-6 md:mt-8 text-xs sm:text-sm md:text-base lg:text-lg text-gray-400 tracking-[0.2em] sm:tracking-[0.3em] uppercase font-mono text-center px-4">
          Mind in the Machine, Machine in the Mind
        </p>
      </div>

      {/* Bottom Content */}
      <div className="relative z-20 flex flex-col md:flex-row items-start md:items-end justify-between gap-6 sm:gap-8 mt-8 sm:mt-12 md:mt-0 mb-16 sm:mb-24 md:mb-32 w-full pointer-events-none">
        {/* Left Info */}
        <div className="w-full max-w-2xl pointer-events-auto">
          <h2 className="font-mono text-base sm:text-xl md:text-2xl lg:text-4xl mb-4 sm:mb-6 tracking-tight text-white font-medium">
            Turkisch-Deutsche Universität
          </h2>
          <div className="font-mono text-xs sm:text-sm text-gray-400 space-y-3 sm:space-y-4 max-w-md leading-relaxed tracking-wide">
            <p>
              Amateur photographer and
              a Molecular Biotechnology
              student, who has
              unlimited imagination
            </p>
            <a href="https://www.instagram.com/augst.von.mackenss/" target="_blank" rel="noopener noreferrer" className="block underline underline-offset-4 decoration-gray-600 hover:decoration-white hover:text-white transition-all w-fit pt-2">
              @augst.von.mackenss
            </a>
          </div>
        </div>

        {/* Right - Name */}
        <div className="text-right self-end">
          <span className="font-great-vibes text-2xl sm:text-3xl md:text-4xl text-white/80 tracking-wide">
            Mert Koca
          </span>
        </div>
      </div>
    </div>
  );
};

export default Hero;
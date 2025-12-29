import React from 'react';

const Hero: React.FC = () => {
  return (
    <div className="relative w-full min-h-screen bg-black overflow-hidden flex flex-col p-6 md:p-12 text-[#F5F5F5] font-sans">
      
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        {/* @ts-ignore */}
        <spline-viewer url="https://prod.spline.design/rZPCbrvNCWCkozOI/scene.splinecode" className="w-full h-full" style={{filter: 'brightness(1.3)'}}></spline-viewer>
        
        {/* Dark Gradients for Depth & Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-full h-2/3 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none"></div>
        
        {/* Spline Watermark Cover Patch */}
        <div className="absolute bottom-0 right-0 w-80 h-32 bg-black z-10 pointer-events-none"></div>
      </div>

      {/* Top Left Logo */}
      <div className="relative z-20 pointer-events-none">
        <span className="font-great-vibes text-3xl md:text-5xl text-white tracking-wide">Mertoshi</span>
      </div>

      {/* Center Content: Headline */}
      <div className="flex-1 flex flex-col md:pt-32 z-10 pt-20 relative items-center justify-start pointer-events-none">
        <h1 className="md:text-8xl lg:text-9xl leading-[1.1] text-5xl font-normal text-white tracking-wide font-instrument text-center drop-shadow-2xl">
          Welcome To The Heart Of <span className="block mt-4">Academia</span>
        </h1>
      </div>

      {/* Bottom Content */}
      <div className="relative z-20 flex flex-col md:flex-row items-end justify-between gap-8 mt-12 md:mt-0 mb-24 md:mb-32 w-full pointer-events-none">
        {/* Left Info */}
        <div className="w-full max-w-2xl pointer-events-auto">
          <h2 className="font-mono text-xl md:text-4xl mb-6 tracking-tight text-white font-medium">
            Turkisch-Deutsche Universität
          </h2>
          <div className="font-mono text-xs md:text-sm text-gray-400 space-y-4 max-w-md leading-relaxed tracking-wide">
            <p>
              Amateur photographer and
              a Molecular Biotechnology
              student, who has
              unlimited imagination
            </p>
            <a href="#" className="block underline underline-offset-4 decoration-gray-600 hover:decoration-white hover:text-white transition-all w-fit pt-2">
              @augst.von.mackenss
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
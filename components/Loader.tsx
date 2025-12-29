import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[100] bg-[#0E0F11] flex flex-col items-center justify-center overflow-hidden">
      <style>
        {`
          @keyframes glitch-skew {
            0% { transform: skew(0deg); }
            10% { transform: skew(-2deg); }
            20% { transform: skew(2deg); }
            30% { transform: skew(0deg); }
            40% { transform: skew(-5deg); }
            50% { transform: skew(5deg); }
            60% { transform: skew(0deg); }
            100% { transform: skew(0deg); }
          }
          
          @keyframes vibrate {
            0% { transform: translate(0); }
            20% { transform: translate(-2px, 2px); }
            40% { transform: translate(-2px, -2px); }
            60% { transform: translate(2px, 2px); }
            80% { transform: translate(2px, -2px); }
            100% { transform: translate(0); }
          }

          .triangle-wrapper {
            position: relative;
            width: 120px;
            height: 120px;
            animation: vibrate 0.3s linear infinite;
          }

          .triangle-main {
            position: absolute;
            inset: 0;
            z-index: 10;
          }

          .triangle-r {
            position: absolute;
            inset: 0;
            left: 2px;
            animation: glitch-skew 1s infinite linear alternate-reverse;
            opacity: 0.7;
            mix-blend-mode: screen;
          }
          
          .triangle-b {
            position: absolute;
            inset: 0;
            left: -2px;
            animation: glitch-skew 2s infinite linear alternate;
            opacity: 0.7;
            mix-blend-mode: screen;
          }

          .scanline {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100px;
            background: linear-gradient(to bottom, transparent, rgba(214, 255, 79, 0.1), transparent);
            animation: scan 2s linear infinite;
            pointer-events: none;
          }

          @keyframes scan {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100vh); }
          }
        `}
      </style>

      {/* Triangle Container */}
      <div className="triangle-wrapper mb-12">
        {/* Cyan/Blue Channel */}
        <div className="triangle-b">
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]">
             <polygon points="50,15 90,85 10,85" fill="none" stroke="cyan" strokeWidth="2" />
          </svg>
        </div>

        {/* Red/Magenta Channel */}
        <div className="triangle-r">
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_8px_rgba(255,0,0,0.8)]">
             <polygon points="50,15 90,85 10,85" fill="none" stroke="red" strokeWidth="2" />
          </svg>
        </div>

        {/* Main Channel */}
        <div className="triangle-main">
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(214,255,79,0.5)]">
             <polygon points="50,15 90,85 10,85" fill="none" stroke="#D6FF4F" strokeWidth="3" />
             {/* Inner detail */}
             <polygon points="50,35 75,80 25,80" fill="none" stroke="#D6FF4F" strokeWidth="1" className="opacity-50" />
          </svg>
        </div>
      </div>

      {/* Text */}
      <div className="relative">
        <h2 className="font-mono text-[#D6FF4F] text-sm tracking-[0.5em] uppercase animate-pulse">
          Loading...
        </h2>
        <div className="absolute top-0 left-0 w-full h-full text-cyan-400 opacity-50 blur-[1px] animate-[vibrate_0.2s_infinite] pointer-events-none mix-blend-screen" aria-hidden="true">
          Loading...
        </div>
        <div className="absolute top-0 left-0 w-full h-full text-red-500 opacity-50 blur-[1px] animate-[vibrate_0.2s_infinite_reverse] pointer-events-none mix-blend-screen" aria-hidden="true">
          Loading...
        </div>
      </div>

      {/* Scanline Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')]"></div>
      <div className="scanline"></div>
    </div>
  );
};

export default Loader;
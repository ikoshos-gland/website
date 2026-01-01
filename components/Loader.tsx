import React from 'react';
import brainLoader from '../assets/brain-loader.png';

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

      {/* Brain Loader */}
      <div
        className="relative w-80 h-80 mb-8 mix-blend-screen"
        style={{
          maskImage: 'radial-gradient(closest-side, black 60%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(closest-side, black 60%, transparent 100%)'
        }}
      >
        <img
          src={brainLoader}
          alt="Loading Brain"
          className="w-full h-full object-contain animate-pulse drop-shadow-[0_0_15px_rgba(214,255,79,0.3)]"
        />
        {/* Glitch/Ghost effect layers */}
        <img
          src={brainLoader}
          alt=""
          className="absolute inset-0 w-full h-full object-contain opacity-50 mix-blend-screen animate-[glitch-skew_1s_infinite_linear_alternate-reverse] text-cyan-400"
          style={{ filter: 'hue-rotate(90deg)' }}
        />
        <img
          src={brainLoader}
          alt=""
          className="absolute inset-0 w-full h-full object-contain opacity-50 mix-blend-screen animate-[glitch-skew_2s_infinite_linear_alternate] text-red-500"
          style={{ filter: 'hue-rotate(-90deg)' }}
        />
      </div>

      {/* Text */}
      <div className="relative">
        <h2 className="font-mono text-[#D6FF4F] text-sm tracking-[0.5em] uppercase animate-pulse">
          Loading...
        </h2>
        {/* Shadow under text */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[800px] h-4 bg-[#D6FF4F] opacity-20 blur-xl rounded-[100%]"></div>
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
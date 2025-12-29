import React from 'react';
import { Telescope, PenTool, Code2 } from 'lucide-react';

const Process: React.FC = () => {
  return (
    <div className="border-t border-[#23252B] bg-[#0E0F11] py-24 px-6">
      <div className="max-w-5xl mx-auto text-center">
        <span className="block text-[10px] text-[#D6FF4F] font-mono w-fit border-b border-[#23252B] mx-auto mb-8 pb-1 tracking-widest">
          05 — METHODOLOGY
        </span>
        <h2 className="text-4xl md:text-5xl font-medium font-heading text-[#F5F5F5] tracking-tight mb-16">
          Precision in Discovery
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          {/* Connector Line */}
          <div className="hidden md:block absolute top-[28px] left-0 right-0 h-px border-t border-dashed border-[#23252B] z-0"></div>

          <div className="flex flex-col items-center gap-4 relative z-10 group">
            <div className="w-14 h-14 rounded-full bg-[#15171B] border border-[#23252B] flex items-center justify-center text-[#A1A1A6] group-hover:text-[#D6FF4F] group-hover:border-[#D6FF4F] transition-all">
              <Telescope size={24} />
            </div>
            <h3 className="text-xl font-heading font-medium text-[#F5F5F5]">Strategy</h3>
            <p className="text-[#A1A1A6] text-sm leading-relaxed max-w-[240px]">
              <span className="block">Multi-scale neuro discovery.</span>
              <span className="block">Vascular & pericyte analysis.</span>
            </p>
          </div>

          <div className="flex flex-col items-center gap-4 relative z-10 group">
            <div className="w-14 h-14 rounded-full bg-[#15171B] border border-[#23252B] flex items-center justify-center text-[#A1A1A6] group-hover:text-[#D6FF4F] group-hover:border-[#D6FF4F] transition-all">
              <PenTool size={24} />
            </div>
            <h3 className="text-xl font-heading font-medium text-[#F5F5F5]">Design</h3>
            <p className="text-[#A1A1A6] text-sm leading-relaxed max-w-[240px]">
              <span className="block">Iterative AI-segmentation.</span>
              <span className="block">Systematized neural craft.</span>
            </p>
          </div>

          <div className="flex flex-col items-center gap-4 relative z-10 group">
            <div className="w-14 h-14 rounded-full bg-[#15171B] border border-[#23252B] flex items-center justify-center text-[#A1A1A6] group-hover:text-[#D6FF4F] group-hover:border-[#D6FF4F] transition-all">
              <Code2 size={24} />
            </div>
            <h3 className="text-xl font-heading font-medium text-[#F5F5F5]">Develop</h3>
            <p className="text-[#A1A1A6] text-sm leading-relaxed max-w-[240px]">
              <span className="block">Nano-precise implementation.</span>
              <span className="block">Scalable, embedded code.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Process;
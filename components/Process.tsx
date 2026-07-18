import React from 'react';
import { Link } from 'react-router-dom';
import { Telescope, PenTool, Code2 } from 'lucide-react';
import { useContent } from '../i18n/LanguageContext';

const Process: React.FC = () => {
  const { process } = useContent();
  return (
    <Link
      to="/thesis"
      aria-label={process.heading}
      className="group/thesis block border-t border-[#23252B] bg-black/75 py-12 sm:py-16 md:py-24 px-4 sm:px-6 cursor-pointer transition-colors duration-300 hover:bg-[#111316]/90 backdrop-blur-[1px]"
    >
      <div className="max-w-5xl mx-auto text-center">
        <span lang="en" className="normal-case block text-[10px] text-[#D6FF4F] font-mono w-fit border-b border-[#23252B] mx-auto mb-6 sm:mb-8 pb-1 tracking-widest">
          {process.sectionLabel}
        </span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium font-heading text-[#F5F5F5] tracking-tight mb-10 sm:mb-16">
          {process.heading}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6 md:gap-12 relative">
          {/* Connector Line */}
          <div className="hidden sm:block absolute top-[28px] left-0 right-0 h-px border-t border-dashed border-[#23252B] z-0"></div>

          <div className="flex flex-col items-center gap-3 sm:gap-4 relative z-10 group">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#15171B] border border-[#23252B] flex items-center justify-center text-[#A1A1A6] group-hover:text-[#D6FF4F] group-hover:border-[#D6FF4F] transition-all">
              <Telescope size={20} className="sm:w-6 sm:h-6" />
            </div>
            <h3 className="text-lg sm:text-xl font-heading font-medium text-[#F5F5F5]">{process.steps[0].title}</h3>
            <p className="text-[#A1A1A6] text-xs sm:text-sm leading-relaxed max-w-[240px]">
              <span className="block">{process.steps[0].line1}</span>
              <span className="block">{process.steps[0].line2}</span>
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 sm:gap-4 relative z-10 group">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#15171B] border border-[#23252B] flex items-center justify-center text-[#A1A1A6] group-hover:text-[#D6FF4F] group-hover:border-[#D6FF4F] transition-all">
              <PenTool size={20} className="sm:w-6 sm:h-6" />
            </div>
            <h3 className="text-lg sm:text-xl font-heading font-medium text-[#F5F5F5]">{process.steps[1].title}</h3>
            <p className="text-[#A1A1A6] text-xs sm:text-sm leading-relaxed max-w-[240px]">
              <span className="block">{process.steps[1].line1}</span>
              <span className="block">{process.steps[1].line2}</span>
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 sm:gap-4 relative z-10 group">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#15171B] border border-[#23252B] flex items-center justify-center text-[#A1A1A6] group-hover:text-[#D6FF4F] group-hover:border-[#D6FF4F] transition-all">
              <Code2 size={20} className="sm:w-6 sm:h-6" />
            </div>
            <h3 className="text-lg sm:text-xl font-heading font-medium text-[#F5F5F5]">{process.steps[2].title}</h3>
            <p className="text-[#A1A1A6] text-xs sm:text-sm leading-relaxed max-w-[240px]">
              <span className="block">{process.steps[2].line1}</span>
              <span className="block">{process.steps[2].line2}</span>
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default Process;

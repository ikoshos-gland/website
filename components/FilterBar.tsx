import React from 'react';
import { Layers, Brain, Wallet } from 'lucide-react';

const FilterBar: React.FC = () => {
  return (
    <div className="sticky top-20 sm:top-24 z-40 px-2 sm:px-4 md:px-8 py-3 sm:py-4 mb-6 sm:mb-8">
      <div className="max-w-[1550px] mx-auto">
        <div className="flex flex-col lg:flex-row bg-[#15171B]/90 border-[#23252B] border rounded-2xl sm:rounded-3xl p-2 sm:p-3 shadow-xl backdrop-blur-sm gap-3 sm:gap-4 items-center justify-between">

          {/* Title - hidden on very small screens, shown on sm+ */}
          <div className="hidden sm:flex items-center px-2 sm:px-4 w-full lg:w-auto justify-center lg:justify-start">
            <span className="text-sm sm:text-base md:text-lg lg:text-xl font-medium text-[#F5F5F5] text-center lg:text-left" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
              Crafted under the iron rule of discipline
            </span>
          </div>

          {/* Tags Container */}
          <div className="flex flex-wrap sm:flex-nowrap w-full lg:w-auto gap-2 items-center justify-center">
            {/* Item 1 */}
            <div className="flex items-center bg-[#0E0F11] rounded-full px-3 sm:px-4 md:px-5 py-2 sm:py-3 gap-2 sm:gap-3 border border-[#23252B] transition-colors justify-center flex-shrink-0">
              <Layers size={12} className="text-[#A1A1A6] flex-shrink-0 sm:w-[14px] sm:h-[14px]" />
              <span className="text-[10px] sm:text-xs font-medium text-[#F5F5F5] uppercase tracking-wide whitespace-nowrap">
                Interdisciplinary
              </span>
            </div>

            {/* Item 2 */}
            <div className="flex items-center bg-[#0E0F11] rounded-full px-3 sm:px-4 md:px-5 py-2 sm:py-3 gap-2 sm:gap-3 border border-[#23252B] transition-colors justify-center flex-shrink-0">
              <Brain size={12} className="text-[#A1A1A6] flex-shrink-0 sm:w-[14px] sm:h-[14px]" />
              <span className="text-[10px] sm:text-xs font-medium text-[#F5F5F5] uppercase tracking-wide whitespace-nowrap">
                Neuroscientist
              </span>
            </div>

            {/* Item 3 */}
            <div className="flex items-center bg-[#0E0F11] rounded-full px-3 sm:px-4 md:px-5 py-2 sm:py-3 gap-2 sm:gap-3 border border-[#23252B] transition-colors justify-center flex-shrink-0">
              <Wallet size={12} className="text-[#A1A1A6] flex-shrink-0 sm:w-[14px] sm:h-[14px]" />
              <span className="text-[10px] sm:text-xs font-medium text-[#F5F5F5] uppercase tracking-wide whitespace-nowrap">
                Self Worth
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
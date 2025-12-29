import React from 'react';
import { Layers, Brain, Wallet } from 'lucide-react';

const FilterBar: React.FC = () => {
  return (
    <div className="sticky top-24 z-40 px-4 md:px-8 py-4 mb-8">
      <div className="max-w-[1550px] mx-auto">
        <div className="flex flex-col md:flex-row bg-[#15171B]/90 border-[#23252B] border rounded-3xl pt-2 pr-2 pb-2 pl-2 shadow-xl backdrop-blur-xl gap-x-4 gap-y-4 items-center justify-between">
          
          <div className="flex items-center px-4 w-full md:w-auto justify-center md:justify-start">
            <span className="text-lg md:text-xl font-medium text-[#F5F5F5] whitespace-nowrap" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
              Crafted under the iron rule of discipline
            </span>
          </div>

          <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2 items-center justify-center">
            {/* Item 1 */}
            <div className="flex items-center bg-[#0E0F11] rounded-full px-5 py-3 gap-3 w-full sm:w-auto border border-[#23252B] transition-colors whitespace-nowrap justify-center sm:justify-start">
              <Layers size={14} className="text-[#A1A1A6]" />
              <span className="text-xs font-medium text-[#F5F5F5] uppercase tracking-wide">
                Interdisciplinary Personality
              </span>
            </div>

            {/* Item 2 */}
            <div className="flex items-center bg-[#0E0F11] rounded-full px-5 py-3 gap-3 w-full sm:w-auto border border-[#23252B] transition-colors whitespace-nowrap justify-center sm:justify-start">
               <Brain size={14} className="text-[#A1A1A6]" />
              <span className="text-xs font-medium text-[#F5F5F5] uppercase tracking-wide">
                Future Neuroscientist
              </span>
            </div>

            {/* Item 3 */}
            <div className="flex items-center bg-[#0E0F11] rounded-full px-5 py-3 gap-3 w-full sm:w-auto border border-[#23252B] transition-colors whitespace-nowrap justify-center sm:justify-start">
               <Wallet size={14} className="text-[#A1A1A6]" />
              <span className="text-xs font-medium text-[#F5F5F5] uppercase tracking-wide">
                High Self worth
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
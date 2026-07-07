import React from 'react';
import { useContent } from '../i18n/LanguageContext';

const MyStory: React.FC = () => {
  const { myStory } = useContent();
  return (
    <div className="py-12 sm:py-16 md:py-24 px-4 md:px-8 max-w-[1550px] mx-auto border-t border-[#23252B]">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-12 md:gap-24 items-center">

        {/* Text Content */}
        <div className="md:col-span-6 lg:col-span-5 order-2 md:order-1">
          <span className="text-[10px] font-mono text-[#D6FF4F] block mb-4 sm:mb-6 border-b border-[#23252B] w-fit pb-1 tracking-widest">
            {myStory.sectionLabel}
          </span>
          <h2 className="font-instrument italic text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#F5F5F5] mb-6 sm:mb-10 leading-none">
            {myStory.heading}
          </h2>
          <div className="space-y-4 sm:space-y-6 md:space-y-8 text-[#A1A1A6] text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed font-light" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
            <p>
              {myStory.paras[0]}
            </p>
            <p>
              {myStory.paras[1]}
            </p>
            <p>
              {myStory.paras[2]}
            </p>
            <p>
              {myStory.paras[3]}
            </p>
          </div>
        </div>

        {/* Image */}
        <div className="md:col-span-6 lg:col-span-7 order-1 md:order-2 md:mt-20">
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#15171B] border border-[#23252B] rounded-lg md:rounded-sm">
            <img
              src="/img/mystory.webp"
              alt={myStory.imageAlt}
              loading="lazy"
              className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0E0F11]/20 to-transparent pointer-events-none"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyStory;
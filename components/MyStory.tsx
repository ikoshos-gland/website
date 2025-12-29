import React from 'react';

const MyStory: React.FC = () => {
  return (
    <div className="py-12 sm:py-16 md:py-24 px-4 md:px-8 max-w-[1550px] mx-auto border-t border-[#23252B]">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-12 md:gap-24 items-center">

        {/* Text Content */}
        <div className="md:col-span-6 lg:col-span-5 order-2 md:order-1">
          <span className="text-[10px] font-mono text-[#D6FF4F] block mb-4 sm:mb-6 border-b border-[#23252B] w-fit pb-1 tracking-widest">
            02 — BIOGRAPHY
          </span>
          <h2 className="font-instrument italic text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#F5F5F5] mb-6 sm:mb-10 leading-none">
            My Story
          </h2>
          <div className="space-y-4 sm:space-y-6 md:space-y-8 text-[#A1A1A6] text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed font-light" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
            <p>
              My name is Mert Koca, and I'm on a journey of relentless self-improvement, inspired by extraordinary thinkers and doers like Jordan Peterson, David Goggins, Robert Sapolsky, and Bruce Lipton. Each of these individuals has reshaped how we see the world and our potential within it.
            </p>
            <p>
              Jordan Peterson teaches the power of responsibility and meaning; David Goggins embodies unyielding mental toughness and pushing through pain; Robert Sapolsky delves into the deep science of human behavior, while Bruce Lipton explores the mind's profound impact on biology.
            </p>
            <p>
              Like them, I believe in the limitless capacity of the human spirit to grow, adapt, and transcend challenges.
            </p>
            <p>
              This website is a reflection of that philosophy — a space for transformation, learning, and becoming the best version of ourselves.
            </p>
          </div>
        </div>

        {/* Image */}
        <div className="md:col-span-6 lg:col-span-7 order-1 md:order-2 md:mt-20">
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#15171B] border border-[#23252B] rounded-lg md:rounded-sm">
            <img
              src="https://i.ibb.co/rfqN2BC2/Whats-App-mage-2024-10-04-at-20-37-32-526fd566.jpg"
              alt="Mert Koca holding a camera"
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
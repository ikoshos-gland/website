import React, { useState } from 'react';
import { Quote, ArrowLeft, ArrowRight } from 'lucide-react';
import { Testimonial } from '../types';

const Testimonials: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const testimonials: Testimonial[] = [
    {
      id: 1,
      quote: "The truest guide for everything in the world—for civilization, for life, and for success—is science and knowledge. Seeking a guide other than science and knowledge is ignorance, carelessness, and deviation.",
      author: "Atatürk",
      role: "Founder of the Republic of Turkey, Commander-in-chief of the Turkish War of Independence, Visionary Statesman & Reformer",
      image: "https://i.ibb.co/B5JVvv8Q/Screenshot-from-2025-12-29-03-17-31.png"
    },
    {
      id: 2,
      quote: "Every man can, if he so desires, become the sculptor of his own brain.",
      author: "Santiago Ramón y Cajal",
      role: "Spanish pathologist, histologist, neuroscientist, and Nobel Prize winner in Physiology or Medicine",
      image: "https://i.ibb.co/H5bNwpz/Screenshot-from-2025-12-29-03-17-50.png"
    }
  ];

  const nextSlide = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevSlide = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <div className="bg-[#15171B] border-t border-[#23252B] py-20 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col text-center pb-12 items-center justify-center">
          <span className="block text-[10px] text-[#D6FF4F] font-mono w-fit border-b border-[#23252B] mb-4 pb-1 tracking-widest">
            06 — CLIENT VOICES
          </span>
        </div>

        <div className="relative min-h-[500px]">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.id}
              className={`transition-opacity duration-500 ease-in-out grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-[#0E0F11] rounded-[2rem] border border-[#23252B] p-6 md:p-12 absolute inset-0 
                ${index === activeIndex ? 'opacity-100 z-10 pointer-events-auto relative' : 'opacity-0 z-0 pointer-events-none'}`}
            >
              <div className="md:col-span-5 h-full">
                <div className="aspect-[4/5] rounded-2xl overflow-hidden border border-[#23252B] relative h-full">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.author}
                    className="w-full h-full object-cover opacity-80 grayscale hover:grayscale-0 transition-all duration-500" 
                  />
                </div>
              </div>
              <div className="md:col-span-7 flex flex-col justify-center">
                <div className="mb-8">
                  <Quote size={32} />
                </div>
                <blockquote className="text-2xl md:text-4xl font-heading font-medium leading-tight text-[#F5F5F5] mb-8">
                  "{testimonial.quote}"
                </blockquote>
                <div>
                  <div className="text-[#F5F5F5] font-semibold text-lg">{testimonial.author}</div>
                  <div className="text-[#A1A1A6] text-sm uppercase tracking-widest mt-1">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 mt-8 relative z-20">
          <button onClick={prevSlide} className="w-12 h-12 rounded-full border border-[#23252B] bg-[#0E0F11] flex items-center justify-center text-[#A1A1A6] hover:text-[#0E0F11] hover:bg-[#D6FF4F] transition-all">
            <ArrowLeft size={20} />
          </button>
          <button onClick={nextSlide} className="w-12 h-12 rounded-full border border-[#23252B] bg-[#0E0F11] flex items-center justify-center text-[#A1A1A6] hover:text-[#0E0F11] hover:bg-[#D6FF4F] transition-all">
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Testimonials;
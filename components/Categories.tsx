import React, { useState } from 'react';
import { ArrowRight, RotateCw } from 'lucide-react';

interface FlashCardProps {
  subtitle: string;
  title: string;
  image: string;
  description: string[];
}

const FlashCard: React.FC<FlashCardProps> = ({ subtitle, title, image, description }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className="group perspective-[1000px] aspect-[3/4] sm:aspect-square cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div
        className={`relative w-full h-full transition-all duration-700 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''
          }`}
      >
        {/* Front Face */}
        <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] overflow-hidden rounded-2xl sm:rounded-3xl border border-[#23252B] bg-[#15171B]">
          <img
            src={image}
            alt={title}
            loading="lazy"
            className="opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 w-full h-full object-cover"
          />
          <div className="bg-gradient-to-t from-[#0E0F11] via-black/40 to-transparent absolute inset-0"></div>

          <div className="absolute bottom-0 left-0 w-full h-[40%] sm:h-[35%] p-3 sm:p-4 md:p-6 flex flex-col justify-start">
            <span className="text-[8px] sm:text-[10px] font-sans uppercase tracking-widest text-[#D6FF4F] mb-1 sm:mb-2 block shrink-0">
              {subtitle}
            </span>
            <h3 className="text-sm sm:text-lg md:text-xl lg:text-2xl font-heading font-medium text-[#F5F5F5] leading-tight shrink-0 line-clamp-2">
              {title}
            </h3>
            <div className="hidden sm:flex items-center gap-2 mt-2 sm:mt-4 text-[#A1A1A6] text-[10px] sm:text-xs uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <RotateCw size={10} className="sm:w-3 sm:h-3" />
              <span>Click to flip</span>
            </div>
          </div>
        </div>

        {/* Back Face */}
        <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl sm:rounded-3xl border border-[#23252B] bg-[#15171B] p-3 sm:p-4 md:p-6 flex flex-col justify-center overflow-y-auto no-scrollbar">
          <div className="h-full flex flex-col justify-center">
            <h4 className="text-[#D6FF4F] font-heading text-sm sm:text-base md:text-lg mb-2 sm:mb-4 leading-tight border-b border-[#23252B] pb-2">
              Key Achievements
            </h4>
            <ul className="space-y-2 sm:space-y-3 md:space-y-4">
              {description.map((point, i) => (
                <li key={i} className="text-[10px] sm:text-xs md:text-sm text-[#A1A1A6] leading-relaxed flex gap-2 sm:gap-3">
                  <span className="shrink-0 text-[#D6FF4F] mt-1 sm:mt-1.5 w-1 h-1 rounded-full bg-[#D6FF4F]"></span>
                  <span className="line-clamp-3 sm:line-clamp-none">{point}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 sm:mt-8 pt-2 sm:pt-4 border-t border-[#23252B] flex justify-end">
              <span className="text-[8px] sm:text-[10px] uppercase tracking-widest text-[#52525B]">Tap to return</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Categories: React.FC = () => {
  const categories: FlashCardProps[] = [
    {
      subtitle: "Scholarship",
      title: "1.5 Year Tuseb Embedded Machine Learning Scholar",
      image: "https://i.ibb.co/JWpD5p89/Gemini-Generated-Image-4cjhe94cjhe94cjh.png",
      description: [
        "Created graphs, charts and other visualizations (Manim package) to convey results of data analysis using python.",
        "Worked with LSTM + CNN, Random Forest and Gaussian process machine learning models to interpret our EMG data.",
        "Developed a real time signal interpretation script for real-time interpretation."
      ]
    },
    {
      subtitle: "Brain Mapping Enthusiast",
      title: "1 Year Long-Internship in KUTTAM",
      image: "https://i.ibb.co/zTsqcFL2/Gemini-Generated-mage-kjwbhekjwbhekjwb.png",
      description: [
        "KUTTAM: Koç University Research Center for Translational Medicine.",
        "Studies Expansion Microscopy Techniques to surpass light diffraction limit.",
        "Tries to integrate state of the art machine learning technique for vessel and neural segmentation to map the brain on computer at nanometer scale resolution.",
        "Also learns newer insights in both wet-lab and computationally from other research groups in Koç Hospital."
      ]
    },
    {
      subtitle: "Start-up",
      title: "PsyAI",
      image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1200&auto=format&fit=crop",
      description: [
        "Advanced Langchain & Langgraph workflows with UI UX to support parents.",
        "Powered by LangChain and LangGraph, my start-up project features a parent-focused agentic workflow.",
        "It also leverages integrated memory and RAG to provide personalized insights from curated books and data sources."
      ]
    },
    {
      subtitle: "Member",
      title: "easyegitim",
      image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1200&auto=format&fit=crop",
      description: [
        "Creating personalized LLM tools to assist students and improve active learning."
      ]
    }
  ];

  return (
    <div className="py-8 sm:py-12 px-4 md:px-8 max-w-[1550px] mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8 sm:mb-12 gap-6 sm:gap-8">
        <div>
          <span className="text-[10px] font-mono text-[#D6FF4F] block mb-3 sm:mb-4 border-b border-[#23252B] w-fit pb-1 tracking-widest">
            01 — EXPERTISE
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-[#F5F5F5] font-heading font-medium tracking-tight leading-tight">
            My Projects
          </h2>
          <a href="#" className="mt-6 sm:mt-8 inline-flex items-center gap-2 sm:gap-3 bg-[#23252B] px-4 sm:px-6 py-2.5 sm:py-3 rounded-full text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-[#F5F5F5] transition-colors hover:bg-[#D6FF4F] hover:text-[#0E0F11]">
            All Projects
            <ArrowRight size={14} className="sm:w-4 sm:h-4" />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        {categories.map((cat, index) => (
          <FlashCard key={index} {...cat} />
        ))}
      </div>
    </div>
  );
};

export default Categories;
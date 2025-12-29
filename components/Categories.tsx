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
      className="group perspective-[1000px] aspect-square cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div
        className={`relative w-full h-full transition-all duration-700 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''
          }`}
      >
        {/* Front Face */}
        <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] overflow-hidden rounded-3xl border border-[#23252B] bg-[#15171B]">
          <img
            src={image}
            alt={title}
            className="opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 w-full h-full object-cover"
          />
          <div className="bg-gradient-to-t from-[#0E0F11] via-black/40 to-transparent absolute inset-0"></div>

          <div className="absolute bottom-0 left-0 w-full h-[35%] p-6 flex flex-col justify-start">
            <span className="text-[10px] font-sans uppercase tracking-widest text-[#D6FF4F] mb-2 block shrink-0">
              {subtitle}
            </span>
            <h3 className="text-xl md:text-2xl font-heading font-medium text-[#F5F5F5] leading-tight shrink-0">
              {title}
            </h3>
            <div className="flex items-center gap-2 mt-4 text-[#A1A1A6] text-xs uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <RotateCw size={12} />
              <span>Click to flip</span>
            </div>
          </div>
        </div>

        {/* Back Face */}
        <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-3xl border border-[#23252B] bg-[#15171B] p-6 flex flex-col justify-center overflow-y-auto no-scrollbar">
          <div className="h-full flex flex-col justify-center">
            <h4 className="text-[#D6FF4F] font-heading text-lg mb-4 leading-tight border-b border-[#23252B] pb-2">
              Key Achievements
            </h4>
            <ul className="space-y-4">
              {description.map((point, i) => (
                <li key={i} className="text-sm text-[#A1A1A6] leading-relaxed flex gap-3">
                  <span className="shrink-0 text-[#D6FF4F] mt-1.5 w-1 h-1 rounded-full bg-[#D6FF4F]"></span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 pt-4 border-t border-[#23252B] flex justify-end">
              <span className="text-[10px] uppercase tracking-widest text-[#52525B]">Tap to return</span>
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
    <div className="py-12 px-4 md:px-8 max-w-[1550px] mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-8">
        <div>
          <span className="text-[10px] font-mono text-[#D6FF4F] block mb-4 border-b border-[#23252B] w-fit pb-1 tracking-widest">
            01 — EXPERTISE
          </span>
          <h2 className="text-3xl md:text-5xl text-[#F5F5F5] font-heading font-medium tracking-tight leading-tight">
            My Projects
          </h2>
          <a href="#" className="mt-8 inline-flex items-center gap-3 bg-[#23252B] px-6 py-3 rounded-full text-xs font-semibold uppercase tracking-widest text-[#F5F5F5] transition-colors hover:bg-[#D6FF4F] hover:text-[#0E0F11]">
            All Projects
            <ArrowRight size={16} />
          </a>
        </div>
        <p className="leading-relaxed text-[#A1A1A6] max-w-sm md:text-right">
          <span className="block">Holistic design systems for brands</span>
          <span className="block">ready to define their category.</span>
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map((cat, index) => (
          <FlashCard key={index} {...cat} />
        ))}
      </div>
    </div>
  );
};

export default Categories;
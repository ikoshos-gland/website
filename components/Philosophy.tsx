import React from 'react';
import { ArrowUpRight } from 'lucide-react';

interface Publication {
  year: string;
  journal: string;
  journalColor: string;
  title: string;
  authors: string;
  metricLabel: string;
  metricValue: string;
}

const PublicationCard: React.FC<Publication> = ({ year, journal, journalColor, title, authors, metricLabel, metricValue }) => (
  <div className="group relative flex flex-col md:flex-row items-center gap-4 sm:gap-6 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#23252B] bg-[#0E0F11] hover:bg-[#15171B] transition-all duration-300">

    {/* Year Box */}
    <div className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl sm:rounded-2xl border border-[#23252B] flex items-center justify-center bg-[#0E0F11] group-hover:border-[#3F4148] transition-colors">
      <span className="text-lg sm:text-xl md:text-2xl font-bold text-[#3F4148] group-hover:text-[#F5F5F5] transition-colors font-heading">{year}</span>
    </div>

    {/* Main Info */}
    <div className="flex-1 w-full text-center md:text-left z-10">
      <div className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1 sm:mb-2 ${journalColor}`}>
        {journal}
      </div>
      <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-heading font-medium text-[#F5F5F5] mb-1 sm:mb-2 leading-tight">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-[#A1A1A6] italic font-serif">
        {authors}
      </p>
    </div>

    {/* Metrics & Action (Desktop) */}
    <div className="hidden lg:flex shrink-0 gap-6 xl:gap-12 items-center pl-6 xl:pl-8 border-l border-[#23252B] h-16 ml-4">

      {/* Bar Chart Metric */}
      <div className="flex flex-col justify-center w-24 xl:w-32">
        <span className="text-[10px] uppercase tracking-wider text-[#52525B] mb-2 text-left">{metricLabel}</span>
        <div className="flex items-end gap-[3px] h-6">
          <div className="w-1 bg-[#23252B] group-hover:bg-[#52525B] h-[40%] rounded-full transition-colors delay-75"></div>
          <div className="w-1 bg-[#23252B] group-hover:bg-[#52525B] h-[70%] rounded-full transition-colors delay-100"></div>
          <div className="w-1 bg-[#23252B] group-hover:bg-[#52525B] h-[50%] rounded-full transition-colors delay-150"></div>
          <div className="w-1 bg-[#23252B] group-hover:bg-[#D6FF4F] h-[100%] rounded-full transition-colors delay-200"></div>
          <div className="w-1 bg-[#23252B] group-hover:bg-[#52525B] h-[60%] rounded-full transition-colors delay-300"></div>
          <div className="w-1 bg-[#23252B] group-hover:bg-[#52525B] h-[80%] rounded-full transition-colors delay-400"></div>
        </div>
      </div>

      {/* Metric Value */}
      <div className="text-right w-40 xl:w-60">
        <span className="text-[10px] xl:text-xs text-[#A1A1A6] font-mono group-hover:text-[#F5F5F5] transition-colors break-all">{metricValue}</span>
      </div>

      {/* Button */}
      <div className="w-10 h-10 xl:w-12 xl:h-12 rounded-full border border-[#23252B] flex items-center justify-center text-[#52525B] group-hover:text-[#D6FF4F] group-hover:border-[#D6FF4F] transition-all cursor-pointer bg-[#0E0F11]">
        <ArrowUpRight size={16} className="xl:w-5 xl:h-5" strokeWidth={1.5} />
      </div>
    </div>

    {/* Mobile/Tablet Metrics */}
    <div className="lg:hidden w-full flex justify-between items-center pt-3 sm:pt-4 border-t border-[#23252B] mt-1 sm:mt-2">
      <div className="flex flex-col">
        <span className="text-[8px] sm:text-[10px] uppercase tracking-wider text-[#52525B]">{metricLabel}</span>
        <span className="text-[10px] sm:text-xs text-[#F5F5F5] mt-0.5 sm:mt-1 break-all max-w-[200px]">{metricValue}</span>
      </div>
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-[#23252B] flex items-center justify-center text-[#A1A1A6]">
        <ArrowUpRight size={14} className="sm:w-4 sm:h-4" />
      </div>
    </div>

  </div>
);

const Publications: React.FC = () => {
  const publications: Publication[] = [
    {
      year: "2025",
      journal: "SPRINGER NATURE LINK",
      journalColor: "text-blue-400",
      title: "Molecular Crowding by Computational Approaches",
      authors: "Orkid Coskuner-Weber, Mert Koca, Vladimir N Uversky",
      metricLabel: "DOI",
      metricValue: "10.1007/978-3-032-03370-3_21"
    },
    {
      year: "2025",
      journal: "QUANTIUM DERGİSİ 5. SAYI",
      journalColor: "text-purple-400",
      title: "Kuantum-Klasik Bilinç Modelleri ve İnterdisipliner Perspektifler",
      authors: "Mert Koca",
      metricLabel: "Link",
      metricValue: "qturkey.org"
    },
    {
      year: "2025",
      journal: "COMING SOON",
      journalColor: "text-gray-400",
      title: "Coming Soon",
      authors: "Mert Koca",
      metricLabel: "Status",
      metricValue: "In Prep"
    }
  ];

  return (
    <div className="py-12 sm:py-16 md:py-24 px-4 md:px-8 max-w-[1550px] mx-auto border-t border-[#23252B]">
      <div className="flex flex-col items-center text-center mb-8 sm:mb-12 md:mb-16">
        <span className="text-[10px] font-mono text-[#D6FF4F] block mb-4 sm:mb-6 border-b border-[#23252B] w-fit pb-1 tracking-widest">
          04 — PUBLICATIONS
        </span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-[#F5F5F5] font-heading font-medium tracking-tight mb-3 sm:mb-4">
          Selected Publications
        </h2>
        <p className="text-[#A1A1A6] text-sm sm:text-base md:text-lg max-w-xl px-4">
          Recent contributions to the field of neuroimmunology.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:gap-4">
        {publications.map((pub, index) => (
          <PublicationCard key={index} {...pub} />
        ))}
      </div>
    </div>
  );
};

export default Publications;
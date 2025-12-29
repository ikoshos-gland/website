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
  <div className="group relative flex flex-col md:flex-row items-center gap-6 p-6 rounded-3xl border border-[#23252B] bg-[#0E0F11] hover:bg-[#15171B] transition-all duration-300">

    {/* Year Box */}
    <div className="shrink-0 w-20 h-20 rounded-2xl border border-[#23252B] flex items-center justify-center bg-[#0E0F11] group-hover:border-[#3F4148] transition-colors">
      <span className="text-2xl font-bold text-[#3F4148] group-hover:text-[#F5F5F5] transition-colors font-heading">{year}</span>
    </div>

    {/* Main Info */}
    <div className="flex-1 w-full text-center md:text-left z-10">
      <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${journalColor}`}>
        {journal}
      </div>
      <h3 className="text-xl md:text-2xl font-heading font-medium text-[#F5F5F5] mb-2 leading-tight">
        {title}
      </h3>
      <p className="text-sm text-[#A1A1A6] italic font-serif">
        {authors}
      </p>
    </div>

    {/* Metrics & Action (Desktop) */}
    <div className="hidden md:flex shrink-0 gap-12 items-center pl-8 border-l border-[#23252B] h-16 ml-4">

      {/* Bar Chart Metric */}
      <div className="flex flex-col justify-center w-32">
        <span className="text-[10px] uppercase tracking-wider text-[#52525B] mb-2 text-right md:text-left">{metricLabel}</span>
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
      <div className="text-right w-60">
        <span className="text-xs text-[#A1A1A6] font-mono group-hover:text-[#F5F5F5] transition-colors whitespace-nowrap">{metricValue}</span>
      </div>

      {/* Button */}
      <div className="w-12 h-12 rounded-full border border-[#23252B] flex items-center justify-center text-[#52525B] group-hover:text-[#D6FF4F] group-hover:border-[#D6FF4F] transition-all cursor-pointer bg-[#0E0F11]">
        <ArrowUpRight size={20} strokeWidth={1.5} />
      </div>
    </div>

    {/* Mobile Metrics */}
    <div className="md:hidden w-full flex justify-between items-center pt-4 border-t border-[#23252B] mt-2">
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-wider text-[#52525B]">{metricLabel}</span>
        <span className="text-xs text-[#F5F5F5] mt-1">{metricValue}</span>
      </div>
      <div className="w-10 h-10 rounded-full border border-[#23252B] flex items-center justify-center text-[#A1A1A6]">
        <ArrowUpRight size={16} />
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
    <div className="py-24 px-4 md:px-8 max-w-[1550px] mx-auto border-t border-[#23252B]">
      <div className="flex flex-col items-center text-center mb-16">
        <span className="text-[10px] font-mono text-[#D6FF4F] block mb-6 border-b border-[#23252B] w-fit pb-1 tracking-widest">
          04 — PUBLICATIONS
        </span>
        <h2 className="text-4xl md:text-6xl text-[#F5F5F5] font-heading font-medium tracking-tight mb-4">
          Selected Publications
        </h2>
        <p className="text-[#A1A1A6] text-lg max-w-xl">
          Recent contributions to the field of neuroimmunology.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {publications.map((pub, index) => (
          <PublicationCard key={index} {...pub} />
        ))}
      </div>
    </div>
  );
};

export default Publications;
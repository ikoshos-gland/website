import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, BookOpen, FileText, MessageCircle } from 'lucide-react';
import { useContent } from '../i18n/LanguageContext';

type HomeBlogProps = {
  onChatClick: () => void;
};

const HomeBlog: React.FC<HomeBlogProps> = ({ onChatClick }) => {
  const c = useContent();

  const destinations = [
    {
      label: c.homeBlog.blogLink,
      to: '/blog',
      icon: BookOpen,
    },
    {
      label: c.homeBlog.thesisLink,
      to: '/thesis',
      icon: FileText,
    },
  ];

  return (
    <section className="w-full px-4 sm:px-6 md:px-12 py-20 md:py-28 max-w-[1600px] mx-auto">
      <div className="relative overflow-hidden rounded-3xl border border-[#23252B] bg-[#0A0B0D]/82 px-6 py-10 sm:px-10 md:px-14 md:py-14 backdrop-blur-sm">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#D6FF4F]/[0.035] blur-3xl pointer-events-none" />

        <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div className="max-w-3xl">
            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.3em] text-[#D6FF4F]">
              {c.homeBlog.sectionLabel}
            </p>
            <h2 className="font-heading text-3xl font-medium leading-tight text-[#F5F5F5] sm:text-4xl md:text-5xl">
              {c.homeBlog.heading}
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#A1A1A6] sm:text-lg">
              {c.homeBlog.description}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {destinations.map(({ label, to, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="group flex min-h-24 flex-col justify-between rounded-2xl border border-[#23252B] bg-black/55 p-4 transition-all duration-300 hover:border-[#D6FF4F]/60 hover:bg-[#111316]"
              >
                <Icon size={18} className="text-[#A1A1A6] transition-colors group-hover:text-[#D6FF4F]" />
                <span className="mt-5 flex items-end justify-between gap-3 text-sm font-medium text-[#F5F5F5]">
                  {label}
                  <ArrowUpRight size={16} className="shrink-0 text-[#52525B] transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#D6FF4F]" />
                </span>
              </Link>
            ))}

            <button
              type="button"
              onClick={onChatClick}
              className="group flex min-h-24 flex-col justify-between rounded-2xl border border-[#23252B] bg-black/55 p-4 text-left transition-all duration-300 hover:border-[#D6FF4F]/60 hover:bg-[#111316]"
            >
              <MessageCircle size={18} className="text-[#A1A1A6] transition-colors group-hover:text-[#D6FF4F]" />
              <span className="mt-5 flex w-full items-end justify-between gap-3 text-sm font-medium text-[#F5F5F5]">
                {c.homeBlog.chatLink}
                <ArrowUpRight size={16} className="shrink-0 text-[#52525B] transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#D6FF4F]" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeBlog;

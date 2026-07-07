import React from 'react';
import { Link } from 'react-router-dom';
import { getPosts } from '../blog/posts';
import { useLang, useContent } from '../i18n/LanguageContext';

const HomeBlog: React.FC = () => {
  const { lang } = useLang();
  const c = useContent();
  const latest = getPosts(lang).slice(0, 3);
  if (latest.length === 0) return null;

  return (
    <section className="w-full px-4 sm:px-6 md:px-12 py-16 md:py-24 max-w-[1600px] mx-auto">
      <div className="flex items-end justify-between mb-10 md:mb-14">
        <div>
          <p className="font-mono text-xs tracking-[0.3em] text-[#A1A1A6] uppercase mb-3">{c.homeBlog.sectionLabel}</p>
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl text-[#F5F5F5] font-medium">{c.homeBlog.heading}</h2>
        </div>
        <Link to="/blog" className="hidden sm:inline-block font-mono text-xs tracking-widest uppercase text-[#A1A1A6] hover:text-[#D6FF4F] border-b border-[#23252B] pb-1 transition-colors">
          {c.homeBlog.readAll}
        </Link>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {latest.map((p) => (
          <Link
            key={p.slug}
            to={`/blog/${p.slug}`}
            className="group flex flex-col bg-[#15171B] border border-[#23252B] rounded-2xl p-5 hover:bg-[#1a1b1e] transition-colors duration-300"
          >
            <div className="flex items-center gap-3 font-mono text-[10px] tracking-widest uppercase text-[#A1A1A6] mb-4">
              <span>{p.date.replace(/-/g, ' · ')}</span>
              <span className="px-2 py-0.5 border border-[#23252B] rounded-full">{(c.blog.contentType as Record<string, string>)[p.contentType] ?? p.contentType}</span>
            </div>
            <h3 className="font-heading text-lg text-[#F5F5F5] font-medium mb-2 group-hover:text-[#D6FF4F] transition-colors">{p.title}</h3>
            <p className="text-sm text-[#A1A1A6] leading-relaxed line-clamp-3">{p.excerpt}</p>
          </Link>
        ))}
      </div>
      <Link to="/blog" className="sm:hidden mt-8 inline-block font-mono text-xs tracking-widest uppercase text-[#A1A1A6] hover:text-[#D6FF4F] border-b border-[#23252B] pb-1">
        {c.homeBlog.readAll}
      </Link>
    </section>
  );
};

export default HomeBlog;

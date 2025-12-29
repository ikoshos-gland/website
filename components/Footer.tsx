import React from 'react';
import { Instagram, Twitter, Linkedin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0E0F11] text-[#F5F5F5] pt-12 sm:pt-16 md:pt-20 pb-8 sm:pb-10 border-t border-[#23252B] mt-16 sm:mt-20 md:mt-24">
      <div className="w-full text-center text-[8px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[#A1A1A6]/50 mb-10 sm:mb-16 font-sans select-none px-4">
        Design for the digital age
      </div>

      <div className="max-w-[1550px] mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-8 sm:gap-10 md:gap-12 mb-12 sm:mb-16 md:mb-20 border-b border-[#23252B] pb-10 sm:pb-12 md:pb-16">

        {/* Brand */}
        <div className="sm:col-span-2 md:col-span-4 pr-0 md:pr-12">
          <a href="#" className="flex items-center gap-2 mb-4 sm:mb-6 group">
            <span className="font-great-vibes text-2xl sm:text-3xl text-[#F5F5F5] group-hover:text-[#D6FF4F] transition-colors">
              Mertoshi
            </span>
          </a>
          <p className="leading-relaxed text-[#A1A1A6] max-w-sm mb-6 sm:mb-8 text-xs sm:text-sm">
            We help ambitious companies build future-proof brands and digital products that stand the test of time.
          </p>
          <div className="flex gap-3 sm:gap-4">
            {[Instagram, Twitter, Linkedin].map((Icon, i) => (
              <a key={i} href="#" className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[#23252B] flex items-center justify-center hover:bg-[#F5F5F5] hover:text-[#0E0F11] transition-colors text-[#A1A1A6]">
                <Icon size={16} className="sm:w-[18px] sm:h-[18px]" />
              </a>
            ))}
          </div>
        </div>

        {/* Links */}
        <div className="grid grid-cols-2 gap-6 sm:gap-8 sm:col-span-2 md:contents">
          <div className="md:col-span-2">
            <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#52525B] mb-4 sm:mb-6 font-sans">
              Sitemap
            </h4>
            <ul className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-[#A1A1A6]">
              {['Projects', 'CV'].map(link => (
                <li key={link}><a href="#" className="hover:text-[#D6FF4F] transition-colors">{link}</a></li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#52525B] mb-4 sm:mb-6 font-sans">
              Socials
            </h4>
            <ul className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-[#A1A1A6]">
              {['Instagram', 'Twitter', 'LinkedIn', 'Dribbble'].map(link => (
                <li key={link}><a href="#" className="hover:text-[#D6FF4F] transition-colors">{link}</a></li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="sm:col-span-2 md:col-span-4">
          <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#52525B] mb-4 sm:mb-6 font-sans">
            New Business
          </h4>
          <p className="text-[#A1A1A6] text-xs sm:text-sm mb-4 sm:mb-6">
            Currently accepting new projects for Q3 2024. Let's build something great.
          </p>
          <a href="mailto:hello@mertoshi.com" className="text-lg sm:text-2xl md:text-3xl font-heading font-medium text-[#F5F5F5] hover:text-[#D6FF4F] transition-colors underline decoration-[#23252B] underline-offset-4 sm:underline-offset-8 decoration-1 break-all">
            hello@mertoshi.com
          </a>
        </div>
      </div>

      <div className="max-w-[1550px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0 text-[8px] sm:text-[10px] text-[#52525B] font-sans tracking-wide uppercase">
        <div className="flex gap-4 sm:gap-6">
          <a href="#" className="hover:text-[#F5F5F5]">Privacy</a>
          <a href="#" className="hover:text-[#F5F5F5]">Terms</a>
        </div>
        <span>© 2025 Mertoshi Inc.</span>
      </div>
    </footer>
  );
};

export default Footer;
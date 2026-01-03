import React from 'react';
import { Instagram, Linkedin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0E0F11] text-[#F5F5F5] pt-12 sm:pt-16 md:pt-20 pb-8 sm:pb-10 border-t border-[#23252B] mt-16 sm:mt-20 md:mt-24">
      <div className="w-full text-center text-[8px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[#A1A1A6]/50 mb-6 sm:mb-10 font-sans select-none px-4">
        Per aspera ad astra
      </div>

      <div className="max-w-[1550px] mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-6 sm:gap-8 md:gap-10 mb-8 sm:mb-10 md:mb-12 border-b border-[#23252B] pb-6 sm:pb-8 md:pb-10">

        {/* Brand */}
        <div className="sm:col-span-2 md:col-span-4 pr-0 md:pr-12">
          <a href="#" className="flex items-center gap-2 mb-4 sm:mb-6 group">
            <span className="font-great-vibes text-3xl sm:text-4xl md:text-5xl text-[#F5F5F5] group-hover:text-[#D6FF4F] transition-colors">
              Mertoshi
            </span>
          </a>
          <p className="leading-relaxed text-[#A1A1A6] max-w-sm mb-6 sm:mb-8 text-xs sm:text-sm">
            Personal Website of Mert Koca
          </p>
          <div className="flex gap-3 sm:gap-4">
            {[
              { Icon: Instagram, href: 'https://www.instagram.com/augst.von.mackenss/' },
              { Icon: Linkedin, href: 'https://www.linkedin.com/in/mert-koca-503372276/' },
            ].map(({ Icon, href }, i) => (
              <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[#23252B] flex items-center justify-center hover:bg-[#F5F5F5] hover:text-[#0E0F11] transition-colors text-[#A1A1A6]">
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
              {[
                { name: 'Instagram', href: 'https://www.instagram.com/augst.von.mackenss/' },
                { name: 'LinkedIn', href: 'https://www.linkedin.com/in/mert-koca-503372276/' },
              ].map(link => (
                <li key={link.name}><a href={link.href} target="_blank" rel="noopener noreferrer" className="hover:text-[#D6FF4F] transition-colors">{link.name}</a></li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact */}
        <div className="sm:col-span-2 md:col-span-4">
          <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#52525B] mb-4 sm:mb-6 font-sans">
            Feel Free to Contact Me
          </h4>
          <a href="mailto:fatih.mertkoca2@gmail.com" className="text-lg sm:text-2xl md:text-3xl font-heading font-medium text-[#F5F5F5] hover:text-[#D6FF4F] transition-colors underline decoration-[#23252B] underline-offset-4 sm:underline-offset-8 decoration-1 break-all">
            fatih.mertkoca2@gmail.com
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
import React, { useState, useEffect } from 'react';
import { Menu, X, Mail } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <>
      {/* Mobile Menu Overlay */}
      <div 
        className={`fixed inset-0 bg-[#0E0F11]/95 backdrop-blur-xl z-[100] transition-opacity duration-300 flex flex-col items-center justify-center ${
          isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button 
          onClick={toggleMenu} 
          className="absolute top-6 right-6 p-2 text-[#F5F5F5] hover:text-[#D6FF4F] transition-colors"
        >
          <X size={32} strokeWidth={1.5} />
        </button>
        <nav className="flex flex-col gap-8 text-center text-3xl font-heading font-medium tracking-tight text-[#F5F5F5]">
          <a href="#" className="hover:text-[#D6FF4F] transition-colors" onClick={toggleMenu}>Projects</a>
          <a href="#" className="hover:text-[#D6FF4F] transition-colors" onClick={toggleMenu}>CV</a>
        </nav>
        <div className="mt-12 flex gap-6">
          <a href="#" className="text-xs font-sans uppercase tracking-widest text-[#A1A1A6] hover:text-[#F5F5F5] border-b border-[#23252B] pb-1">
            Start a Project
          </a>
        </div>
      </div>

      {/* Floating Navigation */}
      <div className="fixed z-50 flex pt-3 sm:pt-4 md:pt-6 px-2 sm:px-3 md:px-4 top-0 right-0 left-0 justify-center pointer-events-none">
        <nav className="flex pointer-events-auto shadow-black/50 bg-[#15171B]/80 w-full max-w-[1500px] border-[#23252B] border rounded-full py-2 sm:py-2.5 md:py-3 px-3 sm:px-4 md:px-6 shadow-2xl backdrop-blur-sm items-center justify-between">

          {/* Desktop Left Nav */}
          <div className="hidden md:flex gap-6 lg:gap-8 items-center">
            <a href="#" className="text-xs lg:text-sm font-medium text-[#F5F5F5] hover:text-[#D6FF4F] transition-colors">Projects</a>
          </div>

          {/* Mobile Hamburger */}
          <button onClick={toggleMenu} className="md:hidden p-1 text-[#F5F5F5] hover:text-[#D6FF4F] transition-colors">
            <Menu size={20} strokeWidth={1.5} className="sm:w-6 sm:h-6" />
          </button>

          {/* Logo */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <a href="#" className="flex items-center justify-center group">
              <span className="font-great-vibes text-2xl sm:text-3xl md:text-4xl text-[#F5F5F5] group-hover:text-[#D6FF4F] transition-colors">
                Mertoshi
              </span>
            </a>
          </div>

          {/* Desktop Right Nav */}
          <div className="hidden md:flex gap-4 lg:gap-8 items-center">
            <a href="#" className="text-xs lg:text-sm font-medium text-[#A1A1A6] hover:text-[#F5F5F5] transition-colors">CV</a>
            <a href="#" className="bg-[#F5F5F5] hover:bg-[#D6FF4F] text-[#0E0F11] px-3 lg:px-5 py-1.5 lg:py-2 rounded-full text-[10px] lg:text-xs font-semibold uppercase tracking-wider transition-colors">
              Contact
            </a>
          </div>

          {/* Mobile User Icon */}
          <a href="#" className="md:hidden p-1 text-[#F5F5F5] hover:text-[#D6FF4F] transition-colors">
            <Mail size={20} strokeWidth={1.5} className="sm:w-6 sm:h-6" />
          </a>
        </nav>
      </div>
    </>
  );
};

export default Navbar;
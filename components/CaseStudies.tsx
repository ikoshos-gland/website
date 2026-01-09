import React from 'react';
import { ArrowRight, MapPin, Camera } from 'lucide-react';

interface PhotoWork {
  id: string;
  title: string;
  category: string;
  location: string;
  gear: string;
  image: string;
  isFeatured?: boolean;
}

const PhotoCard: React.FC<PhotoWork> = ({ title, category, location, gear, image, isFeatured }) => (
  <div className="group cursor-pointer bg-[#0E0F11] p-3 sm:p-4 md:p-6 hover:bg-[#15171B] transition-colors">
    <div className="relative aspect-square bg-[#15171B] rounded-xl sm:rounded-2xl overflow-hidden mb-3 sm:mb-5 border border-[#23252B]">
      <img src={image} alt={title} loading="lazy" decoding="async" className="opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 w-full h-full object-cover" />
      {isFeatured && (
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-[#0E0F11]/80 border border-[#23252B] px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-medium text-[#F5F5F5] uppercase tracking-wider">
          Top Pick
        </div>
      )}
    </div>
    <div className="flex justify-between items-start mb-1 sm:mb-2">
      <div>
        <h3 className="text-sm sm:text-base md:text-lg font-heading font-medium text-[#F5F5F5] tracking-tight">{title}</h3>
        <p className="uppercase text-[8px] sm:text-[10px] text-[#A1A1A6] tracking-widest">{category}</p>
      </div>
    </div>
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-0 text-[10px] sm:text-xs text-[#52525B] mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-[#23252B]">
      <div className="flex items-center gap-1 sm:gap-2 group-hover:text-[#D6FF4F] transition-colors">
        <MapPin size={10} className="sm:w-3 sm:h-3" />
        <span className="font-medium">{location}</span>
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        <Camera size={10} className="sm:w-3 sm:h-3" />
        <span className="font-medium text-[#A1A1A6]">{gear}</span>
      </div>
    </div>
  </div>
);

const CaseStudies: React.FC = () => {
  const fallbackPhotos: PhotoWork[] = [
    { id: "1", title: "Urban Solitude", category: "Street", location: "Istanbul, TR", gear: "Nikon D3100", image: "https://i.ibb.co/5X52yrQ6/Ev-17-02.jpg", isFeatured: true },
    { id: "2", title: "The Artisan", category: "Portrait", location: "Beykoz, İstanbul", gear: "Nikon D3100", image: "https://i.ibb.co/WWKxzk8p/Bazen-hissettiklerimi-kendime-bile-a-klayam-yorum-Bazense-i-imden-rp-n-rcas-na-anlatmak-geli.jpg" },
    { id: "3", title: "Silent Peaks", category: "Camel Cricket", location: "Kuşadası Güzelçamlı", gear: "Nikon D3100", image: "https://i.ibb.co/JW38NYZg/get.jpg" },
    { id: "4", title: "Mısırcı", category: "Black / White", location: "İzmir", gear: "Nikon D3100", image: "https://i.ibb.co/jPtScSHm/DSC-0232-Geli-tirilmi-SR.jpg" },
    { id: "5", title: "Bottik", category: "Botikkedy", location: "Beykoz, İstanbul", gear: "Nikon D3100", image: "https://i.ibb.co/nqv57Lv6/bottikkedy.jpg", isFeatured: true },
    { id: "6", title: "Ephemeral", category: "", location: "Şirince, İzmir", gear: "Nikon D3100", image: "https://i.ibb.co/7Nkv5kv6/g-ne-28.jpg" },
  ];

  const photos = fallbackPhotos;

  return (
    <div className="border-t border-[#23252B] bg-[#0E0F11]">
      <div className="max-w-[1550px] mx-auto grid grid-cols-1 md:grid-cols-12">

        {/* Sidebar Info */}
        <div className="md:col-span-3 p-4 sm:p-6 md:p-8 md:border-r border-[#23252B] flex flex-col justify-between h-auto md:min-h-[500px] lg:min-h-[600px] relative">
          <div className="md:sticky md:top-32 lg:top-48 z-10">
            <span className="text-[10px] font-mono text-[#D6FF4F] block mb-3 sm:mb-4 border-b border-[#23252B] w-fit pb-1 tracking-widest">
              03 — ART
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-heading font-medium tracking-tight leading-[0.95] mb-4 sm:mb-6 text-[#F5F5F5]">
              Some Of My Art
            </h2>

            {/* Crazy Vertical Text - Hidden on smaller screens */}
            <div className="hidden lg:flex mt-8 select-none justify-start">
              <span
                className="text-4xl xl:text-5xl 2xl:text-6xl font-bold text-[#2A2C33] hover:text-[#D6FF4F] transition-colors duration-500 whitespace-nowrap tracking-tighter cursor-default"
                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
              >
                CHECK MY INSTAGRAM FOR MORE
              </span>
            </div>

            <div className="mt-6 sm:mt-8 w-full h-px bg-[#23252B] hidden md:block"></div>
          </div>
          <div className="mt-6 sm:mt-8 md:mt-0 relative z-20">
            <a
              href="https://www.instagram.com/augst.von.mackenss/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#15171B] border border-[#23252B] rounded-full text-[#F5F5F5] px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3 sm:gap-4 text-[10px] sm:text-xs font-semibold uppercase tracking-widest hover:border-[#D6FF4F] hover:text-[#D6FF4F] transition-colors group"
            >
              View Gallery
              <ArrowRight size={14} className="sm:w-4 sm:h-4" />
            </a>
          </div>
        </div>

        {/* Listings */}
        <div className="md:col-span-9 grid grid-cols-2 lg:grid-cols-3 gap-px bg-[#23252B]">
          {photos.map(photo => <PhotoCard key={photo.id} {...photo} />)}
        </div>
      </div>
    </div>
  );
};

export default CaseStudies;
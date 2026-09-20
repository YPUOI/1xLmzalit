import React from 'react';
import wallpaperImg from '../assets/images/ucl_galaxy_wallpaper_1789906614004.jpg';

export const UclStarsBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* 1. Deep Midnight Base Layer */}
      <div className="absolute inset-0 bg-[#050814]" />

      {/* 2. Ultra-wide Futuristic Deep Blue Galaxy Wallpaper */}
      <div className="absolute inset-0 w-full h-full transform-gpu will-change-transform">
        <img
          src={wallpaperImg}
          alt="UEFA Champions League Galaxy Wallpaper"
          className="w-full h-full object-cover object-center opacity-60"
          loading="eager"
          decoding="async"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* 3. Eye-Friendly High-Contrast Atmosphere Overlay (Eliminates glare, preserves text readability) */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#050814]/85 via-[#080C19]/70 to-[#050814]/90" />

      {/* 4. Peripheral Deep Vignette Frame */}
      <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(5,8,20,0.85)]" />
    </div>
  );
};

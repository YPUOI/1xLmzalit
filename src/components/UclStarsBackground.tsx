import React from 'react';

/**
 * Premium UEFA Champions League Nocturnal Atmosphere
 * Subtle, eye-comfortable stadium glow with elegant starlight depth
 */
export const UclStarsBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none" aria-hidden="true">
      {/* Base Canvas */}
      <div className="absolute inset-0 bg-[#06141B]" />

      {/* Atmospheric Top Glow (Soft stadium lighting dome with #4A5C6A accent) */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] opacity-25 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(74, 92, 106, 0.35) 0%, rgba(37, 55, 69, 0.15) 50%, transparent 80%)'
        }}
      />

      {/* Subtle Starball Ambient Constellation Light */}
      <div 
        className="absolute bottom-0 right-1/4 w-[600px] h-[400px] opacity-15 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 60% 70%, rgba(74, 92, 106, 0.25) 0%, transparent 70%)'
        }}
      />

      {/* Ultra-subtle hairline star dot grid */}
      <div 
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.9) 1px, transparent 1px)',
          backgroundSize: '36px 36px'
        }}
      />
    </div>
  );
};

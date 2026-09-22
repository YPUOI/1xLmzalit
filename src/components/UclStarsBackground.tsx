import React from 'react';

/**
 * Simplified 2-color perfectly matched Champions League background
 * Clean, distraction-free deep midnight gradient (#0A1329 -> #070B19)
 */
export const UclStarsBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* Color 1 & Color 2: Clean, perfectly harmonized deep navy gradient */}
      <div className="absolute inset-0 bg-[#070B19]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A1329] via-[#080D1F] to-[#070B19]" />
    </div>
  );
};

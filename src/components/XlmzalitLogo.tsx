import React from 'react';

interface XlmzalitLogoProps {
  className?: string;
  variant?: 'transparent' | 'light' | 'white' | 'dark' | 'card';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const XlmzalitLogo: React.FC<XlmzalitLogoProps> = ({
  className = '',
  variant = 'light',
  size = 'md',
}) => {
  // Height sizing
  const sizeClasses = {
    sm: 'h-7 sm:h-8',
    md: 'h-9 sm:h-11',
    lg: 'h-12 sm:h-14',
    xl: 'h-16 sm:h-20',
  }[size];

  // Palette:
  // - Top arrowhead of '1' in Cyan (#00E5FF on dark, #00A6E0 on light)
  // - Bottom triangle of '1' in vibrant Gold (#E5A118)
  // - Dot of 'i' in vibrant Gold (#E5A118)
  // - Letters: 'light' or 'white' uses crisp clean white / bright slate so it integrates seamlessly without any white box!
  const isDarkNavyText = variant === 'dark';
  const mainTextColor = isDarkNavyText ? '#031753' : '#FFFFFF';
  const cyanColor = '#00D9F5';
  const goldColor = '#EAA81B';

  return (
    <div
      className={`inline-flex items-center justify-center select-none ${sizeClasses} ${className}`}
      style={{ aspectRatio: '390 / 106' }}
    >
      <svg
        viewBox="6 10 384 96"
        className="w-full h-full object-contain filter drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)]"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
      >
        {/* 1: Top Cyan Arrowhead */}
        <path
          d="M 44 10 L 44 38 L 22 38 L 22 30 L 6 38 L 38 10 Z"
          fill={cyanColor}
        />

        {/* 1: Main Stem */}
        <rect x="22" y="38" width="22" height="52" fill={mainTextColor} />

        {/* 1: Bottom-Left Golden Triangle */}
        <polygon points="22,90 22,106 10,98" fill={goldColor} />

        {/* x: Stylized connected cross */}
        <path
          d="M 44 48 L 56 38 L 71 55 L 85 38 L 99 38 L 79 62 L 99 90 L 85 90 L 71 70 L 56 90 L 44 90 L 63 65 Z"
          fill={mainTextColor}
        />

        {/* l: Tall vertical rectangle */}
        <rect x="107" y="10" width="18" height="80" rx="1" fill={mainTextColor} />

        {/* m: Lowercase geometric arches */}
        <path
          d="M 133 38 L 149 38 L 149 47 C 152 40 159 38 165 38 C 172 38 178 41 181 48 C 185 41 192 38 199 38 C 208 38 212 44 212 54 L 212 90 L 196 90 L 196 58 C 196 52 193 50 189 50 C 184 50 180 53 180 59 L 180 90 L 164 90 L 164 58 C 164 52 161 50 157 50 C 152 50 150 53 150 59 L 150 90 L 133 90 Z"
          fill={mainTextColor}
        />

        {/* z: Bold aerodynamic lowercase z */}
        <path
          d="M 220 38 L 260 38 L 260 50 L 237 78 L 260 78 L 260 90 L 220 90 L 220 78 L 243 50 L 220 50 Z"
          fill={mainTextColor}
        />

        {/* a: Dynamic lowercase a snug to z */}
        <path
          d="M 266 50 C 266 42 273 38 282 38 C 293 38 300 44 300 54 L 300 90 L 285 90 L 285 84 C 282 88 276 91 270 91 C 261 91 254 85 254 76 C 254 66 262 61 274 61 L 285 61 L 285 56 C 285 51 282 49 277 49 C 272 49 269 51 267 54 Z M 285 69 L 276 69 C 271 69 268 71 268 75 C 268 79 271 82 276 82 C 281 82 285 78 285 73 Z"
          fill={mainTextColor}
        />

        {/* l: Tall vertical rectangle with slanted top */}
        <polygon
          points="308,24 326,10 326,90 308,90"
          fill={mainTextColor}
        />

        {/* i: Lower stem */}
        <rect x="334" y="38" width="18" height="52" rx="1" fill={mainTextColor} />

        {/* i: Golden circle dot */}
        <circle cx="343" cy="22" r="10" fill={goldColor} />

        {/* t: Lowercase t */}
        <path
          d="M 360 20 L 376 20 L 376 38 L 390 38 L 390 50 L 376 50 L 376 75 C 376 80 378 82 383 82 C 386 82 388 81 390 80 L 390 90 C 387 91 382 92 377 92 C 365 92 360 85 360 74 L 360 50 L 352 50 L 352 38 L 360 38 Z"
          fill={mainTextColor}
        />
      </svg>
    </div>
  );
};

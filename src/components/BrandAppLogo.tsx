import React from 'react';

interface BrandAppLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export const BrandAppLogo: React.FC<BrandAppLogoProps> = ({
  className = '',
  size = 'md',
  rounded = 'lg',
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  }[size];

  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full',
  }[rounded];

  return (
    <div
      className={`relative inline-flex items-center justify-center overflow-hidden bg-black select-none shrink-0 shadow-md ${sizeClasses} ${roundedClasses} ${className}`}
      title="1XLMZALIT App Logo"
    >
      <img
        src="/app-logo.svg"
        alt="1XLMZALIT Logo"
        className="w-full h-full object-contain"
        loading="eager"
      />
    </div>
  );
};

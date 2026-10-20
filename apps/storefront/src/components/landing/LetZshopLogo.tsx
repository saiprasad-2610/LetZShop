import React from 'react';

interface LetZshopLogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const LetZshopLogo: React.FC<LetZshopLogoProps> = ({
  className = '',
  iconOnly = false,
  size = 'md',
}) => {
  // Exact sizing for pixel-perfect display of official 3D brand logo
  const heightClass = {
    sm: iconOnly ? 'h-6 w-auto' : 'h-7 w-auto',
    md: iconOnly ? 'h-8 w-auto' : 'h-9 sm:h-10 w-auto',
    lg: iconOnly ? 'h-10 w-auto' : 'h-11 sm:h-12 w-auto',
    xl: iconOnly ? 'h-12 w-auto' : 'h-14 sm:h-16 w-auto',
  }[size];

  if (iconOnly) {
    return (
      <img
        src="/images/letzshop-icon.png"
        alt="LetZshop Icon"
        className={`inline-block ${heightClass} object-contain shrink-0 select-none ${className}`}
        loading="eager"
      />
    );
  }

  return (
    <img
      src="/images/letzshop-logo.png"
      alt="LetZshop"
      className={`inline-block ${heightClass} object-contain shrink-0 select-none ${className}`}
      loading="eager"
    />
  );
};

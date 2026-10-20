import React from 'react';

interface LetZshopLogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const LetZshopLogo: React.FC<LetZshopLogoProps> = ({
  className = '',
  iconOnly = false,
  size = 'md',
}) => {
  const iconDimensions = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  }[size];

  const textSize = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Approved Shopping Bag + Dynamic Orange Arrow Logo Mark */}
      <div className={`${iconDimensions} relative flex items-center justify-center shrink-0`}>
        <svg
          viewBox="0 0 44 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >
          {/* Blue Shopping Bag Handle */}
          <path
            d="M16 14V11C16 7.68629 18.6863 5 22 5C25.3137 5 28 7.68629 28 11V14"
            stroke="#1D4ED8"
            strokeWidth="3.2"
            strokeLinecap="round"
          />

          {/* Blue Shopping Bag Body */}
          <path
            d="M9 14.5C9 13.6716 9.67157 13 10.5 13H33.5C34.3284 13 35 13.6716 35 14.5L37.5 35.5C37.5 37.9853 35.4853 40 33 40H11C8.51472 40 6.5 37.9853 6.5 35.5L9 14.5Z"
            fill="url(#lzsBagGradient)"
            stroke="#1E40AF"
            strokeWidth="1.2"
          />

          {/* Bag Fold Subtle Shadow */}
          <path
            d="M10 13L13 22H31L34 13"
            fill="white"
            fillOpacity="0.12"
          />

          {/* Dynamic Electric Orange / Amber Bolt & Arrow */}
          <path
            d="M26 15L14 27.5H22.5L18 36.5L31 23H23L26 15Z"
            fill="url(#lzsArrowGradient)"
            stroke="#FFFFFF"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Spark Accent */}
          <circle cx="32" cy="15" r="1.5" fill="#F59E0B" />

          {/* Gradients */}
          <defs>
            <linearGradient id="lzsBagGradient" x1="9" y1="13" x2="36" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#2563EB" />
              <stop offset="1" stopColor="#1D4ED8" />
            </linearGradient>
            <linearGradient id="lzsArrowGradient" x1="14" y1="15" x2="31" y2="36.5" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FB923C" />
              <stop offset="0.5" stopColor="#F97316" />
              <stop offset="1" stopColor="#EA580C" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {!iconOnly && (
        <div className="flex items-baseline tracking-tight font-black">
          <span className={`${textSize} text-slate-900 font-extrabold`}>Let</span>
          <span className={`${textSize} text-blue-600 font-black`}>Z</span>
          <span className={`${textSize} text-slate-900 font-extrabold`}>shop</span>
        </div>
      )}
    </div>
  );
};

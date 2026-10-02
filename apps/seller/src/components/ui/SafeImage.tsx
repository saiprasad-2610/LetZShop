import React, { useState } from 'react';
import { ImageOff, Package } from 'lucide-react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackTitle?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt = 'Product image',
  className = '',
  fallbackTitle,
  ...props
}) => {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div
        className={`bg-slate-100 text-slate-400 flex flex-col items-center justify-center p-3 select-none ${className}`}
      >
        <Package className="w-6 h-6 stroke-[1.5] text-slate-300 mb-1" />
        <span className="text-[10px] font-medium text-slate-400 text-center line-clamp-1">
          {fallbackTitle || alt || 'Image Preview'}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      loading="lazy"
      {...props}
    />
  );
};

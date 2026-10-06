import React, { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import { resolveMediaUrl } from '@simply/ui';

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
  const resolvedSrc = resolveMediaUrl(src);

  useEffect(() => {
    setError(false);
  }, [src]);

  if (!resolvedSrc || error) {
    return (
      <div
        className={`bg-gray-100 text-gray-400 flex flex-col items-center justify-center p-3 select-none ${className}`}
      >
        <Package className="w-8 h-8 stroke-[1.5] text-gray-300 mb-1" />
        <span className="text-[10px] font-medium text-gray-400 text-center line-clamp-1">
          {fallbackTitle || alt || 'Crafted Item'}
        </span>
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      loading="lazy"
      {...props}
    />
  );
};

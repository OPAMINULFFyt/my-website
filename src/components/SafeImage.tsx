import React, { useState } from 'react';
import { Image as ImageIcon, AlertCircle } from 'lucide-react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  className?: string;
}

const SafeImage: React.FC<SafeImageProps> = ({ 
  src, 
  alt, 
  className = '', 
  fallbackSrc,
  ...props 
}) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleError = () => {
    setError(true);
    setLoading(false);
  };

  const handleLoad = () => {
    setLoading(false);
  };

  // Default fallback if none provided
  const defaultFallback = `https://picsum.photos/seed/broken/800/450?blur=10`;

  if (error || !src) {
    return (
      <div className={`flex flex-col items-center justify-center bg-card-main border border-border-main ${className}`}>
        <AlertCircle className="w-8 h-8 text-text-muted opacity-20 mb-2" />
        <span className="text-[8px] font-mono text-text-muted opacity-20 uppercase tracking-widest">Image_Load_Error</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {loading && (
        <div className="absolute inset-0 bg-card-main animate-pulse flex items-center justify-center">
          <ImageIcon className="w-6 h-6 text-text-muted opacity-10" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
        onError={handleError}
        onLoad={handleLoad}
        referrerPolicy="no-referrer"
        loading="lazy"
        {...props}
      />
    </div>
  );
};

export default SafeImage;

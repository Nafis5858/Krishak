import { useState } from 'react';
import { ImageOff, Maximize2, X } from 'lucide-react';

const PhotoDisplay = ({ photoUrl, alt = 'Photo', className = '' }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
  };

  const handleImageError = (e) => {
    // Don't show error if image already loaded successfully
    if (e?.target?.complete && e?.target?.naturalHeight > 0) {
      console.log('⚠️ PhotoDisplay: Error event after successful load (ignoring)');
      return;
    }
    console.error('❌ PhotoDisplay: Failed to load image', {
      photoUrl,
      fullUrl: photoUrl
    });
    setIsLoading(false);
    setImageError(true);
  };

  if (!photoUrl || imageError) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-100 rounded-lg ${className}`}>
        <ImageOff className="w-8 h-8 text-gray-400 mb-2" />
        <p className="text-xs text-gray-500">Photo unavailable</p>
      </div>
    );
  }

  return (
    <>
      <div className="relative group">
        {isLoading && (
          <div className={`absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        )}
        <img
          src={photoUrl}
          alt={alt}
          className={`rounded-lg object-cover cursor-pointer transition-opacity ${className} ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          onClick={() => setIsModalOpen(true)}
        />
        <button
          onClick={() => setIsModalOpen(true)}
          className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <button
            onClick={() => setIsModalOpen(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={photoUrl}
            alt={alt}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

export default PhotoDisplay;

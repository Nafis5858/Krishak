import { useState, useRef } from 'react';
import { Camera, X, AlertCircle } from 'lucide-react';

const PickupVerificationModal = ({ isOpen, onClose, order, onConfirm }) => {
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    setError('');
    setPhoto(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirm = async () => {
    if (!photo) {
      setError('Please capture a pickup photo');
      return;
    }

    setIsUploading(true);
    try {
      await onConfirm(photo);
      handleClose();
    } catch (err) {
      setError(err.message || 'Failed to confirm pickup');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setPhoto(null);
    setPhotoPreview(null);
    setError('');
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold">Pickup Verification</h3>
          </div>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <p className="text-sm text-gray-600 mb-1">Photo required</p>
          <div className="mb-4">
            <p className="text-sm text-gray-700">Order: <span className="font-semibold">{order?.orderId}</span></p>
            <p className="text-sm text-gray-700">Product: <span className="font-semibold">{order?.productName}</span></p>
          </div>

          <div className="mb-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/*"
              capture="environment"
              onChange={handlePhotoChange}
              className="hidden"
              id="pickup-photo"
            />
            
            {!photoPreview ? (
              <label
                htmlFor="pickup-photo"
                className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-500 transition-colors"
              >
                <Camera className="w-12 h-12 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">Tap to capture photo</p>
                <p className="text-xs text-gray-400 mt-1">or select from gallery</p>
              </label>
            ) : (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Pickup preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  onClick={handleRemovePhoto}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                  <span className="w-2 h-2 bg-white rounded-full"></span>
                  Photo ready to upload
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              Pickup photo is mandatory for verification purposes.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={isUploading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!photo || isUploading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isUploading ? 'Confirming...' : 'Confirm Pickup'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PickupVerificationModal;

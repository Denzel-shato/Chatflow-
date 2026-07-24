import { useState } from 'react';
import axios from 'axios';

const useMediaUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  const API_KEY = import.meta.env.VITE_IMGBB_KEY;

  const uploadFile = async (file) => {
    if (!file.type.startsWith('image/')) {
      setError('Only images are supported');
      return { success: false, error: 'Only images supported' };
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await axios.post(
        `https://api.imgbb.com/1/upload?key=${API_KEY}`,
        formData,
        {
          onUploadProgress: (progressEvent) => {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percent);
          },
        }
      );

      return {
        success: true,
        url: response.data.data.url,
        resourceType: 'image',
        originalName: file.name,
        size: file.size,
      };
    } catch (err) {
      setError('Upload failed');
      return { success: false, error: 'Upload failed' };
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return {
    uploadFile,
    uploading,
    uploadProgress,
    error,
    clearError: () => setError(null),
  };
};

export default useMediaUpload;
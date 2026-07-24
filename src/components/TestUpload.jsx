import React, { useRef, useState } from 'react';
import useMediaUpload from './MediaUpload';

const TestUpload = () => {
  const fileInputRef = useRef(null);
  const { uploadFile, uploading, uploadProgress, error, clearError } = useMediaUpload();
  const [uploadedUrl, setUploadedUrl] = useState(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const result = await uploadFile(file);
    
    if (result.success) {
      setUploadedUrl(result.url);
      console.log('Upload success! URL:', result.url);
    } else {
      console.error('Upload failed:', result.error);
    }
  };

  return (
    <div className="p-6 bg-gray-900 rounded-lg border border-gray-700">
      <h3 className="text-white text-lg font-semibold mb-4">📤 Test Media Upload</h3>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*,video/*,audio/*,application/pdf"
        className="text-white text-sm mb-4 block"
      />
      
      {uploading && (
        <div className="mt-3">
          <div className="flex justify-between text-sm text-cyan-400 mb-1">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}
      
      {error && (
        <div className="mt-3 p-2 bg-red-500/20 border border-red-500/50 rounded">
          <p className="text-red-400 text-sm">❌ {error}</p>
          <button 
            onClick={clearError}
            className="text-xs text-red-300 underline mt-1"
          >
            Dismiss
          </button>
        </div>
      )}
      
      {uploadedUrl && (
        <div className="mt-4 p-3 bg-gray-800 rounded border border-green-500/30">
          <p className="text-green-400 text-sm mb-2">✅ Upload successful!</p>
          <p className="text-gray-400 text-xs break-all mb-2">
            URL: {uploadedUrl}
          </p>
          <a 
            href={uploadedUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-cyan-400 text-sm underline hover:text-cyan-300"
          >
            Open file in new tab →
          </a>
        </div>
      )}
    </div>
  );
};

export default TestUpload;
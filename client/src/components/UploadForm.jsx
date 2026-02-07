import { useState, useRef, useCallback } from 'react';

function UploadForm({ onSubmit, isLoading }) {
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [description, setDescription] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [imageError, setImageError] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

  const processImage = useCallback((file) => {
    setImageError(null);

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setImageError('Please upload a JPEG, PNG, or WebP image');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setImageError('Image must be less than 5MB');
      return;
    }

    // Create preview and base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Resize if needed (max 1024px)
        const maxDim = 1024;
        let { width, height } = img;

        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width *= ratio;
          height *= ratio;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const resizedBase64 = canvas.toDataURL('image/jpeg', 0.85);
        setImagePreview(resizedBase64);
        setImageBase64(resizedBase64);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImage(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      processImage(e.target.files[0]);
    }
  };

  const handleCameraCapture = (e) => {
    if (e.target.files && e.target.files[0]) {
      processImage(e.target.files[0]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!imageBase64) {
      setImageError('Please upload an image of the issue');
      return;
    }
    onSubmit({ imageBase64, description });
  };

  return (
    <form onSubmit={handleSubmit} className="upload-form">
      <div
        className={`upload-zone ${dragActive ? 'drag-active' : ''} ${imagePreview ? 'has-image' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {imagePreview ? (
          <div className="image-preview-container">
            <img src={imagePreview} alt="Preview" className="image-preview" />
            <button 
              type="button"
              className="remove-image-btn"
              onClick={(e) => {
                e.stopPropagation();
                setImagePreview(null);
                setImageBase64(null);
              }}
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="upload-placeholder">
            <span className="upload-icon">📷</span>
            <p>Drag & drop an image or click to browse</p>
            <p className="file-hint">JPEG, PNG, or WebP • Max 5MB</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden-input"
        />
      </div>

      {/* Camera capture button */}
      <div className="capture-options">
        <label className="camera-btn" htmlFor="camera-input">
          <span className="btn-icon">📸</span>
          Take Photo
        </label>
        <input
          id="camera-input"
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCameraCapture}
          className="hidden-input"
        />
      </div>

      {imageError && <div className="field-error">{imageError}</div>}

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe the issue (optional but helpful)..."
        className="description-input"
        rows={3}
      />

      <button
        type="submit"
        className="submit-btn"
        disabled={isLoading || !imageBase64}
      >
        {isLoading ? 'Analyzing...' : 'Submit Report'}
      </button>
    </form>
  );
}

export default UploadForm;

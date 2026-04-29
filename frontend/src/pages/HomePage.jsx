import { useState, useRef } from 'react'
import './HomePage.css'
import { compressImage, fileToBase64 } from '../utils/imageUtils'

function HomePage({ onImageSelect }) {
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  const handleImageSelect = async (file) => {
    if (!file) return

    setLoading(true)
    try {
      // Compress image
      const compressed = await compressImage(file)
      setPreview(compressed)
      // Send to chat page
      onImageSelect(compressed)
    } catch (error) {
      alert('Failed to process image. Please try again.')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileClick = () => {
    fileInputRef.current?.click()
  }

  const handleCameraClick = () => {
    cameraInputRef.current?.click()
  }

  return (
    <div className="home-page">
      <div className="header">
        <h1>
          <span className="emoji">🥗</span>
          <span>Food Analyzer</span>
        </h1>
        <p className="tagline">Know what you're actually eating</p>
      </div>

      <div className="options-container">
        <button className="option-card" onClick={handleCameraClick} disabled={loading}>
          <div className="option-icon">📸</div>
          <h2>Scan Product</h2>
          <p>Use your device camera</p>
        </button>

        <button className="option-card" onClick={handleFileClick} disabled={loading}>
          <div className="option-icon">📤</div>
          <h2>Upload Image</h2>
          <p>Choose from your device</p>
        </button>
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => handleImageSelect(e.target.files?.[0])}
        disabled={loading}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => handleImageSelect(e.target.files?.[0])}
        disabled={loading}
      />

      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Processing image...</p>
        </div>
      )}

      <div className="footer">
        <p className="info">
          📱 Works on mobile and desktop • 🔍 Advanced OCR analysis • ⚠️ Detects misleading claims
        </p>
      </div>
    </div>
  )
}

export default HomePage

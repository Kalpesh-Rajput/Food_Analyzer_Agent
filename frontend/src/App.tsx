import { useEffect, useMemo, useRef, useState } from 'react';
import { AnalyzeResponse, FoodAnalysis } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const verdictStyles: Record<string, string> = {
  HEALTHY: 'tag-success',
  OKAY: 'tag-warning',
  UNHEALTHY: 'tag-danger',
  JUNK: 'tag-danger',
};

function App() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [message, setMessage] = useState('');
  const [language, setLanguage] = useState('english');
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [previewUrls, stream]);

  useEffect(() => {
    const urls = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [selectedFiles]);

  const filesToUpload = useMemo(() => {
    const files = [...selectedFiles];
    if (capturedFile) files.unshift(capturedFile);
    return files;
  }, [selectedFiles, capturedFile]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (filesList: FileList | null) => {
    if (!filesList) return;
    setSelectedFiles(Array.from(filesList).slice(0, 4));
    setCapturedFile(null);
    setResult(null);
    setError('');
  };

  const handleBrowseClick = () => {
    setError('');
    fileInputRef.current?.click();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const dt = e.dataTransfer;
    if (dt && dt.files && dt.files.length > 0) {
      handleFileChange(dt.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const openCamera = async () => {
    setError('');
    setCameraOpen(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError('Unable to access webcam. Please allow camera permissions or use file upload.');
      setCameraOpen(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `capture-${Date.now()}.png`, { type: 'image/png' });
      setCapturedFile(file);
      setCameraOpen(false);
      setStream((prev) => {
        prev?.getTracks().forEach((track) => track.stop());
        return null;
      });
      setResult(null);
      setError('');
    });
  };

  const handleSubmit = async () => {
    if (filesToUpload.length === 0) {
      setError('Please upload or capture a food label image.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    filesToUpload.forEach((file) => formData.append('files', file));
    formData.append('message', message);
    formData.append('language', language);

    try {
      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.detail || 'Analysis request failed.');
        return;
      }

      setResult(payload);
    } catch (err) {
      setError('Unable to reach backend. Is the API running?');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFiles([]);
    setCapturedFile(null);
    setMessage('');
    setLanguage('english');
    setResult(null);
    setError('');
  };

  const verdict = result?.food_analysis?.overall_verdict ?? 'UNKNOWN';
  const verdictClass = verdictStyles[verdict] || 'tag-neutral';

  return (
    <div className="page-shell">
      <header className="hero-panel">
        <div>
          <p className="eyebrow">Premium AI Food Analyzer</p>
          <h1>Launch a web-first food intelligence dashboard.</h1>
          <p className="hero-copy">
            Upload label photos or capture from webcam, then get a polished health verdict, ingredient insights,
            and startup-grade UI that feels built for SaaS.
          </p>
        </div>
        <div className="hero-card">
          <span>Live preview</span>
          <div className="hero-stats">
            <div>
              <strong>4</strong>
              <span>Upload sources</span>
            </div>
            <div>
              <strong>3s</strong>
              <span>AI verdict speed</span>
            </div>
          </div>
        </div>
      </header>

      <main className="content-grid">
        <section className="panel upload-panel">
          <div className="panel-header">
            <div>
              <p className="section-label">Upload & Capture</p>
              <h2>Image inputs</h2>
            </div>
            <button className="ghost-button" type="button" onClick={openCamera}>
              Use webcam
            </button>
          </div>

          <div className="upload-content">
            {cameraOpen ? (
              <div className="camera-card">
                <video ref={videoRef} autoPlay muted playsInline className="camera-view" />
                <button className="primary-button" type="button" onClick={capturePhoto}>
                  Capture label
                </button>
              </div>
            ) : (
              <div
                className="upload-dropzone"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <div className="drop-content">
                  <strong>Drag & drop images here</strong>
                  <p>Or use the button below to browse files (up to 4 photos).</p>
                  <div className="drop-actions">
                    <button className="ghost-button" onClick={handleBrowseClick} type="button">
                      Browse files
                    </button>
                    <button className="ghost-button" onClick={openCamera} type="button">
                      Use webcam
                    </button>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileChange(e.target.files)}
                />
              </div>
            )}

            <div className="preview-grid">
              {capturedFile && (
                <img src={URL.createObjectURL(capturedFile)} alt="Captured" className="preview-image" />
              )}
              {previewUrls.map((url) => (
                <img key={url} src={url} alt="Preview" className="preview-image" />
              ))}
              {!capturedFile && previewUrls.length === 0 && (
                <div className="preview-empty">No image selected yet.</div>
              )}
            </div>
          </div>

          <div className="form-grid">
            <textarea
              className="message-box"
              rows={3}
              placeholder="Add a question or context for the AI analyzer"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
            <div className="field-row">
              <label className="field-label">
                Language
                <select value={language} onChange={(event) => setLanguage(event.target.value)}>
                  <option value="english">English</option>
                  <option value="hindi">Hindi</option>
                  <option value="hinglish">Hinglish</option>
                </select>
              </label>
              <div className="button-group">
                <button className="secondary-button" type="button" onClick={handleReset}>
                  Reset
                </button>
                <button className="primary-button" type="button" onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Analyzing...' : 'Analyze Now'}
                </button>
              </div>
            </div>
          </div>

          {error && <div className="alert-box">{error}</div>}
        </section>

        <section className="panel result-panel">
          <div className="panel-header">
            <div>
              <p className="section-label">Analysis dashboard</p>
              <h2>AI verdict</h2>
            </div>
          </div>

          {!result && (
            <div className="empty-state">
              <p>Upload a food label and press Analyze to see the premium dashboard.</p>
            </div>
          )}

          {result?.food_analysis && (
            <div className="result-grid">
              <div className="result-card verdict-card">
                <div className="verdict-row">
                  <div>
                    <span className={`tag ${verdictClass}`}>{verdict}</span>
                    <span className="verdict-emoji">{result.food_analysis.verdict_emoji}</span>
                  </div>
                  <div className="download-actions">
                    <button
                      className="secondary-button"
                      onClick={() => {
                        const blob = new Blob([JSON.stringify(result, null, 2)], {
                          type: 'application/json',
                        });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${(result.product_name || 'analysis').replace(/\s+/g, '_')}_report.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      Download report
                    </button>
                  </div>
                </div>
                <h3>{result.product_name || 'Product analysis'}</h3>
                <p className="response-box small">{result.final_response}</p>
              </div>

              <div className="result-card summary-card">
                <h3>Quick insights</h3>
                <ul>
                  {(result.food_analysis.nutrition_insights || []).map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
                <h4 style={{ marginTop: 12 }}>Comparisons</h4>
                <ul>
                  {(result.food_analysis.fun_comparisons || []).map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="result-card details-card">
                <h3>Key ingredients</h3>
                <div className="tag-row">
                  {(result.food_analysis.harmful_ingredients || []).map((item: any) => (
                    <div key={item.name} className="ingredient-item">
                      <span className="pill pill-danger">{item.name}</span>
                      <div className="ingredient-note">{item.why_harmful}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="result-card metrics-card">
                <h3>Nutrition facts</h3>
                {result.raw_ocr_text ? (
                  (() => {
                    try {
                      const parsed = JSON.parse(result.raw_ocr_text);
                      const nutrition = parsed?.nutrition || parsed?.extracted_nutrition || null;
                      if (nutrition) {
                        return (
                          <table className="nutrition-table">
                            <tbody>
                              {Object.entries(nutrition).map(([k, v]) => (
                                <tr key={k}>
                                  <td className="nutrient-key">{k.replace(/_/g, ' ')}</td>
                                  <td className="nutrient-val">{v ?? '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        );
                      }
                    } catch (e) {
                      return <div className="muted">Nutrition data not available</div>;
                    }
                    return <div className="muted">Nutrition data not available</div>;
                  })()
                ) : (
                  <div className="muted">Nutrition data not available</div>
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;

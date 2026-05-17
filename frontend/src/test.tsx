// import { useEffect, useMemo, useRef, useState } from 'react';
// import { AnalyzeResponse, FoodAnalysis } from './types';

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// const verdictStyles: Record<string, string> = {
//   HEALTHY: 'tag-success',
//   OKAY: 'tag-warning',
//   UNHEALTHY: 'tag-danger',
//   JUNK: 'tag-danger',
//   INVALID: 'tag-danger',
// };

// interface ResponseSection {
//   title: string;
//   paragraphs: string[];
//   bullets: string[];
// }

// function parseFinalResponse(text: string): ResponseSection[] {
//   const lines = text
//     .split(/\r?\n/)
//     .map((line) => line.trim())
//     .filter((line) => line.length > 0);

//   const sections: ResponseSection[] = [];
//   let currentSection: ResponseSection | null = null;

//   const flushSection = () => {
//     if (currentSection) {
//       sections.push(currentSection);
//     }
//   };

//   lines.forEach((line) => {
//     const headingMatch = line.match(/^(\d+)\.\s*([^:]+):?$/);
//     if (headingMatch) {
//       flushSection();
//       currentSection = {
//         title: `${headingMatch[1]}. ${headingMatch[2].trim()}`,
//         paragraphs: [],
//         bullets: [],
//       };
//       return;
//     }

//     const bulletMatch = line.match(/^[-•*]\s+(.*)$/);
//     if (bulletMatch) {
//       if (!currentSection) {
//         currentSection = { title: 'Details', paragraphs: [], bullets: [] };
//       }
//       currentSection.bullets.push(bulletMatch[1].trim());
//       return;
//     }

//     if (!currentSection) {
//       currentSection = { title: 'Overview', paragraphs: [], bullets: [] };
//     }

//     currentSection.paragraphs.push(line);
//   });

//   flushSection();
//   return sections;
// }

// function renderFinalResponse(text: string) {
//   const sections = parseFinalResponse(text);

//   if (sections.length === 0) {
//     return <pre className="response-text">{text}</pre>;
//   }

//   return (
//     <div className="response-text">
//       {sections.map((section) => (
//         <div key={section.title} className="response-section">
//           <h4>{section.title}</h4>
//           {section.paragraphs.map((paragraph, index) => (
//             <p key={index}>{paragraph}</p>
//           ))}
//           {section.bullets.length > 0 && (
//             <ul>
//               {section.bullets.map((bullet, index) => (
//                 <li key={index}>{bullet}</li>
//               ))}
//             </ul>
//           )}
//         </div>
//       ))}
//     </div>
//   );
// }

// function App() {
//   const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
//   const [message, setMessage] = useState('');
//   const [language, setLanguage] = useState('english');
//   const [result, setResult] = useState<AnalyzeResponse | null>(null);
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [cameraOpen, setCameraOpen] = useState(false);
//   const [capturedFile, setCapturedFile] = useState<File | null>(null);
//   const [previewUrls, setPreviewUrls] = useState<string[]>([]);
//   const [stream, setStream] = useState<MediaStream | null>(null);
//   const videoRef = useRef<HTMLVideoElement | null>(null);

//   useEffect(() => {
//     return () => {
//       previewUrls.forEach((url) => URL.revokeObjectURL(url));
//       if (stream) {
//         stream.getTracks().forEach((track) => track.stop());
//       }
//     };
//   }, [previewUrls, stream]);

//   useEffect(() => {
//     const urls = selectedFiles.map((file) => URL.createObjectURL(file));
//     setPreviewUrls(urls);
//     return () => urls.forEach((url) => URL.revokeObjectURL(url));
//   }, [selectedFiles]);

//   const filesToUpload = useMemo(() => {
//     const files = [...selectedFiles];
//     if (capturedFile) files.unshift(capturedFile);
//     return files;
//   }, [selectedFiles, capturedFile]);

//   const fileInputRef = useRef<HTMLInputElement | null>(null);

//   const handleFileChange = (filesList: FileList | null) => {
//     if (!filesList) return;
//     setSelectedFiles(Array.from(filesList).slice(0, 4));
//     setCapturedFile(null);
//     setResult(null);
//     setError('');
//   };

//   const handleBrowseClick = () => {
//     setError('');
//     fileInputRef.current?.click();
//   };

//   const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//     const dt = e.dataTransfer;
//     if (dt && dt.files && dt.files.length > 0) {
//       handleFileChange(dt.files);
//     }
//   };

//   const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//   };

//   const openCamera = async () => {
//     setError('');
//     setCameraOpen(true);
//     try {
//       const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
//       setStream(mediaStream);
//       if (videoRef.current) {
//         videoRef.current.srcObject = mediaStream;
//       }
//     } catch (err) {
//       setError('Unable to access webcam. Please allow camera permissions or use file upload.');
//       setCameraOpen(false);
//     }
//   };

//   const capturePhoto = () => {
//     if (!videoRef.current) return;
//     const video = videoRef.current;
//     const canvas = document.createElement('canvas');
//     canvas.width = video.videoWidth;
//     canvas.height = video.videoHeight;
//     const ctx = canvas.getContext('2d');
//     if (!ctx) return;
//     ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
//     canvas.toBlob((blob) => {
//       if (!blob) return;
//       const file = new File([blob], `capture-${Date.now()}.png`, { type: 'image/png' });
//       setCapturedFile(file);
//       setCameraOpen(false);
//       setStream((prev) => {
//         prev?.getTracks().forEach((track) => track.stop());
//         return null;
//       });
//       setResult(null);
//       setError('');
//     });
//   };

//   const handleSubmit = async () => {
//     if (filesToUpload.length === 0) {
//       setError('Please upload or capture a food label image.');
//       return;
//     }
//     setLoading(true);
//     setError('');
//     setResult(null);

//     const formData = new FormData();
//     filesToUpload.forEach((file) => formData.append('files', file));
//     formData.append('message', message);
//     formData.append('language', language);

//     try {
//       const response = await fetch(`${API_BASE_URL}/analyze`, {
//         method: 'POST',
//         body: formData,
//       });
//       const payload = await response.json();

//       if (!response.ok) {
//         setError(payload.detail || 'Analysis request failed.');
//         return;
//       }

//       // Log payload for debugging in browser console
//       // If backend returned an error field, show it to user instead of rendering empty UI
//       // Also ensure we don't set an entirely empty result (no final_response and no analysis)
//       // which can cause the UI to show a blank state.
//       // eslint-disable-next-line no-console
//       console.log('analyze payload', payload);

//       if (payload?.error) {
//         setError(payload.error || 'Analysis failed.');
//         return;
//       }

//       const hasUsefulOutput = Boolean(payload?.final_response || payload?.food_analysis);
//       if (!hasUsefulOutput) {
//         setError('No usable analysis was produced. Please try a clearer photo of the nutrition facts or ingredients.');
//         return;
//       }

//       setResult(payload);
//     } catch (err) {
//       setError('Unable to reach backend. Is the API running?');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleReset = () => {
//     setSelectedFiles([]);
//     setCapturedFile(null);
//     setMessage('');
//     setLanguage('english');
//     setResult(null);
//     setError('');
//   };

//   const verdict = result?.food_analysis?.overall_verdict ?? (result?.final_response ? 'INVALID' : 'UNKNOWN');
//   const verdictClass = verdictStyles[verdict] || 'tag-neutral';

//   return (
//     <div className="page-shell">
//       <header className="hero-panel">
//         <div>
//           <p className="eyebrow">Premium AI Food Analyzer</p>
//           <h1>⚡Smart Nutrition Assistant.</h1>
//           <p className="hero-copy">
//             Upload food labels and get AI-powered health insights, 
//             harmful ingredient detection, and smarter nutrition guidance instantly.
//           </p>
//         </div>
//         <div className="hero-card">
//           <span>Live preview</span>
//           <div className="hero-stats">
//             <div>
//               <strong>4</strong>
//               <span>Upload sources</span>
//             </div>
//             <div>
//               <strong>3s</strong>
//               <span>AI verdict speed</span>
//             </div>
//           </div>
//         </div>
//       </header>

//       <main className="content-grid">
//         <section className="panel upload-panel">
//           <div className="panel-header">
//             <div>
//               <p className="section-label">Upload & Capture</p>
//               <h2>Image inputs</h2>
//             </div>
//             <button className="ghost-button" type="button" onClick={openCamera}>
//               Use webcam
//             </button>
//           </div>

//           <div className="upload-content">
//             {cameraOpen ? (
//               <div className="camera-card">
//                 <video ref={videoRef} autoPlay muted playsInline className="camera-view" />
//                 <button className="primary-button" type="button" onClick={capturePhoto}>
//                   Capture label
//                 </button>
//               </div>
//             ) : (
//               <div
//                 className="upload-dropzone"
//                 onDrop={handleDrop}
//                 onDragOver={handleDragOver}
//               >
//                 <div className="drop-content">
//                   <strong>Drag & drop images here</strong>
//                   <p>Or use the button below to browse files (up to 4 photos).</p>
//                   <div className="drop-actions">
//                     <button className="ghost-button" onClick={handleBrowseClick} type="button">
//                       Browse files
//                     </button>
//                     <button className="ghost-button" onClick={openCamera} type="button">
//                       Use webcam
//                     </button>
//                   </div>
//                 </div>
//                 <input
//                   ref={fileInputRef}
//                   type="file"
//                   accept="image/*"
//                   multiple
//                   style={{ display: 'none' }}
//                   onChange={(e) => handleFileChange(e.target.files)}
//                 />
//               </div>
//             )}

//             <div className="preview-grid">
//               {capturedFile && (
//                 <img src={URL.createObjectURL(capturedFile)} alt="Captured" className="preview-image" />
//               )}
//               {previewUrls.map((url) => (
//                 <img key={url} src={url} alt="Preview" className="preview-image" />
//               ))}
//               {!capturedFile && previewUrls.length === 0 && (
//                 <div className="preview-empty">No image selected yet.</div>
//               )}
//             </div>
//           </div>

//           <div className="form-grid">
//             <textarea
//               className="message-box"
//               rows={3}
//               placeholder="Add a question or context for the AI analyzer"
//               value={message}
//               onChange={(event) => setMessage(event.target.value)}
//             />
//             <div className="field-row">
//               <label className="field-label">
//                 Language
//                 <select value={language} onChange={(event) => setLanguage(event.target.value)}>
//                   <option value="english">English</option>
//                   <option value="hindi">Hindi</option>
//                   <option value="hinglish">Hinglish</option>
//                 </select>
//               </label>
//               <div className="button-group">
//                 <button className="secondary-button" type="button" onClick={handleReset}>
//                   Reset
//                 </button>
//                 <button className="primary-button" type="button" onClick={handleSubmit} disabled={loading}>
//                   {loading ? 'Analyzing...' : 'Analyze Now'}
//                 </button>
//               </div>
//             </div>
//           </div>

//           {error && <div className="alert-box">{error}</div>}
//         </section>

//         <section className="panel result-panel">
//           <div className="panel-header">
//             <div>
//               <p className="section-label">Analysis dashboard</p>
//               <h2>AI verdict</h2>
//             </div>
//           </div>

//           {!result && (
//             <div className="empty-state">
//               <p>Upload a food label and press Analyze to see the premium dashboard.</p>
//             </div>
//           )}

//           {(result?.food_analysis || result?.final_response) && (
//             <div className="result-grid">
//               <div className="result-card verdict-card">
//                 <div className="verdict-row">
//                   <div>
//                     <span className={`tag ${verdictClass}`}>{verdict}</span>
//                     <span className="verdict-emoji">{result.food_analysis.verdict_emoji}</span>
//                   </div>
//                   <div className="download-actions">
//                     <button
//                       className="secondary-button"
//                       onClick={() => {
//                         const blob = new Blob([JSON.stringify(result, null, 2)], {
//                           type: 'application/json',
//                         });
//                         const url = URL.createObjectURL(blob);
//                         const a = document.createElement('a');
//                         a.href = url;
//                         a.download = `${(result.product_name || 'analysis').replace(/\s+/g, '_')}_report.json`;
//                         a.click();
//                         URL.revokeObjectURL(url);
//                       }}
//                     >
//                       Download report
//                     </button>
//                   </div>
//                 </div>
//                 <h3>{result.product_name || 'Product analysis'}</h3>
//                 <div className="response-box small">
//                   {result.final_response ? renderFinalResponse(result.final_response) : <span>No verdict text available.</span>}
//                 </div>
//               </div>

//               <div className="result-card summary-card">
//                 <h3>Quick insights</h3>
//                 <ul>
//                   {(result.food_analysis.nutrition_insights || []).map((item, index) => (
//                     <li key={index}>{item}</li>
//                   ))}
//                 </ul>
//                 <h4 style={{ marginTop: 12 }}>Comparisons</h4>
//                 <ul>
//                   {(result.food_analysis.fun_comparisons || []).map((item, index) => (
//                     <li key={index}>{item}</li>
//                   ))}
//                 </ul>
//               </div>

//               <div className="result-card details-card">
//                 <h3>Key ingredients</h3>
//                 <div className="tag-row">
//                   {(result.food_analysis.harmful_ingredients || []).map((item: any) => (
//                     <div key={item.name} className="ingredient-item">
//                       <span className="pill pill-danger">{item.name}</span>
//                       <div className="ingredient-note">{item.why_harmful}</div>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               <div className="result-card metrics-card">
//                 <h3>Nutrition facts</h3>
//                 {result.raw_ocr_text ? (
//                   (() => {
//                     try {
//                       const parsed = JSON.parse(result.raw_ocr_text);
//                       const nutrition = parsed?.nutrition || parsed?.extracted_nutrition || null;
//                       if (nutrition) {
//                         return (
//                           <table className="nutrition-table">
//                             <tbody>
//                               {Object.entries(nutrition).map(([k, v]) => (
//                                 <tr key={k}>
//                                   <td className="nutrient-key">{k.replace(/_/g, ' ')}</td>
//                                   <td className="nutrient-val">{v ?? '—'}</td>
//                                 </tr>
//                               ))}
//                             </tbody>
//                           </table>
//                         );
//                       }
//                     } catch (e) {
//                       return <div className="muted">Nutrition data not available</div>;
//                     }
//                     return <div className="muted">Nutrition data not available</div>;
//                   })()
//                 ) : (
//                   <div className="muted">Nutrition data not available</div>
//                 )}
//               </div>
//             </div>
//           )}
//         </section>
//       </main>
//     </div>
//   );
// }

// export default App;


// new code 

// import { useEffect, useRef, useState, useCallback } from 'react';

// const API_BASE_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || 'http://localhost:8000';

// // ─── Types ───────────────────────────────────────────────────────────────────
// interface HarmfulIngredient { name: string; why_harmful: string; }
// interface FoodAnalysis {
//   overall_verdict?: string; verdict_emoji?: string; verdict_color?: string;
//   harmful_ingredients?: HarmfulIngredient[]; okay_ingredients?: string[];
//   nutrition_insights?: string[]; fun_comparisons?: string[];
//   buy_or_avoid?: string; short_summary?: string;
// }
// interface AnalyzeResponse {
//   product_name?: string; final_response?: string; raw_ocr_text?: string;
//   food_analysis?: FoodAnalysis; error?: string;
// }
// interface RecentScan {
//   id: string; name: string; verdict: string; emoji: string;
//   score: number; time: string; thumbnail?: string;
// }

// // ─── Helpers ─────────────────────────────────────────────────────────────────
// const verdictConfig: Record<string, { label: string; color: string; bg: string; glow: string; score: number }> = {
//   HEALTHY:   { label: 'Healthy',   color: '#10b981', bg: 'rgba(16,185,129,0.15)', glow: '#10b981', score: 88 },
//   OKAY:      { label: 'Okay',      color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  glow: '#f59e0b', score: 58 },
//   UNHEALTHY: { label: 'Unhealthy', color: '#ef4444', bg: 'rgba(239,68,68,0.15)',   glow: '#ef4444', score: 28 },
//   JUNK:      { label: 'Junk',      color: '#dc2626', bg: 'rgba(220,38,38,0.15)',   glow: '#dc2626', score: 12 },
//   INVALID:   { label: 'Unknown',   color: '#6366f1', bg: 'rgba(99,102,241,0.15)',  glow: '#6366f1', score: 50 },
// };

// const mockRecentScans: RecentScan[] = [
//   { id: '1', name: 'Whole Grain Oats', verdict: 'HEALTHY', emoji: '🌾', score: 92, time: '2m ago' },
//   { id: '2', name: 'Energy Drink X', verdict: 'JUNK',    emoji: '⚠️', score: 14, time: '1h ago' },
//   { id: '3', name: 'Greek Yogurt',    verdict: 'HEALTHY', emoji: '🥛', score: 85, time: '3h ago' },
//   { id: '4', name: 'Potato Chips',    verdict: 'UNHEALTHY',emoji:'🍟', score: 22, time: '5h ago' },
// ];

// function parseResponseSections(text: string) {
//   const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
//   const sections: { title: string; paragraphs: string[]; bullets: string[] }[] = [];
//   let cur: typeof sections[0] | null = null;
//   const flush = () => { if (cur) sections.push(cur); };
//   lines.forEach(line => {
//     const h = line.match(/^(\d+)\.\s*([^:]+):?$/);
//     if (h) { flush(); cur = { title: `${h[1]}. ${h[2].trim()}`, paragraphs: [], bullets: [] }; return; }
//     const b = line.match(/^[-•*]\s+(.*)$/);
//     if (b) { if (!cur) cur = { title: 'Details', paragraphs: [], bullets: [] }; cur.bullets.push(b[1].trim()); return; }
//     if (!cur) cur = { title: 'Overview', paragraphs: [], bullets: [] };
//     cur.paragraphs.push(line);
//   });
//   flush();
//   return sections;
// }

// // ─── Sub Components ───────────────────────────────────────────────────────────

// function HealthGauge({ score, color }: { score: number; color: string }) {
//   const r = 52, cx = 60, cy = 60;
//   const circ = 2 * Math.PI * r;
//   const dash = (score / 100) * circ;
//   return (
//     <svg width="120" height="120" viewBox="0 0 120 120" style={{ display: 'block' }}>
//       <defs>
//         <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
//           <stop offset="0%" stopColor={color} stopOpacity="0.6" />
//           <stop offset="100%" stopColor={color} />
//         </linearGradient>
//         <filter id="glow">
//           <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
//           <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
//         </filter>
//       </defs>
//       <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
//       <circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#gaugeGrad)" strokeWidth="8"
//         strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
//         transform={`rotate(-90 ${cx} ${cy})`} filter="url(#glow)"
//         style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)' }} />
//       <text x={cx} y={cy + 6} textAnchor="middle" fontSize="18" fontWeight="700" fill="white">{score}</text>
//       <text x={cx} y={cy + 22} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.45)" letterSpacing="1">SCORE</text>
//     </svg>
//   );
// }

// function ShimmerCard({ h = 120 }: { h?: number }) {
//   return (
//     <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 16, height: h, overflow: 'hidden', position: 'relative' }}>
//       <div className="sna-shimmer" />
//     </div>
//   );
// }

// function ScanPulse() {
//   return (
//     <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '48px 0' }}>
//       <div className="sna-scan-ring">
//         <div className="sna-scan-core">
//           <span style={{ fontSize: 28 }}>🔬</span>
//         </div>
//       </div>
//       <div style={{ textAlign: 'center' }}>
//         <div style={{ color: '#10b981', fontWeight: 600, fontSize: 15, letterSpacing: '0.02em' }}>Analyzing your food label…</div>
//         <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 6 }}>AI is scanning ingredients & nutrition data</div>
//       </div>
//       <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 400 }}>
//         {['Reading nutrition facts','Detecting harmful chemicals','Generating health insights'].map((s,i) => (
//           <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
//             <div className="sna-step-dot" style={{ animationDelay: `${i * 0.4}s` }} />
//             <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{s}</span>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// function IngredientPill({ item, type }: { item: HarmfulIngredient | string; type: 'harmful' | 'safe' }) {
//   const [open, setOpen] = useState(false);
//   const isObj = typeof item === 'object';
//   const name = isObj ? item.name : item;
//   const note = isObj ? item.why_harmful : null;
//   return (
//     <div style={{ marginBottom: 8 }}>
//       <button onClick={() => note && setOpen(o => !o)} style={{
//         display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px',
//         borderRadius: 100, border: 'none', cursor: note ? 'pointer' : 'default',
//         background: type === 'harmful' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.12)',
//         color: type === 'harmful' ? '#f87171' : '#34d399',
//         fontSize: 13, fontWeight: 500, transition: 'all 0.2s',
//       }}>
//         {type === 'harmful' ? '⚠' : '✓'} {name}
//         {note && <span style={{ opacity: 0.6, fontSize: 11 }}>{open ? '▲' : '▼'}</span>}
//       </button>
//       {open && note && (
//         <div style={{
//           marginTop: 6, padding: '10px 14px', borderRadius: 10,
//           background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)',
//           fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6,
//         }}>{note}</div>
//       )}
//     </div>
//   );
// }

// function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
//   return (
//     <div style={{ marginBottom: 12 }}>
//       <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 5 }}>
//         <span>{label}</span><span style={{ color }}>{value}%</span>
//       </div>
//       <div style={{ height: 5, borderRadius: 10, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
//         <div style={{ height: '100%', width: `${value}%`, borderRadius: 10, background: color,
//           transition: 'width 1.2s cubic-bezier(.4,0,.2,1)', boxShadow: `0 0 8px ${color}60` }} />
//       </div>
//     </div>
//   );
// }

// function RecentScanCard({ scan }: { scan: RecentScan }) {
//   const cfg = verdictConfig[scan.verdict] || verdictConfig.INVALID;
//   return (
//     <div className="sna-hover-card" style={{
//       padding: '14px 16px', borderRadius: 14,
//       background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
//       display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
//     }}>
//       <div style={{ width: 38, height: 38, borderRadius: 10, background: cfg.bg,
//         display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
//         {scan.emoji}
//       </div>
//       <div style={{ flex: 1, minWidth: 0 }}>
//         <div style={{ fontWeight: 600, fontSize: 13, color: 'rgba(255,255,255,0.9)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{scan.name}</div>
//         <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{scan.time}</div>
//       </div>
//       <div style={{ textAlign: 'right', flexShrink: 0 }}>
//         <div style={{ fontSize: 11, fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{cfg.label}</div>
//         <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Score {scan.score}</div>
//       </div>
//     </div>
//   );
// }

// function StatBox({ icon, label, value, sub }: { icon: string; label: string; value: string | number; sub?: string }) {
//   return (
//     <div style={{ padding: '18px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.03)',
//       border: '1px solid rgba(255,255,255,0.06)' }}>
//       <div style={{ fontSize: 20, marginBottom: 10 }}>{icon}</div>
//       <div style={{ fontSize: 22, fontWeight: 800, color: 'white', lineHeight: 1 }}>{value}</div>
//       <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{label}</div>
//       {sub && <div style={{ fontSize: 11, color: '#10b981', marginTop: 4 }}>{sub}</div>}
//     </div>
//   );
// }

// // ─── Main App ─────────────────────────────────────────────────────────────────
// export default function App() {
//   const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
//   const [message, setMessage] = useState('');
//   const [language, setLanguage] = useState('english');
//   const [result, setResult] = useState<AnalyzeResponse | null>(null);
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [cameraOpen, setCameraOpen] = useState(false);
//   const [capturedFile, setCapturedFile] = useState<File | null>(null);
//   const [previewUrls, setPreviewUrls] = useState<string[]>([]);
//   const [stream, setStream] = useState<MediaStream | null>(null);
//   const [dragOver, setDragOver] = useState(false);
//   const [recentScans] = useState<RecentScan[]>(mockRecentScans);
//   const [activeTab, setActiveTab] = useState<'analysis' | 'ingredients' | 'nutrition' | 'advice'>('analysis');
//   const videoRef = useRef<HTMLVideoElement | null>(null);
//   const fileInputRef = useRef<HTMLInputElement | null>(null);

//   useEffect(() => {
//     return () => {
//       previewUrls.forEach(url => URL.revokeObjectURL(url));
//       if (stream) stream.getTracks().forEach(t => t.stop());
//     };
//   }, [previewUrls, stream]);

//   useEffect(() => {
//     const urls = selectedFiles.map(f => URL.createObjectURL(f));
//     setPreviewUrls(urls);
//     return () => urls.forEach(u => URL.revokeObjectURL(u));
//   }, [selectedFiles]);

//   const filesToUpload = capturedFile ? [capturedFile, ...selectedFiles] : selectedFiles;

//   const handleFileChange = useCallback((filesList: FileList | null) => {
//     if (!filesList) return;
//     setSelectedFiles(Array.from(filesList).slice(0, 4));
//     setCapturedFile(null); setResult(null); setError('');
//   }, []);

//   const handleDrop = (e: React.DragEvent) => {
//     e.preventDefault(); setDragOver(false);
//     handleFileChange(e.dataTransfer.files);
//   };

//   const openCamera = async () => {
//     setError(''); setCameraOpen(true);
//     try {
//       const ms = await navigator.mediaDevices.getUserMedia({ video: true });
//       setStream(ms);
//       if (videoRef.current) videoRef.current.srcObject = ms;
//     } catch { setError('Camera access denied. Please allow camera permissions.'); setCameraOpen(false); }
//   };

//   const capturePhoto = () => {
//     if (!videoRef.current) return;
//     const v = videoRef.current;
//     const c = document.createElement('canvas');
//     c.width = v.videoWidth; c.height = v.videoHeight;
//     c.getContext('2d')?.drawImage(v, 0, 0);
//     c.toBlob(blob => {
//       if (!blob) return;
//       setCapturedFile(new File([blob], `cap-${Date.now()}.png`, { type: 'image/png' }));
//       setCameraOpen(false);
//       setStream(prev => { prev?.getTracks().forEach(t => t.stop()); return null; });
//       setResult(null); setError('');
//     });
//   };

//   const handleSubmit = async () => {
//     if (!filesToUpload.length) { setError('Please upload or capture a food label image.'); return; }
//     setLoading(true); setError(''); setResult(null);
//     const fd = new FormData();
//     filesToUpload.forEach(f => fd.append('files', f));
//     fd.append('message', message); fd.append('language', language);
//     try {
//       const res = await fetch(`${API_BASE_URL}/analyze`, { method: 'POST', body: fd });
//       const payload = await res.json();
//       if (!res.ok || payload?.error) { setError(payload?.detail || payload?.error || 'Analysis failed.'); return; }
//       if (!payload?.final_response && !payload?.food_analysis) {
//         setError('No analysis produced. Try a clearer photo of the nutrition label.'); return;
//       }
//       setResult(payload);
//     } catch { setError('Cannot reach backend. Is the API server running?'); }
//     finally { setLoading(false); }
//   };

//   const handleReset = () => {
//     setSelectedFiles([]); setCapturedFile(null); setMessage('');
//     setLanguage('english'); setResult(null); setError('');
//   };

//   const verdict = result?.food_analysis?.overall_verdict ?? (result?.final_response ? 'INVALID' : null);
//   const vcfg = verdict ? (verdictConfig[verdict] || verdictConfig.INVALID) : null;
//   const sections = result?.final_response ? parseResponseSections(result.final_response) : [];

//   return (
//     <>
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');

//         *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

//         :root {
//           --green: #10b981;
//           --green-dim: rgba(16,185,129,0.15);
//           --red: #ef4444;
//           --amber: #f59e0b;
//           --blue: #3b82f6;
//           --surface: rgba(255,255,255,0.03);
//           --surface2: rgba(255,255,255,0.05);
//           --border: rgba(255,255,255,0.07);
//           --border2: rgba(255,255,255,0.12);
//           --text: rgba(255,255,255,0.9);
//           --text-dim: rgba(255,255,255,0.45);
//           --text-muted: rgba(255,255,255,0.25);
//           --radius: 18px;
//           --font: 'Outfit', sans-serif;
//         }

//         html { scroll-behavior: smooth; }

//         body {
//           font-family: var(--font);
//           background: #080b12;
//           color: var(--text);
//           min-height: 100vh;
//           overflow-x: hidden;
//           -webkit-font-smoothing: antialiased;
//         }

//         body::before {
//           content: '';
//           position: fixed; inset: 0; z-index: 0; pointer-events: none;
//           background:
//             radial-gradient(ellipse 80% 60% at 10% -10%, rgba(16,185,129,0.07) 0%, transparent 60%),
//             radial-gradient(ellipse 60% 50% at 90% 110%, rgba(59,130,246,0.05) 0%, transparent 55%),
//             radial-gradient(ellipse 40% 40% at 50% 50%, rgba(16,185,129,0.025) 0%, transparent 70%);
//         }

//         #root { position: relative; z-index: 1; }

//         /* ── Layout ── */
//         .sna-shell { max-width: 1380px; margin: 0 auto; padding: 0 24px 80px; }

//         /* ── Navbar ── */
//         .sna-nav {
//           display: flex; align-items: center; justify-content: space-between;
//           padding: 20px 0; border-bottom: 1px solid var(--border);
//           margin-bottom: 48px;
//         }
//         .sna-nav-logo {
//           display: flex; align-items: center; gap: 10px;
//           font-size: 18px; font-weight: 800; letter-spacing: -0.03em; color: white;
//         }
//         .sna-nav-logo-icon {
//           width: 34px; height: 34px; border-radius: 10px;
//           background: linear-gradient(135deg, #10b981, #059669);
//           display: flex; align-items: center; justify-content: center; font-size: 16px;
//           box-shadow: 0 0 20px rgba(16,185,129,0.35);
//         }
//         .sna-nav-links { display: flex; align-items: center; gap: 4px; }
//         .sna-nav-link {
//           padding: 7px 14px; border-radius: 8px; font-size: 14px;
//           color: var(--text-dim); cursor: pointer; transition: all 0.2s;
//           border: none; background: transparent; font-family: var(--font);
//         }
//         .sna-nav-link:hover { color: white; background: var(--surface); }
//         .sna-nav-badge {
//           padding: 7px 16px; border-radius: 8px; font-size: 13px; font-weight: 600;
//           background: var(--green); color: #000; cursor: pointer; border: none;
//           font-family: var(--font); transition: all 0.2s;
//         }
//         .sna-nav-badge:hover { background: #34d399; transform: translateY(-1px); }

//         /* ── Hero ── */
//         .sna-hero {
//           display: grid; grid-template-columns: 1fr 420px;
//           gap: 48px; align-items: center; margin-bottom: 56px;
//         }
//         .sna-hero-badge {
//           display: inline-flex; align-items: center; gap: 7px;
//           padding: 6px 14px; border-radius: 100px;
//           background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2);
//           font-size: 12px; font-weight: 600; color: #34d399;
//           letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 20px;
//         }
//         .sna-hero-badge::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: #10b981; animation: pulse 2s infinite; }
//         .sna-hero-h1 {
//           font-size: clamp(2.4rem, 4vw, 3.8rem); font-weight: 900;
//           line-height: 1.05; letter-spacing: -0.04em; color: white;
//           margin-bottom: 20px;
//         }
//         .sna-hero-h1 span {
//           background: linear-gradient(135deg, #10b981 0%, #34d399 40%, #6ee7b7 100%);
//           -webkit-background-clip: text; -webkit-text-fill-color: transparent;
//           background-clip: text;
//         }
//         .sna-hero-sub {
//           font-size: 16px; color: var(--text-dim); line-height: 1.7;
//           max-width: 520px; margin-bottom: 32px; font-weight: 400;
//         }
//         .sna-hero-pills { display: flex; gap: 10px; flex-wrap: wrap; }
//         .sna-hero-pill {
//           padding: 8px 16px; border-radius: 100px; font-size: 13px; font-weight: 500;
//           border: 1px solid var(--border2); color: var(--text-dim);
//           background: var(--surface); cursor: default;
//         }

//         /* Hero stat card */
//         .sna-stat-card {
//           background: rgba(12,17,28,0.85);
//           border: 1px solid var(--border2);
//           border-radius: 24px; padding: 28px;
//           backdrop-filter: blur(20px);
//           box-shadow: 0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07);
//         }
//         .sna-stat-card-label {
//           font-size: 11px; font-weight: 700; text-transform: uppercase;
//           letter-spacing: 0.12em; color: var(--green); margin-bottom: 20px;
//           display: flex; align-items: center; gap: 8px;
//         }
//         .sna-stat-card-label::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--green); animation: pulse 2s infinite; }
//         .sna-stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
//         .sna-stat-item {
//           padding: 16px; border-radius: 14px; background: rgba(255,255,255,0.035);
//           border: 1px solid var(--border);
//         }
//         .sna-stat-val { font-size: 26px; font-weight: 800; color: white; letter-spacing: -0.03em; }
//         .sna-stat-key { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
//         .sna-stat-highlight { color: var(--green); }

//         /* ── Main grid ── */
//         .sna-main { display: grid; grid-template-columns: 420px 1fr; gap: 24px; align-items: start; }
//         .sna-sidebar { display: flex; flex-direction: column; gap: 20px; }
//         .sna-content { display: flex; flex-direction: column; gap: 20px; }

//         /* ── Cards ── */
//         .sna-card {
//           background: rgba(11,15,25,0.92);
//           border: 1px solid var(--border);
//           border-radius: var(--radius);
//           backdrop-filter: blur(16px);
//           overflow: hidden;
//           box-shadow: 0 4px 24px rgba(0,0,0,0.3);
//         }
//         .sna-card-header {
//           padding: 20px 22px 0;
//           display: flex; align-items: center; justify-content: space-between;
//           margin-bottom: 16px;
//         }
//         .sna-card-title { font-size: 14px; font-weight: 700; color: white; letter-spacing: -0.01em; }
//         .sna-card-sub { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
//         .sna-card-body { padding: 0 22px 22px; }

//         /* ── Upload Zone ── */
//         .sna-dropzone {
//           border: 1.5px dashed var(--border2); border-radius: 14px;
//           padding: 32px 20px; text-align: center; cursor: pointer;
//           transition: all 0.25s; position: relative; overflow: hidden;
//           background: rgba(255,255,255,0.015);
//         }
//         .sna-dropzone:hover, .sna-dropzone.drag { border-color: var(--green); background: rgba(16,185,129,0.04); }
//         .sna-dropzone-icon { font-size: 32px; margin-bottom: 12px; display: block; }
//         .sna-dropzone-title { font-size: 15px; font-weight: 600; color: white; margin-bottom: 6px; }
//         .sna-dropzone-sub { font-size: 13px; color: var(--text-dim); margin-bottom: 18px; }

//         /* ── Buttons ── */
//         .sna-btn {
//           display: inline-flex; align-items: center; justify-content: center; gap: 8px;
//           padding: 10px 18px; border-radius: 10px; font-size: 13.5px; font-weight: 600;
//           cursor: pointer; border: none; font-family: var(--font);
//           transition: all 0.2s; text-decoration: none; white-space: nowrap;
//         }
//         .sna-btn-primary {
//           background: var(--green); color: #000;
//           box-shadow: 0 0 20px rgba(16,185,129,0.3);
//         }
//         .sna-btn-primary:hover:not(:disabled) { background: #34d399; transform: translateY(-1px); box-shadow: 0 4px 24px rgba(16,185,129,0.4); }
//         .sna-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
//         .sna-btn-secondary {
//           background: var(--surface2); color: var(--text);
//           border: 1px solid var(--border2);
//         }
//         .sna-btn-secondary:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.18); }
//         .sna-btn-ghost { background: transparent; color: var(--text-dim); border: 1px solid var(--border); }
//         .sna-btn-ghost:hover { color: white; border-color: var(--border2); background: var(--surface); }
//         .sna-btn-danger { background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.2); }
//         .sna-btn-row { display: flex; gap: 8px; flex-wrap: wrap; }

//         /* ── Inputs ── */
//         .sna-textarea {
//           width: 100%; padding: 12px 14px; border-radius: 12px;
//           background: rgba(255,255,255,0.04); border: 1px solid var(--border2);
//           color: white; font-family: var(--font); font-size: 13.5px;
//           resize: none; outline: none; line-height: 1.6;
//           transition: border-color 0.2s;
//         }
//         .sna-textarea:focus { border-color: rgba(16,185,129,0.4); }
//         .sna-textarea::placeholder { color: var(--text-muted); }
//         .sna-select {
//           padding: 9px 14px; border-radius: 10px; background: rgba(255,255,255,0.04);
//           border: 1px solid var(--border2); color: white; font-family: var(--font);
//           font-size: 13px; outline: none; cursor: pointer; appearance: none;
//           background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff60' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
//           background-repeat: no-repeat; background-position: right 12px center;
//           padding-right: 32px;
//         }
//         .sna-select:focus { border-color: rgba(16,185,129,0.4); }
//         .sna-field-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
//         .sna-field-label { font-size: 12px; color: var(--text-dim); margin-bottom: 6px; }
//         .sna-divider { height: 1px; background: var(--border); margin: 16px 0; }

//         /* ── Preview grid ── */
//         .sna-preview-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 12px; }
//         .sna-preview-img {
//           width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 10px;
//           border: 1px solid var(--border2);
//         }
//         .sna-preview-empty {
//           text-align: center; padding: 20px; font-size: 13px; color: var(--text-muted);
//           border: 1px solid var(--border); border-radius: 10px; grid-column: span 2;
//         }

//         /* ── Camera ── */
//         .sna-camera-card { border-radius: 14px; overflow: hidden; background: #000; margin-bottom: 12px; }
//         .sna-camera-video { width: 100%; display: block; aspect-ratio: 16/9; object-fit: cover; }

//         /* ── Alert ── */
//         .sna-alert {
//           padding: 12px 16px; border-radius: 10px; font-size: 13px; line-height: 1.5;
//           background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: #f87171;
//           display: flex; align-items: flex-start; gap: 8px;
//         }

//         /* ── Result Verdict Card ── */
//         .sna-verdict-hero {
//           padding: 28px; display: flex; align-items: center; gap: 24px;
//           border-radius: var(--radius); margin-bottom: 0;
//           position: relative; overflow: hidden;
//         }
//         .sna-verdict-glow {
//           position: absolute; inset: 0; pointer-events: none;
//           background: radial-gradient(ellipse 80% 80% at 0% 50%, var(--vcol, #10b981) 0%, transparent 60%);
//           opacity: 0.1;
//         }
//         .sna-verdict-info { flex: 1; }
//         .sna-verdict-tag {
//           display: inline-flex; align-items: center; gap: 6px;
//           padding: 5px 14px; border-radius: 100px; font-size: 11px; font-weight: 800;
//           text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 10px;
//         }
//         .sna-verdict-name { font-size: 22px; font-weight: 800; letter-spacing: -0.02em; color: white; margin-bottom: 8px; }
//         .sna-verdict-summary { font-size: 14px; color: var(--text-dim); line-height: 1.6; }

//         /* ── Tabs ── */
//         .sna-tabs { display: flex; gap: 4px; padding: 4px; background: rgba(255,255,255,0.04); border-radius: 12px; }
//         .sna-tab {
//           flex: 1; padding: 9px 14px; border-radius: 9px; font-size: 13px; font-weight: 600;
//           color: var(--text-dim); cursor: pointer; border: none; background: transparent;
//           font-family: var(--font); transition: all 0.2s; text-align: center; white-space: nowrap;
//         }
//         .sna-tab.active { background: rgba(255,255,255,0.1); color: white; }
//         .sna-tab:hover:not(.active) { color: rgba(255,255,255,0.7); }

//         /* ── Response sections ── */
//         .sna-resp-section { margin-bottom: 20px; }
//         .sna-resp-section h4 {
//           font-size: 13px; font-weight: 700; color: var(--green);
//           text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 10px;
//         }
//         .sna-resp-section p { font-size: 14px; color: var(--text-dim); line-height: 1.7; margin-bottom: 8px; }
//         .sna-resp-section ul { list-style: none; display: flex; flex-direction: column; gap: 6px; }
//         .sna-resp-section li {
//           font-size: 14px; color: var(--text-dim); line-height: 1.6;
//           padding-left: 18px; position: relative;
//         }
//         .sna-resp-section li::before {
//           content: '›'; position: absolute; left: 0; color: var(--green); font-weight: 700;
//         }

//         /* ── Nutrition table ── */
//         .sna-nutr-table { width: 100%; border-collapse: collapse; }
//         .sna-nutr-table tr { border-bottom: 1px solid var(--border); }
//         .sna-nutr-table tr:last-child { border-bottom: none; }
//         .sna-nutr-table td { padding: 10px 0; font-size: 14px; }
//         .sna-nutr-key { color: var(--text-dim); text-transform: capitalize; }
//         .sna-nutr-val { color: white; font-weight: 600; text-align: right; font-family: 'JetBrains Mono', monospace; }

//         /* ── Insight chips ── */
//         .sna-insight-chip {
//           padding: 10px 14px; border-radius: 12px; font-size: 13px; color: var(--text-dim);
//           background: var(--surface); border: 1px solid var(--border); line-height: 1.5;
//           display: flex; gap: 8px; align-items: flex-start;
//         }
//         .sna-insight-chip-icon { flex-shrink: 0; }

//         /* ── Hover card effect ── */
//         .sna-hover-card { transition: all 0.2s; }
//         .sna-hover-card:hover { background: rgba(255,255,255,0.06) !important; transform: translateY(-1px); }

//         /* ── Shimmer ── */
//         .sna-shimmer {
//           position: absolute; inset: 0;
//           background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
//           animation: shimmer 1.5s infinite;
//         }
//         @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }

//         /* ── Scan ring ── */
//         .sna-scan-ring {
//           width: 90px; height: 90px; border-radius: 50%;
//           border: 2px solid rgba(16,185,129,0.2);
//           display: flex; align-items: center; justify-content: center;
//           position: relative; animation: ring-pulse 2s ease-in-out infinite;
//         }
//         .sna-scan-ring::before {
//           content: ''; position: absolute; inset: -10px; border-radius: 50%;
//           border: 2px solid rgba(16,185,129,0.1); animation: ring-pulse 2s ease-in-out infinite 0.5s;
//         }
//         .sna-scan-core {
//           width: 64px; height: 64px; border-radius: 50%;
//           background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.3);
//           display: flex; align-items: center; justify-content: center;
//           animation: core-glow 2s ease-in-out infinite;
//         }
//         @keyframes ring-pulse {
//           0%, 100% { transform: scale(1); opacity: 0.8; }
//           50% { transform: scale(1.08); opacity: 1; }
//         }
//         @keyframes core-glow {
//           0%, 100% { box-shadow: 0 0 12px rgba(16,185,129,0.2); }
//           50% { box-shadow: 0 0 28px rgba(16,185,129,0.5); }
//         }

//         /* ── Step dot ── */
//         .sna-step-dot {
//           width: 8px; height: 8px; border-radius: 50%; background: var(--green);
//           animation: blink 1.2s ease-in-out infinite; flex-shrink: 0;
//         }
//         @keyframes blink {
//           0%, 100% { opacity: 0.3; transform: scale(0.8); }
//           50% { opacity: 1; transform: scale(1.2); box-shadow: 0 0 8px var(--green); }
//         }

//         /* ── Pulse ── */
//         @keyframes pulse {
//           0%, 100% { opacity: 1; }
//           50% { opacity: 0.4; }
//         }

//         /* ── Recent scans ── */
//         .sna-recent-list { display: flex; flex-direction: column; gap: 8px; }

//         /* ── Harmful badge ── */
//         .sna-harm-badge {
//           display: inline-flex; align-items: center; gap: 6px;
//           padding: 6px 12px; border-radius: 10px; font-size: 13px; font-weight: 600;
//           background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: #f87171;
//         }

//         /* ── Download btn ── */
//         .sna-dl-btn {
//           padding: 7px 14px; border-radius: 8px; font-size: 12px; font-weight: 600;
//           background: var(--surface2); border: 1px solid var(--border2); color: var(--text-dim);
//           cursor: pointer; font-family: var(--font); transition: all 0.2s;
//         }
//         .sna-dl-btn:hover { color: white; border-color: var(--border2); background: rgba(255,255,255,0.08); }

//         /* ── Empty state ── */
//         .sna-empty {
//           padding: 60px 24px; text-align: center; display: flex;
//           flex-direction: column; align-items: center; gap: 14px;
//         }
//         .sna-empty-icon { font-size: 48px; opacity: 0.4; }
//         .sna-empty-title { font-size: 16px; font-weight: 600; color: rgba(255,255,255,0.4); }
//         .sna-empty-sub { font-size: 13px; color: var(--text-muted); max-width: 280px; line-height: 1.6; }

//         /* ── Responsive ── */
//         @media (max-width: 1100px) {
//           .sna-hero { grid-template-columns: 1fr; }
//           .sna-stat-card { display: none; }
//           .sna-main { grid-template-columns: 1fr; }
//         }
//         @media (max-width: 640px) {
//           .sna-shell { padding: 0 14px 60px; }
//           .sna-hero-h1 { font-size: 2rem; }
//           .sna-nav-links { display: none; }
//           .sna-tabs { overflow-x: auto; }
//           .sna-tab { font-size: 12px; padding: 8px 10px; }
//         }
//       `}</style>

//       <div className="sna-shell">
//         {/* ── Navbar ── */}
//         <nav className="sna-nav">
//           <div className="sna-nav-logo">
//             <div className="sna-nav-logo-icon">⚡</div>
//             Smart Nutrition
//           </div>
//           <div className="sna-nav-links">
//             <button className="sna-nav-link">Dashboard</button>
//             <button className="sna-nav-link">History</button>
//             <button className="sna-nav-link">Insights</button>
//             <button className="sna-nav-link">Settings</button>
//           </div>
//           <button className="sna-nav-badge">Try Free →</button>
//         </nav>

//         {/* ── Hero ── */}
//         <section className="sna-hero">
//           <div>
//             <div className="sna-hero-badge">AI-Powered Food Intelligence</div>
//             <h1 className="sna-hero-h1">
//               Know exactly what<br />
//               <span>you're eating</span>, instantly.
//             </h1>
//             <p className="sna-hero-sub">
//               Upload food labels and get AI-powered health insights, harmful ingredient detection,
//               and smarter nutrition guidance — in seconds.
//             </p>
//             <div className="sna-hero-pills">
//               {['🔬 Ingredient Analysis','⚠️ Harmful Detection','❤️ Health Score','💡 Smart Alternatives'].map(p => (
//                 <div key={p} className="sna-hero-pill">{p}</div>
//               ))}
//             </div>
//           </div>
//           <div className="sna-stat-card">
//             <div className="sna-stat-card-label">Live Analytics</div>
//             <div className="sna-stat-grid">
//               <div className="sna-stat-item">
//                 <div className="sna-stat-val sna-stat-highlight">12k+</div>
//                 <div className="sna-stat-key">Labels scanned</div>
//               </div>
//               <div className="sna-stat-item">
//                 <div className="sna-stat-val">~3s</div>
//                 <div className="sna-stat-key">Avg. analysis time</div>
//               </div>
//               <div className="sna-stat-item">
//                 <div className="sna-stat-val sna-stat-highlight">98%</div>
//                 <div className="sna-stat-key">Accuracy rate</div>
//               </div>
//               <div className="sna-stat-item">
//                 <div className="sna-stat-val">500+</div>
//                 <div className="sna-stat-key">Additives tracked</div>
//               </div>
//             </div>
//             <div style={{ marginTop: 16 }}>
//               <ScoreBar label="Healthy foods today" value={68} color="#10b981" />
//               <ScoreBar label="Harmful detected" value={23} color="#ef4444" />
//               <ScoreBar label="User satisfaction" value={96} color="#3b82f6" />
//             </div>
//           </div>
//         </section>

//         {/* ── Main ── */}
//         <div className="sna-main">
//           {/* ── Sidebar ── */}
//           <aside className="sna-sidebar">
//             {/* Upload card */}
//             <div className="sna-card">
//               <div className="sna-card-header">
//                 <div>
//                   <div className="sna-card-title">📤 Upload Food Label</div>
//                   <div className="sna-card-sub">Up to 4 images at once</div>
//                 </div>
//               </div>
//               <div className="sna-card-body">
//                 {cameraOpen ? (
//                   <div>
//                     <div className="sna-camera-card">
//                       <video ref={videoRef} autoPlay muted playsInline className="sna-camera-video" />
//                     </div>
//                     <div className="sna-btn-row">
//                       <button className="sna-btn sna-btn-primary" style={{ flex: 1 }} onClick={capturePhoto}>📸 Capture</button>
//                       <button className="sna-btn sna-btn-ghost" onClick={() => { setCameraOpen(false); setStream(s => { s?.getTracks().forEach(t => t.stop()); return null; }); }}>Cancel</button>
//                     </div>
//                   </div>
//                 ) : (
//                   <div
//                     className={`sna-dropzone${dragOver ? ' drag' : ''}`}
//                     onDrop={handleDrop}
//                     onDragOver={e => { e.preventDefault(); setDragOver(true); }}
//                     onDragLeave={() => setDragOver(false)}
//                     onClick={() => fileInputRef.current?.click()}
//                   >
//                     <span className="sna-dropzone-icon">🖼️</span>
//                     <div className="sna-dropzone-title">Drag & drop images</div>
//                     <div className="sna-dropzone-sub">PNG, JPG, WEBP — up to 4 photos</div>
//                     <div className="sna-btn-row" style={{ justifyContent: 'center' }}>
//                       <button className="sna-btn sna-btn-secondary" style={{ fontSize: 12 }}
//                         onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}>
//                         📂 Browse files
//                       </button>
//                       <button className="sna-btn sna-btn-ghost" style={{ fontSize: 12 }}
//                         onClick={e => { e.stopPropagation(); openCamera(); }}>
//                         📷 Camera
//                       </button>
//                     </div>
//                     <input ref={fileInputRef} type="file" accept="image/*" multiple
//                       style={{ display: 'none' }} onChange={e => handleFileChange(e.target.files)} />
//                   </div>
//                 )}

//                 {/* Previews */}
//                 <div className="sna-preview-grid">
//                   {capturedFile && <img src={URL.createObjectURL(capturedFile)} alt="cap" className="sna-preview-img" />}
//                   {previewUrls.map(u => <img key={u} src={u} alt="preview" className="sna-preview-img" />)}
//                   {!capturedFile && !previewUrls.length && (
//                     <div className="sna-preview-empty">No image selected</div>
//                   )}
//                 </div>

//                 <div className="sna-divider" />

//                 {/* Textarea */}
//                 <div style={{ marginBottom: 12 }}>
//                   <div className="sna-field-label">Additional context or question (optional)</div>
//                   <textarea className="sna-textarea" rows={2}
//                     placeholder="e.g. Is this safe for a diabetic?"
//                     value={message} onChange={e => setMessage(e.target.value)} />
//                 </div>

//                 {/* Language + actions */}
//                 <div className="sna-field-row" style={{ marginBottom: 14 }}>
//                   <div style={{ flex: 1 }}>
//                     <div className="sna-field-label">Language</div>
//                     <select className="sna-select" value={language} onChange={e => setLanguage(e.target.value)} style={{ width: '100%' }}>
//                       <option value="english">🇬🇧 English</option>
//                       <option value="hindi">🇮🇳 Hindi</option>
//                       <option value="hinglish">🔀 Hinglish</option>
//                     </select>
//                   </div>
//                 </div>
//                 <div className="sna-btn-row">
//                   <button className="sna-btn sna-btn-primary" style={{ flex: 1 }}
//                     onClick={handleSubmit} disabled={loading}>
//                     {loading ? '⏳ Analyzing…' : '⚡ Analyze Now'}
//                   </button>
//                   <button className="sna-btn sna-btn-ghost" onClick={handleReset}>↺</button>
//                 </div>

//                 {error && (
//                   <div className="sna-alert" style={{ marginTop: 12 }}>
//                     <span>⚠️</span> {error}
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Stats row */}
//             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
//               <StatBox icon="🔬" label="Scans today" value="4" sub="+2 from yesterday" />
//               <StatBox icon="⚠️" label="Harmful found" value="2" sub="Avg. 3 per scan" />
//             </div>

//             {/* Recent scans */}
//             <div className="sna-card">
//               <div className="sna-card-header">
//                 <div>
//                   <div className="sna-card-title">🕐 Recent Scans</div>
//                   <div className="sna-card-sub">Your last 4 analyses</div>
//                 </div>
//                 <button className="sna-dl-btn">View all</button>
//               </div>
//               <div className="sna-card-body">
//                 <div className="sna-recent-list">
//                   {recentScans.map(s => <RecentScanCard key={s.id} scan={s} />)}
//                 </div>
//               </div>
//             </div>

//             {/* Frequently detected */}
//             <div className="sna-card">
//               <div className="sna-card-header">
//                 <div>
//                   <div className="sna-card-title">🚨 Top Detected Harmful</div>
//                   <div className="sna-card-sub">Most common across your scans</div>
//                 </div>
//               </div>
//               <div className="sna-card-body">
//                 {['High Fructose Corn Syrup','Sodium Nitrate','Monosodium Glutamate','Tartrazine (E102)','Trans Fats'].map((i, idx) => (
//                   <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: idx < 4 ? 10 : 0 }}>
//                     <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(239,68,68,0.1)',
//                       border: '1px solid rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center',
//                       justifyContent: 'center', fontSize: 11, color: '#f87171', fontWeight: 700, flexShrink: 0 }}>
//                       {idx + 1}
//                     </div>
//                     <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>{i}</div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </aside>

//           {/* ── Content ── */}
//           <div className="sna-content">
//             {loading && (
//               <div className="sna-card">
//                 <div className="sna-card-body" style={{ padding: '22px' }}>
//                   <ScanPulse />
//                   <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
//                     <ShimmerCard h={80} /><ShimmerCard h={120} /><ShimmerCard h={100} />
//                   </div>
//                 </div>
//               </div>
//             )}

//             {!loading && !result && (
//               <div className="sna-card">
//                 <div className="sna-empty">
//                   <div className="sna-empty-icon">🥗</div>
//                   <div className="sna-empty-title">No analysis yet</div>
//                   <div className="sna-empty-sub">Upload a food label or product image on the left to get your instant AI health report.</div>
//                 </div>
//               </div>
//             )}

//             {!loading && result && (vcfg || result.final_response) && (() => {
//               const fa = result.food_analysis;
//               const color = vcfg?.color || '#6366f1';
//               const score = vcfg?.score || 50;

//               return (
//                 <>
//                   {/* Verdict hero */}
//                   <div className="sna-card">
//                     <div className="sna-verdict-hero" style={{ '--vcol': color } as React.CSSProperties}>
//                       <div className="sna-verdict-glow" />
//                       <HealthGauge score={score} color={color} />
//                       <div className="sna-verdict-info">
//                         <div className="sna-verdict-tag" style={{ background: vcfg?.bg, color }}>
//                           {fa?.verdict_emoji || '📊'} {vcfg?.label || 'Analysis Result'}
//                         </div>
//                         <div className="sna-verdict-name">{result.product_name || 'Food Analysis'}</div>
//                         {fa?.short_summary && <div className="sna-verdict-summary">{fa.short_summary}</div>}
//                         {fa?.buy_or_avoid && (
//                           <div style={{ marginTop: 12, padding: '8px 14px', borderRadius: 10,
//                             background: color === '#10b981' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
//                             border: `1px solid ${color}30`, fontSize: 13, color, fontWeight: 600 }}>
//                             {fa.buy_or_avoid}
//                           </div>
//                         )}
//                       </div>
//                       <div style={{ flexShrink: 0 }}>
//                         <button className="sna-dl-btn" onClick={() => {
//                           const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
//                           const url = URL.createObjectURL(blob);
//                           const a = document.createElement('a');
//                           a.href = url; a.download = `${(result.product_name||'analysis').replace(/\s+/g,'_')}_report.json`; a.click();
//                           URL.revokeObjectURL(url);
//                         }}>⬇ Download report</button>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Score bars */}
//                   {fa && (
//                     <div className="sna-card">
//                       <div className="sna-card-header">
//                         <div>
//                           <div className="sna-card-title">📊 Health Breakdown</div>
//                           <div className="sna-card-sub">Key nutrition and safety metrics</div>
//                         </div>
//                       </div>
//                       <div className="sna-card-body">
//                         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
//                           <div>
//                             <ScoreBar label="Overall Health" value={score} color={color} />
//                             <ScoreBar label="Ingredient Safety"
//                               value={fa.harmful_ingredients?.length ? Math.max(10, 100 - fa.harmful_ingredients.length * 18) : 90}
//                               color="#10b981" />
//                             <ScoreBar label="Nutritional Balance" value={72} color="#3b82f6" />
//                           </div>
//                           <div>
//                             <ScoreBar label="Additive Risk" value={fa.harmful_ingredients?.length ? fa.harmful_ingredients.length * 20 : 5} color="#ef4444" />
//                             <ScoreBar label="Processing Level" value={58} color="#f59e0b" />
//                             <ScoreBar label="Daily Suitability" value={score > 70 ? 85 : 30} color="#8b5cf6" />
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   )}

//                   {/* Tabs */}
//                   <div className="sna-card">
//                     <div className="sna-card-header">
//                       <div className="sna-tabs" style={{ flex: 1 }}>
//                         {(['analysis','ingredients','nutrition','advice'] as const).map(t => (
//                           <button key={t} className={`sna-tab${activeTab===t?' active':''}`}
//                             onClick={() => setActiveTab(t)}>
//                             {t==='analysis'?'📝 Analysis':t==='ingredients'?'🧪 Ingredients':t==='nutrition'?'📊 Nutrition':'💡 Advice'}
//                           </button>
//                         ))}
//                       </div>
//                     </div>
//                     <div className="sna-card-body">

//                       {activeTab === 'analysis' && (
//                         <div>
//                           {sections.length > 0
//                             ? sections.map(s => (
//                               <div key={s.title} className="sna-resp-section">
//                                 <h4>{s.title}</h4>
//                                 {s.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
//                                 {s.bullets.length > 0 && <ul>{s.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>}
//                               </div>
//                             ))
//                             : result.final_response
//                               ? <div style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.7 }}>{result.final_response}</div>
//                               : <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>No detailed analysis text available.</div>
//                           }
//                         </div>
//                       )}

//                       {activeTab === 'ingredients' && fa && (
//                         <div>
//                           {fa.harmful_ingredients && fa.harmful_ingredients.length > 0 && (
//                             <div style={{ marginBottom: 24 }}>
//                               <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
//                                 <span style={{ fontSize: 16 }}>⚠️</span>
//                                 <span style={{ fontSize: 14, fontWeight: 700, color: '#f87171' }}>Harmful Ingredients</span>
//                                 <span style={{ padding: '2px 8px', borderRadius: 100, background: 'rgba(239,68,68,0.15)',
//                                   color: '#f87171', fontSize: 11, fontWeight: 700 }}>{fa.harmful_ingredients.length}</span>
//                               </div>
//                               <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
//                                 {fa.harmful_ingredients.map(i => <IngredientPill key={i.name} item={i} type="harmful" />)}
//                               </div>
//                             </div>
//                           )}
//                           {fa.okay_ingredients && fa.okay_ingredients.length > 0 && (
//                             <div>
//                               <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
//                                 <span style={{ fontSize: 16 }}>✅</span>
//                                 <span style={{ fontSize: 14, fontWeight: 700, color: '#34d399' }}>Healthy Ingredients</span>
//                                 <span style={{ padding: '2px 8px', borderRadius: 100, background: 'rgba(16,185,129,0.15)',
//                                   color: '#34d399', fontSize: 11, fontWeight: 700 }}>{fa.okay_ingredients.length}</span>
//                               </div>
//                               <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
//                                 {fa.okay_ingredients.map(i => <IngredientPill key={i} item={i} type="safe" />)}
//                               </div>
//                             </div>
//                           )}
//                           {!fa.harmful_ingredients?.length && !fa.okay_ingredients?.length && (
//                             <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>No ingredient data extracted.</div>
//                           )}
//                         </div>
//                       )}

//                       {activeTab === 'nutrition' && (() => {
//                         let nutrition: Record<string, unknown> | null = null;
//                         if (result.raw_ocr_text) {
//                           try { const p = JSON.parse(result.raw_ocr_text); nutrition = p?.nutrition || p?.extracted_nutrition || null; } catch {}
//                         }
//                         return nutrition ? (
//                           <table className="sna-nutr-table">
//                             <tbody>
//                               {Object.entries(nutrition).map(([k, v]) => (
//                                 <tr key={k}>
//                                   <td className="sna-nutr-key">{k.replace(/_/g, ' ')}</td>
//                                   <td className="sna-nutr-val">{String(v) || '—'}</td>
//                                 </tr>
//                               ))}
//                             </tbody>
//                           </table>
//                         ) : (
//                           <div style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: '32px 0' }}>
//                             No nutrition data extracted from the label.
//                           </div>
//                         );
//                       })()}

//                       {activeTab === 'advice' && fa && (
//                         <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
//                           {(fa.nutrition_insights || []).map((i, idx) => (
//                             <div key={idx} className="sna-insight-chip">
//                               <span className="sna-insight-chip-icon">💡</span> {i}
//                             </div>
//                           ))}
//                           {(fa.fun_comparisons || []).map((i, idx) => (
//                             <div key={idx} className="sna-insight-chip">
//                               <span className="sna-insight-chip-icon">🔄</span> {i}
//                             </div>
//                           ))}
//                           {!fa.nutrition_insights?.length && !fa.fun_comparisons?.length && (
//                             <div style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: '32px 0' }}>
//                               No specific advice generated.
//                             </div>
//                           )}
//                         </div>
//                       )}
//                     </div>
//                   </div>

//                   {/* Healthy alternatives */}
//                   <div className="sna-card">
//                     <div className="sna-card-header">
//                       <div>
//                         <div className="sna-card-title">🌿 Healthier Alternatives</div>
//                         <div className="sna-card-sub">AI-suggested swaps for a better diet</div>
//                       </div>
//                     </div>
//                     <div className="sna-card-body">
//                       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: 10 }}>
//                         {['Whole Grain Version','Natural Fruit Snack','Unsweetened Option','Organic Alternative','Low-Sodium Variant','Fresh Home-cooked'].map(alt => (
//                           <div key={alt} className="sna-hover-card" style={{
//                             padding: '14px 16px', borderRadius: 14, cursor: 'pointer',
//                             background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.12)',
//                           }}>
//                             <div style={{ fontSize: 18, marginBottom: 6 }}>🌱</div>
//                             <div style={{ fontSize: 13, fontWeight: 600, color: '#34d399' }}>{alt}</div>
//                             <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>Better choice</div>
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   </div>
//                 </>
//               );
//             })()}

//             {/* Dashboard: Daily insights (always visible) */}
//             {!loading && (
//               <div className="sna-card">
//                 <div className="sna-card-header">
//                   <div>
//                     <div className="sna-card-title">📈 Daily Nutrition Insights</div>
//                     <div className="sna-card-sub">Your health snapshot for today</div>
//                   </div>
//                 </div>
//                 <div className="sna-card-body">
//                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
//                     {[
//                       { icon: '🔥', val: '1,840', label: 'kcal consumed', color: '#f59e0b' },
//                       { icon: '💧', val: '1.8L', label: 'water intake', color: '#3b82f6' },
//                       { icon: '🥩', val: '72g', label: 'protein today', color: '#10b981' },
//                       { icon: '🍬', val: '38g', label: 'sugar intake', color: '#ef4444' },
//                     ].map(s => (
//                       <div key={s.label} style={{ padding: '16px', borderRadius: 14, textAlign: 'center',
//                         background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
//                         <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
//                         <div style={{ fontSize: 20, fontWeight: 800, color: s.color, letterSpacing: '-0.02em' }}>{s.val}</div>
//                         <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, textTransform: 'capitalize' }}>{s.label}</div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }



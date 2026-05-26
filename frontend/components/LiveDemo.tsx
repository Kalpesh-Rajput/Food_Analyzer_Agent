"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type MouseEvent } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

type VerdictType = 'HEALTHY' | 'OKAY' | 'UNHEALTHY' | 'JUNK' | string;

type ParsedSection = { title: string; paragraphs: string[]; bullets: string[] };

type AnalysisResult = {
  overall_verdict?: string;
  verdict_emoji?: string;
  verdict_color?: string;
  harmful_ingredients?: Array<{ name?: string; why_harmful?: string }>;
  okay_ingredients?: string[];
  nutrition_insights?: string[];
  fun_comparisons?: string[];
  buy_or_avoid?: string;
  short_summary?: string;
  health_score?: number;
};

type ResultPayload = {
  final_response?: string;
  formatted_response?: string;
  food_analysis?: AnalysisResult;
  analysis_result?: AnalysisResult;
  raw_ocr_text?: string;
  error?: string;
};

const ScanOverlay = () => (
  <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
    <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-90 animate-[scanLine_2s_ease-in-out_infinite] shadow-[0_0_30px_rgba(16,185,129,0.4)]" />
    {[0, 1, 2, 3].map((i) => (
      <div
        key={i}
        className="absolute h-5 w-5 border-2 border-emerald-400"
        style={
          i === 0
            ? { top: 16, left: 16, borderRight: 'transparent', borderBottom: 'transparent' }
            : i === 1
            ? { top: 16, right: 16, borderLeft: 'transparent', borderBottom: 'transparent' }
            : i === 2
            ? { bottom: 16, left: 16, borderRight: 'transparent', borderTop: 'transparent' }
            : { bottom: 16, right: 16, borderLeft: 'transparent', borderTop: 'transparent' }
        }
      />
    ))}
  </div>
);

const VerdictBadge = ({ verdict }: { verdict: VerdictType }) => {
  const configs: Record<string, { bg: string; text: string; label: string }> = {
    HEALTHY: { bg: 'bg-emerald-500/10', text: 'text-emerald-300', label: 'Healthy' },
    OKAY: { bg: 'bg-amber-500/10', text: 'text-amber-300', label: 'Okay' },
    UNHEALTHY: { bg: 'bg-rose-500/10', text: 'text-rose-300', label: 'Unhealthy' },
    JUNK: { bg: 'bg-rose-500/10', text: 'text-rose-300', label: 'Junk Food' },
  };
  const config = configs[verdict] || { bg: 'bg-slate-700/10', text: 'text-slate-300', label: verdict || 'Unknown' };
  return <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${config.bg} ${config.text}`}>{config.label}</span>;
};

function parseFinalResponse(text: string): ParsedSection[] {
  const lines = text
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const sections: ParsedSection[] = [];
  let current: ParsedSection | null = null;
  let pendingBullet = false;

  const sanitize = (value: string) => value.replace(/^[\-\*\s]+|[\-\*\s]+$/g, '').trim();

  const flush = () => {
    if (current) sections.push(current);
    current = null;
    pendingBullet = false;
  };

  const makeSection = (title: string) => {
    flush();
    current = { title: sanitize(title), paragraphs: [], bullets: [] };
  };

  const addParagraph = (line: string) => {
    if (!current) current = { title: 'Summary', paragraphs: [], bullets: [] };
    current.paragraphs.push(sanitize(line));
  };

  const addBullet = (line: string) => {
    if (!current) current = { title: 'Details', paragraphs: [], bullets: [] };
    current.bullets.push(sanitize(line));
  };

  for (const line of lines) {
    if (/^[-–—]{3,}$/.test(line)) {
      pendingBullet = false;
      continue;
    }
    const bulletMatch = line.match(/^[>›•\-+*]\s*(.+)$/);
    if (bulletMatch) {
      addBullet(bulletMatch[1]);
      pendingBullet = false;
      continue;
    }
    if (/^[>›•\-+*]$/.test(line)) {
      pendingBullet = true;
      continue;
    }
    if (pendingBullet) {
      addBullet(line);
      pendingBullet = false;
      continue;
    }
    const headingMatch = line.match(/^#{1,6}\s*(.+)$/);
    if (headingMatch) {
      makeSection(headingMatch[1]);
      continue;
    }
    addParagraph(line);
  }

  flush();
  return sections.length ? sections : [{ title: 'Analysis', paragraphs: [text], bullets: [] }];
}

function RenderResponse({ text }: { text: string }) {
  const sections = parseFinalResponse(text);
  return (
    <div className="space-y-6">
      {sections.map((section, index) => (
        <div key={index}>
          <h4 className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">{section.title}</h4>
          <div className="mt-4 space-y-3">
            {section.paragraphs.map((paragraph, idx) => (
              <p key={idx} className="text-sm leading-7 text-slate-300">{paragraph}</p>
            ))}
            {section.bullets.length > 0 && (
              <ul className="space-y-2 pl-4 text-sm text-slate-300">
                {section.bullets.map((bullet, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {bullet}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LiveDemo() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [language, setLanguage] = useState('english');
  const [result, setResult] = useState<ResultPayload | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'results'>('upload');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      previewUrls.forEach(URL.revokeObjectURL);
      if (stream) stream.getTracks().forEach((track) => track.stop());
    };
  }, [previewUrls, stream]);

  useEffect(() => {
    const urls = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => urls.forEach(URL.revokeObjectURL);
  }, [selectedFiles]);

  const filesToUpload = useMemo(() => {
    const files = [...selectedFiles];
    if (capturedFile) files.unshift(capturedFile);
    return files;
  }, [selectedFiles, capturedFile]);

  const handleFileChange = (files: FileList | null) => {
    if (!files) return;
    setSelectedFiles(Array.from(files).slice(0, 4));
    setCapturedFile(null);
    setResult(null);
    setError('');
  };

  const handleDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    handleFileChange(event.dataTransfer.files);
  }, []);

  const openCamera = async () => {
    setError('');
    setCameraOpen(true);
    try {
      const ms = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(ms);
      if (videoRef.current) videoRef.current.srcObject = ms;
    } catch {
      setError('Camera access denied. Please upload a label instead.');
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
      setStream((previous) => {
        previous?.getTracks().forEach((track) => track.stop());
        return null;
      });
      setResult(null);
      setError('');
    });
  };

  const handleSubmit = async () => {
    if (!filesToUpload.length) {
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
        setError(payload.detail || 'Analysis failed.');
        return;
      }
      if (payload?.error) {
        setError(payload.error);
        return;
      }
      if (!payload?.final_response && !payload?.formatted_response && !payload?.analysis_result && !payload?.food_analysis) {
        setError('No analysis produced. Try a clearer photo.');
        return;
      }
      setResult(payload);
      setActiveTab('results');
    } catch {
      setError('Cannot reach backend. Is the API running?');
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
    setActiveTab('upload');
  };

  const analysis = result?.analysis_result ?? result?.food_analysis;
  const verdict = analysis?.overall_verdict ?? result?.final_response ?? result?.formatted_response ?? 'Pending';
  const score = analysis?.health_score ?? (verdict === 'HEALTHY' ? 82 : verdict === 'OKAY' ? 58 : verdict === 'UNHEALTHY' ? 28 : verdict === 'JUNK' ? 14 : 0);

  let nutritionData: string[] | null = null;
  if (result?.raw_ocr_text) {
    try {
      const parsed = JSON.parse(result.raw_ocr_text || '{}');
      nutritionData = parsed?.nutrition || parsed?.extracted_nutrition || null;
    } catch {
      nutritionData = null;
    }
  }

  return (
    <div className="relative overflow-hidden rounded-[40px] border border-white/10 bg-slate-900/80 p-8 shadow-[0_40px_120px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.1),transparent_40%)]" />
      <div className="relative z-10 space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Live demo</p>
            <h2 className="text-3xl font-semibold text-slate-100 sm:text-4xl">Upload a label, get AI analysis, and see the real result instantly.</h2>
            <p className="text-sm leading-7 text-slate-400">This is the same demo experience connected to your backend. Upload a photo and watch NutriLens parse ingredients, scores and verdicts.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setActiveTab('upload')} className={`rounded-full border px-5 py-3 text-sm font-semibold transition ${activeTab === 'upload' ? 'border-emerald-400 bg-emerald-500/10 text-emerald-200' : 'border-white/10 text-slate-200 hover:border-emerald-400'}`}>
              Upload
            </button>
            <button onClick={() => setActiveTab('results')} className={`rounded-full border px-5 py-3 text-sm font-semibold transition ${activeTab === 'results' ? 'border-emerald-400 bg-emerald-500/10 text-emerald-200' : 'border-white/10 text-slate-200 hover:border-emerald-400'}`}>
              Results
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div
              className={`rounded-[32px] border p-6 transition ${dragOver ? 'border-emerald-400/40 bg-emerald-500/10' : 'border-white/10 bg-white/5'}`}
              onDrop={handleDrop}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
            >
              {cameraOpen ? (
                <div className="space-y-4">
                  <div className="relative overflow-hidden rounded-3xl bg-slate-950 p-1">
                    <video ref={videoRef} autoPlay muted playsInline className="h-72 w-full rounded-3xl bg-black object-cover" />
                    <ScanOverlay />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button onClick={capturePhoto} className="rounded-3xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400">
                      Capture Photo
                    </button>
                    <button onClick={() => setCameraOpen(false)} className="rounded-3xl border border-white/10 bg-slate-950/80 px-5 py-3 text-sm text-slate-200 transition hover:border-emerald-400">
                      Close Camera
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-950 text-3xl text-emerald-300 shadow-[0_0_40px_rgba(16,185,129,0.15)]">📷</div>
                  <div className="space-y-3">
                    <p className="text-lg font-semibold text-slate-100">Add food label images</p>
                    <p className="text-sm leading-7 text-slate-400">Drag and drop up to 4 images or browse to upload a food label, barcode or nutrition panel.</p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <button onClick={() => fileInputRef.current?.click()} className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400">
                      Upload images
                    </button>
                    <button onClick={openCamera} className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-emerald-400">
                      Use camera
                    </button>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(event) => handleFileChange(event.target.files)} />
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-5">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Language</p>
                <select value={language} onChange={(event) => setLanguage(event.target.value)} className="mt-4 w-full rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400">
                  <option value="english">English</option>
                  <option value="hindi">Hindi</option>
                  <option value="hinglish">Hinglish</option>
                </select>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-5">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Notes</p>
                <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={4} placeholder="Ask NutriLens to focus on sugar, additives, or calories." className="mt-4 w-full rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500" />
              </div>
            </div>

            {error ? (
              <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-100">{error}</div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button onClick={handleSubmit} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? 'Analyzing...' : 'Analyze now'}
              </button>
              <button onClick={handleReset} className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-emerald-400">
                Reset demo
              </button>
            </div>

            {(capturedFile || previewUrls.length > 0) && (
              <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-5">
                <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Preview</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {capturedFile && (
                    <img src={URL.createObjectURL(capturedFile)} alt="Captured label" className="h-40 w-full rounded-3xl object-cover" />
                  )}
                  {previewUrls.map((url) => (
                    <img key={url} src={url} alt="Selected label" className="h-40 w-full rounded-3xl object-cover" />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Health score</p>
                  <p className="mt-3 text-5xl font-semibold text-slate-100">{score}</p>
                </div>
                <VerdictBadge verdict={verdict} />
              </div>
              <p className="mt-6 text-sm leading-7 text-slate-400">NutriLens delivers the verdict, ingredient intelligence, and label confidence in one view.</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">AI analysis preview</p>
              <div className="mt-5 min-h-[220px]">
                {loading ? (
                  <div className="space-y-3">
                    <div className="h-4 w-3/4 rounded-full bg-slate-800 animate-pulse" />
                    <div className="h-4 w-full rounded-full bg-slate-800 animate-pulse" />
                    <div className="h-4 w-5/6 rounded-full bg-slate-800 animate-pulse" />
                  </div>
                ) : result ? (
                  <RenderResponse text={result.formatted_response ?? result.final_response ?? 'No verdict available yet.'} />
                ) : (
                  <p className="text-sm leading-7 text-slate-400">Upload a food label to see how NutriLens turns ingredients into meaningful advice.</p>
                )}
              </div>
            </div>

            {result && nutritionData?.length ? (
              <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Nutrition callouts</p>
                <div className="mt-4 space-y-3 text-sm text-slate-300">
                  {nutritionData.map((item, index) => (
                    <p key={`${item}-${index}`} className="rounded-2xl bg-slate-900/80 px-4 py-3">{item}</p>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

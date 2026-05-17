// New code

import { useEffect, useMemo, useRef, useState, useCallback, type DragEvent, type MouseEvent } from "react";

const API_BASE_URL = import.meta?.env?.VITE_API_BASE_URL || "http://localhost:8000";

type VerdictType = "HEALTHY" | "OKAY" | "UNHEALTHY" | "JUNK" | string;

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
  food_analysis?: AnalysisResult;
  product_name?: string;
  raw_ocr_text?: string;
};

// ─── Shimmer Skeleton ─────────────────────────────────────────────────────────
const Shimmer = ({ width = "100%", height = "16px", radius = "8px" }) => (
  <div
    style={{
      width,
      height,
      borderRadius: radius,
      background: "linear-gradient(90deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.18) 50%, rgba(16,185,129,0.08) 100%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.6s infinite",
    }}
  />
);

// ─── Health Score Gauge ────────────────────────────────────────────────────────
const HealthGauge = ({ score = 0, label = "Score" }) => {
  const r = 52, cx = 64, cy = 64;
  const circ = 2 * Math.PI * r;
  const clampedScore = Math.min(100, Math.max(0, score));
  const dash = (clampedScore / 100) * circ;
  const color = clampedScore >= 70 ? "#10b981" : clampedScore >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ position: "relative", width: 128, height: 128 }}>
      <svg width="128" height="128" viewBox="0 0 128 128">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          transform="rotate(-90 64 64)"
          style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.34,1.56,0.64,1)", filter: `drop-shadow(0 0 8px ${color}80)` }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 26, fontWeight: 700, color, fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{clampedScore}</span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>{label}</span>
      </div>
    </div>
  );
};

// ─── Scan Animation Overlay ────────────────────────────────────────────────────
const ScanOverlay = () => (
  <div style={{ position: "absolute", inset: 0, borderRadius: 16, overflow: "hidden", pointerEvents: "none", zIndex: 10 }}>
    <div style={{
      position: "absolute", left: 0, right: 0, height: "3px",
      background: "linear-gradient(90deg, transparent, #10b981, transparent)",
      animation: "scanLine 2s ease-in-out infinite",
      boxShadow: "0 0 16px #10b981",
    }} />
    {[0, 1, 2, 3].map((i) => (
      <div key={i} style={{
        position: "absolute",
        width: 20, height: 20,
        borderColor: "#10b981",
        borderStyle: "solid",
        borderWidth: "2px",
        ...(i === 0 ? { top: 12, left: 12, borderRight: "none", borderBottom: "none" } : {}),
        ...(i === 1 ? { top: 12, right: 12, borderLeft: "none", borderBottom: "none" } : {}),
        ...(i === 2 ? { bottom: 12, left: 12, borderRight: "none", borderTop: "none" } : {}),
        ...(i === 3 ? { bottom: 12, right: 12, borderLeft: "none", borderTop: "none" } : {}),
      }} />
    ))}
  </div>
);

// ─── Verdict Badge ─────────────────────────────────────────────────────────────
const VerdictBadge = ({ verdict }: { verdict: VerdictType }) => {
  const configs: Record<string, { bg: string; border: string; color: string; icon: string; label: string }> = {
    HEALTHY: { bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.4)", color: "#10b981", icon: "✓", label: "Healthy" },
    OKAY: { bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.4)", color: "#f59e0b", icon: "~", label: "Okay" },
    UNHEALTHY: { bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.4)", color: "#ef4444", icon: "!", label: "Unhealthy" },
    JUNK: { bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.4)", color: "#ef4444", icon: "✕", label: "Junk Food" },
    INVALID: { bg: "rgba(107,114,128,0.15)", border: "rgba(107,114,128,0.4)", color: "#9ca3af", icon: "?", label: "Unknown" },
  };
  const cfg = configs[verdict] || configs.INVALID;
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      borderRadius: 100, padding: "6px 16px",
      color: cfg.color, fontWeight: 600, fontSize: 13,
    }}>
      <span style={{
        width: 20, height: 20, borderRadius: "50%",
        background: cfg.color, color: "#000",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 700,
      }}>{cfg.icon}</span>
      {cfg.label}
    </div>
  );
};

// ─── Ingredient Pill ───────────────────────────────────────────────────────────
const IngredientPill = ({ name = "Ingredient", note, type = "danger" }: { name?: string; note?: string; type?: "danger" | "warn" | "ok" }) => {
  const [open, setOpen] = useState<boolean>(false);
  const colors: Record<"danger" | "warn" | "ok", { bg: string; border: string; text: string }> = {
    danger: { bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)", text: "#f87171" },
    warn: { bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)", text: "#fbbf24" },
    ok: { bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.3)", text: "#34d399" },
  };
  const c = colors[type] || colors.danger;
  return (
    <div style={{ marginBottom: 8 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: c.bg, border: `1px solid ${c.border}`,
          borderRadius: 100, padding: "5px 14px",
          color: c.text, fontWeight: 500, fontSize: 13,
          cursor: "pointer", transition: "all 0.2s",
        }}
      >
        {name}
        {note && <span style={{ fontSize: 10, opacity: 0.7 }}>{open ? "▲" : "▼"}</span>}
      </button>
      {open && note && (
        <div style={{
          marginTop: 6, padding: "10px 14px",
          background: "rgba(255,255,255,0.03)",
          border: `1px solid ${c.border}`,
          borderRadius: 10, fontSize: 13, color: "rgba(255,255,255,0.65)",
          lineHeight: 1.6,
        }}>
          {note}
        </div>
      )}
    </div>
  );
};

// ─── Response Parser ────────────────────────────────────────────────────────────
function parseFinalResponse(text: string): ParsedSection[] {
  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .map((l: string) => l.trim())
    .filter(Boolean);

  const sections: ParsedSection[] = [];
  let cur: ParsedSection | null = null;
  let pendingBullet = false;

  const sanitize = (value: string) => {
    return value
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/__([^_]+)__/g, "$1")
      .replace(/_(.*?)_/g, "$1")
      .replace(/^[:\-\*\s]+|[:\-\*\s]+$/g, "")
      .trim();
  };

  const flush = () => {
    if (cur) sections.push(cur);
    cur = null;
    pendingBullet = false;
  };

  const makeSection = (title: string) => {
    flush();
    cur = { title: sanitize(title), paragraphs: [], bullets: [] };
  };

  const addParagraph = (line: string) => {
    if (!cur) cur = { title: "Overview", paragraphs: [], bullets: [] };
    cur.paragraphs.push(sanitize(line));
  };

  const addBullet = (line: string) => {
    if (!cur) cur = { title: "Details", paragraphs: [], bullets: [] };
    cur.bullets.push(sanitize(line));
  };

  lines.forEach((line) => {
    if (/^[-–—]{3,}$/.test(line)) {
      pendingBullet = false;
      return;
    }

    const headingMatch = line.match(/^#{1,6}\s*(.+)$/);
    if (headingMatch) {
      makeSection(headingMatch[1]);
      return;
    }

    const titleMatch = line.match(/^(?:\d+\.)?\s*([A-Za-z][A-Za-z0-9 &()'’,-]+?):?$/);
    if (titleMatch && line.endsWith(":")) {
      makeSection(titleMatch[1]);
      return;
    }

    const bulletMatch = line.match(/^(?:[>›•\-+\*]\s*)(.+)$/);
    if (bulletMatch) {
      addBullet(bulletMatch[1]);
      pendingBullet = false;
      return;
    }

    if (/^[>›•\-+\*]$/.test(line)) {
      pendingBullet = true;
      return;
    }

    if (pendingBullet) {
      addBullet(line);
      pendingBullet = false;
      return;
    }

    addParagraph(line);
  });

  flush();

  return sections.length ? sections : [{ title: "Overview", paragraphs: [sanitize(text)], bullets: [] }];
}

function RenderResponse({ text }: { text: string }) {
  const sections = parseFinalResponse(text);
  if (!sections.length) return <p style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.8 }}>{text}</p>;
  return (
    <div>
      {sections.map((s, i) => (
        <div key={i} style={{ marginBottom: 16 }}>
          <h4 style={{ color: "#10b981", fontSize: 13, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.title}</h4>
          {s.paragraphs.map((p, j) => <p key={j} style={{ color: "rgba(255,255,255,0.75)", fontSize: 14, lineHeight: 1.8, marginBottom: 6 }}>{p}</p>)}
          {s.bullets.length > 0 && (
            <ul style={{ paddingLeft: 0, listStyle: "none" }}>
              {s.bullets.map((b, k) => (
                <li key={k} style={{ display: "flex", gap: 8, color: "rgba(255,255,255,0.7)", fontSize: 14, lineHeight: 1.7, marginBottom: 4 }}>
                  <span style={{ color: "#10b981", marginTop: 2, flexShrink: 0 }}>›</span>{b}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [message, setMessage] = useState<string>("");
  const [language, setLanguage] = useState<string>("english");
  const [result, setResult] = useState<ResultPayload | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [cameraOpen, setCameraOpen] = useState<boolean>(false);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"upload" | "results">("upload");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      previewUrls.forEach(URL.revokeObjectURL);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [previewUrls, stream]);

  useEffect(() => {
    const urls = selectedFiles.map((f) => URL.createObjectURL(f));
    setPreviewUrls(urls);
    return () => urls.forEach(URL.revokeObjectURL);
  }, [selectedFiles]);

  const filesToUpload = useMemo(() => {
    const f = [...selectedFiles];
    if (capturedFile) f.unshift(capturedFile);
    return f;
  }, [selectedFiles, capturedFile]);

  const handleFileChange = (filesList: FileList | null) => {
    if (!filesList) return;
    setSelectedFiles(Array.from(filesList).slice(0, 4));
    setCapturedFile(null); setResult(null); setError("");
  };

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragOver(false);
    handleFileChange(e.dataTransfer.files);
  }, []);

  const openCamera = async () => {
    setError(""); setCameraOpen(true);
    try {
      const ms = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(ms);
      if (videoRef.current) (videoRef.current as HTMLVideoElement).srcObject = ms;
    } catch {
      setError("Camera access denied. Please use file upload."); setCameraOpen(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const v = videoRef.current;
    if (!v) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth; c.height = v.videoHeight;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0);
    c.toBlob(blob => {
      if (!blob) return;
      setCapturedFile(new File([blob], `capture-${Date.now()}.png`, { type: "image/png" }));
      setCameraOpen(false);
      setStream((prev) => { prev?.getTracks().forEach((t) => t.stop()); return null; });
      setResult(null); setError("");
    });
  };

  const handleSubmit = async () => {
    if (!filesToUpload.length) { setError("Please upload or capture a food label image."); return; }
    setLoading(true); setError(""); setResult(null);
    const fd = new FormData();
    filesToUpload.forEach(f => fd.append("files", f));
    fd.append("message", message); fd.append("language", language);
    try {
      const resp = await fetch(`${API_BASE_URL}/analyze`, { method: "POST", body: fd });
      const payload = await resp.json();
      if (!resp.ok) { setError(payload.detail || "Analysis failed."); return; }
      if (payload?.error) { setError(payload.error); return; }
      if (!payload?.final_response && !payload?.food_analysis) {
        setError("No analysis produced. Try a clearer photo."); return;
      }
      setResult(payload);
      setActiveTab("results");
    } catch { setError("Cannot reach backend. Is the API running?"); }
    finally { setLoading(false); }
  };

  const handleReset = () => {
    setSelectedFiles([]); setCapturedFile(null); setMessage(""); setLanguage("english");
    setResult(null); setError(""); setActiveTab("upload");
  };

  const fa = result?.food_analysis;
  const verdict = fa?.overall_verdict ?? (result?.final_response ? "INVALID" : null);
  const healthScore = fa?.health_score ?? (verdict === "HEALTHY" ? 80 : verdict === "OKAY" ? 55 : verdict === "UNHEALTHY" ? 25 : verdict === "JUNK" ? 15 : 0);

  // Parse nutrition from raw_ocr_text
  let nutritionData = null;
  if (result?.raw_ocr_text) {
    try {
      const p = JSON.parse(result.raw_ocr_text);
      nutritionData = p?.nutrition || p?.extracted_nutrition || null;
    } catch {}
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #050a0e; font-family: 'DM Sans', sans-serif; color: #fff; min-height: 100vh; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes scanLine { 0%{top:0;opacity:1} 100%{top:100%;opacity:0} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes glow { 0%,100%{opacity:0.4} 50%{opacity:0.8} }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #10b98140; border-radius: 4px; }
      `}</style>

      {/* ── Background ── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-20%", left: "-10%", width: "60%", height: "60%", background: "radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "-20%", right: "-10%", width: "50%", height: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 70%)" }} />
        {/* Grid lines */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.03 }}>
          <defs><pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M 48 0 L 0 0 0 48" fill="none" stroke="#10b981" strokeWidth="0.5" /></pattern></defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1280, margin: "0 auto", padding: "0 24px 64px" }}>

        {/* ── Nav ── */}
        <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #10b981, #059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⚡</div>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em" }}>Smart Nutrition</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {["History", "Insights", "Settings"].map((l) => (
              <button key={l} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "7px 16px", color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={(e: MouseEvent<HTMLButtonElement>) => { const target = e.currentTarget; target.style.borderColor = "rgba(16,185,129,0.4)"; target.style.color = "#10b981"; }}
                onMouseLeave={(e: MouseEvent<HTMLButtonElement>) => { const target = e.currentTarget; target.style.borderColor = "rgba(255,255,255,0.1)"; target.style.color = "rgba(255,255,255,0.5)"; }}>{l}</button>
            ))}
          </div>
        </nav>

        {/* ── Hero ── */}
        <div style={{ textAlign: "center", padding: "64px 0 48px", animation: "fadeUp 0.8s ease" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 100, padding: "6px 18px", marginBottom: 24 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", animation: "pulse 2s infinite", display: "inline-block" }} />
            <span style={{ fontSize: 13, color: "#10b981", fontWeight: 500 }}>AI-Powered Analysis</span>
          </div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(36px, 5vw, 64px)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.04em", marginBottom: 20 }}>
            Know What's <span style={{ background: "linear-gradient(135deg, #10b981, #34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Inside</span><br />Your Food.
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "clamp(15px, 2vw, 18px)", maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>
            Upload food labels and get AI-powered health insights, harmful ingredient detection, and smarter nutrition guidance instantly.
          </p>

          {/* Stats Row */}
          <div style={{ display: "flex", justifyContent: "center", gap: 40, marginTop: 48 }}>
            {[{ val: "10K+", label: "Labels Analyzed" }, { val: "99%", label: "Accuracy Rate" }, { val: "<3s", label: "Analysis Speed" }].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 24, fontWeight: 500, color: "#10b981" }}>{s.val}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tab Switcher ── */}
        {result && (
          <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 32 }}>
            {( ["upload", "results"] as const ).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: "10px 28px", borderRadius: 10, fontWeight: 500, fontSize: 14, cursor: "pointer", transition: "all 0.2s",
                background: activeTab === tab ? "rgba(16,185,129,0.15)" : "transparent",
                border: activeTab === tab ? "1px solid rgba(16,185,129,0.4)" : "1px solid rgba(255,255,255,0.08)",
                color: activeTab === tab ? "#10b981" : "rgba(255,255,255,0.4)",
              }}>{tab === "upload" ? "📁 Upload" : "📊 Results"}</button>
            ))}
          </div>
        )}

        {/* ── Upload Panel ── */}
        {activeTab === "upload" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24, animation: "fadeUp 0.5s ease" }}>

            {/* Left: Drop Zone */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: `2px dashed ${dragOver ? "#10b981" : "rgba(255,255,255,0.08)"}`, borderRadius: 20, padding: 32, transition: "all 0.3s" }}
              onDrop={handleDrop} onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}>

              {cameraOpen ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
                  <div style={{ position: "relative", width: "100%", borderRadius: 16, overflow: "hidden", background: "#000" }}>
                    <video ref={videoRef} autoPlay muted playsInline style={{ width: "100%", display: "block", borderRadius: 16 }} />
                    <ScanOverlay />
                  </div>
                  <button onClick={capturePhoto} style={{ background: "linear-gradient(135deg, #10b981, #059669)", border: "none", borderRadius: 12, padding: "14px 40px", color: "#fff", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>
                    📸 Capture Label
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "48px 24px" }}>
                  <div style={{ width: 80, height: 80, margin: "0 auto 24px", borderRadius: 20, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>🍽️</div>
                  <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Drop Your Food Label Here</h3>
                  <p style={{ color: "rgba(255,255,255,0.4)", marginBottom: 28, fontSize: 14 }}>Supports JPG, PNG, WEBP — up to 4 images</p>
                  <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                    <button onClick={() => fileInputRef.current?.click()} style={{
                      background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", borderRadius: 12,
                      padding: "12px 28px", color: "#10b981", fontWeight: 600, fontSize: 14, cursor: "pointer",
                    }}>📂 Browse Files</button>
                    <button onClick={openCamera} style={{
                      background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12,
                      padding: "12px 28px", color: "rgba(255,255,255,0.7)", fontWeight: 600, fontSize: 14, cursor: "pointer",
                    }}>📷 Use Camera</button>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => handleFileChange(e.target.files)} />
                </div>
              )}

              {/* Image Previews */}
              {(capturedFile || previewUrls.length > 0) && (
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24, padding: "20px 0 0", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  {capturedFile && (
                    <div style={{ position: "relative" }}>
                      <img src={URL.createObjectURL(capturedFile)} alt="Captured" style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 12, border: "2px solid rgba(16,185,129,0.4)" }} />
                      <div style={{ position: "absolute", top: 6, left: 6, background: "rgba(16,185,129,0.9)", borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 600, color: "#000" }}>LIVE</div>
                    </div>
                  )}
                  {previewUrls.map((url, i) => (
                    <img key={i} src={url} alt={`Preview ${i}`} style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)" }} />
                  ))}
                </div>
              )}
            </div>

            {/* Right: Settings Panel */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Settings Card */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 24 }}>
                <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 20, color: "rgba(255,255,255,0.9)" }}>Analysis Settings</h3>

                <label style={{ display: "block", marginBottom: 6, fontSize: 12, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Language</label>
                <select value={language} onChange={e => setLanguage(e.target.value)} style={{
                  width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
                  padding: "10px 14px", color: "#fff", fontSize: 14, marginBottom: 16, outline: "none",
                }}>
                  <option value="english">🇬🇧 English</option>
                  <option value="hindi">🇮🇳 Hindi</option>
                  <option value="hinglish">🇮🇳 Hinglish</option>
                </select>

                <label style={{ display: "block", marginBottom: 6, fontSize: 12, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Custom Query</label>
                <textarea
                  rows={4} value={message} onChange={e => setMessage(e.target.value)}
                  placeholder="e.g. Is this safe for diabetics? Can kids eat this daily?"
                  style={{
                    width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
                    padding: "10px 14px", color: "#fff", fontSize: 14, resize: "vertical", outline: "none", fontFamily: "inherit",
                  }}
                />
              </div>

              {error && (
                <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "14px 18px", color: "#f87171", fontSize: 14, lineHeight: 1.6 }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Action Buttons */}
              <button onClick={handleSubmit} disabled={loading} style={{
                width: "100%", padding: "16px 24px", borderRadius: 14, border: "none", cursor: loading ? "wait" : "pointer",
                background: loading ? "rgba(16,185,129,0.3)" : "linear-gradient(135deg, #10b981, #059669)",
                color: "#fff", fontWeight: 700, fontSize: 16, fontFamily: "'Syne', sans-serif",
                transition: "all 0.3s", position: "relative", overflow: "hidden",
              }}>
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                    <span style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                    Analyzing...
                  </span>
                ) : "⚡ Analyze Now"}
              </button>
              <button onClick={handleReset} style={{
                width: "100%", padding: "12px 24px", borderRadius: 14, cursor: "pointer",
                background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.5)", fontWeight: 500, fontSize: 14,
              }}>Reset</button>

              {/* Tip Card */}
              <div style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 16, padding: 16 }}>
                <p style={{ fontSize: 12, color: "rgba(16,185,129,0.8)", fontWeight: 600, marginBottom: 6 }}>💡 Tips for best results</p>
                <ul style={{ listStyle: "none", paddingLeft: 0 }}>
                  {["Ensure the label is fully visible", "Good lighting, avoid glare", "Include ingredients list if possible"].map(tip => (
                    <li key={tip} style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 4, display: "flex", gap: 6 }}>
                      <span style={{ color: "#10b981" }}>✓</span>{tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ── Results Panel ── */}
        {activeTab === "results" && result && (
          <div style={{ animation: "fadeUp 0.5s ease" }}>

            {/* Hero Verdict Banner */}
            <div style={{
              background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.03))",
              border: "1px solid rgba(16,185,129,0.2)", borderRadius: 24, padding: "32px 40px",
              display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 24, marginBottom: 24,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                <HealthGauge score={healthScore} label="Health Score" />
                <div>
                  {verdict && <VerdictBadge verdict={verdict} />}
                  <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, marginTop: 10, letterSpacing: "-0.03em" }}>{result.product_name || "Food Product"}</h2>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, marginTop: 4 }}>Analysis complete · AI-powered insights</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => {
                  const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
                  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
                  a.download = `${(result.product_name || "analysis").replace(/\s+/g, "_")}_report.json`; a.click();
                }} style={{
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10,
                  padding: "10px 20px", color: "rgba(255,255,255,0.7)", fontWeight: 500, fontSize: 13, cursor: "pointer",
                }}>📥 Download JSON</button>
                <button onClick={handleReset} style={{
                  background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.35)", borderRadius: 10,
                  padding: "10px 20px", color: "#10b981", fontWeight: 500, fontSize: 13, cursor: "pointer",
                }}>+ New Scan</button>
              </div>
            </div>

            {/* Results Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

              {/* AI Full Response */}
              {result.final_response && (
                <div style={{ gridColumn: "1 / -1", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 28 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🤖</div>
                    <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700 }}>AI Health Report</h3>
                  </div>
                  <RenderResponse text={result.final_response} />
                </div>
              )}

              {/* Nutrition Insights */}
              {(fa?.nutrition_insights?.length ?? 0) > 0 && (
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                    <span style={{ fontSize: 20 }}>💡</span>
                    <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700 }}>Quick Insights</h3>
                  </div>
                  <ul style={{ listStyle: "none", paddingLeft: 0 }}>
                    {(fa?.nutrition_insights ?? []).map((item, i) => (
                      <li key={i} style={{ display: "flex", gap: 10, marginBottom: 12, padding: "10px 14px", background: "rgba(16,185,129,0.04)", borderRadius: 10, fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>
                        <span style={{ color: "#10b981", fontSize: 16, flexShrink: 0, marginTop: 1 }}>•</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Fun Comparisons */}
              {(fa?.fun_comparisons?.length ?? 0) > 0 && (
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                    <span style={{ fontSize: 20 }}>⚖️</span>
                    <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700 }}>Comparisons</h3>
                  </div>
                  {(fa?.fun_comparisons ?? []).map((item, i) => (
                    <div key={i} style={{ padding: "10px 14px", marginBottom: 10, background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.12)", borderRadius: 10, fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
                      {item}
                    </div>
                  ))}
                </div>
              )}

              {/* Harmful Ingredients */}
              {(fa?.harmful_ingredients?.length ?? 0) > 0 && (
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                    <span style={{ fontSize: 20 }}>⚠️</span>
                    <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700 }}>Harmful Ingredients</h3>
                    <span style={{ marginLeft: "auto", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 100, padding: "2px 10px", fontSize: 12, color: "#f87171" }}>{fa?.harmful_ingredients?.length ?? 0} found</span>
                  </div>
                  <div>
                    {(fa?.harmful_ingredients ?? []).map((item, index) => (
                      <IngredientPill key={`${item.name ?? item.why_harmful ?? index}`} name={item.name ?? "Ingredient"} note={item.why_harmful} type="danger" />
                    ))}
                  </div>
                </div>
              )}

              {/* Nutrition Facts Table */}
              {nutritionData ? (
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                    <span style={{ fontSize: 20 }}>🧪</span>
                    <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700 }}>Nutrition Facts</h3>
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                      {Object.entries(nutritionData).map(([k, v], i) => (
                        <tr key={k} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          <td style={{ padding: "9px 0", fontSize: 13, color: "rgba(255,255,255,0.5)", textTransform: "capitalize" }}>{k.replace(/_/g, " ")}</td>
                          <td style={{ padding: "9px 0", fontSize: 13, fontWeight: 500, textAlign: "right", fontFamily: "'DM Mono', monospace", color: "#fff" }}>
                            {v == null ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 200 }}>
                  <span style={{ fontSize: 40, marginBottom: 12 }}>🧪</span>
                  <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>Nutrition data not available</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Empty Upload State with Loading ── */}
        {loading && activeTab === "upload" && (
          <div style={{ marginTop: 32, background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 20, padding: 40, textAlign: "center" }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", border: "3px solid rgba(16,185,129,0.2)", borderTopColor: "#10b981", animation: "spin 1s linear infinite", margin: "0 auto 24px" }} />
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Analyzing Your Food Label</h3>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>AI is scanning ingredients, nutrients and health impacts…</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 28, maxWidth: 360, margin: "28px auto 0" }}>
              {["Extracting text from image", "Identifying ingredients", "Checking health impact", "Generating recommendations"].map((step, i) => (
                <div key={step} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#10b981", flexShrink: 0 }}>{i + 1}</div>
                  <Shimmer height="12px" radius="6px" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{ textAlign: "center", padding: "48px 0 0", borderTop: "1px solid rgba(255,255,255,0.04)", marginTop: 64 }}>
          <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 13 }}>
            ⚡ Smart Nutrition Assistant · AI-powered · For informational purposes only
          </p>
        </div>
      </div>
    </>
  );
}

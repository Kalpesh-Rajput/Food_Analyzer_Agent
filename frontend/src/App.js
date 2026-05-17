import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// New code
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
const API_BASE_URL = import.meta?.env?.VITE_API_BASE_URL || "http://localhost:8000";
// ─── Shimmer Skeleton ─────────────────────────────────────────────────────────
const Shimmer = ({ width = "100%", height = "16px", radius = "8px" }) => (_jsx("div", { style: {
        width,
        height,
        borderRadius: radius,
        background: "linear-gradient(90deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.18) 50%, rgba(16,185,129,0.08) 100%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.6s infinite",
    } }));
// ─── Health Score Gauge ────────────────────────────────────────────────────────
const HealthGauge = ({ score = 0, label = "Score" }) => {
    const r = 52, cx = 64, cy = 64;
    const circ = 2 * Math.PI * r;
    const clampedScore = Math.min(100, Math.max(0, score));
    const dash = (clampedScore / 100) * circ;
    const color = clampedScore >= 70 ? "#10b981" : clampedScore >= 40 ? "#f59e0b" : "#ef4444";
    return (_jsxs("div", { style: { position: "relative", width: 128, height: 128 }, children: [_jsxs("svg", { width: "128", height: "128", viewBox: "0 0 128 128", children: [_jsx("circle", { cx: cx, cy: cy, r: r, fill: "none", stroke: "rgba(255,255,255,0.06)", strokeWidth: "10" }), _jsx("circle", { cx: cx, cy: cy, r: r, fill: "none", stroke: color, strokeWidth: "10", strokeLinecap: "round", strokeDasharray: `${dash} ${circ}`, transform: "rotate(-90 64 64)", style: { transition: "stroke-dasharray 1.2s cubic-bezier(0.34,1.56,0.64,1)", filter: `drop-shadow(0 0 8px ${color}80)` } })] }), _jsxs("div", { style: { position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }, children: [_jsx("span", { style: { fontSize: 26, fontWeight: 700, color, fontFamily: "'DM Mono', monospace", lineHeight: 1 }, children: clampedScore }), _jsx("span", { style: { fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2 }, children: label })] })] }));
};
// ─── Scan Animation Overlay ────────────────────────────────────────────────────
const ScanOverlay = () => (_jsxs("div", { style: { position: "absolute", inset: 0, borderRadius: 16, overflow: "hidden", pointerEvents: "none", zIndex: 10 }, children: [_jsx("div", { style: {
                position: "absolute", left: 0, right: 0, height: "3px",
                background: "linear-gradient(90deg, transparent, #10b981, transparent)",
                animation: "scanLine 2s ease-in-out infinite",
                boxShadow: "0 0 16px #10b981",
            } }), [0, 1, 2, 3].map((i) => (_jsx("div", { style: {
                position: "absolute",
                width: 20, height: 20,
                borderColor: "#10b981",
                borderStyle: "solid",
                borderWidth: "2px",
                ...(i === 0 ? { top: 12, left: 12, borderRight: "none", borderBottom: "none" } : {}),
                ...(i === 1 ? { top: 12, right: 12, borderLeft: "none", borderBottom: "none" } : {}),
                ...(i === 2 ? { bottom: 12, left: 12, borderRight: "none", borderTop: "none" } : {}),
                ...(i === 3 ? { bottom: 12, right: 12, borderLeft: "none", borderTop: "none" } : {}),
            } }, i)))] }));
// ─── Verdict Badge ─────────────────────────────────────────────────────────────
const VerdictBadge = ({ verdict }) => {
    const configs = {
        HEALTHY: { bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.4)", color: "#10b981", icon: "✓", label: "Healthy" },
        OKAY: { bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.4)", color: "#f59e0b", icon: "~", label: "Okay" },
        UNHEALTHY: { bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.4)", color: "#ef4444", icon: "!", label: "Unhealthy" },
        JUNK: { bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.4)", color: "#ef4444", icon: "✕", label: "Junk Food" },
        INVALID: { bg: "rgba(107,114,128,0.15)", border: "rgba(107,114,128,0.4)", color: "#9ca3af", icon: "?", label: "Unknown" },
    };
    const cfg = configs[verdict] || configs.INVALID;
    return (_jsxs("div", { style: {
            display: "inline-flex", alignItems: "center", gap: 8,
            background: cfg.bg, border: `1px solid ${cfg.border}`,
            borderRadius: 100, padding: "6px 16px",
            color: cfg.color, fontWeight: 600, fontSize: 13,
        }, children: [_jsx("span", { style: {
                    width: 20, height: 20, borderRadius: "50%",
                    background: cfg.color, color: "#000",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700,
                }, children: cfg.icon }), cfg.label] }));
};
// ─── Ingredient Pill ───────────────────────────────────────────────────────────
const IngredientPill = ({ name = "Ingredient", note, type = "danger" }) => {
    const [open, setOpen] = useState(false);
    const colors = {
        danger: { bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)", text: "#f87171" },
        warn: { bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)", text: "#fbbf24" },
        ok: { bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.3)", text: "#34d399" },
    };
    const c = colors[type] || colors.danger;
    return (_jsxs("div", { style: { marginBottom: 8 }, children: [_jsxs("button", { onClick: () => setOpen(!open), style: {
                    display: "inline-flex", alignItems: "center", gap: 6,
                    background: c.bg, border: `1px solid ${c.border}`,
                    borderRadius: 100, padding: "5px 14px",
                    color: c.text, fontWeight: 500, fontSize: 13,
                    cursor: "pointer", transition: "all 0.2s",
                }, children: [name, note && _jsx("span", { style: { fontSize: 10, opacity: 0.7 }, children: open ? "▲" : "▼" })] }), open && note && (_jsx("div", { style: {
                    marginTop: 6, padding: "10px 14px",
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid ${c.border}`,
                    borderRadius: 10, fontSize: 13, color: "rgba(255,255,255,0.65)",
                    lineHeight: 1.6,
                }, children: note }))] }));
};
// ─── Response Parser ────────────────────────────────────────────────────────────
function parseFinalResponse(text) {
    const lines = text
        .replace(/\r/g, "")
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
    const sections = [];
    let cur = null;
    let pendingBullet = false;
    const sanitize = (value) => {
        return value
            .replace(/\*\*(.*?)\*\*/g, "$1")
            .replace(/\*(.*?)\*/g, "$1")
            .replace(/__([^_]+)__/g, "$1")
            .replace(/_(.*?)_/g, "$1")
            .replace(/^[:\-\*\s]+|[:\-\*\s]+$/g, "")
            .trim();
    };
    const flush = () => {
        if (cur)
            sections.push(cur);
        cur = null;
        pendingBullet = false;
    };
    const makeSection = (title) => {
        flush();
        cur = { title: sanitize(title), paragraphs: [], bullets: [] };
    };
    const addParagraph = (line) => {
        if (!cur)
            cur = { title: "Overview", paragraphs: [], bullets: [] };
        cur.paragraphs.push(sanitize(line));
    };
    const addBullet = (line) => {
        if (!cur)
            cur = { title: "Details", paragraphs: [], bullets: [] };
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
function RenderResponse({ text }) {
    const sections = parseFinalResponse(text);
    if (!sections.length)
        return _jsx("p", { style: { color: "rgba(255,255,255,0.7)", lineHeight: 1.8 }, children: text });
    return (_jsx("div", { children: sections.map((s, i) => (_jsxs("div", { style: { marginBottom: 16 }, children: [_jsx("h4", { style: { color: "#10b981", fontSize: 13, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }, children: s.title }), s.paragraphs.map((p, j) => _jsx("p", { style: { color: "rgba(255,255,255,0.75)", fontSize: 14, lineHeight: 1.8, marginBottom: 6 }, children: p }, j)), s.bullets.length > 0 && (_jsx("ul", { style: { paddingLeft: 0, listStyle: "none" }, children: s.bullets.map((b, k) => (_jsxs("li", { style: { display: "flex", gap: 8, color: "rgba(255,255,255,0.7)", fontSize: 14, lineHeight: 1.7, marginBottom: 4 }, children: [_jsx("span", { style: { color: "#10b981", marginTop: 2, flexShrink: 0 }, children: "\u203A" }), b] }, k))) }))] }, i))) }));
}
// ─── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [message, setMessage] = useState("");
    const [language, setLanguage] = useState("english");
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [cameraOpen, setCameraOpen] = useState(false);
    const [capturedFile, setCapturedFile] = useState(null);
    const [previewUrls, setPreviewUrls] = useState([]);
    const [stream, setStream] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const [activeTab, setActiveTab] = useState("upload");
    const videoRef = useRef(null);
    const fileInputRef = useRef(null);
    useEffect(() => {
        return () => {
            previewUrls.forEach(URL.revokeObjectURL);
            if (stream)
                stream.getTracks().forEach((t) => t.stop());
        };
    }, [previewUrls, stream]);
    useEffect(() => {
        const urls = selectedFiles.map((f) => URL.createObjectURL(f));
        setPreviewUrls(urls);
        return () => urls.forEach(URL.revokeObjectURL);
    }, [selectedFiles]);
    const filesToUpload = useMemo(() => {
        const f = [...selectedFiles];
        if (capturedFile)
            f.unshift(capturedFile);
        return f;
    }, [selectedFiles, capturedFile]);
    const handleFileChange = (filesList) => {
        if (!filesList)
            return;
        setSelectedFiles(Array.from(filesList).slice(0, 4));
        setCapturedFile(null);
        setResult(null);
        setError("");
    };
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
        handleFileChange(e.dataTransfer.files);
    }, []);
    const openCamera = async () => {
        setError("");
        setCameraOpen(true);
        try {
            const ms = await navigator.mediaDevices.getUserMedia({ video: true });
            setStream(ms);
            if (videoRef.current)
                videoRef.current.srcObject = ms;
        }
        catch {
            setError("Camera access denied. Please use file upload.");
            setCameraOpen(false);
        }
    };
    const capturePhoto = () => {
        if (!videoRef.current)
            return;
        const v = videoRef.current;
        if (!v)
            return;
        const c = document.createElement("canvas");
        c.width = v.videoWidth;
        c.height = v.videoHeight;
        const ctx = c.getContext("2d");
        if (!ctx)
            return;
        ctx.drawImage(v, 0, 0);
        c.toBlob(blob => {
            if (!blob)
                return;
            setCapturedFile(new File([blob], `capture-${Date.now()}.png`, { type: "image/png" }));
            setCameraOpen(false);
            setStream((prev) => { prev?.getTracks().forEach((t) => t.stop()); return null; });
            setResult(null);
            setError("");
        });
    };
    const handleSubmit = async () => {
        if (!filesToUpload.length) {
            setError("Please upload or capture a food label image.");
            return;
        }
        setLoading(true);
        setError("");
        setResult(null);
        const fd = new FormData();
        filesToUpload.forEach(f => fd.append("files", f));
        fd.append("message", message);
        fd.append("language", language);
        try {
            const resp = await fetch(`${API_BASE_URL}/analyze`, { method: "POST", body: fd });
            const payload = await resp.json();
            if (!resp.ok) {
                setError(payload.detail || "Analysis failed.");
                return;
            }
            if (payload?.error) {
                setError(payload.error);
                return;
            }
            if (!payload?.final_response && !payload?.food_analysis) {
                setError("No analysis produced. Try a clearer photo.");
                return;
            }
            setResult(payload);
            setActiveTab("results");
        }
        catch {
            setError("Cannot reach backend. Is the API running?");
        }
        finally {
            setLoading(false);
        }
    };
    const handleReset = () => {
        setSelectedFiles([]);
        setCapturedFile(null);
        setMessage("");
        setLanguage("english");
        setResult(null);
        setError("");
        setActiveTab("upload");
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
        }
        catch { }
    }
    return (_jsxs(_Fragment, { children: [_jsx("style", { children: `
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
      ` }), _jsxs("div", { style: { position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }, children: [_jsx("div", { style: { position: "absolute", top: "-20%", left: "-10%", width: "60%", height: "60%", background: "radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)" } }), _jsx("div", { style: { position: "absolute", bottom: "-20%", right: "-10%", width: "50%", height: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 70%)" } }), _jsxs("svg", { style: { position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.03 }, children: [_jsx("defs", { children: _jsx("pattern", { id: "grid", width: "48", height: "48", patternUnits: "userSpaceOnUse", children: _jsx("path", { d: "M 48 0 L 0 0 0 48", fill: "none", stroke: "#10b981", strokeWidth: "0.5" }) }) }), _jsx("rect", { width: "100%", height: "100%", fill: "url(#grid)" })] })] }), _jsxs("div", { style: { position: "relative", zIndex: 1, maxWidth: 1280, margin: "0 auto", padding: "0 24px 64px" }, children: [_jsxs("nav", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10 }, children: [_jsx("div", { style: { width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #10b981, #059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }, children: "\u26A1" }), _jsx("span", { style: { fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em" }, children: "Smart Nutrition" })] }), _jsx("div", { style: { display: "flex", gap: 8 }, children: ["History", "Insights", "Settings"].map((l) => (_jsx("button", { style: { background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "7px 16px", color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer", transition: "all 0.2s" }, onMouseEnter: (e) => { const target = e.currentTarget; target.style.borderColor = "rgba(16,185,129,0.4)"; target.style.color = "#10b981"; }, onMouseLeave: (e) => { const target = e.currentTarget; target.style.borderColor = "rgba(255,255,255,0.1)"; target.style.color = "rgba(255,255,255,0.5)"; }, children: l }, l))) })] }), _jsxs("div", { style: { textAlign: "center", padding: "64px 0 48px", animation: "fadeUp 0.8s ease" }, children: [_jsxs("div", { style: { display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 100, padding: "6px 18px", marginBottom: 24 }, children: [_jsx("span", { style: { width: 7, height: 7, borderRadius: "50%", background: "#10b981", animation: "pulse 2s infinite", display: "inline-block" } }), _jsx("span", { style: { fontSize: 13, color: "#10b981", fontWeight: 500 }, children: "AI-Powered Analysis" })] }), _jsxs("h1", { style: { fontFamily: "'Syne', sans-serif", fontSize: "clamp(36px, 5vw, 64px)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.04em", marginBottom: 20 }, children: ["Know What's ", _jsx("span", { style: { background: "linear-gradient(135deg, #10b981, #34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }, children: "Inside" }), _jsx("br", {}), "Your Food."] }), _jsx("p", { style: { color: "rgba(255,255,255,0.5)", fontSize: "clamp(15px, 2vw, 18px)", maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }, children: "Upload food labels and get AI-powered health insights, harmful ingredient detection, and smarter nutrition guidance instantly." }), _jsx("div", { style: { display: "flex", justifyContent: "center", gap: 40, marginTop: 48 }, children: [{ val: "10K+", label: "Labels Analyzed" }, { val: "99%", label: "Accuracy Rate" }, { val: "<3s", label: "Analysis Speed" }].map(s => (_jsxs("div", { style: { textAlign: "center" }, children: [_jsx("div", { style: { fontFamily: "'DM Mono', monospace", fontSize: 24, fontWeight: 500, color: "#10b981" }, children: s.val }), _jsx("div", { style: { fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 4 }, children: s.label })] }, s.label))) })] }), result && (_jsx("div", { style: { display: "flex", justifyContent: "center", gap: 4, marginBottom: 32 }, children: ["upload", "results"].map((tab) => (_jsx("button", { onClick: () => setActiveTab(tab), style: {
                                padding: "10px 28px", borderRadius: 10, fontWeight: 500, fontSize: 14, cursor: "pointer", transition: "all 0.2s",
                                background: activeTab === tab ? "rgba(16,185,129,0.15)" : "transparent",
                                border: activeTab === tab ? "1px solid rgba(16,185,129,0.4)" : "1px solid rgba(255,255,255,0.08)",
                                color: activeTab === tab ? "#10b981" : "rgba(255,255,255,0.4)",
                            }, children: tab === "upload" ? "📁 Upload" : "📊 Results" }, tab))) })), activeTab === "upload" && (_jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 380px", gap: 24, animation: "fadeUp 0.5s ease" }, children: [_jsxs("div", { style: { background: "rgba(255,255,255,0.02)", border: `2px dashed ${dragOver ? "#10b981" : "rgba(255,255,255,0.08)"}`, borderRadius: 20, padding: 32, transition: "all 0.3s" }, onDrop: handleDrop, onDragOver: e => { e.preventDefault(); setDragOver(true); }, onDragLeave: () => setDragOver(false), children: [cameraOpen ? (_jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }, children: [_jsxs("div", { style: { position: "relative", width: "100%", borderRadius: 16, overflow: "hidden", background: "#000" }, children: [_jsx("video", { ref: videoRef, autoPlay: true, muted: true, playsInline: true, style: { width: "100%", display: "block", borderRadius: 16 } }), _jsx(ScanOverlay, {})] }), _jsx("button", { onClick: capturePhoto, style: { background: "linear-gradient(135deg, #10b981, #059669)", border: "none", borderRadius: 12, padding: "14px 40px", color: "#fff", fontWeight: 600, fontSize: 15, cursor: "pointer" }, children: "\uD83D\uDCF8 Capture Label" })] })) : (_jsxs("div", { style: { textAlign: "center", padding: "48px 24px" }, children: [_jsx("div", { style: { width: 80, height: 80, margin: "0 auto 24px", borderRadius: 20, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }, children: "\uD83C\uDF7D\uFE0F" }), _jsx("h3", { style: { fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 10 }, children: "Drop Your Food Label Here" }), _jsx("p", { style: { color: "rgba(255,255,255,0.4)", marginBottom: 28, fontSize: 14 }, children: "Supports JPG, PNG, WEBP \u2014 up to 4 images" }), _jsxs("div", { style: { display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }, children: [_jsx("button", { onClick: () => fileInputRef.current?.click(), style: {
                                                            background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", borderRadius: 12,
                                                            padding: "12px 28px", color: "#10b981", fontWeight: 600, fontSize: 14, cursor: "pointer",
                                                        }, children: "\uD83D\uDCC2 Browse Files" }), _jsx("button", { onClick: openCamera, style: {
                                                            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12,
                                                            padding: "12px 28px", color: "rgba(255,255,255,0.7)", fontWeight: 600, fontSize: 14, cursor: "pointer",
                                                        }, children: "\uD83D\uDCF7 Use Camera" })] }), _jsx("input", { ref: fileInputRef, type: "file", accept: "image/*", multiple: true, style: { display: "none" }, onChange: e => handleFileChange(e.target.files) })] })), (capturedFile || previewUrls.length > 0) && (_jsxs("div", { style: { display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24, padding: "20px 0 0", borderTop: "1px solid rgba(255,255,255,0.06)" }, children: [capturedFile && (_jsxs("div", { style: { position: "relative" }, children: [_jsx("img", { src: URL.createObjectURL(capturedFile), alt: "Captured", style: { width: 120, height: 120, objectFit: "cover", borderRadius: 12, border: "2px solid rgba(16,185,129,0.4)" } }), _jsx("div", { style: { position: "absolute", top: 6, left: 6, background: "rgba(16,185,129,0.9)", borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 600, color: "#000" }, children: "LIVE" })] })), previewUrls.map((url, i) => (_jsx("img", { src: url, alt: `Preview ${i}`, style: { width: 120, height: 120, objectFit: "cover", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)" } }, i)))] }))] }), _jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 16 }, children: [_jsxs("div", { style: { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 24 }, children: [_jsx("h3", { style: { fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 20, color: "rgba(255,255,255,0.9)" }, children: "Analysis Settings" }), _jsx("label", { style: { display: "block", marginBottom: 6, fontSize: 12, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }, children: "Language" }), _jsxs("select", { value: language, onChange: e => setLanguage(e.target.value), style: {
                                                    width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
                                                    padding: "10px 14px", color: "#fff", fontSize: 14, marginBottom: 16, outline: "none",
                                                }, children: [_jsx("option", { value: "english", children: "\uD83C\uDDEC\uD83C\uDDE7 English" }), _jsx("option", { value: "hindi", children: "\uD83C\uDDEE\uD83C\uDDF3 Hindi" }), _jsx("option", { value: "hinglish", children: "\uD83C\uDDEE\uD83C\uDDF3 Hinglish" })] }), _jsx("label", { style: { display: "block", marginBottom: 6, fontSize: 12, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }, children: "Custom Query" }), _jsx("textarea", { rows: 4, value: message, onChange: e => setMessage(e.target.value), placeholder: "e.g. Is this safe for diabetics? Can kids eat this daily?", style: {
                                                    width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
                                                    padding: "10px 14px", color: "#fff", fontSize: 14, resize: "vertical", outline: "none", fontFamily: "inherit",
                                                } })] }), error && (_jsxs("div", { style: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "14px 18px", color: "#f87171", fontSize: 14, lineHeight: 1.6 }, children: ["\u26A0\uFE0F ", error] })), _jsx("button", { onClick: handleSubmit, disabled: loading, style: {
                                            width: "100%", padding: "16px 24px", borderRadius: 14, border: "none", cursor: loading ? "wait" : "pointer",
                                            background: loading ? "rgba(16,185,129,0.3)" : "linear-gradient(135deg, #10b981, #059669)",
                                            color: "#fff", fontWeight: 700, fontSize: 16, fontFamily: "'Syne', sans-serif",
                                            transition: "all 0.3s", position: "relative", overflow: "hidden",
                                        }, children: loading ? (_jsxs("span", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }, children: [_jsx("span", { style: { width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" } }), "Analyzing..."] })) : "⚡ Analyze Now" }), _jsx("button", { onClick: handleReset, style: {
                                            width: "100%", padding: "12px 24px", borderRadius: 14, cursor: "pointer",
                                            background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
                                            color: "rgba(255,255,255,0.5)", fontWeight: 500, fontSize: 14,
                                        }, children: "Reset" }), _jsxs("div", { style: { background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 16, padding: 16 }, children: [_jsx("p", { style: { fontSize: 12, color: "rgba(16,185,129,0.8)", fontWeight: 600, marginBottom: 6 }, children: "\uD83D\uDCA1 Tips for best results" }), _jsx("ul", { style: { listStyle: "none", paddingLeft: 0 }, children: ["Ensure the label is fully visible", "Good lighting, avoid glare", "Include ingredients list if possible"].map(tip => (_jsxs("li", { style: { fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 4, display: "flex", gap: 6 }, children: [_jsx("span", { style: { color: "#10b981" }, children: "\u2713" }), tip] }, tip))) })] })] })] })), activeTab === "results" && result && (_jsxs("div", { style: { animation: "fadeUp 0.5s ease" }, children: [_jsxs("div", { style: {
                                    background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.03))",
                                    border: "1px solid rgba(16,185,129,0.2)", borderRadius: 24, padding: "32px 40px",
                                    display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 24, marginBottom: 24,
                                }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: 24 }, children: [_jsx(HealthGauge, { score: healthScore, label: "Health Score" }), _jsxs("div", { children: [verdict && _jsx(VerdictBadge, { verdict: verdict }), _jsx("h2", { style: { fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, marginTop: 10, letterSpacing: "-0.03em" }, children: result.product_name || "Food Product" }), _jsx("p", { style: { color: "rgba(255,255,255,0.4)", fontSize: 14, marginTop: 4 }, children: "Analysis complete \u00B7 AI-powered insights" })] })] }), _jsxs("div", { style: { display: "flex", gap: 10 }, children: [_jsx("button", { onClick: () => {
                                                    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
                                                    const a = document.createElement("a");
                                                    a.href = URL.createObjectURL(blob);
                                                    a.download = `${(result.product_name || "analysis").replace(/\s+/g, "_")}_report.json`;
                                                    a.click();
                                                }, style: {
                                                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10,
                                                    padding: "10px 20px", color: "rgba(255,255,255,0.7)", fontWeight: 500, fontSize: 13, cursor: "pointer",
                                                }, children: "\uD83D\uDCE5 Download JSON" }), _jsx("button", { onClick: handleReset, style: {
                                                    background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.35)", borderRadius: 10,
                                                    padding: "10px 20px", color: "#10b981", fontWeight: 500, fontSize: 13, cursor: "pointer",
                                                }, children: "+ New Scan" })] })] }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }, children: [result.final_response && (_jsxs("div", { style: { gridColumn: "1 / -1", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 28 }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }, children: [_jsx("div", { style: { width: 32, height: 32, borderRadius: 8, background: "rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }, children: "\uD83E\uDD16" }), _jsx("h3", { style: { fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700 }, children: "AI Health Report" })] }), _jsx(RenderResponse, { text: result.final_response })] })), (fa?.nutrition_insights?.length ?? 0) > 0 && (_jsxs("div", { style: { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 24 }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }, children: [_jsx("span", { style: { fontSize: 20 }, children: "\uD83D\uDCA1" }), _jsx("h3", { style: { fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700 }, children: "Quick Insights" })] }), _jsx("ul", { style: { listStyle: "none", paddingLeft: 0 }, children: (fa?.nutrition_insights ?? []).map((item, i) => (_jsxs("li", { style: { display: "flex", gap: 10, marginBottom: 12, padding: "10px 14px", background: "rgba(16,185,129,0.04)", borderRadius: 10, fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }, children: [_jsx("span", { style: { color: "#10b981", fontSize: 16, flexShrink: 0, marginTop: 1 }, children: "\u2022" }), item] }, i))) })] })), (fa?.fun_comparisons?.length ?? 0) > 0 && (_jsxs("div", { style: { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 24 }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }, children: [_jsx("span", { style: { fontSize: 20 }, children: "\u2696\uFE0F" }), _jsx("h3", { style: { fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700 }, children: "Comparisons" })] }), (fa?.fun_comparisons ?? []).map((item, i) => (_jsx("div", { style: { padding: "10px 14px", marginBottom: 10, background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.12)", borderRadius: 10, fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }, children: item }, i)))] })), (fa?.harmful_ingredients?.length ?? 0) > 0 && (_jsxs("div", { style: { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 24 }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }, children: [_jsx("span", { style: { fontSize: 20 }, children: "\u26A0\uFE0F" }), _jsx("h3", { style: { fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700 }, children: "Harmful Ingredients" }), _jsxs("span", { style: { marginLeft: "auto", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 100, padding: "2px 10px", fontSize: 12, color: "#f87171" }, children: [fa?.harmful_ingredients?.length ?? 0, " found"] })] }), _jsx("div", { children: (fa?.harmful_ingredients ?? []).map((item, index) => (_jsx(IngredientPill, { name: item.name ?? "Ingredient", note: item.why_harmful, type: "danger" }, `${item.name ?? item.why_harmful ?? index}`))) })] })), nutritionData ? (_jsxs("div", { style: { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 24 }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }, children: [_jsx("span", { style: { fontSize: 20 }, children: "\uD83E\uDDEA" }), _jsx("h3", { style: { fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700 }, children: "Nutrition Facts" })] }), _jsx("table", { style: { width: "100%", borderCollapse: "collapse" }, children: _jsx("tbody", { children: Object.entries(nutritionData).map(([k, v], i) => (_jsxs("tr", { style: { borderBottom: "1px solid rgba(255,255,255,0.05)" }, children: [_jsx("td", { style: { padding: "9px 0", fontSize: 13, color: "rgba(255,255,255,0.5)", textTransform: "capitalize" }, children: k.replace(/_/g, " ") }), _jsx("td", { style: { padding: "9px 0", fontSize: 13, fontWeight: 500, textAlign: "right", fontFamily: "'DM Mono', monospace", color: "#fff" }, children: v == null ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v) })] }, k))) }) })] })) : (_jsxs("div", { style: { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 200 }, children: [_jsx("span", { style: { fontSize: 40, marginBottom: 12 }, children: "\uD83E\uDDEA" }), _jsx("p", { style: { color: "rgba(255,255,255,0.3)", fontSize: 14 }, children: "Nutrition data not available" })] }))] })] })), loading && activeTab === "upload" && (_jsxs("div", { style: { marginTop: 32, background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 20, padding: 40, textAlign: "center" }, children: [_jsx("div", { style: { width: 60, height: 60, borderRadius: "50%", border: "3px solid rgba(16,185,129,0.2)", borderTopColor: "#10b981", animation: "spin 1s linear infinite", margin: "0 auto 24px" } }), _jsx("h3", { style: { fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 8 }, children: "Analyzing Your Food Label" }), _jsx("p", { style: { color: "rgba(255,255,255,0.4)", fontSize: 14 }, children: "AI is scanning ingredients, nutrients and health impacts\u2026" }), _jsx("div", { style: { display: "flex", flexDirection: "column", gap: 12, marginTop: 28, maxWidth: 360, margin: "28px auto 0" }, children: ["Extracting text from image", "Identifying ingredients", "Checking health impact", "Generating recommendations"].map((step, i) => (_jsxs("div", { style: { display: "flex", alignItems: "center", gap: 12 }, children: [_jsx("div", { style: { width: 20, height: 20, borderRadius: "50%", background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#10b981", flexShrink: 0 }, children: i + 1 }), _jsx(Shimmer, { height: "12px", radius: "6px" })] }, step))) })] })), _jsx("div", { style: { textAlign: "center", padding: "48px 0 0", borderTop: "1px solid rgba(255,255,255,0.04)", marginTop: 64 }, children: _jsx("p", { style: { color: "rgba(255,255,255,0.2)", fontSize: 13 }, children: "\u26A1 Smart Nutrition Assistant \u00B7 AI-powered \u00B7 For informational purposes only" }) })] })] }));
}
//# sourceMappingURL=App.js.map
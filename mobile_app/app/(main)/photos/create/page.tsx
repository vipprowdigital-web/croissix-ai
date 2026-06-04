// // mobile_app\app\(main)\photos\create\page.tsx

// "use client";

// import { useState, useEffect, useRef, useCallback, DragEvent } from "react";
// import { useTheme } from "next-themes";
// import { useRouter } from "next/navigation";
// import { useMutation, useQueryClient } from "@tanstack/react-query";
// import {
//   ArrowLeft, Upload, Image as ImgIcon, Camera, Star, MapPin,
//   Package, Users, Shield, Video, X, Check, Loader2, Brain,
//   Sparkles, ChevronDown, AlertTriangle, ZoomIn, Wand2, Info,
//   Plus, FileImage, Crop, RotateCw, SlidersHorizontal, Eye,
//   CheckCircle2, Clock, Zap, ArrowUpRight,
// } from "lucide-react";

// /* ════════════════════════════════════════════════════════
//    TYPES
// ════════════════════════════════════════════════════════ */
// type MediaCategory = "COVER" | "LOGO" | "EXTERIOR" | "INTERIOR" | "PRODUCT" | "AT_WORK" | "ADDITIONAL";
// type UploadStatus  = "idle" | "uploading" | "success" | "error";

// interface FileEntry {
//   id:       string;
//   file:     File;
//   preview:  string;
//   category: MediaCategory;
//   status:   UploadStatus;
//   progress: number;
//   error?:   string;
//   aiTag?:   MediaCategory;
// }

// /* ════════════════════════════════════════════════════════
//    CATEGORY CONFIG
// ════════════════════════════════════════════════════════ */
// const CATS: { value: MediaCategory; label: string; icon: React.ReactNode; color: string; desc: string; minDim: string; maxMB: number }[] = [
//   { value:"COVER",     label:"Cover Photo",  icon:<Star      size={13}/>, color:"#3b82f6", desc:"Banner shown at top of your profile",            minDim:"1080×608px", maxMB:5  },
//   { value:"LOGO",      label:"Logo",         icon:<Shield    size={13}/>, color:"#6366f1", desc:"Square logo for Knowledge Panel (min 250×250px)", minDim:"720×720px",  maxMB:5  },
//   { value:"EXTERIOR",  label:"Exterior",     icon:<MapPin    size={13}/>, color:"#0ea5e9", desc:"Outside your building & signage",                 minDim:"720×540px",  maxMB:5  },
//   { value:"INTERIOR",  label:"Interior",     icon:<ImgIcon   size={13}/>, color:"#8b5cf6", desc:"Inside your business & ambiance",                 minDim:"720×540px",  maxMB:5  },
//   { value:"PRODUCT",   label:"Product",      icon:<Package   size={13}/>, color:"#06b6d4", desc:"Products you sell",                               minDim:"720×720px",  maxMB:5  },
//   { value:"AT_WORK",   label:"At Work",      icon:<Users     size={13}/>, color:"#10b981", desc:"Your team in action",                             minDim:"720×540px",  maxMB:5  },
//   { value:"ADDITIONAL",label:"Additional",   icon:<Camera    size={13}/>, color:"#64748b", desc:"Other photos",                                    minDim:"720×540px",  maxMB:5  },
// ];

// /* ════════════════════════════════════════════════════════
//    FAKE UPLOAD API
// ════════════════════════════════════════════════════════ */
// async function uploadPhoto(file: File, category: MediaCategory, onProgress: (p: number) => void): Promise<void> {
//   for (let i = 0; i <= 100; i += Math.random() * 18 + 5) {
//     await new Promise(r => setTimeout(r, 80 + Math.random() * 60));
//     onProgress(Math.min(i, 100));
//   }
//   onProgress(100);
//   if (Math.random() < 0.05) throw new Error("Upload failed — try again");
//   await new Promise(r => setTimeout(r, 200));
// }

// /* ════════════════════════════════════════════════════════
//    AI CATEGORY TAGGER (mock)
// ════════════════════════════════════════════════════════ */
// async function aiTagCategory(file: File): Promise<MediaCategory> {
//   await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
//   const guesses: MediaCategory[] = ["EXTERIOR","INTERIOR","PRODUCT","AT_WORK","ADDITIONAL"];
//   return guesses[Math.floor(Math.random() * guesses.length)];
// }

// /* ════════════════════════════════════════════════════════
//    VALIDATE
// ════════════════════════════════════════════════════════ */
// function validateFile(file: File): string | null {
//   if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) return "Only images and videos are supported.";
//   if (file.size > 75 * 1024 * 1024) return "File is too large. Maximum 75MB.";
//   return null;
// }

// /* ════════════════════════════════════════════════════════
//    CATEGORY PICKER MODAL
// ════════════════════════════════════════════════════════ */
// function CategoryPicker({ dark, value, onChange, onClose }: {
//   dark: boolean; value: MediaCategory;
//   onChange: (c: MediaCategory) => void; onClose: () => void;
// }) {
//   return (
//     <div className="fixed inset-0 z-[400] flex items-end justify-center"
//       style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
//       onClick={onClose}>
//       <div className={`w-full max-w-sm rounded-t-3xl border-t border-x p-4 pb-8
//         ${dark ? "bg-[#0a1020] border-blue-900/50" : "bg-white border-blue-100"}`}
//         style={{ boxShadow: "0 -24px 80px rgba(0,0,0,0.3)" }}
//         onClick={e => e.stopPropagation()}>

//         {/* handle */}
//         <div className={`w-10 h-1 rounded-full mx-auto mb-4 ${dark ? "bg-white/10" : "bg-slate-200"}`}/>
//         <p className={`text-[14px] font-black mb-4 ${dark ? "text-white" : "text-slate-900"}`}
//           style={{ letterSpacing: "-0.03em" }}>Select Category</p>

//         <div className="flex flex-col gap-2">
//           {CATS.map(c => (
//             <button key={c.value} onClick={() => { onChange(c.value); onClose(); }}
//               className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-all active:scale-[0.98]
//                 ${value === c.value
//                   ? dark ? "border-blue-500/40" : "border-blue-300"
//                   : dark ? "border-white/[0.05]" : "border-slate-100"}`}
//               style={value === c.value ? { background: `${c.color}12` } : {}}>
//               <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
//                 style={{ background: `${c.color}18`, color: c.color }}>{c.icon}</div>
//               <div className="flex-1 min-w-0">
//                 <p className={`text-[12.5px] font-bold ${dark ? "text-white" : "text-slate-900"}`}>{c.label}</p>
//                 <p className={`text-[10.5px] ${dark ? "text-slate-500" : "text-slate-400"}`}>{c.desc}</p>
//               </div>
//               {value === c.value && <Check size={14} style={{ color: c.color, flexShrink: 0 }}/>}
//             </button>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ════════════════════════════════════════════════════════
//    FILE CARD
// ════════════════════════════════════════════════════════ */
// function FileCard({ entry, dark, onRemove, onCategoryChange }: {
//   entry: FileEntry; dark: boolean;
//   onRemove: () => void;
//   onCategoryChange: (c: MediaCategory) => void;
// }) {
//   const [showPicker, setShowPicker] = useState(false);
//   const cat = CATS.find(c => c.value === entry.category)!;

//   return (
//     <>
//       <div className={`rounded-3xl border overflow-hidden transition-all
//         ${dark ? "bg-[#0a1020] border-blue-900/40" : "bg-white border-blue-100/80 shadow-sm"}`}
//         style={{ boxShadow: entry.status === "success"
//           ? dark ? "0 0 0 1.5px rgba(74,222,128,0.3)" : "0 0 0 1.5px rgba(34,197,94,0.3)"
//           : entry.status === "error"
//           ? dark ? "0 0 0 1.5px rgba(248,113,113,0.3)" : "0 0 0 1.5px rgba(239,68,68,0.3)"
//           : "none" }}>

//         <div className="flex items-start gap-3 p-3">
//           {/* thumbnail */}
//           <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 relative bg-blue-900/10">
//             <img src={entry.preview} alt="" className="w-full h-full object-cover"/>
//             {/* progress overlay */}
//             {entry.status === "uploading" && (
//               <div className="absolute inset-0 flex items-center justify-center"
//                 style={{ background: "rgba(3,7,18,0.6)" }}>
//                 <div className="relative w-10 h-10">
//                   <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
//                     <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3"/>
//                     <circle cx="20" cy="20" r="16" fill="none" stroke="#3b82f6" strokeWidth="3"
//                       strokeLinecap="round"
//                       strokeDasharray={`${2*Math.PI*16 * entry.progress/100} ${2*Math.PI*16}`}/>
//                   </svg>
//                   <div className="absolute inset-0 flex items-center justify-center">
//                     <span className="text-[9px] font-black text-white">{Math.round(entry.progress)}%</span>
//                   </div>
//                 </div>
//               </div>
//             )}
//             {entry.status === "success" && (
//               <div className="absolute inset-0 flex items-center justify-center"
//                 style={{ background: "rgba(3,7,18,0.45)" }}>
//                 <div className="w-8 h-8 rounded-full flex items-center justify-center bg-emerald-500">
//                   <Check size={14} className="text-white"/>
//                 </div>
//               </div>
//             )}
//             {entry.status === "error" && (
//               <div className="absolute inset-0 flex items-center justify-center"
//                 style={{ background: "rgba(3,7,18,0.55)" }}>
//                 <AlertTriangle size={18} className="text-red-400"/>
//               </div>
//             )}
//           </div>

//           {/* info */}
//           <div className="flex-1 min-w-0">
//             <div className="flex items-start justify-between gap-2 mb-2">
//               <p className={`text-[12px] font-semibold truncate leading-tight ${dark ? "text-slate-300" : "text-slate-700"}`}>
//                 {entry.file.name}
//               </p>
//               <button onClick={onRemove} disabled={entry.status === "uploading"}
//                 className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all
//                   ${dark ? "hover:bg-white/[0.08]" : "hover:bg-red-50"}`}>
//                 <X size={12} className={dark ? "text-slate-500" : "text-slate-400"}/>
//               </button>
//             </div>

//             {/* file meta */}
//             <p className={`text-[10px] mb-2 ${dark ? "text-slate-600" : "text-slate-400"}`}>
//               {(entry.file.size / 1024 / 1024).toFixed(1)} MB · {entry.file.type.split("/")[1]?.toUpperCase()}
//             </p>

//             {/* category */}
//             <button onClick={() => setShowPicker(true)}
//               disabled={entry.status === "uploading" || entry.status === "success"}
//               className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all active:scale-95"
//               style={{ background: `${cat.color}10`, borderColor: `${cat.color}30`, color: cat.color }}>
//               <span style={{ color: cat.color }}>{cat.icon}</span>
//               <span className="text-[10.5px] font-bold">{cat.label}</span>
//               {entry.aiTag === entry.category && (
//                 <Brain size={8} style={{ color: cat.color, opacity: 0.7 }}/>
//               )}
//               {entry.status !== "uploading" && entry.status !== "success" && (
//                 <ChevronDown size={9} style={{ color: cat.color }}/>
//               )}
//             </button>

//             {/* error */}
//             {entry.status === "error" && entry.error && (
//               <p className="text-[10px] text-red-400 mt-1.5 flex items-center gap-1">
//                 <AlertTriangle size={9}/> {entry.error}
//               </p>
//             )}
//           </div>
//         </div>

//         {/* progress bar */}
//         {entry.status === "uploading" && (
//           <div className={`h-0.5 ${dark ? "bg-white/[0.04]" : "bg-blue-50"}`}>
//             <div className="h-full rounded-full transition-all duration-150"
//               style={{ width: `${entry.progress}%`, background: "linear-gradient(90deg,#1e40af,#3b82f6)" }}/>
//           </div>
//         )}
//         {entry.status === "success" && <div className="h-0.5 bg-emerald-500"/>}
//         {entry.status === "error"   && <div className="h-0.5 bg-red-500"/>}
//       </div>

//       {showPicker && (
//         <CategoryPicker dark={dark} value={entry.category}
//           onChange={onCategoryChange} onClose={() => setShowPicker(false)}/>
//       )}
//     </>
//   );
// }

// /* ════════════════════════════════════════════════════════
//    TIPS CARD
// ════════════════════════════════════════════════════════ */
// function TipsCard({ dark, category }: { dark: boolean; category: MediaCategory }) {
//   const tips: Record<MediaCategory, string[]> = {
//     COVER:      ["Min 1080×608px recommended","Shoot during golden hour for warmth","Include people if possible — 2.6× more engagement"],
//     LOGO:       ["Minimum 720×720px square","PNG with transparent background","Ensure readable at 40×40px thumbnail size"],
//     EXTERIOR:   ["Shoot from street-level approach","Include daytime + evening shots","Make signage clearly visible"],
//     INTERIOR:   ["Min 8–12 photos for full impact","Use natural or warm lighting","No mirrors reflecting camera"],
//     PRODUCT:    ["Clean/neutral background","Include close-up detail shots","Lifestyle/in-use photos perform 2× better"],
//     AT_WORK:    ["Candid > posed — more authentic","Include your team & customers","Show the process, not just the result"],
//     ADDITIONAL: ["Use consistent lighting","Min 720px on shortest side","Under 5MB per image"],
//   };
//   const list = tips[category] ?? tips.ADDITIONAL;

//   return (
//     <div className={`rounded-2xl border px-4 py-3.5
//       ${dark ? "bg-[#080f1e] border-blue-900/30" : "bg-blue-50/60 border-blue-200/50"}`}>
//       <div className="flex items-center gap-2 mb-2.5">
//         <Brain size={12} style={{ color: "#60a5fa" }}/>
//         <span className={`text-[9.5px] font-black uppercase tracking-widest ${dark ? "text-blue-400" : "text-blue-600"}`}>
//           AI Photo Tips
//         </span>
//         <Sparkles size={8} className="text-blue-400 ml-auto"/>
//       </div>
//       <div className="flex flex-col gap-1.5">
//         {list.map((t, i) => (
//           <div key={i} className="flex items-start gap-2">
//             <div className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 shrink-0"/>
//             <p className={`text-[11px] leading-relaxed ${dark ? "text-blue-200/70" : "text-blue-800/80"}`}>{t}</p>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// /* ════════════════════════════════════════════════════════
//    SUCCESS SCREEN
// ════════════════════════════════════════════════════════ */
// function SuccessScreen({ count, dark, onDone, onMore }: {
//   count: number; dark: boolean; onDone: () => void; onMore: () => void;
// }) {
//   return (
//     <div className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center">
//       {/* animated check */}
//       <div className="relative mb-6">
//         <div className="w-24 h-24 rounded-3xl flex items-center justify-center"
//           style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)" }}>
//           <CheckCircle2 size={44} className="text-emerald-400"/>
//         </div>
//         <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
//           style={{ background: "#3b82f6" }}>
//           <Sparkles size={12} className="text-white"/>
//         </div>
//       </div>

//       <h2 className={`text-[22px] font-black mb-2 ${dark ? "text-white" : "text-slate-900"}`}
//         style={{ letterSpacing: "-0.04em" }}>
//         {count === 1 ? "Photo Uploaded!" : `${count} Photos Uploaded!`}
//       </h2>
//       <p className={`text-[12px] mb-2 max-w-[240px] leading-relaxed ${dark ? "text-slate-400" : "text-slate-500"}`}>
//         Your photos have been submitted to Google Business Profile. They'll appear on your listing within a few minutes.
//       </p>
//       <p className={`text-[11px] mb-8 flex items-center gap-1.5 px-3 py-1.5 rounded-full border
//         ${dark ? "bg-amber-500/[0.08] border-amber-500/20 text-amber-400" : "bg-amber-50 border-amber-200 text-amber-600"}`}>
//         <Clock size={10}/> Google review may take up to 24 hours
//       </p>

//       <div className="flex gap-3 w-full max-w-xs">
//         <button onClick={onMore}
//           className={`flex-1 py-3 rounded-2xl text-[13px] font-bold border transition-all active:scale-[0.97]
//             ${dark ? "bg-white/[0.04] border-white/[0.08] text-slate-300" : "bg-white border-blue-100 text-slate-700"}`}>
//           Add More
//         </button>
//         <button onClick={onDone}
//           className="flex-1 py-3 rounded-2xl text-[13px] font-black text-white flex items-center justify-center gap-1.5 transition-all active:scale-[0.97]"
//           style={{ background: "linear-gradient(135deg,#1e40af,#3b82f6)",
//             boxShadow: "0 8px 24px rgba(59,130,246,0.35)" }}>
//           View All <ArrowUpRight size={13}/>
//         </button>
//       </div>
//     </div>
//   );
// }

// /* ════════════════════════════════════════════════════════
//    MAIN PAGE
// ════════════════════════════════════════════════════════ */
// export default function CreatePhotoPage() {
//   const { resolvedTheme } = useTheme();
//   const [mounted, setMounted] = useState(false);
//   useEffect(() => setMounted(true), []);
//   const dark = mounted && resolvedTheme === "dark";

//   const router      = useRouter();
//   const queryClient = useQueryClient();
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const [entries,      setEntries]     = useState<FileEntry[]>([]);
//   const [dragging,     setDragging]    = useState(false);
//   const [uploading,    setUploading]   = useState(false);
//   const [done,         setDone]        = useState(false);
//   const [successCount, setSuccessCount]= useState(0);
//   const [defaultCat,   setDefaultCat]  = useState<MediaCategory>("EXTERIOR");
//   const [aiTagging,    setAiTagging]   = useState<Set<string>>(new Set());

//   /* ── add files ── */
//   async function addFiles(files: File[]) {
//     const valid = files.filter(f => !validateFile(f));
//     const newEntries: FileEntry[] = valid.map(f => ({
//       id:       Math.random().toString(36).slice(2),
//       file:     f,
//       preview:  URL.createObjectURL(f),
//       category: defaultCat,
//       status:   "idle" as const,
//       progress: 0,
//     }));
//     setEntries(prev => [...prev, ...newEntries]);

//     // AI auto-tag each
//     for (const entry of newEntries) {
//       setAiTagging(s => new Set(s).add(entry.id));
//       try {
//         const tag = await aiTagCategory(entry.file);
//         setEntries(prev => prev.map(e => e.id === entry.id
//           ? { ...e, category: tag, aiTag: tag } : e));
//       } finally {
//         setAiTagging(s => { const n = new Set(s); n.delete(entry.id); return n; });
//       }
//     }
//   }

//   /* ── drag & drop ── */
//   function onDrop(e: DragEvent<HTMLDivElement>) {
//     e.preventDefault();
//     setDragging(false);
//     const files = Array.from(e.dataTransfer.files);
//     addFiles(files);
//   }

//   /* ── remove ── */
//   function removeEntry(id: string) {
//     setEntries(prev => {
//       const e = prev.find(x => x.id === id);
//       if (e) URL.revokeObjectURL(e.preview);
//       return prev.filter(x => x.id !== id);
//     });
//   }

//   /* ── update category ── */
//   function setCat(id: string, cat: MediaCategory) {
//     setEntries(prev => prev.map(e => e.id === id ? { ...e, category: cat } : e));
//   }

//   /* ── upload all ── */
//   async function handleUpload() {
//     const pending = entries.filter(e => e.status === "idle" || e.status === "error");
//     if (!pending.length) return;
//     setUploading(true);

//     let successN = 0;
//     await Promise.all(pending.map(async entry => {
//       setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, status: "uploading", progress: 0 } : e));
//       try {
//         await uploadPhoto(entry.file, entry.category, (p) => {
//           setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, progress: p } : e));
//         });
//         setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, status: "success", progress: 100 } : e));
//         successN++;
//       } catch (err: any) {
//         setEntries(prev => prev.map(e => e.id === entry.id
//           ? { ...e, status: "error", error: err.message ?? "Upload failed" } : e));
//       }
//     }));

//     setUploading(false);
//     setSuccessCount(successN);
//     if (successN > 0) {
//       queryClient.invalidateQueries({ queryKey: ["gbp-media"] });
//       setTimeout(() => setDone(true), 600);
//     }
//   }

//   const pendingCount  = entries.filter(e => e.status === "idle" || e.status === "error").length;
//   const successN      = entries.filter(e => e.status === "success").length;
//   const allDone       = entries.length > 0 && entries.every(e => e.status === "success");
//   const activeCat     = CATS.find(c => c.value === defaultCat)!;

//   /* ── default cat for new files ── */
//   const [showDefaultPicker, setShowDefaultPicker] = useState(false);

//   if (done) {
//     return (
//       <div className={`min-h-screen transition-colors ${dark ? "bg-[#050d1a]" : "bg-[#eef4ff]"}`}
//         style={{ fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}>
//         <div className="fixed inset-0 pointer-events-none opacity-[0.015]"
//           style={{ backgroundImage: "radial-gradient(circle at 1px 1px,#3b82f6 1px,transparent 0)", backgroundSize:"32px 32px" }}/>
//         <div className="relative max-w-lg mx-auto px-4">
//           <SuccessScreen count={successCount} dark={dark}
//             onDone={() => router.push("/photos")}
//             onMore={() => { setEntries([]); setDone(false); }}/>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className={`min-h-screen transition-colors ${dark ? "bg-[#050d1a]" : "bg-[#eef4ff]"}`}
//       style={{ fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}>

//       <div className="fixed inset-0 pointer-events-none opacity-[0.015]"
//         style={{ backgroundImage: "radial-gradient(circle at 1px 1px,#3b82f6 1px,transparent 0)", backgroundSize:"32px 32px" }}/>

//       <div className="relative max-w-lg mx-auto px-4 pb-32">

//         {/* ── HEADER ── */}
//         <div className="pt-5 pb-5">
//           <div className="flex items-center gap-3 mb-4">
//             <button onClick={() => router.back()}
//               className={`w-9 h-9 rounded-2xl flex items-center justify-center border transition-all active:scale-90
//                 ${dark ? "bg-white/[0.04] border-white/[0.07] text-slate-300" : "bg-white border-blue-100 text-slate-600"}`}>
//               <ArrowLeft size={16}/>
//             </button>
//             <div>
//               <h1 className={`text-[20px] font-black leading-none ${dark ? "text-white" : "text-slate-900"}`}
//                 style={{ letterSpacing: "-0.04em" }}>
//                 Add Photos
//               </h1>
//               <p className={`text-[11px] mt-0.5 ${dark ? "text-slate-500" : "text-blue-500/80"}`}>
//                 Google Business Profile · Media API
//               </p>
//             </div>
//           </div>

//           {/* default category selector */}
//           <div className={`flex items-center justify-between px-4 py-3 rounded-2xl border
//             ${dark ? "bg-[#0a1020] border-blue-900/30" : "bg-white border-blue-100 shadow-sm"}`}>
//             <div>
//               <p className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${dark ? "text-slate-600" : "text-slate-400"}`}>
//                 Default Category
//               </p>
//               <p className={`text-[11px] ${dark ? "text-slate-400" : "text-slate-500"}`}>
//                 AI will auto-detect per photo
//               </p>
//             </div>
//             <button onClick={() => setShowDefaultPicker(true)}
//               className="flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all active:scale-95"
//               style={{ background: `${activeCat.color}12`, borderColor: `${activeCat.color}30` }}>
//               <span style={{ color: activeCat.color }}>{activeCat.icon}</span>
//               <span className="text-[11px] font-bold" style={{ color: activeCat.color }}>{activeCat.label}</span>
//               <ChevronDown size={10} style={{ color: activeCat.color }}/>
//             </button>
//           </div>
//         </div>

//         {/* ── DROP ZONE ── */}
//         <div
//           onDragOver={e => { e.preventDefault(); setDragging(true); }}
//           onDragLeave={() => setDragging(false)}
//           onDrop={onDrop}
//           onClick={() => fileInputRef.current?.click()}
//           className={`relative rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-3 py-10 px-6 mb-5 cursor-pointer transition-all
//             ${dragging
//               ? dark ? "border-blue-500 bg-blue-500/[0.08]" : "border-blue-400 bg-blue-50"
//               : dark ? "border-blue-900/60 hover:border-blue-700/60 bg-[#0a1020]/60" : "border-blue-200/80 hover:border-blue-300 bg-white/60"}`}>

//           {/* bg glow when dragging */}
//           {dragging && (
//             <div className="absolute inset-0 rounded-3xl pointer-events-none"
//               style={{ background: "radial-gradient(circle at 50% 50%, rgba(59,130,246,0.08), transparent 70%)" }}/>
//           )}

//           <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all
//             ${dragging ? "bg-blue-500/15 scale-110" : dark ? "bg-blue-500/08" : "bg-blue-50"}`}
//             style={{ border: dragging ? "1px solid rgba(59,130,246,0.4)" : "1px solid rgba(59,130,246,0.15)" }}>
//             {dragging
//               ? <FileImage size={28} style={{ color: "#3b82f6" }}/>
//               : <Upload size={28} className="text-blue-400"/>}
//           </div>

//           <div className="text-center">
//             <p className={`text-[14px] font-black mb-1 ${dark ? "text-white" : "text-slate-900"}`}
//               style={{ letterSpacing: "-0.025em" }}>
//               {dragging ? "Drop to add" : "Tap to choose photos"}
//             </p>
//             <p className={`text-[11px] ${dark ? "text-slate-500" : "text-slate-400"}`}>
//               or drag & drop · JPG, PNG, WebP, MP4 · Max 75MB
//             </p>
//           </div>

//           {/* AI tag badge */}
//           <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border"
//             style={{ background: "rgba(37,99,235,0.1)", borderColor: "rgba(59,130,246,0.2)" }}>
//             <Brain size={10} style={{ color: "#60a5fa" }}/>
//             <span className="text-[9.5px] font-bold text-blue-400">AI auto-detects category</span>
//             <Sparkles size={8} className="text-blue-400"/>
//           </div>

//           <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" className="hidden"
//             onChange={e => { if (e.target.files) addFiles(Array.from(e.target.files)); e.target.value=""; }}/>
//         </div>

//         {/* ── FILE LIST ── */}
//         {entries.length > 0 && (
//           <div className="mb-5">
//             <div className="flex items-center justify-between mb-3">
//               <div className="flex items-center gap-2">
//                 <p className={`text-[13px] font-black ${dark ? "text-white" : "text-slate-900"}`}
//                   style={{ letterSpacing: "-0.025em" }}>
//                   {entries.length} {entries.length === 1 ? "Photo" : "Photos"} Selected
//                 </p>
//                 {successN > 0 && (
//                   <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
//                     <Check size={9}/> {successN} uploaded
//                   </span>
//                 )}
//               </div>
//               {aiTagging.size > 0 && (
//                 <div className="flex items-center gap-1.5">
//                   <Brain size={10} style={{ color: "#60a5fa", animation:"spin .8s linear infinite" }}/>
//                   <span className="text-[10px] text-blue-400">AI tagging…</span>
//                 </div>
//               )}
//               {entries.some(e => e.status === "idle" || e.status === "error") && !uploading && (
//                 <button onClick={() => setEntries([])}
//                   className={`text-[10px] font-bold ${dark ? "text-slate-600" : "text-slate-400"}`}>
//                   Clear all
//                 </button>
//               )}
//             </div>

//             <div className="flex flex-col gap-2.5">
//               {entries.map(entry => (
//                 <FileCard key={entry.id} entry={entry} dark={dark}
//                   onRemove={() => removeEntry(entry.id)}
//                   onCategoryChange={cat => setCat(entry.id, cat)}/>
//               ))}
//             </div>
//           </div>
//         )}

//         {/* ── TIPS ── */}
//         {entries.length === 0 && (
//           <TipsCard dark={dark} category={defaultCat}/>
//         )}

//         {/* ── CATEGORY GUIDE ── */}
//         {entries.length === 0 && (
//           <div className="mt-4">
//             <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${dark ? "text-slate-600" : "text-slate-400"}`}>
//               Photo Categories
//             </p>
//             <div className="flex flex-col gap-2">
//               {CATS.filter(c => c.value !== "ADDITIONAL").map(c => (
//                 <div key={c.value} className={`flex items-start gap-3 px-4 py-3 rounded-2xl border
//                   ${dark ? "bg-[#0a1020] border-blue-900/30" : "bg-white border-blue-100/80"}`}>
//                   <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
//                     style={{ background: `${c.color}15`, color: c.color }}>{c.icon}</div>
//                   <div className="flex-1 min-w-0">
//                     <div className="flex items-center gap-1.5 mb-0.5">
//                       <span className={`text-[12px] font-bold ${dark ? "text-white" : "text-slate-900"}`}>{c.label}</span>
//                       <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md"
//                         style={{ background: `${c.color}15`, color: c.color }}>{c.minDim}</span>
//                     </div>
//                     <p className={`text-[10.5px] ${dark ? "text-slate-500" : "text-slate-400"}`}>{c.desc}</p>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}

//       </div>

//       {/* ── UPLOAD BUTTON ── */}
//       {entries.length > 0 && pendingCount > 0 && (
//         <div className="fixed bottom-20 left-0 right-0 px-4 z-50 max-w-lg mx-auto">
//           <div className={`rounded-3xl border p-3 ${dark ? "bg-[#0a1020]/90 border-blue-900/50" : "bg-white/90 border-blue-100"}`}
//             style={{ backdropFilter: "blur(20px)", boxShadow: "0 -8px 40px rgba(0,0,0,0.15)" }}>
//             <button onClick={handleUpload} disabled={uploading}
//               className="w-full py-4 rounded-2xl text-[14px] font-black text-white flex items-center justify-center gap-2.5 transition-all active:scale-[0.97]"
//               style={{ background: uploading
//                 ? "rgba(37,99,235,0.5)"
//                 : "linear-gradient(135deg,#1e40af,#2563eb,#3b82f6)",
//                 boxShadow: uploading ? "none" : "0 8px 28px rgba(59,130,246,0.42)" }}>
//               {uploading
//                 ? <><Loader2 size={16} style={{ animation:"spin .6s linear infinite" }}/> Uploading {successN > 0 ? `${successN}/${entries.length}` : "…"}</>
//                 : <><Upload size={16}/> Upload {pendingCount} {pendingCount === 1 ? "Photo" : "Photos"} to Google</>}
//             </button>
//           </div>
//         </div>
//       )}

//       {/* ── ALL SUCCESS FLOATING ── */}
//       {allDone && !done && (
//         <div className="fixed bottom-20 left-0 right-0 px-4 z-50 max-w-lg mx-auto">
//           <div className={`rounded-3xl border p-3 ${dark ? "bg-[#0a1020]/90 border-emerald-900/40" : "bg-white/90 border-emerald-100"}`}
//             style={{ backdropFilter: "blur(20px)" }}>
//             <button onClick={() => setDone(true)}
//               className="w-full py-4 rounded-2xl text-[14px] font-black text-white flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
//               style={{ background: "linear-gradient(135deg,#065f46,#10b981)" }}>
//               <CheckCircle2 size={16}/> All uploaded — View Gallery <ArrowUpRight size={14}/>
//             </button>
//           </div>
//         </div>
//       )}

//       {/* default category picker */}
//       {showDefaultPicker && (
//         <CategoryPicker dark={dark} value={defaultCat}
//           onChange={v => setDefaultCat(v)}
//           onClose={() => setShowDefaultPicker(false)}/>
//       )}

//       <style>{`
//         @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
//         .no-scrollbar::-webkit-scrollbar { display: none }
//         .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none }
//       `}</style>
//     </div>
//   );
// }

"use client";

import { useState, useEffect, useRef, useCallback, DragEvent } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Upload,
  Image as ImgIcon,
  Camera,
  Star,
  MapPin,
  Package,
  Users,
  Shield,
  Video,
  X,
  Check,
  Loader2,
  Brain,
  Sparkles,
  ChevronDown,
  AlertTriangle,
  ZoomIn,
  Info,
  Plus,
  FileImage,
  Eye,
  CheckCircle2,
  Clock,
  Zap,
  ArrowUpRight,
} from "lucide-react";
import { getToken } from "@/lib/token";
import { useUser } from "@/features/user/hook/useUser";

/* ════════════════════════════════════════════════════════
   TYPES
════════════════════════════════════════════════════════ */
type MediaCategory =
  | "COVER"
  | "LOGO"
  | "EXTERIOR"
  | "INTERIOR"
  | "PRODUCT"
  | "AT_WORK"
  | "ADDITIONAL";
type UploadStatus = "idle" | "uploading" | "success" | "error";

interface FileEntry {
  id: string;
  file: File;
  preview: string;
  category: MediaCategory;
  status: UploadStatus;
  progress: number;
  error?: string;
}

/* ════════════════════════════════════════════════════════
   CATEGORY CONFIG
════════════════════════════════════════════════════════ */
const CATS: {
  value: MediaCategory;
  label: string;
  icon: React.ReactNode;
  color: string;
  desc: string;
  minDim: string;
}[] = [
  {
    value: "COVER",
    label: "Cover Photo",
    icon: <Star size={13} />,
    color: "#3b82f6",
    desc: "Banner shown at top of your profile",
    minDim: "1080×608px",
  },
  {
    value: "LOGO",
    label: "Logo",
    icon: <Shield size={13} />,
    color: "#6366f1",
    desc: "Square logo for Knowledge Panel (min 250×250px)",
    minDim: "720×720px",
  },
  {
    value: "EXTERIOR",
    label: "Exterior",
    icon: <MapPin size={13} />,
    color: "#0ea5e9",
    desc: "Outside your building & signage",
    minDim: "720×540px",
  },
  {
    value: "INTERIOR",
    label: "Interior",
    icon: <ImgIcon size={13} />,
    color: "#8b5cf6",
    desc: "Inside your business & ambiance",
    minDim: "720×540px",
  },
  {
    value: "PRODUCT",
    label: "Product",
    icon: <Package size={13} />,
    color: "#06b6d4",
    desc: "Products you sell",
    minDim: "720×720px",
  },
  {
    value: "AT_WORK",
    label: "At Work",
    icon: <Users size={13} />,
    color: "#10b981",
    desc: "Your team in action",
    minDim: "720×540px",
  },
  {
    value: "ADDITIONAL",
    label: "Additional",
    icon: <Camera size={13} />,
    color: "#64748b",
    desc: "Other photos",
    minDim: "720×540px",
  },
];

/* ════════════════════════════════════════════════════════
   REAL UPLOAD API  (mirrors mobile uploadMedia)
════════════════════════════════════════════════════════ */
async function uploadMedia(
  file: File,
  category: MediaCategory,
  locationId: string,
  accountId: string,
  onProgress: (p: number) => void,
): Promise<void> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("category", category.toUpperCase());

  const locationName = `accounts/${accountId}/locations/${locationId}`;
  formData.append("locationName", locationName);

  // XHR so we get upload progress events (fetch doesn't expose upload progress)
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
      } else {
        let msg = "Upload failed";
        try {
          msg = JSON.parse(xhr.responseText)?.error ?? msg;
        } catch {}
        reject(new Error(msg));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Network error")));
    xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));

    xhr.open("POST", "/api/google/media");
    xhr.setRequestHeader("Authorization", `Bearer ${getToken()}`);
    // Do NOT set Content-Type — browser sets it with the correct multipart boundary
    xhr.send(formData);
  });
}

/* ════════════════════════════════════════════════════════
   VALIDATE
════════════════════════════════════════════════════════ */
function validateFile(file: File): string | null {
  if (!file.type.startsWith("image/") && !file.type.startsWith("video/"))
    return "Only images and videos are supported.";
  if (file.size > 75 * 1024 * 1024) return "File is too large. Maximum 75MB.";
  return null;
}

/* ════════════════════════════════════════════════════════
   CATEGORY PICKER MODAL
════════════════════════════════════════════════════════ */
function CategoryPicker({
  dark,
  value,
  onChange,
  onClose,
}: {
  dark: boolean;
  value: MediaCategory;
  onChange: (c: MediaCategory) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-sm rounded-t-3xl sm:rounded-3xl border p-5 pb-8
          ${dark ? "bg-[#0a1020] border-blue-900/50" : "bg-white border-blue-100"}`}
        style={{ boxShadow: "0 -24px 80px rgba(0,0,0,0.3)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* handle */}
        <div
          className={`w-10 h-1 rounded-full mx-auto mb-4 ${dark ? "bg-white/10" : "bg-slate-200"}`}
        />
        <p
          className={`text-[14px] font-black mb-4 ${dark ? "text-white" : "text-slate-900"}`}
          style={{ letterSpacing: "-0.03em" }}
        >
          Select Category
        </p>

        <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
          {CATS.map((c) => (
            <button
              key={c.value}
              onClick={() => {
                onChange(c.value);
                onClose();
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-all active:scale-[0.98]
                ${
                  value === c.value
                    ? dark
                      ? "border-blue-500/40"
                      : "border-blue-300"
                    : dark
                      ? "border-white/[0.05]"
                      : "border-slate-100"
                }`}
              style={value === c.value ? { background: `${c.color}12` } : {}}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${c.color}18`, color: c.color }}
              >
                {c.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-[12.5px] font-bold ${dark ? "text-white" : "text-slate-900"}`}
                >
                  {c.label}
                </p>
                <p
                  className={`text-[10.5px] ${dark ? "text-slate-500" : "text-slate-400"}`}
                >
                  {c.desc}
                </p>
              </div>
              {value === c.value && (
                <Check size={14} style={{ color: c.color, flexShrink: 0 }} />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   FILE CARD
════════════════════════════════════════════════════════ */
function FileCard({
  entry,
  dark,
  onRemove,
  onCategoryChange,
}: {
  entry: FileEntry;
  dark: boolean;
  onRemove: () => void;
  onCategoryChange: (c: MediaCategory) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const cat = CATS.find((c) => c.value === entry.category)!;

  return (
    <>
      <div
        className={`rounded-3xl border overflow-hidden transition-all
          ${dark ? "bg-[#0a1020] border-blue-900/40" : "bg-white border-blue-100/80 shadow-sm"}`}
        style={{
          boxShadow:
            entry.status === "success"
              ? dark
                ? "0 0 0 1.5px rgba(74,222,128,0.3)"
                : "0 0 0 1.5px rgba(34,197,94,0.3)"
              : entry.status === "error"
                ? dark
                  ? "0 0 0 1.5px rgba(248,113,113,0.3)"
                  : "0 0 0 1.5px rgba(239,68,68,0.3)"
                : "none",
        }}
      >
        <div className="flex items-start gap-3 p-3">
          {/* Thumbnail */}
          <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 relative bg-blue-900/10">
            <img
              src={entry.preview}
              alt=""
              className="w-full h-full object-cover"
            />

            {entry.status === "uploading" && (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: "rgba(3,7,18,0.6)" }}
              >
                <div className="relative w-10 h-10">
                  <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      fill="none"
                      stroke="rgba(255,255,255,0.15)"
                      strokeWidth="3"
                    />
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={`${(2 * Math.PI * 16 * entry.progress) / 100} ${2 * Math.PI * 16}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[9px] font-black text-white">
                      {Math.round(entry.progress)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {entry.status === "success" && (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: "rgba(3,7,18,0.45)" }}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-emerald-500">
                  <Check size={14} className="text-white" />
                </div>
              </div>
            )}

            {entry.status === "error" && (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: "rgba(3,7,18,0.55)" }}
              >
                <AlertTriangle size={18} className="text-red-400" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p
                className={`text-[12px] font-semibold truncate leading-tight ${dark ? "text-slate-300" : "text-slate-700"}`}
              >
                {entry.file.name}
              </p>
              <button
                onClick={onRemove}
                disabled={entry.status === "uploading"}
                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all
                  ${dark ? "hover:bg-white/[0.08]" : "hover:bg-red-50"}`}
              >
                <X
                  size={12}
                  className={dark ? "text-slate-500" : "text-slate-400"}
                />
              </button>
            </div>

            <p
              className={`text-[10px] mb-2 ${dark ? "text-slate-600" : "text-slate-400"}`}
            >
              {(entry.file.size / 1024 / 1024).toFixed(1)} MB ·{" "}
              {entry.file.type.split("/")[1]?.toUpperCase()}
            </p>

            {/* Category selector */}
            <button
              onClick={() => setShowPicker(true)}
              disabled={
                entry.status === "uploading" || entry.status === "success"
              }
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all active:scale-95"
              style={{
                background: `${cat.color}10`,
                borderColor: `${cat.color}30`,
                color: cat.color,
              }}
            >
              <span style={{ color: cat.color }}>{cat.icon}</span>
              <span className="text-[10.5px] font-bold">{cat.label}</span>
              {entry.status !== "uploading" && entry.status !== "success" && (
                <ChevronDown size={9} style={{ color: cat.color }} />
              )}
            </button>

            {entry.status === "error" && entry.error && (
              <p className="text-[10px] text-red-400 mt-1.5 flex items-center gap-1">
                <AlertTriangle size={9} /> {entry.error}
              </p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {entry.status === "uploading" && (
          <div className={`h-0.5 ${dark ? "bg-white/[0.04]" : "bg-blue-50"}`}>
            <div
              className="h-full rounded-full transition-all duration-150"
              style={{
                width: `${entry.progress}%`,
                background: "linear-gradient(90deg,#1e40af,#3b82f6)",
              }}
            />
          </div>
        )}
        {entry.status === "success" && <div className="h-0.5 bg-emerald-500" />}
        {entry.status === "error" && <div className="h-0.5 bg-red-500" />}
      </div>

      {showPicker && (
        <CategoryPicker
          dark={dark}
          value={entry.category}
          onChange={onCategoryChange}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}

/* ════════════════════════════════════════════════════════
   TIPS CARD
════════════════════════════════════════════════════════ */
function TipsCard({
  dark,
  category,
}: {
  dark: boolean;
  category: MediaCategory;
}) {
  const tips: Record<MediaCategory, string[]> = {
    COVER: [
      "Min 1080×608px recommended",
      "Shoot during golden hour for warmth",
      "Include people if possible — 2.6× more engagement",
    ],
    LOGO: [
      "Minimum 720×720px square",
      "PNG with transparent background",
      "Ensure readable at 40×40px thumbnail size",
    ],
    EXTERIOR: [
      "Shoot from street-level approach",
      "Include daytime + evening shots",
      "Make signage clearly visible",
    ],
    INTERIOR: [
      "Min 8–12 photos for full impact",
      "Use natural or warm lighting",
      "No mirrors reflecting camera",
    ],
    PRODUCT: [
      "Clean/neutral background",
      "Include close-up detail shots",
      "Lifestyle/in-use photos perform 2× better",
    ],
    AT_WORK: [
      "Candid > posed — more authentic",
      "Include your team & customers",
      "Show the process, not just the result",
    ],
    ADDITIONAL: [
      "Use consistent lighting",
      "Min 720px on shortest side",
      "Under 5MB per image",
    ],
  };
  const list = tips[category] ?? tips.ADDITIONAL;

  return (
    <div
      className={`rounded-2xl border px-4 py-3.5 mb-5
        ${dark ? "bg-[#080f1e] border-blue-900/30" : "bg-blue-50/60 border-blue-200/50"}`}
    >
      <div className="flex items-center gap-2 mb-2.5">
        <Brain size={12} style={{ color: "#60a5fa" }} />
        <span
          className={`text-[9.5px] font-black uppercase tracking-widest ${dark ? "text-blue-400" : "text-blue-600"}`}
        >
          AI Photo Tips
        </span>
        <Sparkles size={8} className="text-blue-400 ml-auto" />
      </div>
      <div className="flex flex-col gap-1.5">
        {list.map((t, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 shrink-0" />
            <p
              className={`text-[11px] leading-relaxed ${dark ? "text-blue-200/70" : "text-blue-800/80"}`}
            >
              {t}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   SUCCESS SCREEN
════════════════════════════════════════════════════════ */
function SuccessScreen({
  count,
  dark,
  onDone,
  onMore,
}: {
  count: number;
  dark: boolean;
  onDone: () => void;
  onMore: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center">
      <div className="relative mb-6">
        <div
          className="w-24 h-24 rounded-3xl flex items-center justify-center"
          style={{
            background: "rgba(34,197,94,0.12)",
            border: "1px solid rgba(34,197,94,0.25)",
          }}
        >
          <CheckCircle2 size={44} className="text-emerald-400" />
        </div>
        <div
          className="absolute -top-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: "#3b82f6" }}
        >
          <Sparkles size={12} className="text-white" />
        </div>
      </div>

      <h2
        className={`text-[22px] font-black mb-2 ${dark ? "text-white" : "text-slate-900"}`}
        style={{ letterSpacing: "-0.04em" }}
      >
        {count === 1 ? "Photo Uploaded!" : `${count} Photos Uploaded!`}
      </h2>
      <p
        className={`text-[12px] mb-3 max-w-[240px] leading-relaxed ${dark ? "text-slate-400" : "text-slate-500"}`}
      >
        Your photos have been submitted to Google Business Profile. They'll
        appear on your listing within a few minutes.
      </p>
      <p
        className={`text-[11px] mb-8 flex items-center gap-1.5 px-3 py-1.5 rounded-full border
          ${dark ? "bg-amber-500/[0.08] border-amber-500/20 text-amber-400" : "bg-amber-50 border-amber-200 text-amber-600"}`}
      >
        <Clock size={10} /> Google review may take up to 24 hours
      </p>

      <div className="flex gap-3 w-full max-w-xs">
        <button
          onClick={onMore}
          className={`flex-1 py-3 rounded-2xl text-[13px] font-bold border transition-all active:scale-[0.97]
            ${dark ? "bg-white/[0.04] border-white/[0.08] text-slate-300" : "bg-white border-blue-100 text-slate-700"}`}
        >
          Add More
        </button>
        <button
          onClick={onDone}
          className="flex-1 py-3 rounded-2xl text-[13px] font-black text-white flex items-center justify-center gap-1.5 transition-all active:scale-[0.97]"
          style={{
            background: "linear-gradient(135deg,#1e40af,#3b82f6)",
            boxShadow: "0 8px 24px rgba(59,130,246,0.35)",
          }}
        >
          View All <ArrowUpRight size={13} />
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════ */
export default function CreatePhotoPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";

  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [defaultCat, setDefaultCat] = useState<MediaCategory>("EXTERIOR");
  const [showDefaultPicker, setShowDefaultPicker] = useState(false);

  // Get user locationId and accountId (mirrors mobile's user.googleLocationId / user.googleId)
  const { data: user } = useUser();
  const locationId = user?.googleLocationId ?? "";
  const accountId = user?.googleId ?? "";

  /* ── add files ── */
  function addFiles(files: File[]) {
    const newEntries: FileEntry[] = [];
    for (const f of files) {
      const err = validateFile(f);
      if (err) continue; // skip invalid files silently (or you can show a toast)
      newEntries.push({
        id: Math.random().toString(36).slice(2),
        file: f,
        preview: URL.createObjectURL(f),
        category: defaultCat,
        status: "idle",
        progress: 0,
      });
    }
    setEntries((prev) => [...prev, ...newEntries]);
  }

  /* ── drag & drop ── */
  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  }

  /* ── remove ── */
  function removeEntry(id: string) {
    setEntries((prev) => {
      const e = prev.find((x) => x.id === id);
      if (e) URL.revokeObjectURL(e.preview);
      return prev.filter((x) => x.id !== id);
    });
  }

  /* ── update category ── */
  function setCat(id: string, cat: MediaCategory) {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, category: cat } : e)),
    );
  }

  /* ── upload all — mirrors mobile handleUpload ── */
  async function handleUpload() {
    const pending = entries.filter(
      (e) => e.status === "idle" || e.status === "error",
    );
    if (!pending.length) return;

    if (!locationId || !accountId) {
      alert("Google Business Profile not connected.");
      return;
    }

    setUploading(true);
    let successN = 0;

    // Sequential upload (same as mobile's for loop)
    for (const entry of pending) {
      setEntries((prev) =>
        prev.map((e) =>
          e.id === entry.id ? { ...e, status: "uploading", progress: 0 } : e,
        ),
      );
      try {
        await uploadMedia(
          entry.file,
          entry.category,
          locationId,
          accountId,
          (p) => {
            setEntries((prev) =>
              prev.map((e) => (e.id === entry.id ? { ...e, progress: p } : e)),
            );
          },
        );
        setEntries((prev) =>
          prev.map((e) =>
            e.id === entry.id ? { ...e, status: "success", progress: 100 } : e,
          ),
        );
        successN++;
      } catch (err: any) {
        setEntries((prev) =>
          prev.map((e) =>
            e.id === entry.id
              ? { ...e, status: "error", error: err.message ?? "Upload failed" }
              : e,
          ),
        );
      }
    }

    setUploading(false);
    setSuccessCount(successN);

    if (successN > 0) {
      // Invalidate cache so the photos list page refetches (same as mobile)
      queryClient.invalidateQueries({ queryKey: ["gbp-media"] });
      setTimeout(() => setDone(true), 600);
    }
  }

  const pendingCount = entries.filter(
    (e) => e.status === "idle" || e.status === "error",
  ).length;
  const successN = entries.filter((e) => e.status === "success").length;
  const allDone =
    entries.length > 0 && entries.every((e) => e.status === "success");
  const activeCat = CATS.find((c) => c.value === defaultCat)!;

  /* ── Success screen ── */
  if (done) {
    return (
      <div
        className={`min-h-screen transition-colors ${dark ? "bg-[#050d1a]" : "bg-[#eef4ff]"}`}
        style={{ fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}
      >
        <div
          className="fixed inset-0 pointer-events-none opacity-[0.015]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px,#3b82f6 1px,transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative max-w-lg mx-auto px-4">
          <SuccessScreen
            count={successCount}
            dark={dark}
            onDone={() => router.push("/photos")}
            onMore={() => {
              setEntries([]);
              setDone(false);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors ${dark ? "bg-[#050d1a]" : "bg-[#eef4ff]"}`}
      style={{ fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}
    >
      {/* Dot grid bg */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px,#3b82f6 1px,transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative max-w-2xl mx-auto px-5 pb-40 pt-6">
        {/* ── HEADER ── */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={() => router.back()}
              className={`w-9 h-9 rounded-2xl flex items-center justify-center border transition-all active:scale-90
                ${dark ? "bg-white/[0.04] border-white/[0.07] text-slate-300" : "bg-white border-blue-100 text-slate-600"}`}
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1
                className={`text-[20px] font-black leading-none ${dark ? "text-white" : "text-slate-900"}`}
                style={{ letterSpacing: "-0.04em" }}
              >
                Add Photos
              </h1>
              <p
                className={`text-[11px] mt-0.5 ${dark ? "text-slate-500" : "text-blue-500/80"}`}
              >
                Google Business Profile · Media API
              </p>
            </div>
          </div>

          {/* Default category selector */}
          <div
            className={`flex items-center justify-between px-4 py-3 rounded-2xl border
              ${dark ? "bg-[#0a1020] border-blue-900/30" : "bg-white border-blue-100 shadow-sm"}`}
          >
            <div>
              <p
                className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${dark ? "text-slate-600" : "text-slate-400"}`}
              >
                Default Category
              </p>
              <p
                className={`text-[11px] ${dark ? "text-slate-400" : "text-slate-500"}`}
              >
                Applied to all new photos
              </p>
            </div>
            <button
              onClick={() => setShowDefaultPicker(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all active:scale-95"
              style={{
                background: `${activeCat.color}12`,
                borderColor: `${activeCat.color}30`,
              }}
            >
              <span style={{ color: activeCat.color }}>{activeCat.icon}</span>
              <span
                className="text-[11px] font-bold"
                style={{ color: activeCat.color }}
              >
                {activeCat.label}
              </span>
              <ChevronDown size={10} style={{ color: activeCat.color }} />
            </button>
          </div>
        </div>

        {/* ── DROP ZONE ── */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-3 py-12 px-6 mb-5 cursor-pointer transition-all
            ${
              dragging
                ? dark
                  ? "border-blue-500 bg-blue-500/[0.08]"
                  : "border-blue-400 bg-blue-50"
                : dark
                  ? "border-blue-900/60 hover:border-blue-700/60 bg-[#0a1020]/60"
                  : "border-blue-200/80 hover:border-blue-300 bg-white/60"
            }`}
        >
          {dragging && (
            <div
              className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at 50% 50%, rgba(59,130,246,0.08), transparent 70%)",
              }}
            />
          )}

          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all
              ${dragging ? "bg-blue-500/15 scale-110" : dark ? "bg-blue-500/08" : "bg-blue-50"}`}
            style={{
              border: dragging
                ? "1px solid rgba(59,130,246,0.4)"
                : "1px solid rgba(59,130,246,0.15)",
            }}
          >
            {dragging ? (
              <FileImage size={28} style={{ color: "#3b82f6" }} />
            ) : (
              <Upload size={28} className="text-blue-400" />
            )}
          </div>

          <div className="text-center">
            <p
              className={`text-[14px] font-black mb-1 ${dark ? "text-white" : "text-slate-900"}`}
              style={{ letterSpacing: "-0.025em" }}
            >
              {dragging ? "Drop to add" : "Click to choose photos"}
            </p>
            <p
              className={`text-[11px] ${dark ? "text-slate-500" : "text-slate-400"}`}
            >
              or drag & drop · JPG, PNG, WebP, MP4 · Max 75MB
            </p>
          </div>

          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border"
            style={{
              background: "rgba(37,99,235,0.1)",
              borderColor: "rgba(59,130,246,0.2)",
            }}
          >
            <Brain size={10} style={{ color: "#60a5fa" }} />
            <span className="text-[9.5px] font-bold text-blue-400">
              Change category per photo after selecting
            </span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) addFiles(Array.from(e.target.files));
              e.target.value = "";
            }}
          />
        </div>

        {/* ── FILE LIST ── */}
        {entries.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <p
                  className={`text-[13px] font-black ${dark ? "text-white" : "text-slate-900"}`}
                  style={{ letterSpacing: "-0.025em" }}
                >
                  {entries.length} {entries.length === 1 ? "Photo" : "Photos"}{" "}
                  Selected
                </p>
                {successN > 0 && (
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                    <Check size={9} /> {successN} uploaded
                  </span>
                )}
              </div>
              {pendingCount > 0 && !uploading && (
                <button
                  onClick={() => setEntries([])}
                  className={`text-[10px] font-bold ${dark ? "text-slate-600" : "text-slate-400"}`}
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2.5">
              {entries.map((entry) => (
                <FileCard
                  key={entry.id}
                  entry={entry}
                  dark={dark}
                  onRemove={() => removeEntry(entry.id)}
                  onCategoryChange={(cat) => setCat(entry.id, cat)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── TIPS (shown when no files selected) ── */}
        {entries.length === 0 && <TipsCard dark={dark} category={defaultCat} />}

        {/* ── CATEGORY GUIDE (shown when no files selected) ── */}
        {entries.length === 0 && (
          <div className="mt-4">
            <p
              className={`text-[10px] font-black uppercase tracking-widest mb-3 ${dark ? "text-slate-600" : "text-slate-400"}`}
            >
              Photo Categories
            </p>
            <div className="flex flex-col gap-2">
              {CATS.filter((c) => c.value !== "ADDITIONAL").map((c) => (
                <div
                  key={c.value}
                  className={`flex items-start gap-3 px-4 py-3 rounded-2xl border
                    ${dark ? "bg-[#0a1020] border-blue-900/30" : "bg-white border-blue-100/80"}`}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${c.color}15`, color: c.color }}
                  >
                    {c.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span
                        className={`text-[12px] font-bold ${dark ? "text-white" : "text-slate-900"}`}
                      >
                        {c.label}
                      </span>
                      <span
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded-md"
                        style={{ background: `${c.color}15`, color: c.color }}
                      >
                        {c.minDim}
                      </span>
                    </div>
                    <p
                      className={`text-[10.5px] ${dark ? "text-slate-500" : "text-slate-400"}`}
                    >
                      {c.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <p
              className={`text-[10px] text-center mt-6 font-bold uppercase tracking-widest ${dark ? "text-slate-700" : "text-slate-400"}`}
            >
              Recommended Formats: JPG, PNG, WebP, MP4
            </p>
          </div>
        )}
      </div>

      {/* ── UPLOAD BUTTON (sticky bottom) ── */}
      {entries.length > 0 && pendingCount > 0 && (
        <div className="fixed bottom-26 left-0 right-0 px-5 z-50 max-w-2xl mx-auto">
          <div
            className={`rounded-3xl border${dark ? "bg-[#0a1020]/90 border-blue-900/50" : "bg-white/90 border-blue-100"}`}
            style={{
              backdropFilter: "blur(20px)",
              boxShadow: "0 -8px 40px rgba(0,0,0,0.15)",
            }}
          >
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full py-4 rounded-2xl text-[14px] font-black text-white flex items-center justify-center gap-2.5 transition-all active:scale-[0.97]"
              style={{
                background: uploading
                  ? "rgba(37,99,235,0.5)"
                  : "linear-gradient(135deg,#1e40af,#2563eb,#3b82f6)",
                boxShadow: uploading
                  ? "none"
                  : "0 8px 28px rgba(59,130,246,0.42)",
              }}
            >
              {uploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Uploading{" "}
                  {successN > 0 ? `${successN}/${entries.length}` : "…"}
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Upload {pendingCount}{" "}
                  {pendingCount === 1 ? "Photo" : "Photos"} to Google
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── ALL SUCCESS FLOATING ── */}
      {allDone && !done && (
        <div className="fixed bottom-6 left-0 right-0 px-5 z-50 max-w-2xl mx-auto">
          <div
            className={`rounded-3xl border p-3 ${dark ? "bg-[#0a1020]/90 border-emerald-900/40" : "bg-white/90 border-emerald-100"}`}
            style={{ backdropFilter: "blur(20px)" }}
          >
            <button
              onClick={() => setDone(true)}
              className="w-full py-4 rounded-2xl text-[14px] font-black text-white flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
              style={{ background: "linear-gradient(135deg,#065f46,#10b981)" }}
            >
              <CheckCircle2 size={16} /> All uploaded — View Gallery{" "}
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Default category picker */}
      {showDefaultPicker && (
        <CategoryPicker
          dark={dark}
          value={defaultCat}
          onChange={(v) => setDefaultCat(v)}
          onClose={() => setShowDefaultPicker(false)}
        />
      )}
    </div>
  );
}

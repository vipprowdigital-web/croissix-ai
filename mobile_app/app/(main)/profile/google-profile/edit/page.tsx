// mobile_app\app\(main)\profile\google-profile\edit\page.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useUser } from "@/features/user/hook/useUser";
import {
  ArrowLeft, Plus, X, Building2, Phone, Globe, MapPin,
  Clock, Info, Users, Settings, Trash2, Star, Car, Save,
  CheckCircle2, ExternalLink, Tag, RefreshCw, ChevronRight,
  AlertTriangle, Wifi, Hash, Navigation, Layers, Zap, Copy,
  Link2, MessageSquare, FileText, BarChart2,
} from "lucide-react";
import { getToken } from "@/lib/token";

/* ═══════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════ */
type Tab = "about" | "contact" | "location" | "hours" | "more" | "advanced";

interface TimePeriod {
  openDay: string; openTime: string; closeDay: string; closeTime: string;
}
interface SpecialHourPeriod {
  startDate: { year: number; month: number; day: number };
  endDate: { year: number; month: number; day: number };
  openTime?: string; closeTime?: string; closed?: boolean;
}
interface ServiceAreaPlace { placeId: string; name: string; }
interface ServiceItem {
  freeFormServiceItem?: { category: string; label: { displayName: string; description?: string } };
  structuredServiceItem?: { serviceTypeId: string; description?: string };
}
interface LocationDraft {
  title: string; storeCode: string; languageCode: string;
  categories: {
    primaryCategory: { displayName: string; name: string };
    additionalCategories: { displayName: string; name: string }[];
  };
  profile: { description: string };
  phoneNumbers: { primaryPhone: string; additionalPhones: string[] };
  websiteUri: string;
  storefrontAddress: {
    regionCode: string; languageCode: string; postalCode: string;
    administrativeArea: string; locality: string; addressLines: string[];
  };
  latlng: { latitude: number; longitude: number };
  regularHours: { periods: TimePeriod[] };
  specialHours: { specialHourPeriods: SpecialHourPeriod[] };
  moreHours: { hoursTypeId: string; periods: TimePeriod[] }[];
  openInfo: { status: "OPEN" | "CLOSED_PERMANENTLY" | "CLOSED_TEMPORARILY"; openingDate?: { year: number; month: number; day: number } };
  serviceArea: { businessType: "CUSTOMER_LOCATION_ONLY" | "CUSTOMER_AND_BUSINESS_LOCATION"; places?: { placeInfos: ServiceAreaPlace[] } };
  serviceItems: ServiceItem[];
  adWordsLocationExtensions: { adPhone: string };
  labels: string[];
  relationshipData: { parentChain?: string };
}

const EMPTY_DRAFT: LocationDraft = {
  title: "", storeCode: "", languageCode: "en",
  categories: { primaryCategory: { displayName: "", name: "" }, additionalCategories: [] },
  profile: { description: "" },
  phoneNumbers: { primaryPhone: "", additionalPhones: [] },
  websiteUri: "",
  storefrontAddress: { regionCode: "IN", languageCode: "en", postalCode: "", administrativeArea: "", locality: "", addressLines: [""] },
  latlng: { latitude: 0, longitude: 0 },
  regularHours: { periods: [] },
  specialHours: { specialHourPeriods: [] },
  moreHours: [],
  openInfo: { status: "OPEN" },
  serviceArea: { businessType: "CUSTOMER_AND_BUSINESS_LOCATION", places: { placeInfos: [] } },
  serviceItems: [],
  adWordsLocationExtensions: { adPhone: "" },
  labels: [],
  relationshipData: {},
};

/* ═══════════════════════════════════════════════
   API HELPERS
═══════════════════════════════════════════════ */

/** Strip "categories/" prefix Google returns: "categories/gcid:foo" → "gcid:foo" */
function stripCatPrefix(name: string) {
  return name?.replace(/^categories\//, "") ?? "";
}

/** Map raw Google API response → LocationDraft */
function mapApiToDraft(d: any, prev: LocationDraft): LocationDraft {
  return {
    title:        d.title        || prev.title,
    storeCode:    d.storeCode    || prev.storeCode,
    languageCode: d.languageCode || prev.languageCode,
    profile:      { description: d.profile?.description || "" },
    phoneNumbers: {
      primaryPhone:     d.phoneNumbers?.primaryPhone     || "",
      additionalPhones: d.phoneNumbers?.additionalPhones || [],
    },
    websiteUri: d.websiteUri || prev.websiteUri,
    storefrontAddress: d.storefrontAddress
      ? {
          regionCode:         d.storefrontAddress.regionCode         || "IN",
          languageCode:       d.storefrontAddress.languageCode       || "en",
          postalCode:         d.storefrontAddress.postalCode         || "",
          administrativeArea: d.storefrontAddress.administrativeArea || "",
          locality:           d.storefrontAddress.locality           || "",
          addressLines:       d.storefrontAddress.addressLines?.length
            ? d.storefrontAddress.addressLines
            : [""],
        }
      : prev.storefrontAddress,
    latlng:   d.latlng   || prev.latlng,
    openInfo: d.openInfo ? { status: d.openInfo.status || "OPEN" } : prev.openInfo,
    regularHours: d.regularHours || { periods: [] },
    specialHours: d.specialHours || { specialHourPeriods: [] },
    moreHours:    d.moreHours    || [],
    serviceArea: d.serviceArea
      ? {
          businessType: d.serviceArea.businessType || "CUSTOMER_AND_BUSINESS_LOCATION",
          places: d.serviceArea.places || { placeInfos: [] },
        }
      : prev.serviceArea,
    serviceItems:              d.serviceItems              || [],
    adWordsLocationExtensions: d.adWordsLocationExtensions || { adPhone: "" },
    labels:           d.labels           || [],
    relationshipData: d.relationshipData || {},
    categories: d.categories
      ? {
          primaryCategory: {
            name:        stripCatPrefix(d.categories.primaryCategory?.name || ""),
            displayName: d.categories.primaryCategory?.displayName || "",
          },
          additionalCategories: (d.categories.additionalCategories || []).map((c: any) => ({
            name:        stripCatPrefix(c.name || ""),
            displayName: c.displayName || "",
          })),
        }
      : prev.categories,
  };
}

async function patchLocation(locationId: string, payload: any, fields: string[]) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  // Strip empty openingDate
  const filteredFields = fields.filter(f => {
    if (f === "openInfo.openingDate" && !payload?.openInfo?.openingDate) return false;
    if (f === "profile.description"  && !payload?.profile?.description)  return false;
    return true;
  });

  // Sanitize categories — Google only wants { name } not displayName
  if (payload.categories) {
    payload.categories = {
      primaryCategory: { name: payload.categories.primaryCategory?.name },
      additionalCategories: (payload.categories.additionalCategories || []).map((c: any) => ({
        name: c.name,
      })),
    };
  }

  const res = await fetch("/api/google/locations/update", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ locationId, payload, fields: filteredFields }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Save failed");
  return data;
}

/* ═══════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════ */
const DAYS = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"];
const DSHRT: Record<string,string> = { MONDAY:"Mon",TUESDAY:"Tue",WEDNESDAY:"Wed",THURSDAY:"Thu",FRIDAY:"Fri",SATURDAY:"Sat",SUNDAY:"Sun" };
const MORE_HOURS_TYPES = [
  { id:"DRIVE_THROUGH",l:"Drive-through"},{id:"HAPPY_HOUR",l:"Happy hour"},
  {id:"DELIVERY",l:"Delivery"},{id:"TAKEOUT",l:"Takeout"},{id:"KITCHEN",l:"Kitchen"},
  {id:"BREAKFAST",l:"Breakfast"},{id:"LUNCH",l:"Lunch"},{id:"DINNER",l:"Dinner"},
  {id:"BRUNCH",l:"Brunch"},{id:"PICKUP",l:"Pickup"},{id:"SENIOR_HOURS",l:"Senior hours"},
];

/* ═══════════════════════════════════════════════
   DESIGN TOKENS
═══════════════════════════════════════════════ */
const fade = {
  hidden: { opacity: 0, y: 7 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.22,1,0.36,1] as any } },
};
const stag = { hidden: {}, show: { transition: { staggerChildren: 0.045 } } };

function tok(dark: boolean) {
  return {
    card: {
      borderRadius: 20, overflow: "hidden" as const,
      border: `1.5px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(203,213,225,0.5)"}`,
      background: dark ? "#0f1a2e" : "#fff",
      boxShadow: dark ? "none" : "0 1px 6px rgba(0,0,0,0.04)",
      marginBottom: 12,
    },
    ch: {
      padding: "11px 15px",
      borderBottom: `1px solid ${dark ? "rgba(255,255,255,0.05)" : "rgba(203,213,225,0.35)"}`,
      display: "flex" as const, alignItems: "center" as const, gap: 8,
    },
    cb: { padding: "13px 15px" },
    lbl: {
      fontSize: 10.5, fontWeight: 800, textTransform: "uppercase" as const,
      letterSpacing: "0.08em", color: dark ? "#334155" : "#94a3b8",
      marginBottom: 5, display: "block" as const,
    },
    inp: {
      width: "100%", padding: "10px 13px", borderRadius: 12,
      fontSize: 13, fontWeight: 500,
      border: `1.5px solid ${dark ? "rgba(255,255,255,0.07)" : "rgba(203,213,225,0.65)"}`,
      background: dark ? "rgba(255,255,255,0.04)" : "#fff",
      color: dark ? "#e2e8f0" : "#1e293b", outline: "none",
      fontFamily: "-apple-system,'SF Pro Text',sans-serif",
      boxSizing: "border-box" as const, transition: "border-color 0.18s",
    },
    muted: { color: dark ? "#334155" : "#94a3b8", fontSize: 10.5, fontWeight: 500 },
    div:   { borderTop: `1px solid ${dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)"}` },
    bdg: (c: string) => ({
      fontSize: 9.5, fontWeight: 800, padding: "2px 8px", borderRadius: 99,
      background: `${c}20`, color: c, border: `1px solid ${c}35`,
    }),
  };
}

/* ═══════════════════════════════════════════════
   SHARED COMPONENTS
═══════════════════════════════════════════════ */
function Card({ title, icon, badge, children, dark }: { title:string; icon:React.ReactNode; badge?:string; children:React.ReactNode; dark:boolean }) {
  const s = tok(dark);
  return (
    <motion.div variants={fade} style={s.card}>
      <div style={s.ch}>
        <span style={{ color:"#3b82f6", display:"flex", alignItems:"center" }}>{icon}</span>
        <span style={{ fontSize:12, fontWeight:800, color:dark?"#e2e8f0":"#1e293b", flex:1, letterSpacing:"-0.01em" }}>{title}</span>
        {badge && <span style={s.bdg("#22c55e")}>{badge}</span>}
      </div>
      <div style={s.cb}>{children}</div>
    </motion.div>
  );
}

function FW({ label, required, hint, children, dark }: { label:string; required?:boolean; hint?:string; children:React.ReactNode; dark:boolean }) {
  const s = tok(dark);
  return (
    <div style={{ marginBottom:13 }}>
      <div style={{ display:"flex", alignItems:"center", gap:3, marginBottom:5 }}>
        <span style={s.lbl}>{label}</span>
        {required && <span style={{ color:"#3b82f6", fontSize:11 }}>*</span>}
      </div>
      {children}
      {hint && <p style={{ ...s.muted, marginTop:4 }}>{hint}</p>}
    </div>
  );
}

function TI({ value, onChange, placeholder, type="text", dark, prefix, suffix, readOnly }: {
  value:string; onChange?:(v:string)=>void; placeholder?:string; type?:string;
  dark:boolean; prefix?:string; suffix?:string; readOnly?:boolean;
}) {
  const s = tok(dark);
  const [f, setF] = useState(false);
  return (
    <div style={{ position:"relative" }}>
      {prefix && (
        <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", fontSize:12, color:dark?"#475569":"#94a3b8", fontWeight:600, pointerEvents:"none" }}>
          {prefix}
        </span>
      )}
      <input
        value={value} onChange={e=>onChange?.(e.target.value)} placeholder={placeholder}
        type={type} readOnly={readOnly}
        style={{ ...s.inp, borderColor:f?"#3b82f6":dark?"rgba(255,255,255,0.07)":"rgba(203,213,225,0.65)", paddingLeft:prefix?13+prefix.length*7.5:13, paddingRight:suffix?44:13 }}
        onFocus={()=>setF(true)} onBlur={()=>setF(false)}
      />
      {suffix && (
        <span style={{ position:"absolute", right:11, top:"50%", transform:"translateY(-50%)", fontSize:10, fontWeight:800, padding:"2px 7px", borderRadius:7, background:dark?"rgba(59,130,246,0.15)":"rgba(219,234,254,0.8)", color:"#3b82f6" }}>
          {suffix}
        </span>
      )}
    </div>
  );
}

function TA({ value, onChange, placeholder, rows=4, dark, maxLen }: {
  value:string; onChange:(v:string)=>void; placeholder?:string; rows?:number; dark:boolean; maxLen?:number;
}) {
  const s = tok(dark);
  const [f, setF] = useState(false);
  return (
    <>
      <textarea
        value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}
        style={{ ...s.inp, resize:"none", lineHeight:1.65, padding:"11px 13px", borderColor:f?"#3b82f6":dark?"rgba(255,255,255,0.07)":"rgba(203,213,225,0.65)" }}
        onFocus={()=>setF(true)} onBlur={()=>setF(false)}
      />
      {maxLen && (
        <p style={{ fontSize:10, marginTop:3, fontWeight:600, textAlign:"right", color:value.length>maxLen?"#ef4444":dark?"#334155":"#94a3b8" }}>
          {value.length}/{maxLen}
        </p>
      )}
    </>
  );
}

function Tog({ value, onChange, dark }: { value:boolean; onChange:(v:boolean)=>void; dark:boolean }) {
  return (
    <motion.div onClick={()=>onChange(!value)} style={{ width:36, height:20, borderRadius:99, cursor:"pointer", position:"relative", flexShrink:0, background:value?"#3b82f6":dark?"rgba(255,255,255,0.09)":"rgba(0,0,0,0.09)" }}>
      <motion.div animate={{ x:value?17:2 }} transition={{ type:"spring", stiffness:420, damping:32 }} style={{ position:"absolute", top:2, width:16, height:16, borderRadius:"50%", background:"#fff", boxShadow:"0 1px 3px rgba(0,0,0,0.25)" }} />
    </motion.div>
  );
}

function TR({ label, sub, value, onChange, dark }: { label:string; sub?:string; value:boolean; onChange:(v:boolean)=>void; dark:boolean }) {
  const s = tok(dark);
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, padding:"9px 0", borderBottom:s.div.borderTop }}>
      <div style={{ flex:1 }}>
        <p style={{ fontSize:12.5, fontWeight:600, color:dark?"#cbd5e1":"#334155", margin:0 }}>{label}</p>
        {sub && <p style={{ ...s.muted, margin:"1px 0 0" }}>{sub}</p>}
      </div>
      <Tog value={value} onChange={onChange} dark={dark} />
    </div>
  );
}

function Chip({ label, onRemove, dark }: { label:string; onRemove:()=>void; dark:boolean }) {
  return (
    <motion.div initial={{ scale:0.85, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.85, opacity:0 }} transition={{ duration:0.15 }}
      style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 9px 4px 11px", borderRadius:99, fontSize:11.5, fontWeight:700, background:dark?"rgba(59,130,246,0.1)":"rgba(219,234,254,0.7)", border:`1.5px solid ${dark?"rgba(59,130,246,0.18)":"rgba(147,197,253,0.55)"}`, color:dark?"#93c5fd":"#1d4ed8" }}>
      {label}
      <button onClick={onRemove} style={{ display:"flex", alignItems:"center", justifyContent:"center", width:15, height:15, borderRadius:"50%", border:"none", cursor:"pointer", padding:0, background:dark?"rgba(59,130,246,0.22)":"rgba(147,197,253,0.45)", color:dark?"#93c5fd":"#1d4ed8" }}>
        <X size={8} strokeWidth={3} />
      </button>
    </motion.div>
  );
}

function AddI({ placeholder, onAdd, dark }: { placeholder:string; onAdd:(v:string)=>void; dark:boolean }) {
  const [v, setV] = useState("");
  const s = tok(dark);
  return (
    <div style={{ display:"flex", gap:7, marginTop:8 }}>
      <input value={v} onChange={e=>setV(e.target.value)} placeholder={placeholder}
        onKeyDown={e=>{ if(e.key==="Enter"&&v.trim()){ onAdd(v.trim()); setV(""); } }}
        style={{ ...s.inp, flex:1, padding:"9px 12px" }} />
      <motion.button whileTap={{ scale:0.93 }} onClick={()=>{ if(v.trim()){ onAdd(v.trim()); setV(""); } }}
        style={{ padding:"9px 13px", borderRadius:11, border:"none", cursor:"pointer", background:"#3b82f6", color:"#fff", display:"flex", alignItems:"center" }}>
        <Plus size={13} />
      </motion.button>
    </div>
  );
}

function SavePill({ status, dark }: { status:"idle"|"saving"|"saved"|"error"; dark:boolean }) {
  if (status==="idle") return null;
  const m = { saving:{l:"Saving…",c:"#f59e0b"}, saved:{l:"Saved ✓",c:"#22c55e"}, error:{l:"Failed",c:"#ef4444"}, idle:{l:"",c:""} }[status];
  return (
    <motion.div initial={{ opacity:0, scale:0.88 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.88 }} transition={{ duration:0.2 }}
      style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px", borderRadius:99, background:`${m.c}18`, border:`1px solid ${m.c}30`, color:m.c }}>
      {status==="saving"
        ? <motion.div animate={{ rotate:360 }} transition={{ duration:0.8, repeat:Infinity, ease:"linear" }}><RefreshCw size={11} /></motion.div>
        : status==="saved" ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
      <span style={{ fontSize:11, fontWeight:700 }}>{m.l}</span>
    </motion.div>
  );
}

/* ── Loading skeleton ── */
function Skeleton({ dark }: { dark: boolean }) {
  const bg = dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)";
  const shine = dark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.7)";
  return (
    <div style={{ paddingTop:8 }}>
      <style>{`@keyframes skshimmer{0%{background-position:-200px 0}100%{background-position:200px 0}}`}</style>
      {[120,80,100,70,90].map((w,i)=>(
        <div key={i} style={{ height:14, borderRadius:8, marginBottom:14, width:`${w}%`,
          background:`linear-gradient(90deg,${bg} 0%,${shine} 50%,${bg} 100%)`,
          backgroundSize:"400px 100%", animation:`skshimmer 1.4s ease infinite`, animationDelay:`${i*0.1}s` }} />
      ))}
      <div style={{ height:80, borderRadius:16, marginBottom:14, background:`linear-gradient(90deg,${bg} 0%,${shine} 50%,${bg} 100%)`, backgroundSize:"400px 100%", animation:`skshimmer 1.4s ease infinite` }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ABOUT TAB
═══════════════════════════════════════════════ */
function AboutTab({ draft, upd, dark }: { draft:LocationDraft; upd:(p:Partial<LocationDraft>,f:string[])=>void; dark:boolean }) {
  const [name,    setName]    = useState(draft.title);
  const [code,    setCode]    = useState(draft.storeCode);
  const [desc,    setDesc]    = useState(draft.profile.description);
  const [primary, setPrimary] = useState(draft.categories.primaryCategory.displayName);
  const [cats,    setCats]    = useState(draft.categories.additionalCategories.map(c=>c.displayName));
  const [status,  setStatus]  = useState(draft.openInfo.status);
  const [oDate,   setODate]   = useState("");

  // Sync when draft loads from API
  useEffect(()=>{ setName(draft.title); },                    [draft.title]);
  useEffect(()=>{ setCode(draft.storeCode); },                [draft.storeCode]);
  useEffect(()=>{ setDesc(draft.profile.description); },      [draft.profile.description]);
  useEffect(()=>{ setPrimary(draft.categories.primaryCategory.displayName); }, [draft.categories.primaryCategory.displayName]);
  useEffect(()=>{ setCats(draft.categories.additionalCategories.map(c=>c.displayName)); }, [draft.categories.additionalCategories]);
  useEffect(()=>{ setStatus(draft.openInfo.status); },        [draft.openInfo.status]);

  const commit = () => upd({
    title: name, storeCode: code,
    profile: { description: desc },
    categories: {
      primaryCategory: { displayName: primary, name: draft.categories.primaryCategory.name },
      additionalCategories: cats.map((c,i) => ({
        displayName: c,
        name: draft.categories.additionalCategories[i]?.name || "",
      })),
    },
    openInfo: {
      status,
      ...(oDate ? { openingDate: { year:+oDate.split("-")[0], month:+oDate.split("-")[1], day:+oDate.split("-")[2] } } : {}),
    },
  }, ["title","storeCode","profile.description","categories","openInfo.status","openInfo.openingDate"]);

  const ST = { OPEN:{l:"Open",c:"#22c55e"}, CLOSED_TEMPORARILY:{l:"Temporarily closed",c:"#f59e0b"}, CLOSED_PERMANENTLY:{l:"Permanently closed",c:"#ef4444"} };

  return (
    <motion.div variants={stag} initial="hidden" animate="show" onBlur={commit}>
      <Card title="Business Name" icon={<Building2 size={13}/>} dark={dark}>
        <FW label="Business Name" required dark={dark} hint="Use your real-world name — as customers know it.">
          <TI value={name} onChange={setName} dark={dark} />
          <p style={{ fontSize:10, marginTop:3, textAlign:"right", color:name.length>750?"#ef4444":dark?"#334155":"#94a3b8", fontWeight:600 }}>{name.length}/750</p>
        </FW>
        <FW label="Store Code" dark={dark} hint="Internal identifier. Not shown publicly.">
          <TI value={code} onChange={setCode} dark={dark} placeholder="e.g. STORE-JBP-001" prefix="# " />
        </FW>
      </Card>

      <Card title="Open Status" icon={<Zap size={13}/>} dark={dark}>
        <FW label="Current Status" required dark={dark} hint="Controls what customers see on Google Search & Maps.">
          {(["OPEN","CLOSED_TEMPORARILY","CLOSED_PERMANENTLY"] as const).map(s=>(
            <motion.button key={s} whileTap={{ scale:0.99 }} onClick={()=>setStatus(s)}
              style={{ display:"flex", alignItems:"center", gap:9, width:"100%", padding:"9px 12px", marginBottom:7, borderRadius:12, border:"2px solid", cursor:"pointer", textAlign:"left",
                borderColor:status===s?ST[s].c:dark?"rgba(255,255,255,0.06)":"rgba(203,213,225,0.5)",
                background:status===s?`${ST[s].c}12`:"transparent" }}>
              <div style={{ width:14, height:14, borderRadius:"50%", flexShrink:0, border:`2px solid ${status===s?ST[s].c:dark?"#334155":"#cbd5e1"}`, background:status===s?ST[s].c:"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
                {status===s && <div style={{ width:5, height:5, borderRadius:"50%", background:"#fff" }} />}
              </div>
              <span style={{ fontSize:12.5, fontWeight:700, color:status===s?ST[s].c:dark?"#94a3b8":"#64748b" }}>{ST[s].l}</span>
            </motion.button>
          ))}
        </FW>
        <FW label="Opening Date" dark={dark} hint="When your business opened or will open.">
          <TI value={oDate} onChange={setODate} type="date" dark={dark} />
        </FW>
      </Card>

      <Card title="Categories" icon={<Tag size={13}/>} dark={dark} badge="Affects ranking">
        <FW label="Primary Category" required dark={dark} hint="The single most important category.">
          <TI value={primary} onChange={setPrimary} dark={dark} placeholder="e.g. Advertising agency" />
          {draft.categories.primaryCategory.name && (
            <p style={{ fontSize:9.5, marginTop:3, fontFamily:"monospace", color:dark?"#334155":"#94a3b8", fontWeight:600 }}>
              gcid: {draft.categories.primaryCategory.name}
            </p>
          )}
        </FW>
        <FW label="Additional Categories" dark={dark} hint="Up to 9 more.">
          <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginBottom:2 }}>
            <AnimatePresence>
              {cats.map((c,i)=>(
                <Chip key={c+i} label={c} dark={dark} onRemove={()=>setCats(cs=>cs.filter((_,j)=>j!==i))} />
              ))}
            </AnimatePresence>
          </div>
          <AddI placeholder="Add category…" dark={dark} onAdd={c=>setCats(cs=>[...cs,c])} />
        </FW>
      </Card>

      <Card title="Business Description" icon={<Info size={13}/>} dark={dark}>
        <FW label="Description" dark={dark} hint="Appears on your Google profile. Max 750 characters.">
          <TA value={desc} onChange={setDesc} rows={5} dark={dark} maxLen={750} placeholder="Tell customers about your business…" />
        </FW>
      </Card>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   CONTACT TAB
═══════════════════════════════════════════════ */
function ContactTab({ draft, upd, dark }: { draft:LocationDraft; upd:(p:Partial<LocationDraft>,f:string[])=>void; dark:boolean }) {
  const [primary, setPrimary] = useState(draft.phoneNumbers.primaryPhone);
  const [extra,   setExtra]   = useState(draft.phoneNumbers.additionalPhones);
  const [website, setWebsite] = useState(draft.websiteUri);
  const [adPhone, setAdPhone] = useState(draft.adWordsLocationExtensions.adPhone);

  useEffect(()=>{ setPrimary(draft.phoneNumbers.primaryPhone); },       [draft.phoneNumbers.primaryPhone]);
  useEffect(()=>{ setExtra(draft.phoneNumbers.additionalPhones); },     [draft.phoneNumbers.additionalPhones]);
  useEffect(()=>{ setWebsite(draft.websiteUri); },                      [draft.websiteUri]);
  useEffect(()=>{ setAdPhone(draft.adWordsLocationExtensions.adPhone); },[draft.adWordsLocationExtensions.adPhone]);

  const commit = () => upd(
    { phoneNumbers:{ primaryPhone:primary, additionalPhones:extra }, websiteUri:website, adWordsLocationExtensions:{ adPhone } },
    ["phoneNumbers","websiteUri","adWordsLocationExtensions"]
  );

  return (
    <motion.div variants={stag} initial="hidden" animate="show" onBlur={commit}>
      <Card title="Phone Numbers" icon={<Phone size={13}/>} dark={dark}>
        <FW label="Primary Phone" required dark={dark} hint="International format: +91 XXXXX XXXXX.">
          <TI value={primary} onChange={setPrimary} dark={dark} placeholder="+91 00000 00000" type="tel" />
        </FW>
        <FW label="Additional Phones" dark={dark} hint="Up to 2 extra numbers.">
          <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
            {extra.map((p,i)=>(
              <div key={i} style={{ display:"flex", gap:7 }}>
                <TI value={p} onChange={v=>setExtra(a=>a.map((x,j)=>j===i?v:x))} dark={dark} placeholder="+91 00000 00000" type="tel" />
                <motion.button whileTap={{ scale:0.92 }} onClick={()=>setExtra(a=>a.filter((_,j)=>j!==i))}
                  style={{ padding:"0 11px", borderRadius:11, border:"none", cursor:"pointer", background:dark?"rgba(239,68,68,0.1)":"rgba(254,226,226,0.6)", color:"#ef4444" }}>
                  <X size={13}/>
                </motion.button>
              </div>
            ))}
            {extra.length<2 && (
              <motion.button whileTap={{ scale:0.96 }} onClick={()=>setExtra(a=>[...a,""])}
                style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 13px", borderRadius:12, border:`1.5px dashed ${dark?"rgba(59,130,246,0.25)":"rgba(147,197,253,0.5)"}`, background:"transparent", cursor:"pointer", fontSize:12, fontWeight:700, color:"#3b82f6" }}>
                <Plus size={12}/> Add phone
              </motion.button>
            )}
          </div>
        </FW>
        <FW label="AdWords Call Extension Phone" dark={dark} hint="Shown in Google Ads.">
          <TI value={adPhone} onChange={setAdPhone} dark={dark} placeholder="+91 00000 00000" type="tel" />
        </FW>
      </Card>

      <Card title="Website" icon={<Globe size={13}/>} dark={dark}>
        <FW label="Website URL" required dark={dark} hint="Full URL with https://.">
          <TI value={website} onChange={setWebsite} dark={dark} placeholder="https://yourwebsite.com" />
          {website && (
            <a href={website} target="_blank" rel="noopener noreferrer"
              style={{ display:"inline-flex", alignItems:"center", gap:5, marginTop:6, fontSize:11.5, color:"#3b82f6", fontWeight:600, textDecoration:"none" }}>
              <ExternalLink size={10}/> Open website
            </a>
          )}
        </FW>
      </Card>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   LOCATION TAB
═══════════════════════════════════════════════ */
function LocationTab({ draft, upd, dark }: { draft:LocationDraft; upd:(p:Partial<LocationDraft>,f:string[])=>void; dark:boolean }) {
  const [addr,    setAddr]    = useState(draft.storefrontAddress);
  const [bizType, setBizType] = useState(draft.serviceArea.businessType);
  const [areas,   setAreas]   = useState(draft.serviceArea.places?.placeInfos ?? []);

  useEffect(()=>{ setAddr(draft.storefrontAddress); },               [draft.storefrontAddress]);
  useEffect(()=>{ setBizType(draft.serviceArea.businessType); },     [draft.serviceArea.businessType]);
  useEffect(()=>{ setAreas(draft.serviceArea.places?.placeInfos??[]); }, [draft.serviceArea.places]);

  const commit = () => upd(
    { storefrontAddress:addr, serviceArea:{ businessType:bizType, places:{ placeInfos:areas } } },
    ["storefrontAddress","serviceArea"]
  );
  const s = tok(dark);

  return (
    <motion.div variants={stag} initial="hidden" animate="show" onBlur={commit}>
      <Card title="Storefront Address" icon={<MapPin size={13}/>} dark={dark}>
        <FW label="Address Lines" required dark={dark} hint="Street address. Line 2 for suite/floor.">
          {addr.addressLines.map((l,i)=>(
            <div key={i} style={{ marginBottom:7 }}>
              <TI value={l} onChange={v=>setAddr(a=>({ ...a, addressLines:a.addressLines.map((x,j)=>j===i?v:x) }))}
                dark={dark} placeholder={i===0?"Street address":"Line 2 (optional)"} />
            </div>
          ))}
        </FW>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9 }}>
          <FW label="City" required dark={dark}><TI value={addr.locality} onChange={v=>setAddr(a=>({...a,locality:v}))} dark={dark} placeholder="City" /></FW>
          <FW label="PIN Code" required dark={dark}><TI value={addr.postalCode} onChange={v=>setAddr(a=>({...a,postalCode:v}))} dark={dark} placeholder="000000" /></FW>
        </div>
        <FW label="State" required dark={dark}><TI value={addr.administrativeArea} onChange={v=>setAddr(a=>({...a,administrativeArea:v}))} dark={dark} /></FW>
        <FW label="Country Code" required dark={dark} hint="ISO 3166-1 alpha-2 (e.g. IN, US, GB).">
          <TI value={addr.regionCode} onChange={v=>setAddr(a=>({...a,regionCode:v.toUpperCase()}))} dark={dark} placeholder="IN" />
        </FW>
      </Card>

      <Card title="GPS Coordinates" icon={<Navigation size={13}/>} dark={dark} badge="Read-only">
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9 }}>
          <FW label="Latitude" dark={dark}><TI value={draft.latlng.latitude.toString()} dark={dark} readOnly /></FW>
          <FW label="Longitude" dark={dark}><TI value={draft.latlng.longitude.toString()} dark={dark} readOnly /></FW>
        </div>
        <div style={{ borderRadius:12, height:70, background:dark?"rgba(59,130,246,0.04)":"rgba(59,130,246,0.03)", border:`1.5px solid ${dark?"rgba(59,130,246,0.1)":"rgba(147,197,253,0.25)"}`, display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginTop:6 }}>
          <MapPin size={14} style={{ color:"#3b82f6", opacity:0.4 }} />
          <span style={{ fontSize:11.5, color:dark?"#334155":"#94a3b8", fontWeight:600 }}>{addr.locality}, {addr.administrativeArea} · {addr.regionCode}</span>
        </div>
        <p style={{ ...s.muted, marginTop:5, fontSize:10 }}>Coordinates are managed by Google. Use Maps to reposition the pin.</p>
      </Card>

      <Card title="Service Area" icon={<Globe size={13}/>} dark={dark}>
        <FW label="Business Type" required dark={dark} hint="CUSTOMER_LOCATION_ONLY hides your storefront address.">
          {([{v:"CUSTOMER_AND_BUSINESS_LOCATION",l:"Physical storefront + service area"},{v:"CUSTOMER_LOCATION_ONLY",l:"Service-area only (no storefront)"}] as const).map(opt=>(
            <motion.button key={opt.v} whileTap={{ scale:0.99 }} onClick={()=>setBizType(opt.v)}
              style={{ display:"flex", alignItems:"center", gap:9, width:"100%", padding:"9px 12px", marginBottom:7, borderRadius:12, border:"2px solid", cursor:"pointer", textAlign:"left",
                borderColor:bizType===opt.v?"#3b82f6":dark?"rgba(255,255,255,0.06)":"rgba(203,213,225,0.5)",
                background:bizType===opt.v?dark?"rgba(37,99,235,0.08)":"rgba(219,234,254,0.35)":"transparent" }}>
              <div style={{ width:14, height:14, borderRadius:"50%", flexShrink:0, border:`2px solid ${bizType===opt.v?"#3b82f6":dark?"#334155":"#cbd5e1"}`, background:bizType===opt.v?"#3b82f6":"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
                {bizType===opt.v && <div style={{ width:5, height:5, borderRadius:"50%", background:"#fff" }} />}
              </div>
              <span style={{ fontSize:12, fontWeight:700, color:bizType===opt.v?"#3b82f6":dark?"#94a3b8":"#64748b" }}>{opt.l}</span>
            </motion.button>
          ))}
        </FW>
        <FW label="Service Area Places" dark={dark} hint="Cities or regions you serve.">
          <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
            {areas.map((a,i)=>(
              <div key={i} style={{ display:"flex", gap:7, alignItems:"center" }}>
                <div style={{ flex:1, padding:"9px 12px", borderRadius:11, fontSize:12, fontWeight:600, background:dark?"rgba(255,255,255,0.04)":"#f8fafc", border:`1.5px solid ${dark?"rgba(255,255,255,0.06)":"rgba(203,213,225,0.5)"}`, color:dark?"#94a3b8":"#64748b" }}>
                  {a.name}
                </div>
                <motion.button whileTap={{ scale:0.92 }} onClick={()=>setAreas(as=>as.filter((_,j)=>j!==i))}
                  style={{ padding:"0 11px", height:38, borderRadius:11, border:"none", cursor:"pointer", background:dark?"rgba(239,68,68,0.1)":"rgba(254,226,226,0.6)", color:"#ef4444" }}>
                  <X size={13}/>
                </motion.button>
              </div>
            ))}
            <AddI placeholder="Add city or region…" dark={dark} onAdd={v=>setAreas(as=>[...as,{placeId:"",name:v}])} />
          </div>
        </FW>
      </Card>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   HOURS TAB
═══════════════════════════════════════════════ */
function HoursTab({ draft, upd, dark }: { draft:LocationDraft; upd:(p:Partial<LocationDraft>,f:string[])=>void; dark:boolean }) {
  const buildMap = (periods: TimePeriod[]) => {
    const m: Record<string, TimePeriod|null> = {};
    DAYS.forEach(d => { m[d] = periods.find(p=>p.openDay===d) ?? null; });
    return m;
  };
  const [dayMap,  setDayMap]  = useState(()=>buildMap(draft.regularHours.periods));
  const [special, setSpecial] = useState(draft.specialHours.specialHourPeriods);
  const [more,    setMore]    = useState(draft.moreHours);
  const [morePanel, setMorePanel] = useState(false);

  useEffect(()=>{ setDayMap(buildMap(draft.regularHours.periods)); }, [draft.regularHours]);
  useEffect(()=>{ setSpecial(draft.specialHours.specialHourPeriods); }, [draft.specialHours]);
  useEffect(()=>{ setMore(draft.moreHours); }, [draft.moreHours]);

  const commit = () => {
    const periods = Object.values(dayMap).filter(Boolean) as TimePeriod[];
    upd({ regularHours:{periods}, specialHours:{specialHourPeriods:special}, moreHours:more },
        ["regularHours","specialHours","moreHours"]);
  };
  const s = tok(dark);
  const tInp: React.CSSProperties = { padding:"8px 9px", borderRadius:10, fontSize:11.5, fontWeight:700, border:`1.5px solid ${dark?"rgba(255,255,255,0.07)":"rgba(203,213,225,0.6)"}`, background:dark?"rgba(255,255,255,0.05)":"#f8fafc", color:dark?"#e2e8f0":"#1e293b", outline:"none", width:82, fontFamily:"-apple-system,sans-serif" };

  return (
    <motion.div variants={stag} initial="hidden" animate="show" onBlur={commit}>
      <Card title="Regular Hours" icon={<Clock size={13}/>} dark={dark}>
        {DAYS.map((day,idx)=>{
          const p = dayMap[day]; const open = p!==null;
          return (
            <div key={day} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:idx<6?s.div.borderTop:"none" }}>
              <span style={{ width:74, fontSize:12.5, fontWeight:700, flexShrink:0, color:dark?(open?"#e2e8f0":"#334155"):(open?"#1e293b":"#cbd5e1") }}>{DSHRT[day]}</span>
              <Tog value={open} onChange={v=>setDayMap(m=>({...m,[day]:v?{openDay:day,closeDay:day,openTime:"09:00",closeTime:"18:00"}:null}))} dark={dark} />
              <AnimatePresence mode="wait">
                {open ? (
                  <motion.div key="o" initial={{ opacity:0,x:5 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:-5 }} transition={{ duration:0.14 }}
                    style={{ display:"flex", alignItems:"center", gap:5, flex:1 }}>
                    <input type="time" value={p!.openTime} onChange={e=>setDayMap(m=>({...m,[day]:{...m[day]!,openTime:e.target.value}}))} style={tInp} />
                    <span style={{ fontSize:11, color:dark?"#334155":"#94a3b8", fontWeight:700 }}>–</span>
                    <input type="time" value={p!.closeTime} onChange={e=>setDayMap(m=>({...m,[day]:{...m[day]!,closeTime:e.target.value}}))} style={tInp} />
                  </motion.div>
                ) : (
                  <motion.span key="c" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.12 }}
                    style={{ fontSize:12, fontWeight:700, color:dark?"#334155":"#cbd5e1" }}>Closed</motion.span>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </Card>

      <Card title="More Hours" icon={<Clock size={13}/>} dark={dark} badge={`${more.length} types`}>
        <p style={{ ...s.muted, marginBottom:10 }}>Add separate hours for delivery, drive-through, etc.</p>
        {more.map((mh,i)=>(
          <div key={i} style={{ marginBottom:10, padding:"10px 12px", borderRadius:14, border:`1.5px solid ${dark?"rgba(255,255,255,0.06)":"rgba(203,213,225,0.4)"}` }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
              <span style={{ fontSize:12, fontWeight:800, color:dark?"#93c5fd":"#1d4ed8" }}>
                {MORE_HOURS_TYPES.find(t=>t.id===mh.hoursTypeId)?.l ?? mh.hoursTypeId}
              </span>
              <motion.button whileTap={{ scale:0.92 }} onClick={()=>setMore(m=>m.filter((_,j)=>j!==i))}
                style={{ width:24, height:24, borderRadius:8, border:"none", cursor:"pointer", background:dark?"rgba(239,68,68,0.1)":"rgba(254,226,226,0.6)", color:"#ef4444", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <X size={11}/>
              </motion.button>
            </div>
            {DAYS.map(day=>{ const p=mh.periods.find(p=>p.openDay===day); return (
              <div key={day} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5 }}>
                <span style={{ width:32, fontSize:11, fontWeight:700, color:dark?"#475569":"#94a3b8" }}>{DSHRT[day].slice(0,2)}</span>
                <Tog value={!!p} onChange={open=>setMore(m=>m.map((x,j)=>j!==i?x:{...x,periods:open?[...x.periods,{openDay:day,closeDay:day,openTime:"09:00",closeTime:"17:00"}]:x.periods.filter(p=>p.openDay!==day)}))} dark={dark} />
                {p && (
                  <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <input type="time" value={p.openTime} style={{ ...tInp,width:74 }} onChange={e=>setMore(m=>m.map((x,j)=>j!==i?x:{...x,periods:x.periods.map(pp=>pp.openDay===day?{...pp,openTime:e.target.value}:pp)}))} />
                    <span style={{ fontSize:10, color:dark?"#334155":"#94a3b8" }}>–</span>
                    <input type="time" value={p.closeTime} style={{ ...tInp,width:74 }} onChange={e=>setMore(m=>m.map((x,j)=>j!==i?x:{...x,periods:x.periods.map(pp=>pp.openDay===day?{...pp,closeTime:e.target.value}:pp)}))} />
                  </div>
                )}
              </div>
            ); })}
          </div>
        ))}
        <motion.button whileTap={{ scale:0.97 }} onClick={()=>setMorePanel(v=>!v)}
          style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 13px", width:"100%", borderRadius:12, border:`1.5px dashed ${dark?"rgba(59,130,246,0.25)":"rgba(147,197,253,0.5)"}`, background:"transparent", cursor:"pointer", fontSize:12, fontWeight:700, color:"#3b82f6", justifyContent:"center" }}>
          <Plus size={12}/> Add hours type
        </motion.button>
        <AnimatePresence>
          {morePanel && (
            <motion.div initial={{ opacity:0,y:4 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:4 }}
              style={{ marginTop:10, display:"flex", flexWrap:"wrap", gap:7 }}>
              {MORE_HOURS_TYPES.filter(t=>!more.find(m=>m.hoursTypeId===t.id)).map(t=>(
                <motion.button key={t.id} whileTap={{ scale:0.94 }} onClick={()=>{ setMore(m=>[...m,{hoursTypeId:t.id,periods:[]}]); setMorePanel(false); }}
                  style={{ padding:"6px 12px", borderRadius:10, border:`1.5px solid ${dark?"rgba(59,130,246,0.2)":"rgba(147,197,253,0.45)"}`, background:"transparent", cursor:"pointer", fontSize:11.5, fontWeight:700, color:"#3b82f6" }}>
                  {t.l}
                </motion.button>
              ))}
              <motion.button whileTap={{ scale:0.94 }} onClick={()=>setMorePanel(false)}
                style={{ padding:"6px 12px", borderRadius:10, border:"none", background:"transparent", cursor:"pointer", fontSize:11.5, fontWeight:700, color:dark?"#475569":"#94a3b8" }}>
                Cancel
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      <Card title="Special Hours" icon={<Star size={13}/>} dark={dark} badge={special.length?`${special.length} dates`:undefined}>
        <p style={{ ...s.muted, marginBottom:10 }}>Override hours for holidays or temporary closures.</p>
        {special.map((sp,i)=>(
          <div key={i} style={{ display:"flex", alignItems:"center", gap:9, marginBottom:8, padding:"9px 12px", borderRadius:13, border:`1.5px solid ${dark?"rgba(255,255,255,0.06)":"rgba(203,213,225,0.4)"}` }}>
            <p style={{ flex:1, fontSize:11.5, fontWeight:700, color:dark?"#e2e8f0":"#1e293b", margin:0 }}>
              {sp.startDate.day}/{sp.startDate.month}/{sp.startDate.year}
              {sp.closed?" · Closed":` · ${sp.openTime}–${sp.closeTime}`}
            </p>
            <motion.button whileTap={{ scale:0.92 }} onClick={()=>setSpecial(s=>s.filter((_,j)=>j!==i))}
              style={{ width:26, height:26, borderRadius:8, border:"none", cursor:"pointer", background:dark?"rgba(239,68,68,0.1)":"rgba(254,226,226,0.6)", color:"#ef4444", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <X size={11}/>
            </motion.button>
          </div>
        ))}
        <motion.button whileTap={{ scale:0.97 }}
          onClick={()=>setSpecial(s=>[...s,{ startDate:{year:new Date().getFullYear(),month:new Date().getMonth()+1,day:new Date().getDate()}, endDate:{year:new Date().getFullYear(),month:new Date().getMonth()+1,day:new Date().getDate()}, closed:true }])}
          style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 13px", width:"100%", borderRadius:12, border:`1.5px dashed ${dark?"rgba(59,130,246,0.25)":"rgba(147,197,253,0.5)"}`, background:"transparent", cursor:"pointer", fontSize:12, fontWeight:700, color:"#3b82f6", justifyContent:"center" }}>
          <Plus size={12}/> Add special date
        </motion.button>
      </Card>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   MORE (ATTRIBUTES) TAB
═══════════════════════════════════════════════ */
function MoreTab({ dark }: { dark:boolean }) {
  const [a, setA] = useState({
    wheelchair_accessible_entrance:false, wheelchair_accessible_seating:false,
    wheelchair_accessible_restroom:false, wheelchair_accessible_parking:false,
    assistive_hearing_loop:false, lgbtq_friendly:false, transgender_safe:false, women_led:false,
    accepts_cash:true, accepts_credit_cards:true, accepts_debit_cards:true, accepts_nfc_payment:false,
    has_online_care:false, appointment_required:true, online_appointments:true, onsite_services:true,
    parking_free_street:true, parking_free_lot:true, parking_paid_lot:false,
    parking_free_garage:false, parking_paid_garage:false, parking_valet:false,
    free_wifi:false, paid_wifi:false, no_wifi:false,
  });
  const t = (k:string) => setA(x=>({...x,[k]:!(x as any)[k]}));
  const SECS = [
    { title:"Accessibility", icon:<Users size={13}/>, rows:[{k:"wheelchair_accessible_entrance",l:"Wheelchair-accessible entrance"},{k:"wheelchair_accessible_seating",l:"Wheelchair-accessible seating"},{k:"wheelchair_accessible_restroom",l:"Wheelchair-accessible restroom"},{k:"wheelchair_accessible_parking",l:"Wheelchair-accessible parking"},{k:"assistive_hearing_loop",l:"Assistive hearing loop"}] },
    { title:"Inclusivity",   icon:<Star size={13}/>,  rows:[{k:"lgbtq_friendly",l:"LGBTQ+ friendly"},{k:"transgender_safe",l:"Transgender safe space"},{k:"women_led",l:"Women-led"}] },
    { title:"Payments",      icon:<Layers size={13}/>,rows:[{k:"accepts_cash",l:"Cash"},{k:"accepts_credit_cards",l:"Credit cards"},{k:"accepts_debit_cards",l:"Debit cards"},{k:"accepts_nfc_payment",l:"Contactless / UPI"}] },
    { title:"Service Options",icon:<Settings size={13}/>,rows:[{k:"onsite_services",l:"On-site services"},{k:"online_appointments",l:"Online appointments"},{k:"appointment_required",l:"Appointment required"},{k:"has_online_care",l:"Online care"}] },
    { title:"Parking",       icon:<Car size={13}/>,   rows:[{k:"parking_free_street",l:"Free street"},{k:"parking_free_lot",l:"Free lot"},{k:"parking_paid_lot",l:"Paid lot"},{k:"parking_free_garage",l:"Free garage"},{k:"parking_paid_garage",l:"Paid garage"},{k:"parking_valet",l:"Valet"}] },
    { title:"Wi-Fi",         icon:<Wifi size={13}/>,  rows:[{k:"free_wifi",l:"Free Wi-Fi"},{k:"paid_wifi",l:"Paid Wi-Fi"},{k:"no_wifi",l:"No Wi-Fi"}] },
  ];
  return (
    <motion.div variants={stag} initial="hidden" animate="show">
      {SECS.map(sec=>(
        <Card key={sec.title} title={sec.title} icon={sec.icon} dark={dark}>
          <div style={{ display:"flex", flexDirection:"column" }}>
            {sec.rows.map(r=><TR key={r.k} label={r.l} value={(a as any)[r.k]} onChange={()=>t(r.k)} dark={dark} />)}
          </div>
        </Card>
      ))}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   ADVANCED TAB
═══════════════════════════════════════════════ */
function AdvancedTab({ draft, upd, dark, locationId }: { draft:LocationDraft; upd:(p:Partial<LocationDraft>,f:string[])=>void; dark:boolean; locationId:string }) {
  const [svcs,   setSvcs]  = useState(draft.serviceItems);
  const [labels, setLbls]  = useState(draft.labels);
  const [chain,  setChain] = useState(draft.relationshipData.parentChain ?? "");
  const [lang,   setLang]  = useState(draft.languageCode);

  useEffect(()=>{ setSvcs(draft.serviceItems); },                              [draft.serviceItems]);
  useEffect(()=>{ setLbls(draft.labels); },                                    [draft.labels]);
  useEffect(()=>{ setLang(draft.languageCode); },                              [draft.languageCode]);
  useEffect(()=>{ setChain(draft.relationshipData.parentChain ?? ""); },        [draft.relationshipData]);

  const commit = () => upd(
    { serviceItems:svcs, labels, languageCode:lang, relationshipData:chain?{parentChain:chain}:{} },
    ["serviceItems","labels","languageCode","relationshipData"]
  );
  const s = tok(dark);

  return (
    <motion.div variants={stag} initial="hidden" animate="show" onBlur={commit}>
      <Card title="Service Items" icon={<FileText size={13}/>} dark={dark} badge="serviceItems">
        <p style={{ ...s.muted, marginBottom:10 }}>Services your business offers. Free-form and structured types.</p>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {svcs.map((svc,i)=>{
            const lbl = svc.freeFormServiceItem?.label.displayName ?? svc.structuredServiceItem?.serviceTypeId ?? "";
            const dsc = svc.freeFormServiceItem?.label.description ?? "";
            return (
              <div key={i} style={{ borderRadius:14, border:`1.5px solid ${dark?"rgba(255,255,255,0.06)":"rgba(203,213,225,0.4)"}`, padding:"10px 12px" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:dsc?4:0 }}>
                  <span style={{ fontSize:12.5, fontWeight:800, color:dark?"#e2e8f0":"#1e293b" }}>{lbl}</span>
                  <motion.button whileTap={{ scale:0.92 }} onClick={()=>setSvcs(s=>s.filter((_,j)=>j!==i))}
                    style={{ width:24, height:24, borderRadius:7, border:"none", cursor:"pointer", background:dark?"rgba(239,68,68,0.1)":"rgba(254,226,226,0.6)", color:"#ef4444", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <X size={10}/>
                  </motion.button>
                </div>
                {dsc && <p style={{ ...s.muted, margin:0 }}>{dsc}</p>}
                {svc.structuredServiceItem && (
                  <p style={{ fontSize:9, fontFamily:"monospace", color:dark?"#334155":"#94a3b8", margin:"2px 0 0", fontWeight:600 }}>{svc.structuredServiceItem.serviceTypeId}</p>
                )}
              </div>
            );
          })}
        </div>
        <AddI placeholder="Add service…" dark={dark} onAdd={v=>setSvcs(s=>[...s,{freeFormServiceItem:{category:"",label:{displayName:v}}}])} />
      </Card>

      <Card title="Internal Labels" icon={<Hash size={13}/>} dark={dark} badge="labels">
        <FW label="Labels" dark={dark} hint="Not shown to customers. For internal organization. Max 10.">
          <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginBottom:4 }}>
            <AnimatePresence>
              {labels.map((l,i)=><Chip key={l+i} label={l} dark={dark} onRemove={()=>setLbls(ls=>ls.filter((_,j)=>j!==i))} />)}
            </AnimatePresence>
          </div>
          <AddI placeholder="Add label…" dark={dark} onAdd={v=>setLbls(ls=>[...ls,v])} />
        </FW>
      </Card>

      <Card title="Chain Affiliation" icon={<Link2 size={13}/>} dark={dark} badge="relationshipData">
        <FW label="Parent Chain" dark={dark} hint="chains/{chainId} format.">
          <TI value={chain} onChange={setChain} dark={dark} placeholder="chains/{chainId}" />
        </FW>
      </Card>

      <Card title="Language" icon={<Globe size={13}/>} dark={dark}>
        <FW label="Language Code" required dark={dark} hint="BCP 47 tag (e.g. en, en-IN, hi).">
          <TI value={lang} onChange={setLang} dark={dark} placeholder="en" />
        </FW>
      </Card>

      <Card title="Profile Metadata" icon={<BarChart2 size={13}/>} dark={dark} badge="Read-only">
        {[
          { l:"Location Resource Name", v:`locations/${locationId}` },
          { l:"Maps URI",               v:`https://maps.google.com/?cid=${locationId}` },
          { l:"New Review URI",         v:`https://search.google.com/local/writereview?placeid=...` },
        ].map((row,i)=>(
          <div key={i} style={{ padding:"8px 0", borderBottom:i<2?s.div.borderTop:"none" }}>
            <p style={{ ...s.lbl, marginBottom:2 }}>{row.l}</p>
            <p style={{ fontSize:11, fontFamily:"monospace", fontWeight:600, margin:0, color:dark?"#60a5fa":"#2563eb", wordBreak:"break-all" }}>{row.v}</p>
          </div>
        ))}
      </Card>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   SETTINGS DRAWER
═══════════════════════════════════════════════ */
function SettingsDrawer({ dark, onClose, locationId, locationName }: { dark:boolean; onClose:()=>void; locationId:string; locationName:string }) {
  const s = tok(dark);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard?.writeText(locationId);
    setCopied(true);
    setTimeout(()=>setCopied(false), 1800);
  };

  const acts = [
    { icon:<Users size={14}/>,      t:"People & Access",   d:"Add or remove managers", c:"#3b82f6" },
    { icon:<Settings size={14}/>,   t:"Advanced Settings", d:"Profile ID, store codes", c:"#8b5cf6" },
    { icon:<Link2 size={14}/>,      t:"Linked Accounts",   d:"Google Ads, Merchant",   c:"#22c55e" },
    { icon:<MessageSquare size={14}/>,t:"Manage Reviews",  d:"Reply & flag reviews",   c:"#f59e0b" },
    { icon:<Trash2 size={14}/>,     t:"Remove Profile",    d:"Mark closed or delete",  c:"#ef4444", danger:true },
  ];

  return (
    <motion.div initial={{ y:"100%" }} animate={{ y:0 }} exit={{ y:"100%" }} transition={{ duration:0.3, ease:[0.22,1,0.36,1] as any }}
      style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:50, borderRadius:"22px 22px 0 0", overflow:"hidden", maxHeight:"88vh", overflowY:"auto", background:dark?"#0d1829":"#fff", boxShadow:"0 -16px 60px rgba(0,0,0,0.3)" }}>
      <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 6px" }}>
        <div style={{ width:34, height:4, borderRadius:99, background:dark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.1)" }} />
      </div>
      <div style={{ padding:"8px 18px 12px", borderBottom:`1px solid ${dark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.07)"}` }}>
        <h2 style={{ fontSize:15, fontWeight:900, letterSpacing:"-0.03em", color:dark?"#fff":"#0f172a", margin:0 }}>Profile Settings</h2>
        <p style={{ fontSize:11, color:dark?"#334155":"#94a3b8", margin:"3px 0 0", fontWeight:600 }}>{locationName}</p>
      </div>

      {/* Profile ID */}
      <div style={{ margin:"12px 18px 0", padding:"10px 13px", borderRadius:14, background:dark?"rgba(255,255,255,0.03)":"#f8fafc", border:`1px solid ${dark?"rgba(255,255,255,0.05)":"rgba(203,213,225,0.5)"}` }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <p style={{ ...s.lbl, marginBottom:2 }}>Business Profile ID</p>
            <p style={{ fontSize:12, fontFamily:"monospace", fontWeight:700, margin:0, color:dark?"#60a5fa":"#2563eb" }}>{locationId}</p>
          </div>
          <motion.button whileTap={{ scale:0.9 }} onClick={copy}
            style={{ width:30, height:30, borderRadius:9, border:"none", cursor:"pointer", background:dark?"rgba(59,130,246,0.1)":"rgba(219,234,254,0.6)", color:copied?"#22c55e":"#3b82f6", display:"flex", alignItems:"center", justifyContent:"center" }}>
            {copied ? <CheckCircle2 size={12}/> : <Copy size={12}/>}
          </motion.button>
        </div>
      </div>

      {/* Google Business link */}
      <div style={{ margin:"10px 18px 0" }}>
        <a href={`https://business.google.com/edit/l/${locationId}`} target="_blank" rel="noopener noreferrer"
          style={{ display:"flex", alignItems:"center", gap:7, padding:"10px 13px", borderRadius:13, background:dark?"rgba(66,133,244,0.08)":"rgba(219,234,254,0.4)", border:`1px solid ${dark?"rgba(66,133,244,0.15)":"rgba(147,197,253,0.4)"}`, textDecoration:"none" }}>
          <div style={{ width:28, height:28, borderRadius:8, background:"rgba(66,133,244,0.15)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Globe size={13} style={{ color:"#3b82f6" }} />
          </div>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:12, fontWeight:700, color:dark?"#93c5fd":"#2563eb", margin:0 }}>Open in Google Business</p>
            <p style={{ fontSize:10, color:dark?"#334155":"#94a3b8", margin:"1px 0 0", fontWeight:500 }}>business.google.com</p>
          </div>
          <ExternalLink size={12} style={{ color:dark?"#334155":"#94a3b8" }} />
        </a>
      </div>

      {/* Actions */}
      <div style={{ padding:"8px 0 4px" }}>
        {acts.map((a,i)=>(
          <motion.button key={i} whileTap={{ scale:0.99 }}
            style={{ width:"100%", display:"flex", alignItems:"center", gap:13, padding:"13px 18px", border:"none", background:"transparent", cursor:"pointer", textAlign:"left" }}>
            <div style={{ width:34, height:34, borderRadius:11, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", background:`${a.c}16`, color:a.c }}>{a.icon}</div>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:13, fontWeight:700, margin:"0 0 1px", color:(a as any).danger?"#ef4444":dark?"#e2e8f0":"#1e293b" }}>{a.t}</p>
              <p style={{ ...s.muted, margin:0 }}>{a.d}</p>
            </div>
            <ChevronRight size={13} style={{ color:dark?"#1e3a5c":"#cbd5e1" }} />
          </motion.button>
        ))}
      </div>

      <div style={{ padding:"14px 18px 32px" }}>
        <motion.button whileTap={{ scale:0.98 }} onClick={onClose}
          style={{ width:"100%", padding:"13px 20px", borderRadius:16, border:"none", background:dark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.05)", cursor:"pointer", fontSize:13, fontWeight:700, color:dark?"#64748b":"#64748b" }}>
          Close
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   ROOT PAGE
═══════════════════════════════════════════════ */
export default function GoogleProfileEditPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(()=>setMounted(true),[]);
  const dark = mounted && resolvedTheme === "dark";
  const router = useRouter();

  // ── Get user from Redux / useUser hook ──
  const { data: userData, isLoading: userLoading } = useUser();
  const userFromRedux = useSelector((state: RootState) => state.user.data);
  const user = userData ?? userFromRedux;

  // Use locationId and locationName from user DB record
  const LOCATION_ID   = user?.googleLocationId   ?? "";
  const LOCATION_NAME = user?.googleLocationName  ?? "";

  const [tab,          setTab]          = useState<Tab>("about");
  const [draft,        setDraft]        = useState<LocationDraft>(EMPTY_DRAFT);
  const [loading,      setLoading]      = useState(true);
  const [loadError,    setLoadError]    = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [saveStatus,   setSaveStatus]   = useState<"idle"|"saving"|"saved"|"error">("idle");

  /* ── Fetch real location data once we have locationId ── */
  useEffect(()=>{
    if (!LOCATION_ID) return;

    async function loadLocation() {
      setLoading(true);
      setLoadError(null);
      try {
        const token = getToken();
        if (!token) throw new Error("Not authenticated");

        const res = await fetch(`/api/google/locations/get?locationId=${LOCATION_ID}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load location");

        // Handle both { success, data } envelope AND direct response
        const d = json.data ?? json;
        setDraft(prev => mapApiToDraft(d, prev));
      } catch (err: any) {
        setLoadError(err.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    }

    loadLocation();
  }, [LOCATION_ID]);

  /* ── Pending changes accumulator ── */
  const pending = useRef<{ payload: Partial<LocationDraft>; fields: string[] }>({ payload:{}, fields:[] });

  function accumulate(partial: Partial<LocationDraft>, fields: string[]) {
    pending.current.payload = { ...pending.current.payload, ...partial };
    pending.current.fields  = [...new Set([...pending.current.fields, ...fields])];
    setDraft(d => ({ ...d, ...partial }));
  }

  const saveMut = useMutation({
    mutationFn: () => patchLocation(LOCATION_ID, { ...pending.current.payload }, [...pending.current.fields]),
    onMutate:  ()  => setSaveStatus("saving"),
    onSuccess: ()  => {
      setSaveStatus("saved");
      pending.current = { payload:{}, fields:[] };
      setTimeout(()=>setSaveStatus("idle"), 2800);
    },
    onError: () => {
      setSaveStatus("error");
      setTimeout(()=>setSaveStatus("idle"), 4000);
    },
  });

  const TABS: { id:Tab; label:string; icon:React.ReactNode }[] = [
    { id:"about",    label:"About",      icon:<Info size={12}/> },
    { id:"contact",  label:"Contact",    icon:<Phone size={12}/> },
    { id:"location", label:"Location",   icon:<MapPin size={12}/> },
    { id:"hours",    label:"Hours",      icon:<Clock size={12}/> },
    { id:"more",     label:"Attributes", icon:<Layers size={12}/> },
    { id:"advanced", label:"Advanced",   icon:<Settings size={12}/> },
  ];

  const bg = dark ? "linear-gradient(150deg,#050d1a,#080f1e)" : "linear-gradient(150deg,#eef4ff,#f0f5ff)";
  const s  = tok(dark);

  return (
    <div style={{ minHeight:"100vh", background:bg, fontFamily:"-apple-system,'SF Pro Text',sans-serif", transition:"background 0.3s" }}>

      {/* Backdrop */}
      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={()=>setShowSettings(false)}
            style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:40 }} />
        )}
      </AnimatePresence>

      {/* Settings drawer — passes real location data */}
      <AnimatePresence>
        {showSettings && (
          <SettingsDrawer dark={dark} onClose={()=>setShowSettings(false)} locationId={LOCATION_ID} locationName={LOCATION_NAME || draft.title} />
        )}
      </AnimatePresence>

      <div style={{ maxWidth:440, margin:"0 auto", padding:"0 15px", position:"relative", zIndex:1 }}>

        {/* ── HEADER ── */}
        <motion.div initial={{ opacity:0,y:-10 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.27 }}
          style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingTop:15, paddingBottom:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:9 }}>
            <motion.button onClick={()=>router.back()} whileTap={{ scale:0.88 }}
              style={{ width:34, height:34, borderRadius:11, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", background:dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.06)", color:dark?"#94a3b8":"#64748b" }}>
              <ArrowLeft size={14}/>
            </motion.button>
            <div>
              <h1 style={{ fontSize:15, fontWeight:900, letterSpacing:"-0.03em", margin:0, color:dark?"#fff":"#0f172a" }}>Business Information</h1>
              {/* Show real location name from user DB */}
              <p style={{ fontSize:10, fontWeight:600, margin:"2px 0 0", color:dark?"#334155":"#94a3b8" }}>
                {userLoading ? "Loading…" : (LOCATION_NAME || "Google Business Profile")} · API v1
              </p>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:7 }}>
            <AnimatePresence><SavePill status={saveStatus} dark={dark} /></AnimatePresence>
            <motion.button onClick={()=>setShowSettings(true)} whileTap={{ scale:0.9 }}
              style={{ width:32, height:32, borderRadius:10, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", background:dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.06)", color:dark?"#94a3b8":"#64748b" }}>
              <Settings size={13}/>
            </motion.button>
            <motion.button onClick={()=>saveMut.mutate()} disabled={saveMut.isPending||loading||!LOCATION_ID} whileTap={{ scale:0.94 }}
              style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 13px", borderRadius:11, border:"none", cursor:saveMut.isPending?"wait":"pointer", background:"linear-gradient(135deg,#1d4ed8,#3b82f6)", color:"#fff", fontSize:12.5, fontWeight:800, boxShadow:"0 4px 14px rgba(37,99,235,0.28)", opacity:(saveMut.isPending||loading||!LOCATION_ID)?0.6:1 }}>
              {saveMut.isPending
                ? <motion.div animate={{ rotate:360 }} transition={{ duration:0.8, repeat:Infinity, ease:"linear" }}><RefreshCw size={11}/></motion.div>
                : <Save size={11}/>}
              {saveMut.isPending ? "Saving" : "Save"}
            </motion.button>
          </div>
        </motion.div>

        {/* ── LINKED ACCOUNT BANNER ── */}
        {!userLoading && user && (
          <motion.div initial={{ opacity:0,y:6 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.15, duration:0.25 }}
            style={{ marginBottom:12, padding:"10px 13px", borderRadius:16, background:dark?"rgba(59,130,246,0.07)":"rgba(219,234,254,0.5)", border:`1.5px solid ${dark?"rgba(59,130,246,0.14)":"rgba(147,197,253,0.5)"}`, display:"flex", alignItems:"center", gap:10 }}>
            {/* Google icon */}
            <div style={{ width:32, height:32, borderRadius:10, flexShrink:0, background:dark?"rgba(66,133,244,0.15)":"rgba(66,133,244,0.1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:11.5, fontWeight:800, color:dark?"#93c5fd":"#1d4ed8", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {LOCATION_NAME || draft.title || "Google Business Profile"}
              </p>
              <p style={{ fontSize:10, color:dark?"#334155":"#64748b", margin:"1px 0 0", fontWeight:500 }}>
                ID: {LOCATION_ID || "—"}
              </p>
            </div>
            <span style={{ ...s.bdg("#22c55e"), fontSize:9, flexShrink:0 }}>Connected</span>
          </motion.div>
        )}

        {/* ── TAB BAR ── */}
        <div style={{ display:"flex", gap:5, overflowX:"auto", paddingBottom:11, scrollbarWidth:"none" } as React.CSSProperties}>
          {TABS.map(t=>{
            const active = tab===t.id;
            return (
              <motion.button key={t.id} onClick={()=>setTab(t.id)} whileTap={{ scale:0.95 }}
                style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 11px", borderRadius:11, border:"1.5px solid", flexShrink:0,
                  borderColor:active?"#3b82f6":dark?"rgba(255,255,255,0.06)":"rgba(203,213,225,0.55)",
                  background:active?dark?"rgba(37,99,235,0.16)":"rgba(219,234,254,0.55)":"transparent",
                  color:active?"#3b82f6":dark?"#475569":"#94a3b8",
                  fontSize:11.5, fontWeight:700, cursor:"pointer", transition:"all 0.16s", whiteSpace:"nowrap" as const }}>
                {t.icon}{t.label}
              </motion.button>
            );
          })}
        </div>

        {/* ── CONTENT ── */}
        <div style={{ paddingBottom:48 }}>
          {/* No location ID (user not linked) */}
          {!userLoading && !LOCATION_ID && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
              style={{ padding:"32px 20px", textAlign:"center", borderRadius:20, border:`1.5px solid ${dark?"rgba(239,68,68,0.2)":"rgba(254,202,202,0.6)"}`, background:dark?"rgba(239,68,68,0.05)":"rgba(254,242,242,0.5)" }}>
              <AlertTriangle size={28} style={{ color:"#ef4444", marginBottom:10 }} />
              <p style={{ fontSize:13, fontWeight:700, color:dark?"#fca5a5":"#dc2626", margin:"0 0 6px" }}>No Google Business account linked</p>
              <p style={{ fontSize:11.5, color:dark?"#334155":"#94a3b8", fontWeight:500, margin:0 }}>Connect your Google account in Profile settings to manage your business information.</p>
            </motion.div>
          )}

          {/* Loading skeleton */}
          {loading && LOCATION_ID && <Skeleton dark={dark} />}

          {/* Load error */}
          {loadError && !loading && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
              style={{ padding:"20px", borderRadius:16, border:`1.5px solid ${dark?"rgba(239,68,68,0.2)":"rgba(254,202,202,0.6)"}`, background:dark?"rgba(239,68,68,0.05)":"rgba(254,242,242,0.5)", marginBottom:12 }}>
              <p style={{ fontSize:12, fontWeight:700, color:"#ef4444", margin:"0 0 4px" }}>Failed to load location data</p>
              <p style={{ fontSize:11, color:dark?"#334155":"#94a3b8", margin:0 }}>{loadError}</p>
            </motion.div>
          )}

          {/* Actual tabs — show once loaded */}
          {!loading && LOCATION_ID && (
            <AnimatePresence mode="wait">
              <motion.div key={tab} initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-5 }} transition={{ duration:0.2 }}>
                {tab==="about"    && <AboutTab    draft={draft} upd={accumulate} dark={dark} />}
                {tab==="contact"  && <ContactTab  draft={draft} upd={accumulate} dark={dark} />}
                {tab==="location" && <LocationTab draft={draft} upd={accumulate} dark={dark} />}
                {tab==="hours"    && <HoursTab    draft={draft} upd={accumulate} dark={dark} />}
                {tab==="more"     && <MoreTab     dark={dark} />}
                {tab==="advanced" && <AdvancedTab draft={draft} upd={accumulate} dark={dark} locationId={LOCATION_ID} />}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div style={{ borderTop:`1px solid ${dark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.05)"}`, paddingTop:14, paddingBottom:32 }}>
          <p style={{ fontSize:10, color:dark?"#1e3a5c":"#cbd5e1", fontWeight:500, lineHeight:1.7, margin:"0 0 10px", textAlign:"center" }}>
            Changes are sent to Google Business Profile via the Business Information API (v1).
            Updates may take a few minutes to reflect on Search & Maps.
          </p>
          <a href="https://business.google.com" target="_blank" rel="noopener noreferrer"
            style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:5, fontSize:11, color:"#3b82f6", fontWeight:700, textDecoration:"none" }}>
            <ExternalLink size={10}/> Open Google Business Profile
          </a>
        </div>
      </div>
    </div>
  );
}
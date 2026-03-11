// mobile_app\app\(main)\profile\google-profile\edit\page.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeft, Check, Plus, X, Building2, Phone, Globe, MapPin,
  Clock, Info, Users, Settings, Trash2, Star, Car, Calendar,
  Save, CheckCircle2, ExternalLink, Tag, RefreshCw, ChevronRight,
  AlertTriangle, Wifi, Hash, Navigation, Layers, Zap, Copy,
  Link2, MessageSquare, FileText, BarChart2,
} from "lucide-react";

/* ════════════════════════════════════════════════════════
   ALL GBP API v1 PATCHABLE FIELDS
   PATCH https://mybusinessbusinessinformation.googleapis.com
         /v1/locations/{locationId}?updateMask=<fields>
   Attributes: PATCH /v1/locations/{locationId}/attributes
               ?attributeMask=<attrs>
════════════════════════════════════════════════════════ */

type Tab = "about" | "contact" | "location" | "hours" | "more" | "advanced";

interface TimePeriod { openDay: string; openTime: string; closeDay: string; closeTime: string; }
interface SpecialHourPeriod {
  startDate: { year:number; month:number; day:number };
  endDate:   { year:number; month:number; day:number };
  openTime?: string; closeTime?: string; closed?: boolean;
}
interface ServiceAreaPlace { placeId: string; name: string; }
interface ServiceItem {
  freeFormServiceItem?: { category: string; label: { displayName: string; description?: string } };
  structuredServiceItem?: { serviceTypeId: string; description?: string };
}

interface LocationDraft {
  title: string;
  storeCode: string;
  languageCode: string;
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
  openInfo: { status: "OPEN"|"CLOSED_PERMANENTLY"|"CLOSED_TEMPORARILY"; openingDate?: { year:number; month:number; day:number } };
  serviceArea: {
    businessType: "CUSTOMER_LOCATION_ONLY"|"CUSTOMER_AND_BUSINESS_LOCATION";
    places?: { placeInfos: ServiceAreaPlace[] };
  };
  serviceItems: ServiceItem[];
  adWordsLocationExtensions: { adPhone: string };
  labels: string[];
  relationshipData: { parentChain?: string };
}

const INITIAL: LocationDraft = {
  title: "Vipprow | Digital Marketing | SaaS Solutions",
  storeCode: "VIPPROW-JBP-001",
  languageCode: "en",
  categories: {
    primaryCategory: { displayName: "Advertising agency", name: "gcid:advertising_agency" },
    additionalCategories: [
      { displayName: "Software company",   name: "gcid:software_company" },
      { displayName: "Automation company", name: "gcid:automation_company" },
    ],
  },
  profile: { description: "Vipprow is a leading SaaS & Digital Marketing company helping businesses grow online with smart, performance-driven solutions. We specialize in social media marketing, SEO, performance marketing, website & app development, CRM, inventory management software, and creative graphic design." },
  phoneNumbers: { primaryPhone: "+919669932121", additionalPhones: ["+919669932122"] },
  websiteUri: "https://vipprow.com/",
  storefrontAddress: {
    regionCode: "IN", languageCode: "en", postalCode: "482001",
    administrativeArea: "Madhya Pradesh", locality: "Jabalpur",
    addressLines: ["H.NO. 753 GUPTESHWAR WARD", "Near Good Luck Apartment"],
  },
  latlng: { latitude: 23.1666, longitude: 79.9333 },
  regularHours: {
    periods: [
      { openDay:"MONDAY",    closeDay:"MONDAY",    openTime:"10:30", closeTime:"19:30" },
      { openDay:"TUESDAY",   closeDay:"TUESDAY",   openTime:"10:30", closeTime:"19:30" },
      { openDay:"WEDNESDAY", closeDay:"WEDNESDAY", openTime:"10:30", closeTime:"19:30" },
      { openDay:"THURSDAY",  closeDay:"THURSDAY",  openTime:"10:30", closeTime:"19:30" },
      { openDay:"FRIDAY",    closeDay:"FRIDAY",    openTime:"10:30", closeTime:"19:30" },
      { openDay:"SATURDAY",  closeDay:"SATURDAY",  openTime:"10:30", closeTime:"19:30" },
    ],
  },
  specialHours: { specialHourPeriods: [] },
  moreHours: [],
  openInfo: { status: "OPEN" },
  serviceArea: {
    businessType: "CUSTOMER_AND_BUSINESS_LOCATION",
    places: { placeInfos: [{ placeId: "", name: "Jabalpur, Madhya Pradesh, India" }] },
  },
  serviceItems: [
    { freeFormServiceItem: { category: "gcid:advertising_agency", label: { displayName: "Social Media Marketing", description: "Full-service social media management" } } },
    { freeFormServiceItem: { category: "gcid:software_company",   label: { displayName: "CRM Software",           description: "Custom CRM development" } } },
    { freeFormServiceItem: { category: "gcid:software_company",   label: { displayName: "Inventory Management",   description: "Stock & warehouse software" } } },
  ],
  adWordsLocationExtensions: { adPhone: "+919669932121" },
  labels: ["jabalpur", "digital-marketing", "saas"],
  relationshipData: {},
};

/* ── API ── */
async function patchLocation(locationId: string, payload: Partial<LocationDraft>, fields: string[]) {
  const token = typeof window !== "undefined" ? localStorage.getItem("gbp_access_token") : null;
  const res = await fetch(
    `https://mybusinessbusinessinformation.googleapis.com/v1/locations/${locationId}?updateMask=${fields.join(",")}`,
    { method:"PATCH", headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` }, body: JSON.stringify(payload) }
  );
  if (!res.ok) { const e = await res.json(); throw new Error(e?.error?.message ?? "Save failed"); }
  return res.json();
}

/* ── Constants ── */
const DAYS  = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"];
const DSHRT: Record<string,string> = { MONDAY:"Mon",TUESDAY:"Tue",WEDNESDAY:"Wed",THURSDAY:"Thu",FRIDAY:"Fri",SATURDAY:"Sat",SUNDAY:"Sun" };
const MORE_HOURS_TYPES = [
  {id:"DRIVE_THROUGH",l:"Drive-through"},{id:"HAPPY_HOUR",l:"Happy hour"},
  {id:"DELIVERY",l:"Delivery"},{id:"TAKEOUT",l:"Takeout"},{id:"KITCHEN",l:"Kitchen"},
  {id:"BREAKFAST",l:"Breakfast"},{id:"LUNCH",l:"Lunch"},{id:"DINNER",l:"Dinner"},
  {id:"BRUNCH",l:"Brunch"},{id:"PICKUP",l:"Pickup"},{id:"SENIOR_HOURS",l:"Senior hours"},
];

/* ── Design tokens ── */
const fade  = { hidden:{opacity:0,y:7},  show:{opacity:1,y:0,transition:{duration:0.25,ease:[0.22,1,0.36,1] as any}} };
const stag  = { hidden:{},              show:{transition:{staggerChildren:0.045}} };

function tok(dark: boolean) {
  return {
    card: { borderRadius:20,overflow:"hidden" as const, border:`1.5px solid ${dark?"rgba(255,255,255,0.06)":"rgba(203,213,225,0.5)"}`, background:dark?"#0f1a2e":"#fff", boxShadow:dark?"none":"0 1px 6px rgba(0,0,0,0.04)", marginBottom:12 },
    ch:   { padding:"11px 15px", borderBottom:`1px solid ${dark?"rgba(255,255,255,0.05)":"rgba(203,213,225,0.35)"}`, display:"flex" as const, alignItems:"center" as const, gap:8 },
    cb:   { padding:"13px 15px" },
    lbl:  { fontSize:10.5,fontWeight:800,textTransform:"uppercase" as const,letterSpacing:"0.08em",color:dark?"#334155":"#94a3b8",marginBottom:5,display:"block" as const },
    inp:  { width:"100%",padding:"10px 13px",borderRadius:12,fontSize:13,fontWeight:500, border:`1.5px solid ${dark?"rgba(255,255,255,0.07)":"rgba(203,213,225,0.65)"}`, background:dark?"rgba(255,255,255,0.04)":"#fff", color:dark?"#e2e8f0":"#1e293b",outline:"none", fontFamily:"-apple-system,'SF Pro Text',sans-serif",boxSizing:"border-box" as const,transition:"border-color 0.18s" },
    muted:{ color:dark?"#334155":"#94a3b8",fontSize:10.5,fontWeight:500 },
    div:  { borderTop:`1px solid ${dark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.05)"}` },
    bdg:  (c:string) => ({ fontSize:9.5,fontWeight:800,padding:"2px 8px",borderRadius:99,background:`${c}20`,color:c,border:`1px solid ${c}35` }),
  };
}

/* ── Shared Components ── */
function Card({ title, icon, badge, children, dark }: { title:string; icon:React.ReactNode; badge?:string; children:React.ReactNode; dark:boolean }) {
  const s = tok(dark);
  return (
    <motion.div variants={fade} style={s.card}>
      <div style={s.ch}>
        <span style={{ color:"#3b82f6",display:"flex",alignItems:"center" }}>{icon}</span>
        <span style={{ fontSize:12,fontWeight:800,color:dark?"#e2e8f0":"#1e293b",flex:1,letterSpacing:"-0.01em" }}>{title}</span>
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
      <div style={{ display:"flex",alignItems:"center",gap:3,marginBottom:5 }}>
        <span style={s.lbl}>{label}</span>
        {required && <span style={{ color:"#3b82f6",fontSize:11 }}>*</span>}
      </div>
      {children}
      {hint && <p style={{ ...s.muted,marginTop:4 }}>{hint}</p>}
    </div>
  );
}

function TI({ value, onChange, placeholder, type="text", dark, prefix, suffix, readOnly }: { value:string; onChange?:(v:string)=>void; placeholder?:string; type?:string; dark:boolean; prefix?:string; suffix?:string; readOnly?:boolean }) {
  const s = tok(dark);
  const [f,setF] = useState(false);
  const style = { ...s.inp, borderColor:f?"#3b82f6":dark?"rgba(255,255,255,0.07)":"rgba(203,213,225,0.65)", paddingLeft:prefix?13+prefix.length*7.5:13, paddingRight:suffix?44:13 };
  return (
    <div style={{ position:"relative" }}>
      {prefix && <span style={{ position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",fontSize:12,color:dark?"#475569":"#94a3b8",fontWeight:600,pointerEvents:"none" }}>{prefix}</span>}
      <input value={value} onChange={e=>onChange?.(e.target.value)} placeholder={placeholder} type={type} readOnly={readOnly} style={style} onFocus={()=>setF(true)} onBlur={()=>setF(false)}/>
      {suffix && <span style={{ position:"absolute",right:11,top:"50%",transform:"translateY(-50%)",fontSize:10,fontWeight:800,padding:"2px 7px",borderRadius:7,background:dark?"rgba(59,130,246,0.15)":"rgba(219,234,254,0.8)",color:"#3b82f6" }}>{suffix}</span>}
    </div>
  );
}

function TA({ value, onChange, placeholder, rows=4, dark, maxLen }: { value:string; onChange:(v:string)=>void; placeholder?:string; rows?:number; dark:boolean; maxLen?:number }) {
  const s = tok(dark);
  const [f,setF] = useState(false);
  return (
    <>
      <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}
        style={{ ...s.inp,resize:"none",lineHeight:1.65,padding:"11px 13px",borderColor:f?"#3b82f6":dark?"rgba(255,255,255,0.07)":"rgba(203,213,225,0.65)" }}
        onFocus={()=>setF(true)} onBlur={()=>setF(false)}/>
      {maxLen && <p style={{ fontSize:10,marginTop:3,fontWeight:600,textAlign:"right",color:value.length>maxLen?"#ef4444":dark?"#334155":"#94a3b8" }}>{value.length}/{maxLen}</p>}
    </>
  );
}

function Tog({ value, onChange, dark }: { value:boolean; onChange:(v:boolean)=>void; dark:boolean }) {
  return (
    <motion.div onClick={()=>onChange(!value)} style={{ width:36,height:20,borderRadius:99,cursor:"pointer",position:"relative",flexShrink:0,background:value?"#3b82f6":dark?"rgba(255,255,255,0.09)":"rgba(0,0,0,0.09)" }}>
      <motion.div animate={{ x:value?17:2 }} transition={{ type:"spring",stiffness:420,damping:32 }}
        style={{ position:"absolute",top:2,width:16,height:16,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 3px rgba(0,0,0,0.25)" }}/>
    </motion.div>
  );
}

function TR({ label, sub, value, onChange, dark }: { label:string; sub?:string; value:boolean; onChange:(v:boolean)=>void; dark:boolean }) {
  const s = tok(dark);
  return (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,padding:"9px 0",borderBottom:s.div.borderTop }}>
      <div style={{ flex:1 }}>
        <p style={{ fontSize:12.5,fontWeight:600,color:dark?"#cbd5e1":"#334155",margin:0 }}>{label}</p>
        {sub && <p style={{ ...s.muted,margin:"1px 0 0" }}>{sub}</p>}
      </div>
      <Tog value={value} onChange={onChange} dark={dark}/>
    </div>
  );
}

function Chip({ label, onRemove, dark }: { label:string; onRemove:()=>void; dark:boolean }) {
  return (
    <motion.div initial={{ scale:0.85,opacity:0 }} animate={{ scale:1,opacity:1 }} exit={{ scale:0.85,opacity:0 }} transition={{ duration:0.15 }}
      style={{ display:"inline-flex",alignItems:"center",gap:5,padding:"4px 9px 4px 11px",borderRadius:99,fontSize:11.5,fontWeight:700,background:dark?"rgba(59,130,246,0.1)":"rgba(219,234,254,0.7)",border:`1.5px solid ${dark?"rgba(59,130,246,0.18)":"rgba(147,197,253,0.55)"}`,color:dark?"#93c5fd":"#1d4ed8" }}>
      {label}
      <button onClick={onRemove} style={{ display:"flex",alignItems:"center",justifyContent:"center",width:15,height:15,borderRadius:"50%",border:"none",cursor:"pointer",padding:0,background:dark?"rgba(59,130,246,0.22)":"rgba(147,197,253,0.45)",color:dark?"#93c5fd":"#1d4ed8" }}>
        <X size={8} strokeWidth={3}/>
      </button>
    </motion.div>
  );
}

function AddI({ placeholder, onAdd, dark }: { placeholder:string; onAdd:(v:string)=>void; dark:boolean }) {
  const [v,setV] = useState("");
  const s = tok(dark);
  return (
    <div style={{ display:"flex",gap:7,marginTop:8 }}>
      <input value={v} onChange={e=>setV(e.target.value)} placeholder={placeholder}
        onKeyDown={e=>{ if(e.key==="Enter"&&v.trim()){onAdd(v.trim());setV("");}}}
        style={{ ...s.inp,flex:1,padding:"9px 12px" }}/>
      <motion.button whileTap={{ scale:0.93 }} onClick={()=>{ if(v.trim()){onAdd(v.trim());setV("");}}}
        style={{ padding:"9px 13px",borderRadius:11,border:"none",cursor:"pointer",background:"#3b82f6",color:"#fff",display:"flex",alignItems:"center" }}>
        <Plus size={13}/>
      </motion.button>
    </div>
  );
}

function SavePill({ status, dark }: { status:"idle"|"saving"|"saved"|"error"; dark:boolean }) {
  if (status==="idle") return null;
  const m = { saving:{l:"Saving…",c:"#f59e0b"}, saved:{l:"Saved to Google",c:"#22c55e"}, error:{l:"Save failed",c:"#ef4444"}, idle:{l:"",c:""} }[status];
  return (
    <motion.div initial={{ opacity:0,scale:0.88 }} animate={{ opacity:1,scale:1 }} exit={{ opacity:0,scale:0.88 }} transition={{ duration:0.2 }}
      style={{ display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:99,background:`${m.c}18`,border:`1px solid ${m.c}30`,color:m.c }}>
      {status==="saving" ? (
        <motion.div animate={{ rotate:360 }} transition={{ duration:0.8,repeat:Infinity,ease:"linear" }}><RefreshCw size={11}/></motion.div>
      ) : status==="saved" ? <CheckCircle2 size={11}/> : <AlertTriangle size={11}/>}
      <span style={{ fontSize:11,fontWeight:700 }}>{m.l}</span>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════
   ABOUT TAB
   updateMask: title, storeCode, categories, profile.description, openInfo
════════════════════════════════════════════════════════ */
function AboutTab({ draft, upd, dark }: { draft:LocationDraft; upd:(p:Partial<LocationDraft>,f:string[])=>void; dark:boolean }) {
  const [name,    setName]    = useState(draft.title);
  const [code,    setCode]    = useState(draft.storeCode);
  const [desc,    setDesc]    = useState(draft.profile.description);
  const [cats,    setCats]    = useState(draft.categories.additionalCategories.map(c=>c.displayName));
  const [primary, setPrimary] = useState(draft.categories.primaryCategory.displayName);
  const [status,  setStatus]  = useState(draft.openInfo.status);
  const [oDate,   setODate]   = useState("");

  const commit = () => upd({
    title:name, storeCode:code, profile:{description:desc},
    categories:{ primaryCategory:{displayName:primary,name:draft.categories.primaryCategory.name}, additionalCategories:cats.map(c=>({displayName:c,name:""})) },
    openInfo:{ status, ...(oDate ? { openingDate:{ year:+oDate.split("-")[0], month:+oDate.split("-")[1], day:+oDate.split("-")[2] } } : {}) },
  }, ["title","storeCode","profile.description","categories","openInfo.status","openInfo.openingDate"]);

  const ST = { OPEN:{l:"Open",c:"#22c55e"}, CLOSED_TEMPORARILY:{l:"Temporarily closed",c:"#f59e0b"}, CLOSED_PERMANENTLY:{l:"Permanently closed",c:"#ef4444"} };

  return (
    <motion.div variants={stag} initial="hidden" animate="show" onBlur={commit}>
      <Card title="Business Name" icon={<Building2 size={13}/>} dark={dark}>
        <FW label="Business Name" required dark={dark} hint="Use your real-world name — as customers know it.">
          <TI value={name} onChange={setName} dark={dark}/>
          <p style={{ fontSize:10,marginTop:3,textAlign:"right",color:name.length>750?"#ef4444":dark?"#334155":"#94a3b8",fontWeight:600 }}>{name.length}/750</p>
        </FW>
        <FW label="Store Code" dark={dark} hint="Internal identifier. Not shown publicly. Used for multi-location tracking.">
          <TI value={code} onChange={setCode} dark={dark} placeholder="e.g. STORE-JBP-001" prefix="# "/>
        </FW>
      </Card>

      <Card title="Open Status" icon={<Zap size={13}/>} dark={dark}>
        <FW label="Current Status" required dark={dark} hint="Controls what customers see on Google Search & Maps.">
          {(["OPEN","CLOSED_TEMPORARILY","CLOSED_PERMANENTLY"] as const).map(s => (
            <motion.button key={s} whileTap={{ scale:0.99 }} onClick={()=>setStatus(s)}
              style={{ display:"flex",alignItems:"center",gap:9,width:"100%",padding:"9px 12px",marginBottom:7,borderRadius:12,border:"2px solid",cursor:"pointer",textAlign:"left",
                borderColor:status===s?ST[s].c:dark?"rgba(255,255,255,0.06)":"rgba(203,213,225,0.5)",
                background:status===s?`${ST[s].c}12`:"transparent" }}>
              <div style={{ width:14,height:14,borderRadius:"50%",flexShrink:0,border:`2px solid ${status===s?ST[s].c:dark?"#334155":"#cbd5e1"}`,background:status===s?ST[s].c:"transparent",display:"flex",alignItems:"center",justifyContent:"center" }}>
                {status===s && <div style={{ width:5,height:5,borderRadius:"50%",background:"#fff" }}/>}
              </div>
              <span style={{ fontSize:12.5,fontWeight:700,color:status===s?ST[s].c:dark?"#94a3b8":"#64748b" }}>{ST[s].l}</span>
            </motion.button>
          ))}
        </FW>
        <FW label="Opening Date" dark={dark} hint="When your business opened or will open. Shown on Maps during grand opening.">
          <TI value={oDate} onChange={setODate} type="date" dark={dark}/>
        </FW>
      </Card>

      <Card title="Categories" icon={<Tag size={13}/>} dark={dark} badge="Affects ranking">
        <FW label="Primary Category" required dark={dark} hint="The single most important category. Must match your core business type.">
          <TI value={primary} onChange={setPrimary} dark={dark} placeholder="e.g. Advertising agency"/>
        </FW>
        <FW label="Additional Categories" dark={dark} hint="Up to 9 more. Primary + additional must always be set together in updateMask.">
          <div style={{ display:"flex",flexWrap:"wrap",gap:7,marginBottom:2 }}>
            <AnimatePresence>{cats.map((c,i)=><Chip key={c+i} label={c} dark={dark} onRemove={()=>setCats(cs=>cs.filter((_,j)=>j!==i))}/>)}</AnimatePresence>
          </div>
          <AddI placeholder="Add category…" dark={dark} onAdd={c=>setCats(cs=>[...cs,c])}/>
        </FW>
      </Card>

      <Card title="Business Description" icon={<Info size={13}/>} dark={dark}>
        <FW label="Description" dark={dark} hint="Appears on your Google profile. Max 750 characters.">
          <TA value={desc} onChange={setDesc} rows={5} dark={dark} maxLen={750} placeholder="Tell customers about your business…"/>
        </FW>
      </Card>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════
   CONTACT TAB
   updateMask: phoneNumbers, websiteUri, adWordsLocationExtensions
════════════════════════════════════════════════════════ */
function ContactTab({ draft, upd, dark }: { draft:LocationDraft; upd:(p:Partial<LocationDraft>,f:string[])=>void; dark:boolean }) {
  const [primary, setPrimary]  = useState(draft.phoneNumbers.primaryPhone);
  const [extra,   setExtra]    = useState(draft.phoneNumbers.additionalPhones);
  const [website, setWebsite]  = useState(draft.websiteUri);
  const [adPhone, setAdPhone]  = useState(draft.adWordsLocationExtensions.adPhone);

  const commit = () => upd({
    phoneNumbers:{ primaryPhone:primary, additionalPhones:extra },
    websiteUri:website,
    adWordsLocationExtensions:{ adPhone },
  }, ["phoneNumbers","websiteUri","adWordsLocationExtensions"]);

  const s = tok(dark);

  return (
    <motion.div variants={stag} initial="hidden" animate="show" onBlur={commit}>
      <Card title="Phone Numbers" icon={<Phone size={13}/>} dark={dark}>
        <FW label="Primary Phone" required dark={dark} hint="International format: +91 XXXXX XXXXX. Primary and additional must be set together.">
          <TI value={primary} onChange={setPrimary} dark={dark} placeholder="+91 00000 00000" type="tel"/>
        </FW>
        <FW label="Additional Phones" dark={dark} hint="Up to 2 extra numbers (e.g. WhatsApp, SMS line).">
          <div style={{ display:"flex",flexDirection:"column",gap:7 }}>
            {extra.map((p,i)=>(
              <div key={i} style={{ display:"flex",gap:7 }}>
                <TI value={p} onChange={v=>setExtra(a=>a.map((x,j)=>j===i?v:x))} dark={dark} placeholder="+91 00000 00000" type="tel"/>
                <motion.button whileTap={{ scale:0.92 }} onClick={()=>setExtra(a=>a.filter((_,j)=>j!==i))}
                  style={{ padding:"0 11px",borderRadius:11,border:"none",cursor:"pointer",background:dark?"rgba(239,68,68,0.1)":"rgba(254,226,226,0.6)",color:"#ef4444" }}>
                  <X size={13}/>
                </motion.button>
              </div>
            ))}
            {extra.length<2 && (
              <motion.button whileTap={{ scale:0.96 }} onClick={()=>setExtra(a=>[...a,""])}
                style={{ display:"flex",alignItems:"center",gap:6,padding:"9px 13px",borderRadius:12,border:`1.5px dashed ${dark?"rgba(59,130,246,0.25)":"rgba(147,197,253,0.5)"}`,background:"transparent",cursor:"pointer",fontSize:12,fontWeight:700,color:"#3b82f6" }}>
                <Plus size={12}/> Add phone
              </motion.button>
            )}
          </div>
        </FW>
        <FW label="AdWords Call Extension Phone" dark={dark} hint="Shown in Google Ads. Defaults to primary phone if empty.">
          <TI value={adPhone} onChange={setAdPhone} dark={dark} placeholder="+91 00000 00000" type="tel"/>
        </FW>
      </Card>

      <Card title="Website" icon={<Globe size={13}/>} dark={dark}>
        <FW label="Website URL" required dark={dark} hint="Full URL with https://. Primary link shown on Search & Maps.">
          <TI value={website} onChange={setWebsite} dark={dark} placeholder="https://yourwebsite.com"/>
          {website && <a href={website} target="_blank" rel="noopener noreferrer" style={{ display:"inline-flex",alignItems:"center",gap:5,marginTop:6,fontSize:11.5,color:"#3b82f6",fontWeight:600,textDecoration:"none" }}><ExternalLink size={10}/> Open website</a>}
        </FW>
        <div style={{ padding:"10px 12px",borderRadius:13,background:dark?"rgba(59,130,246,0.06)":"rgba(219,234,254,0.4)",border:`1px solid ${dark?"rgba(59,130,246,0.1)":"rgba(147,197,253,0.35)"}` }}>
          <p style={{ fontSize:10.5,fontWeight:700,color:"#3b82f6",margin:"0 0 4px" }}>Profile Deep Link</p>
          <p style={{ fontSize:10,fontFamily:"monospace",fontWeight:600,margin:0,color:dark?"#60a5fa":"#2563eb",wordBreak:"break-all" }}>https://business.google.com/edit/l/u8458234036949018584</p>
        </div>
      </Card>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════
   LOCATION TAB
   updateMask: storefrontAddress, serviceArea  (latlng = read-only)
════════════════════════════════════════════════════════ */
function LocationTab({ draft, upd, dark }: { draft:LocationDraft; upd:(p:Partial<LocationDraft>,f:string[])=>void; dark:boolean }) {
  const [addr,    setAddr]    = useState(draft.storefrontAddress);
  const [bizType, setBizType] = useState(draft.serviceArea.businessType);
  const [areas,   setAreas]   = useState(draft.serviceArea.places?.placeInfos??[]);

  const commit = () => upd({
    storefrontAddress:addr,
    serviceArea:{ businessType:bizType, places:{ placeInfos:areas } },
  }, ["storefrontAddress","serviceArea"]);

  const s = tok(dark);
  return (
    <motion.div variants={stag} initial="hidden" animate="show" onBlur={commit}>
      <Card title="Storefront Address" icon={<MapPin size={13}/>} dark={dark}>
        <FW label="Address Lines" required dark={dark} hint="Street address. Line 2 for suite/floor/unit.">
          {addr.addressLines.map((l,i)=>(
            <div key={i} style={{ marginBottom:7 }}>
              <TI value={l} onChange={v=>setAddr(a=>({...a,addressLines:a.addressLines.map((x,j)=>j===i?v:x)}))} dark={dark} placeholder={i===0?"Street address":"Line 2 (optional)"}/>
            </div>
          ))}
        </FW>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:9 }}>
          <FW label="City" required dark={dark}><TI value={addr.locality} onChange={v=>setAddr(a=>({...a,locality:v}))} dark={dark} placeholder="City"/></FW>
          <FW label="PIN Code" required dark={dark}><TI value={addr.postalCode} onChange={v=>setAddr(a=>({...a,postalCode:v}))} dark={dark} placeholder="000000"/></FW>
        </div>
        <FW label="State" required dark={dark}><TI value={addr.administrativeArea} onChange={v=>setAddr(a=>({...a,administrativeArea:v}))} dark={dark} placeholder="Madhya Pradesh"/></FW>
        <FW label="Country Code" required dark={dark} hint="ISO 3166-1 alpha-2 (e.g. IN, US, GB)."><TI value={addr.regionCode} onChange={v=>setAddr(a=>({...a,regionCode:v.toUpperCase()}))} dark={dark} placeholder="IN"/></FW>
      </Card>

      <Card title="GPS Coordinates" icon={<Navigation size={13}/>} dark={dark} badge="Read-only">
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:9 }}>
          <FW label="Latitude" dark={dark}><TI value={draft.latlng.latitude.toString()} dark={dark} readOnly/></FW>
          <FW label="Longitude" dark={dark}><TI value={draft.latlng.longitude.toString()} dark={dark} readOnly/></FW>
        </div>
        <div style={{ borderRadius:12,height:100,background:dark?"rgba(59,130,246,0.04)":"rgba(59,130,246,0.03)",border:`1.5px solid ${dark?"rgba(59,130,246,0.1)":"rgba(147,197,253,0.25)"}`,display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginTop:6 }}>
          <MapPin size={16} style={{ color:"#3b82f6",opacity:0.4 }}/>
          <span style={{ fontSize:12,color:dark?"#334155":"#94a3b8",fontWeight:600 }}>Jabalpur, Madhya Pradesh · IN</span>
        </div>
        <p style={{ ...s.muted,marginTop:5,fontSize:10 }}>Coordinates are managed by Google. Use Maps or Business Profile Manager to reposition the pin.</p>
      </Card>

      <Card title="Service Area" icon={<Globe size={13}/>} dark={dark}>
        <FW label="Business Type" required dark={dark} hint="CUSTOMER_LOCATION_ONLY hides your address from Maps and shows service area instead.">
          {([{v:"CUSTOMER_AND_BUSINESS_LOCATION",l:"Physical storefront + service area"},{v:"CUSTOMER_LOCATION_ONLY",l:"Service-area only (no storefront on Maps)"}] as const).map(opt=>(
            <motion.button key={opt.v} whileTap={{ scale:0.99 }} onClick={()=>setBizType(opt.v)}
              style={{ display:"flex",alignItems:"center",gap:9,width:"100%",padding:"9px 12px",marginBottom:7,borderRadius:12,border:"2px solid",cursor:"pointer",textAlign:"left",
                borderColor:bizType===opt.v?"#3b82f6":dark?"rgba(255,255,255,0.06)":"rgba(203,213,225,0.5)",
                background:bizType===opt.v?dark?"rgba(37,99,235,0.08)":"rgba(219,234,254,0.35)":"transparent" }}>
              <div style={{ width:14,height:14,borderRadius:"50%",flexShrink:0,border:`2px solid ${bizType===opt.v?"#3b82f6":dark?"#334155":"#cbd5e1"}`,background:bizType===opt.v?"#3b82f6":"transparent",display:"flex",alignItems:"center",justifyContent:"center" }}>
                {bizType===opt.v && <div style={{ width:5,height:5,borderRadius:"50%",background:"#fff" }}/>}
              </div>
              <span style={{ fontSize:12,fontWeight:700,color:bizType===opt.v?"#3b82f6":dark?"#94a3b8":"#64748b" }}>{opt.l}</span>
            </motion.button>
          ))}
        </FW>
        <FW label="Service Area Places" dark={dark} hint="Cities or regions you serve. Google maps these to Place IDs internally.">
          <div style={{ display:"flex",flexDirection:"column",gap:7 }}>
            {areas.map((a,i)=>(
              <div key={i} style={{ display:"flex",gap:7,alignItems:"center" }}>
                <div style={{ flex:1,padding:"9px 12px",borderRadius:11,fontSize:12,fontWeight:600,background:dark?"rgba(255,255,255,0.04)":"#f8fafc",border:`1.5px solid ${dark?"rgba(255,255,255,0.06)":"rgba(203,213,225,0.5)"}`,color:dark?"#94a3b8":"#64748b" }}>{a.name}</div>
                <motion.button whileTap={{ scale:0.92 }} onClick={()=>setAreas(as=>as.filter((_,j)=>j!==i))}
                  style={{ padding:"0 11px",height:38,borderRadius:11,border:"none",cursor:"pointer",background:dark?"rgba(239,68,68,0.1)":"rgba(254,226,226,0.6)",color:"#ef4444" }}>
                  <X size={13}/>
                </motion.button>
              </div>
            ))}
            <AddI placeholder="Add city or region…" dark={dark} onAdd={v=>setAreas(as=>[...as,{placeId:"",name:v}])}/>
          </div>
        </FW>
      </Card>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════
   HOURS TAB
   updateMask: regularHours, specialHours, moreHours
════════════════════════════════════════════════════════ */
function HoursTab({ draft, upd, dark }: { draft:LocationDraft; upd:(p:Partial<LocationDraft>,f:string[])=>void; dark:boolean }) {
  const initMap = () => { const m:Record<string,TimePeriod|null>={}; DAYS.forEach(d=>{m[d]=draft.regularHours.periods.find(p=>p.openDay===d)??null;}); return m; };
  const [dayMap, setDayMap] = useState(initMap);
  const [special, setSpecial] = useState(draft.specialHours.specialHourPeriods);
  const [more, setMore] = useState(draft.moreHours);
  const [morePanel, setMorePanel] = useState(false);

  const commit = () => {
    const periods = Object.values(dayMap).filter(Boolean) as TimePeriod[];
    upd({ regularHours:{periods}, specialHours:{specialHourPeriods:special}, moreHours:more },
        ["regularHours","specialHours","moreHours"]);
  };

  const s = tok(dark);
  const tInp: React.CSSProperties = { padding:"8px 9px",borderRadius:10,fontSize:11.5,fontWeight:700,border:`1.5px solid ${dark?"rgba(255,255,255,0.07)":"rgba(203,213,225,0.6)"}`,background:dark?"rgba(255,255,255,0.05)":"#f8fafc",color:dark?"#e2e8f0":"#1e293b",outline:"none",width:82,fontFamily:"-apple-system,sans-serif" };

  return (
    <motion.div variants={stag} initial="hidden" animate="show" onBlur={commit}>
      <Card title="Regular Hours" icon={<Clock size={13}/>} dark={dark}>
        {DAYS.map((day,idx)=>{
          const p = dayMap[day]; const open = p!==null;
          return (
            <div key={day} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:idx<6?s.div.borderTop:"none" }}>
              <span style={{ width:74,fontSize:12.5,fontWeight:700,flexShrink:0,color:dark?(open?"#e2e8f0":"#334155"):(open?"#1e293b":"#cbd5e1") }}>{DSHRT[day]}</span>
              <Tog value={open} onChange={v=>setDayMap(m=>({...m,[day]:v?{openDay:day,closeDay:day,openTime:"09:00",closeTime:"18:00"}:null}))} dark={dark}/>
              <AnimatePresence mode="wait">
                {open ? (
                  <motion.div key="o" initial={{ opacity:0,x:5 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:-5 }} transition={{ duration:0.14 }}
                    style={{ display:"flex",alignItems:"center",gap:5,flex:1 }}>
                    <input type="time" value={p!.openTime} onChange={e=>setDayMap(m=>({...m,[day]:{...m[day]!,openTime:e.target.value}}))} style={tInp}/>
                    <span style={{ fontSize:11,color:dark?"#334155":"#94a3b8",fontWeight:700 }}>–</span>
                    <input type="time" value={p!.closeTime} onChange={e=>setDayMap(m=>({...m,[day]:{...m[day]!,closeTime:e.target.value}}))} style={tInp}/>
                  </motion.div>
                ) : (
                  <motion.span key="c" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.12 }}
                    style={{ fontSize:12,fontWeight:700,color:dark?"#334155":"#cbd5e1" }}>Closed</motion.span>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </Card>

      <Card title="More Hours" icon={<Clock size={13}/>} dark={dark} badge={`${more.length} types`}>
        <p style={{ ...s.muted,marginBottom:10 }}>Add separate hours for delivery, drive-through, happy hour, kitchen, etc.</p>
        {more.map((mh,i)=>(
          <div key={i} style={{ marginBottom:10,padding:"10px 12px",borderRadius:14,border:`1.5px solid ${dark?"rgba(255,255,255,0.06)":"rgba(203,213,225,0.4)"}` }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8 }}>
              <span style={{ fontSize:12,fontWeight:800,color:dark?"#93c5fd":"#1d4ed8" }}>{MORE_HOURS_TYPES.find(t=>t.id===mh.hoursTypeId)?.l ?? mh.hoursTypeId}</span>
              <motion.button whileTap={{ scale:0.92 }} onClick={()=>setMore(m=>m.filter((_,j)=>j!==i))}
                style={{ width:24,height:24,borderRadius:8,border:"none",cursor:"pointer",background:dark?"rgba(239,68,68,0.1)":"rgba(254,226,226,0.6)",color:"#ef4444",display:"flex",alignItems:"center",justifyContent:"center" }}>
                <X size={11}/>
              </motion.button>
            </div>
            {DAYS.map(day=>{
              const p = mh.periods.find(p=>p.openDay===day);
              return (
                <div key={day} style={{ display:"flex",alignItems:"center",gap:7,marginBottom:5 }}>
                  <span style={{ width:32,fontSize:11,fontWeight:700,color:dark?"#475569":"#94a3b8" }}>{DSHRT[day].slice(0,2)}</span>
                  <Tog value={!!p} onChange={open=>setMore(m=>m.map((x,j)=>j!==i?x:{...x,periods:open?[...x.periods,{openDay:day,closeDay:day,openTime:"09:00",closeTime:"17:00"}]:x.periods.filter(p=>p.openDay!==day)}))} dark={dark}/>
                  {p && <div style={{ display:"flex",alignItems:"center",gap:4 }}>
                    <input type="time" value={p.openTime} style={{ ...tInp,width:74 }} onChange={e=>setMore(m=>m.map((x,j)=>j!==i?x:{...x,periods:x.periods.map(pp=>pp.openDay===day?{...pp,openTime:e.target.value}:pp)}))}/>
                    <span style={{ fontSize:10,color:dark?"#334155":"#94a3b8" }}>–</span>
                    <input type="time" value={p.closeTime} style={{ ...tInp,width:74 }} onChange={e=>setMore(m=>m.map((x,j)=>j!==i?x:{...x,periods:x.periods.map(pp=>pp.openDay===day?{...pp,closeTime:e.target.value}:pp)}))}/>
                  </div>}
                </div>
              );
            })}
          </div>
        ))}
        <motion.button whileTap={{ scale:0.97 }} onClick={()=>setMorePanel(v=>!v)}
          style={{ display:"flex",alignItems:"center",gap:6,padding:"9px 13px",width:"100%",borderRadius:12,border:`1.5px dashed ${dark?"rgba(59,130,246,0.25)":"rgba(147,197,253,0.5)"}`,background:"transparent",cursor:"pointer",fontSize:12,fontWeight:700,color:"#3b82f6",justifyContent:"center" }}>
          <Plus size={12}/> Add hours type
        </motion.button>
        <AnimatePresence>
          {morePanel && (
            <motion.div initial={{ opacity:0,y:4 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:4 }} style={{ marginTop:10,display:"flex",flexWrap:"wrap",gap:7 }}>
              {MORE_HOURS_TYPES.filter(t=>!more.find(m=>m.hoursTypeId===t.id)).map(t=>(
                <motion.button key={t.id} whileTap={{ scale:0.94 }} onClick={()=>{setMore(m=>[...m,{hoursTypeId:t.id,periods:[]}]);setMorePanel(false);}}
                  style={{ padding:"6px 12px",borderRadius:10,border:`1.5px solid ${dark?"rgba(59,130,246,0.2)":"rgba(147,197,253,0.45)"}`,background:"transparent",cursor:"pointer",fontSize:11.5,fontWeight:700,color:"#3b82f6" }}>
                  {t.l}
                </motion.button>
              ))}
              <motion.button whileTap={{ scale:0.94 }} onClick={()=>setMorePanel(false)}
                style={{ padding:"6px 12px",borderRadius:10,border:"none",background:"transparent",cursor:"pointer",fontSize:11.5,fontWeight:700,color:dark?"#475569":"#94a3b8" }}>Cancel</motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      <Card title="Special Hours" icon={<Star size={13}/>} dark={dark} badge={special.length?`${special.length} dates`:undefined}>
        <p style={{ ...s.muted,marginBottom:10 }}>Override hours for holidays or temporary closures.</p>
        {special.map((sp,i)=>(
          <div key={i} style={{ display:"flex",alignItems:"center",gap:9,marginBottom:8,padding:"9px 12px",borderRadius:13,border:`1.5px solid ${dark?"rgba(255,255,255,0.06)":"rgba(203,213,225,0.4)"}` }}>
            <p style={{ flex:1,fontSize:11.5,fontWeight:700,color:dark?"#e2e8f0":"#1e293b",margin:0 }}>
              {sp.startDate.day}/{sp.startDate.month}/{sp.startDate.year}{sp.closed?" · Closed":` · ${sp.openTime}–${sp.closeTime}`}
            </p>
            <motion.button whileTap={{ scale:0.92 }} onClick={()=>setSpecial(s=>s.filter((_,j)=>j!==i))}
              style={{ width:26,height:26,borderRadius:8,border:"none",cursor:"pointer",background:dark?"rgba(239,68,68,0.1)":"rgba(254,226,226,0.6)",color:"#ef4444",display:"flex",alignItems:"center",justifyContent:"center" }}>
              <X size={11}/>
            </motion.button>
          </div>
        ))}
        <motion.button whileTap={{ scale:0.97 }}
          onClick={()=>setSpecial(s=>[...s,{startDate:{year:new Date().getFullYear(),month:new Date().getMonth()+1,day:new Date().getDate()},endDate:{year:new Date().getFullYear(),month:new Date().getMonth()+1,day:new Date().getDate()},closed:true}])}
          style={{ display:"flex",alignItems:"center",gap:6,padding:"9px 13px",width:"100%",borderRadius:12,border:`1.5px dashed ${dark?"rgba(59,130,246,0.25)":"rgba(147,197,253,0.5)"}`,background:"transparent",cursor:"pointer",fontSize:12,fontWeight:700,color:"#3b82f6",justifyContent:"center" }}>
          <Plus size={12}/> Add special date
        </motion.button>
      </Card>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════
   MORE (ATTRIBUTES) TAB
   PATCH /v1/locations/{id}/attributes?attributeMask=...
════════════════════════════════════════════════════════ */
function MoreTab({ dark }: { dark:boolean }) {
  const [a, setA] = useState({
    wheelchair_accessible_entrance:false,wheelchair_accessible_seating:false,
    wheelchair_accessible_restroom:false,wheelchair_accessible_parking:false,
    assistive_hearing_loop:false,lgbtq_friendly:false,transgender_safe:false,
    women_led:false,accepts_cash:true,accepts_credit_cards:true,
    accepts_debit_cards:true,accepts_nfc_payment:false,has_online_care:false,
    appointment_required:true,online_appointments:true,onsite_services:true,
    parking_free_street:true,parking_free_lot:true,parking_paid_lot:false,
    parking_free_garage:false,parking_paid_garage:false,parking_valet:false,
    free_wifi:false,paid_wifi:false,no_wifi:false,
  });
  const t = (k:string) => setA(x=>({...x,[k]:!(x as any)[k]}));
  const SECS = [
    { title:"Accessibility",icon:<Users size={13}/>,rows:[{k:"wheelchair_accessible_entrance",l:"Wheelchair-accessible entrance"},{k:"wheelchair_accessible_seating",l:"Wheelchair-accessible seating"},{k:"wheelchair_accessible_restroom",l:"Wheelchair-accessible restroom"},{k:"wheelchair_accessible_parking",l:"Wheelchair-accessible parking"},{k:"assistive_hearing_loop",l:"Assistive hearing loop"}] },
    { title:"Inclusivity",  icon:<Star size={13}/>, rows:[{k:"lgbtq_friendly",l:"LGBTQ+ friendly"},{k:"transgender_safe",l:"Transgender safe space"},{k:"women_led",l:"Women-led"}] },
    { title:"Payments",     icon:<Layers size={13}/>,rows:[{k:"accepts_cash",l:"Cash"},{k:"accepts_credit_cards",l:"Credit cards"},{k:"accepts_debit_cards",l:"Debit cards"},{k:"accepts_nfc_payment",l:"Contactless / UPI"}] },
    { title:"Service Options",icon:<Settings size={13}/>,rows:[{k:"onsite_services",l:"On-site services"},{k:"online_appointments",l:"Online appointments"},{k:"appointment_required",l:"Appointment required"},{k:"has_online_care",l:"Online care"}] },
    { title:"Parking",      icon:<Car size={13}/>,  rows:[{k:"parking_free_street",l:"Free street"},{k:"parking_free_lot",l:"Free lot"},{k:"parking_paid_lot",l:"Paid lot"},{k:"parking_free_garage",l:"Free garage"},{k:"parking_paid_garage",l:"Paid garage"},{k:"parking_valet",l:"Valet"}] },
    { title:"Wi-Fi",        icon:<Wifi size={13}/>, rows:[{k:"free_wifi",l:"Free Wi-Fi"},{k:"paid_wifi",l:"Paid Wi-Fi"},{k:"no_wifi",l:"No Wi-Fi"}] },
  ];
  return (
    <motion.div variants={stag} initial="hidden" animate="show">
      {SECS.map(sec=>(
        <Card key={sec.title} title={sec.title} icon={sec.icon} dark={dark}>
          <div style={{ display:"flex",flexDirection:"column" }}>
            {sec.rows.map(r=><TR key={r.k} label={r.l} value={(a as any)[r.k]} onChange={()=>t(r.k)} dark={dark}/>)}
          </div>
        </Card>
      ))}
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════
   ADVANCED TAB
   updateMask: serviceItems, labels, languageCode, relationshipData
════════════════════════════════════════════════════════ */
function AdvancedTab({ draft, upd, dark }: { draft:LocationDraft; upd:(p:Partial<LocationDraft>,f:string[])=>void; dark:boolean }) {
  const [svcs,  setSvcs]  = useState(draft.serviceItems);
  const [labels,setLbls]  = useState(draft.labels);
  const [chain, setChain] = useState(draft.relationshipData.parentChain??"");
  const [lang,  setLang]  = useState(draft.languageCode);

  const commit = () => upd({ serviceItems:svcs, labels, languageCode:lang, relationshipData:chain?{parentChain:chain}:{} }, ["serviceItems","labels","languageCode","relationshipData"]);
  const s = tok(dark);

  return (
    <motion.div variants={stag} initial="hidden" animate="show" onBlur={commit}>
      <Card title="Service Items" icon={<FileText size={13}/>} dark={dark} badge="serviceItems">
        <p style={{ ...s.muted,marginBottom:10 }}>Services your business offers. Supports free-form and Google structured types.</p>
        <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
          {svcs.map((svc,i)=>{
            const lbl = svc.freeFormServiceItem?.label.displayName ?? svc.structuredServiceItem?.serviceTypeId ?? "";
            const dsc = svc.freeFormServiceItem?.label.description ?? "";
            return (
              <div key={i} style={{ borderRadius:14,border:`1.5px solid ${dark?"rgba(255,255,255,0.06)":"rgba(203,213,225,0.4)"}`,padding:"10px 12px" }}>
                <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:dsc?4:0 }}>
                  <span style={{ fontSize:12.5,fontWeight:800,color:dark?"#e2e8f0":"#1e293b" }}>{lbl}</span>
                  <motion.button whileTap={{ scale:0.92 }} onClick={()=>setSvcs(s=>s.filter((_,j)=>j!==i))}
                    style={{ width:24,height:24,borderRadius:7,border:"none",cursor:"pointer",background:dark?"rgba(239,68,68,0.1)":"rgba(254,226,226,0.6)",color:"#ef4444",display:"flex",alignItems:"center",justifyContent:"center" }}>
                    <X size={10}/>
                  </motion.button>
                </div>
                {dsc && <p style={{ ...s.muted,margin:0 }}>{dsc}</p>}
              </div>
            );
          })}
        </div>
        <AddI placeholder="Add service…" dark={dark} onAdd={v=>setSvcs(s=>[...s,{freeFormServiceItem:{category:"",label:{displayName:v}}}])}/>
      </Card>

      <Card title="Internal Labels" icon={<Hash size={13}/>} dark={dark} badge="labels">
        <FW label="Labels" dark={dark} hint="Not shown to customers. For your own internal organization. Max 10.">
          <div style={{ display:"flex",flexWrap:"wrap",gap:7,marginBottom:4 }}>
            <AnimatePresence>{labels.map((l,i)=><Chip key={l+i} label={l} dark={dark} onRemove={()=>setLbls(ls=>ls.filter((_,j)=>j!==i))}/>)}</AnimatePresence>
          </div>
          <AddI placeholder="Add label…" dark={dark} onAdd={v=>setLbls(ls=>[...ls,v])}/>
        </FW>
      </Card>

      <Card title="Chain Affiliation" icon={<Link2 size={13}/>} dark={dark} badge="relationshipData">
        <FW label="Parent Chain" dark={dark} hint="If part of a chain brand. Resource name format: chains/{chainId}.">
          <TI value={chain} onChange={setChain} dark={dark} placeholder="chains/{chainId}"/>
        </FW>
      </Card>

      <Card title="Language" icon={<Globe size={13}/>} dark={dark}>
        <FW label="Language Code" required dark={dark} hint="BCP 47 tag for profile content (e.g. en, en-IN, hi).">
          <TI value={lang} onChange={setLang} dark={dark} placeholder="en"/>
        </FW>
      </Card>

      <Card title="Profile Metadata" icon={<BarChart2 size={13}/>} dark={dark} badge="Read-only">
        {[
          { l:"Location Resource Name", v:"locations/8458234036949018584" },
          { l:"Maps URI",               v:"https://maps.google.com/?cid=8458234036949018584" },
          { l:"New Review URI",         v:"https://search.google.com/local/writereview?placeid=..." },
          { l:"Can Operate",            v:"true" },
          { l:"Has Pending Edits",      v:"false" },
        ].map((row,i)=>(
          <div key={i} style={{ padding:"8px 0",borderBottom:i<4?s.div.borderTop:"none" }}>
            <p style={{ ...s.lbl,marginBottom:2 }}>{row.l}</p>
            <p style={{ fontSize:11,fontFamily:"monospace",fontWeight:600,margin:0,color:dark?"#60a5fa":"#2563eb",wordBreak:"break-all" }}>{row.v}</p>
          </div>
        ))}
      </Card>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════
   SETTINGS DRAWER
════════════════════════════════════════════════════════ */
function SettingsDrawer({ dark, onClose }: { dark:boolean; onClose:()=>void }) {
  const s = tok(dark);
  const people = [
    {n:"VT Blogs",          r:"Primary owner",email:"tbipin021@gmail.com",    i:"VT",h:210},
    {n:"vipprow",           r:"Owner",        email:"vipprowdigital@gmail.com",i:"V", h:250,you:true},
    {n:"Sneha Harchandwani",r:"Manager",      email:"sharchandwani@gmail.com", i:"SH",h:280},
    {n:"Vipprow Contact",   r:"Owner",        email:"vipprowcontact@gmail.com",i:"VC",h:200},
  ];
  const acts = [
    {icon:<Users size={14}/>,   t:"People & Access",       d:"Add or remove managers",  c:"#3b82f6"},
    {icon:<Settings size={14}/>,t:"Advanced Settings",     d:"Profile ID, store codes", c:"#8b5cf6"},
    {icon:<Link2 size={14}/>,   t:"Linked Accounts",       d:"Google Ads, Merchant",    c:"#22c55e"},
    {icon:<MessageSquare size={14}/>,t:"Manage Reviews",   d:"Reply & flag reviews",    c:"#f59e0b"},
    {icon:<Trash2 size={14}/>,  t:"Remove Profile",        d:"Mark closed or delete",   c:"#ef4444",danger:true},
  ];
  return (
    <motion.div initial={{ y:"100%" }} animate={{ y:0 }} exit={{ y:"100%" }}
      transition={{ duration:0.3,ease:[0.22,1,0.36,1] as any }}
      style={{ position:"fixed",bottom:0,left:0,right:0,zIndex:50,borderRadius:"22px 22px 0 0",overflow:"hidden",maxHeight:"88vh",overflowY:"auto",background:dark?"#0d1829":"#fff",boxShadow:"0 -16px 60px rgba(0,0,0,0.3)" }}>
      <div style={{ display:"flex",justifyContent:"center",padding:"12px 0 6px" }}>
        <div style={{ width:34,height:4,borderRadius:99,background:dark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.1)" }}/>
      </div>
      <div style={{ padding:"8px 18px 12px",borderBottom:`1px solid ${dark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.07)"}` }}>
        <h2 style={{ fontSize:15,fontWeight:900,letterSpacing:"-0.03em",color:dark?"#fff":"#0f172a",margin:0 }}>Profile Settings</h2>
      </div>
      {/* Profile ID */}
      <div style={{ margin:"12px 18px 0",padding:"10px 13px",borderRadius:14,background:dark?"rgba(255,255,255,0.03)":"#f8fafc",border:`1px solid ${dark?"rgba(255,255,255,0.05)":"rgba(203,213,225,0.5)"}` }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <div>
            <p style={{ ...s.lbl,marginBottom:2 }}>Business Profile ID</p>
            <p style={{ fontSize:12,fontFamily:"monospace",fontWeight:700,margin:0,color:dark?"#60a5fa":"#2563eb" }}>8458234036949018584</p>
          </div>
          <motion.button whileTap={{ scale:0.9 }} onClick={()=>navigator.clipboard?.writeText("8458234036949018584")}
            style={{ width:30,height:30,borderRadius:9,border:"none",cursor:"pointer",background:dark?"rgba(59,130,246,0.1)":"rgba(219,234,254,0.6)",color:"#3b82f6",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <Copy size={12}/>
          </motion.button>
        </div>
      </div>
      {/* Actions */}
      <div style={{ padding:"8px 0 4px" }}>
        {acts.map((a,i)=>(
          <motion.button key={i} whileTap={{ scale:0.99 }}
            style={{ width:"100%",display:"flex",alignItems:"center",gap:13,padding:"13px 18px",border:"none",background:"transparent",cursor:"pointer",textAlign:"left" }}>
            <div style={{ width:34,height:34,borderRadius:11,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:`${a.c}16`,color:a.c }}>{a.icon}</div>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:13,fontWeight:700,margin:"0 0 1px",color:(a as any).danger?"#ef4444":dark?"#e2e8f0":"#1e293b" }}>{a.t}</p>
              <p style={{ ...s.muted,margin:0 }}>{a.d}</p>
            </div>
            <ChevronRight size={13} style={{ color:dark?"#1e3a5c":"#cbd5e1" }}/>
          </motion.button>
        ))}
      </div>
      {/* People */}
      <div style={{ margin:"4px 18px 0",padding:"12px 14px",borderRadius:16,border:`1.5px solid ${dark?"rgba(255,255,255,0.06)":"rgba(203,213,225,0.4)"}`,background:dark?"rgba(255,255,255,0.02)":"#f8fafc" }}>
        <p style={{ ...s.lbl,marginBottom:10 }}>People with access</p>
        {people.map((p,i)=>(
          <div key={i} style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<people.length-1?s.div.borderTop:"none" }}>
            <div style={{ width:30,height:30,borderRadius:"50%",flexShrink:0,background:`hsl(${p.h},55%,${dark?32:68}%)`,display:"flex",alignItems:"center",justifyContent:"center" }}>
              <span style={{ fontSize:11,fontWeight:800,color:"#fff" }}>{p.i}</span>
            </div>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ display:"flex",alignItems:"center",gap:5 }}>
                <p style={{ fontSize:12,fontWeight:700,margin:0,color:dark?"#e2e8f0":"#1e293b",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:110 }}>{p.n}</p>
                {(p as any).you && <span style={{ ...s.bdg("#3b82f6") }}>you</span>}
              </div>
              <p style={{ ...s.muted,margin:"1px 0 0" }}>{p.r}</p>
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding:"14px 18px 32px" }}>
        <motion.button whileTap={{ scale:0.98 }} onClick={onClose}
          style={{ width:"100%",padding:"13px 20px",borderRadius:16,border:"none",background:dark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.05)",cursor:"pointer",fontSize:13,fontWeight:700,color:dark?"#64748b":"#64748b" }}>
          Close
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════
   ROOT PAGE
════════════════════════════════════════════════════════ */
export default function GoogleProfileEditPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(()=>setMounted(true),[]);
  const dark = mounted && resolvedTheme==="dark";
  const router = useRouter();
  const LOCATION_ID = "8458234036949018584";

  const [tab,   setTab]   = useState<Tab>("about");
  const [draft, setDraft] = useState<LocationDraft>(INITIAL);
  const [showSettings, setShowSettings] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle"|"saving"|"saved"|"error">("idle");

  const pending = useRef<{payload:Partial<LocationDraft>;fields:string[]}>({payload:{},fields:[]});

  function accumulate(partial: Partial<LocationDraft>, fields: string[]) {
    pending.current.payload = {...pending.current.payload,...partial};
    pending.current.fields  = [...new Set([...pending.current.fields,...fields])];
    setDraft(d=>({...d,...partial}));
  }

  const saveMut = useMutation({
    mutationFn: ()=>patchLocation(LOCATION_ID, pending.current.payload, pending.current.fields),
    onMutate:  ()=>setSaveStatus("saving"),
    onSuccess: ()=>{ setSaveStatus("saved"); pending.current={payload:{},fields:[]}; setTimeout(()=>setSaveStatus("idle"),2800); },
    onError:   ()=>{ setSaveStatus("error"); setTimeout(()=>setSaveStatus("idle"),4000); },
  });

  const TABS: {id:Tab;label:string;icon:React.ReactNode}[] = [
    {id:"about",    label:"About",      icon:<Info size={12}/>},
    {id:"contact",  label:"Contact",    icon:<Phone size={12}/>},
    {id:"location", label:"Location",   icon:<MapPin size={12}/>},
    {id:"hours",    label:"Hours",      icon:<Clock size={12}/>},
    {id:"more",     label:"Attributes", icon:<Layers size={12}/>},
    {id:"advanced", label:"Advanced",   icon:<Settings size={12}/>},
  ];

  const bg = dark ? "linear-gradient(150deg,#050d1a,#080f1e)" : "linear-gradient(150deg,#eef4ff,#f0f5ff)";

  return (
    <div style={{ minHeight:"100vh",background:bg,fontFamily:"-apple-system,'SF Pro Text',sans-serif",transition:"background 0.3s" }}>
      <AnimatePresence>
        {showSettings && <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={()=>setShowSettings(false)} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:40 }}/>}
      </AnimatePresence>
      <AnimatePresence>{showSettings && <SettingsDrawer dark={dark} onClose={()=>setShowSettings(false)}/>}</AnimatePresence>

      <div style={{ maxWidth:440,margin:"0 auto",padding:"0 15px",position:"relative",zIndex:1 }}>

        {/* HEADER */}
        <motion.div initial={{ opacity:0,y:-10 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.27 }}
          style={{ display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:15,paddingBottom:10 }}>
          <div style={{ display:"flex",alignItems:"center",gap:9 }}>
            <motion.button onClick={()=>router.back()} whileTap={{ scale:0.88 }}
              style={{ width:34,height:34,borderRadius:11,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",background:dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.06)",color:dark?"#94a3b8":"#64748b" }}>
              <ArrowLeft size={14}/>
            </motion.button>
            <div>
              <h1 style={{ fontSize:15,fontWeight:900,letterSpacing:"-0.03em",margin:0,color:dark?"#fff":"#0f172a" }}>Business Information</h1>
              <p style={{ fontSize:10,fontWeight:600,margin:"2px 0 0",color:dark?"#334155":"#94a3b8" }}>Google Business Profile · API v1</p>
            </div>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:7 }}>
            <AnimatePresence><SavePill status={saveStatus} dark={dark}/></AnimatePresence>
            <motion.button onClick={()=>setShowSettings(true)} whileTap={{ scale:0.9 }}
              style={{ width:32,height:32,borderRadius:10,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",background:dark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.06)",color:dark?"#94a3b8":"#64748b" }}>
              <Settings size={13}/>
            </motion.button>
            <motion.button onClick={()=>saveMut.mutate()} disabled={saveMut.isPending} whileTap={{ scale:0.94 }}
              style={{ display:"flex",alignItems:"center",gap:5,padding:"7px 13px",borderRadius:11,border:"none",cursor:saveMut.isPending?"wait":"pointer",background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",color:"#fff",fontSize:12.5,fontWeight:800,boxShadow:"0 4px 14px rgba(37,99,235,0.28)",opacity:saveMut.isPending?0.8:1 }}>
              {saveMut.isPending ? <motion.div animate={{ rotate:360 }} transition={{ duration:0.8,repeat:Infinity,ease:"linear" }}><RefreshCw size={11}/></motion.div> : <Save size={11}/>}
              {saveMut.isPending?"Saving":"Save"}
            </motion.button>
          </div>
        </motion.div>

        {/* TAB BAR */}
        <div style={{ display:"flex",gap:5,overflowX:"auto",paddingBottom:11,scrollbarWidth:"none" } as React.CSSProperties}>
          {TABS.map(t=>{
            const active = tab===t.id;
            return (
              <motion.button key={t.id} onClick={()=>setTab(t.id)} whileTap={{ scale:0.95 }}
                style={{ display:"flex",alignItems:"center",gap:5,padding:"6px 11px",borderRadius:11,border:"1.5px solid",flexShrink:0,
                  borderColor:active?"#3b82f6":dark?"rgba(255,255,255,0.06)":"rgba(203,213,225,0.55)",
                  background:active?(dark?"rgba(37,99,235,0.16)":"rgba(219,234,254,0.55)"):"transparent",
                  color:active?"#3b82f6":dark?"#475569":"#94a3b8",
                  fontSize:11.5,fontWeight:700,cursor:"pointer",transition:"all 0.16s",whiteSpace:"nowrap" as const }}>
                {t.icon}{t.label}
              </motion.button>
            );
          })}
        </div>

        {/* CONTENT */}
        <div style={{ paddingBottom:48 }}>
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-5 }} transition={{ duration:0.2 }}>
              {tab==="about"    && <AboutTab    draft={draft} upd={accumulate} dark={dark}/>}
              {tab==="contact"  && <ContactTab  draft={draft} upd={accumulate} dark={dark}/>}
              {tab==="location" && <LocationTab draft={draft} upd={accumulate} dark={dark}/>}
              {tab==="hours"    && <HoursTab    draft={draft} upd={accumulate} dark={dark}/>}
              {tab==="more"     && <MoreTab dark={dark}/>}
              {tab==="advanced" && <AdvancedTab draft={draft} upd={accumulate} dark={dark}/>}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* FOOTER */}
        <div style={{ borderTop:`1px solid ${dark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.05)"}`,paddingTop:14,paddingBottom:32 }}>
          <p style={{ fontSize:10,color:dark?"#1e3a5c":"#cbd5e1",fontWeight:500,lineHeight:1.7,margin:"0 0 10px",textAlign:"center" }}>
            Changes are sent to Google Business Profile via the Business Information API (v1). Updates may take a few minutes to reflect on Search & Maps.
          </p>
          <a href="https://business.google.com" target="_blank" rel="noopener noreferrer"
            style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:5,fontSize:11,color:"#3b82f6",fontWeight:700,textDecoration:"none" }}>
            <ExternalLink size={10}/> Open Google Business Profile
          </a>
        </div>
      </div>
    </div>
  );
}
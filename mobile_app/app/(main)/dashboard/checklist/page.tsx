// mobile_app\app\(main)\dashboard\checklist\page.tsx

"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import {
  Building2, Tag, FileText, Clock, Phone, MapPin, Globe, Image as Img,
  Camera, Video, ShoppingBag, Star, MessageSquare, Zap, BarChart2,
  ChevronDown, ChevronRight, Check, X, Brain, Sparkles, Wand2,
  TrendingUp, Target, Award, Flame, Eye, Shield, Lock, ArrowUpRight,
  ScanLine, Cpu, AlertCircle, Info, RefreshCw, ChevronUp, Navigation,
  Hash, PlayCircle, Users, Share2, Layers, Bookmark, Settings,
  CheckCircle2, Circle, ExternalLink, Copy, Lightbulb, Activity,
} from "lucide-react";

/* ════════════════════════════════════════════════════════════════════
   TYPES
════════════════════════════════════════════════════════════════════ */
type Impact  = "critical" | "high" | "medium" | "low";
type Status  = "complete" | "partial" | "missing" | "na";
type APISource = "read_only" | "read_write";

interface GoogleAPIField {
  fieldPath: string;      // actual GBP API field path
  endpoint: string;       // which API endpoint
  readable: boolean;
  writable: boolean;
}

interface CheckItem {
  id:        string;
  title:     string;
  points:    number;
  impact:    Impact;
  status:    Status;
  apiField:  GoogleAPIField;
  what:      string;
  why:       string;
  how:       string;
  aiInsight: string;
  googleDoc: string;      // link text to relevant google docs
  icon:      React.ReactNode;
  unit?:     string;      // e.g. "characters", "photos", "reviews"
  current?:  string;      // mock current value from Google API
  target?:   string;      // target value
}

interface Category {
  id:    string;
  label: string;
  icon:  React.ReactNode;
  color: string;
  accent: string;         // lighter version for backgrounds
  items: CheckItem[];
}

/* ════════════════════════════════════════════════════════════════════
   SCORE / IMPACT CONFIG
════════════════════════════════════════════════════════════════════ */
const IMP: Record<Impact, { label: string; color: string; glow: string; dot: string }> = {
  critical: { label: "Critical", color: "#f87171", glow: "rgba(248,113,113,0.25)", dot: "#ef4444" },
  high:     { label: "High",     color: "#fb923c", glow: "rgba(251,146,60,0.25)",  dot: "#f97316" },
  medium:   { label: "Medium",   color: "#fbbf24", glow: "rgba(251,191,36,0.2)",   dot: "#f59e0b" },
  low:      { label: "Low",      color: "#4ade80", glow: "rgba(74,222,128,0.2)",   dot: "#22c55e" },
};

const STATUS_CFG: Record<Status, { label: string; color: string; bg: string; icon: React.ReactNode; pts: number }> = {
  complete: { label: "Complete", color: "#4ade80", bg: "rgba(74,222,128,0.12)", icon: <Check size={10}/>,  pts: 1.0 },
  partial:  { label: "Partial",  color: "#fbbf24", bg: "rgba(251,191,36,0.12)", icon: <Target size={10}/>, pts: 0.4 },
  missing:  { label: "Missing",  color: "#f87171", bg: "rgba(248,113,113,0.1)", icon: <X size={10}/>,      pts: 0.0 },
  na:       { label: "N/A",      color: "#64748b", bg: "rgba(100,116,139,0.1)", icon: <Bookmark size={10}/>, pts: 0.0 },
};

/* ════════════════════════════════════════════════════════════════════
   CHECKLIST DATA — 30 items, 1000 pts, ALL sourced from real GBP API
   Fields: accounts.locations.*  (v1 / Business Profile API)
════════════════════════════════════════════════════════════════════ */
const CATEGORIES: Category[] = [
  /* ── 1. CORE IDENTITY ── */
  {
    id: "identity", label: "Business Identity", color: "#3b82f6", accent: "#1d3a6e",
    icon: <Building2 size={15}/>,
    items: [
      {
        id: "name", title: "Business Name — Exact Match",
        points: 80, impact: "critical", status: "complete",
        icon: <Building2 size={13}/>,
        apiField: { fieldPath: "location.title", endpoint: "PATCH /v1/accounts/{accountId}/locations/{locationId}", readable: true, writable: true },
        what: "The exact legal or trading name of your business as it appears on your signage, website, and official documents.",
        why: "Google cross-checks your name across 200+ citation sources. Keyword-stuffed names (e.g. 'Best Dentist Jabalpur Sharma Clinic') trigger spam filters causing 3–5 position ranking drops. Exact-match names build NAP consistency — the #3 local ranking factor.",
        how: "Edit Profile → Business name. Match exactly to: your shopfront sign, your website's <title> tag, and your Facebook page name. Remove all city/keyword additions. One exception: if 'Dr.' or professional suffix is genuinely part of your brand, keep it.",
        aiInsight: "Businesses with keyword-stuffed names are penalised by Google's Quality Algorithm (introduced 2020). Exact-match names rank 38% higher in the local 3-pack on average.",
        googleDoc: "Business Profile API: locations.title",
        unit: "characters", current: "RudrakshaWala", target: "Exact match only",
      },
      {
        id: "primary_cat", title: "Primary Category — Best-Fit",
        points: 90, impact: "critical", status: "complete",
        icon: <Tag size={13}/>,
        apiField: { fieldPath: "location.categories.primaryCategory", endpoint: "PATCH /v1/accounts/{accountId}/locations/{locationId}", readable: true, writable: true },
        what: "The single Google-defined category that most precisely describes what your business does as its main activity.",
        why: "Primary category is Google's #1 local ranking signal — it determines which search intent pools you appear in. An incorrect or generic category (e.g., 'Store' instead of 'Spiritual Jewelry Store') can cost you 60% of relevant impressions.",
        how: "Search Google's category taxonomy (3,500+ options). Use the most specific sub-category available. Test: search for your competitors and note their categories via mobile GBP cards. Change yours to match the highest-ranking competitor's category if it fits your business better.",
        aiInsight: "Primary category drives 64% of all local search impressions. Switching from a parent to a child category (e.g., 'Health' → 'Ayurvedic Clinic') doubles search visibility on average within 30 days.",
        googleDoc: "locations.categories.primaryCategory",
        current: "Spiritual goods store", target: "Most specific match",
      },
      {
        id: "secondary_cats", title: "Secondary Categories (3–5)",
        points: 40, impact: "high", status: "partial",
        icon: <Layers size={13}/>,
        apiField: { fieldPath: "location.categories.additionalCategories", endpoint: "PATCH /v1/accounts/{accountId}/locations/{locationId}", readable: true, writable: true },
        what: "Up to 9 additional categories that describe other services/products you offer alongside your primary business.",
        why: "Each secondary category expands your search surface. Businesses with 3–5 additional categories receive 43% more discovery searches. They also help Google understand your full service scope for 'near me' queries.",
        how: "Add categories for every major service line. E.g., a jewellery store might add: Religious goods store, Gift shop, Bead store, Arts & crafts store. Don't use unrelated categories — that can trigger quality issues.",
        aiInsight: "You currently have 1 secondary category. Adding 2–4 more relevant ones could unlock ~340 additional monthly searches based on your primary category benchmark.",
        googleDoc: "locations.categories.additionalCategories",
        current: "1 of up to 9 added", target: "3–5 relevant categories",
      },
      {
        id: "description", title: "Business Description (750 chars)",
        points: 50, impact: "high", status: "missing",
        icon: <FileText size={13}/>,
        apiField: { fieldPath: "location.profile.description", endpoint: "PATCH /v1/accounts/{accountId}/locations/{locationId}", readable: true, writable: true },
        what: "A 750-character plain-text description of your business that appears on your Knowledge Panel and Maps listing.",
        why: "Descriptions are indexed by Google as profile content. Users who read your description convert 2.8× more. Descriptions containing your service keywords and city name give Google stronger context signals for ranking.",
        how: "Write 2–3 paragraphs: (1) What you do + speciality. (2) Who you serve + where. (3) What makes you different. Include 3–5 naturally placed keywords. Avoid promotional language like 'best', 'cheap', 'guaranteed' — Google filters these.",
        aiInsight: "Your description is empty — this is one of the largest gaps in your profile. Businesses with complete descriptions get 7× more profile clicks. AI can generate a keyword-optimised draft in seconds.",
        googleDoc: "locations.profile.description",
        unit: "characters", current: "0 / 750", target: "700–750 characters",
      },
      {
        id: "opening_date", title: "Opening Date",
        points: 20, impact: "low", status: "complete",
        icon: <Clock size={13}/>,
        apiField: { fieldPath: "location.openInfo.openingDate", endpoint: "PATCH /v1/accounts/{accountId}/locations/{locationId}", readable: true, writable: true },
        what: "The official date your business first opened to the public.",
        why: "Google displays your business age ('Open since 2019') which builds trust. Businesses operating 5+ years see a subtle authority boost in competitive niches. The date also feeds the 'established' signal in Google's trust score.",
        how: "Edit Profile → More → Opening Date. Use your actual opening date even if it was years ago. Avoid setting today's date for an old business — that erases your trust history.",
        aiInsight: "Your business age is a positive trust signal. Ensure this is accurately set — incorrect dates reset your trust score history in Google's quality evaluator.",
        googleDoc: "locations.openInfo.openingDate",
        current: "Set correctly", target: "Actual opening date",
      },
    ],
  },

  /* ── 2. CONTACT & LOCATION ── */
  {
    id: "contact", label: "Contact & Location", color: "#06b6d4", accent: "#0c3244",
    icon: <MapPin size={15}/>,
    items: [
      {
        id: "phone", title: "Primary Phone — Local Number",
        points: 60, impact: "critical", status: "complete",
        icon: <Phone size={13}/>,
        apiField: { fieldPath: "location.phoneNumbers.primaryPhone", endpoint: "PATCH /v1/accounts/{accountId}/locations/{locationId}", readable: true, writable: true },
        what: "A local phone number (with area code) displayed as your primary contact on the listing.",
        why: "Local numbers generate 78% more trust than toll-free numbers. Google also uses phone NAP consistency (same number across all citations) as a major ranking signal. Mismatched numbers across directories create 'conflicting signals' that suppress rankings.",
        how: "Use a real local number with your city code. If you use call-tracking numbers, keep the local number as primary and add the tracking number as additional. Ensure this number is identical across: GBP, website, Facebook, JustDial, Sulekha, IndiaMart.",
        aiInsight: "Your phone number is set. Verify it matches across all 12+ major citation sources. Even 1 mismatch in area code format (+91 vs 0) can suppress your local pack ranking.",
        googleDoc: "locations.phoneNumbers.primaryPhone",
        current: "+91 XXXXXXXXXX", target: "Local number, consistent across citations",
      },
      {
        id: "address", title: "Address — Verified & Pin-Precise",
        points: 70, impact: "critical", status: "complete",
        icon: <MapPin size={13}/>,
        apiField: { fieldPath: "location.storefrontAddress", endpoint: "PATCH /v1/accounts/{accountId}/locations/{locationId}", readable: true, writable: true },
        what: "Your exact street address with the map pin placed precisely on your building entrance — verified via Google postcard, phone, or video call.",
        why: "Unverified profiles CANNOT appear in the local 3-pack. Incorrect pin placement affects distance calculations — a 500m error can cost 2 ranking positions for 'near me' searches. Verified businesses get 4× more calls.",
        how: "Verification: Profile → Verify → choose postcard/phone/video. Pin: Search your business → 'Suggest an edit' → drag pin to exact entrance. Consider the view from street level — set pin where Google Maps navigation would drop customers.",
        aiInsight: "Your address is verified. Check your pin placement quarterly — Google's Street View updates can shift pins automatically. An accurate pin increases direction requests by 29%.",
        googleDoc: "locations.storefrontAddress",
        current: "Verified ✓", target: "Precise pin + verified",
      },
      {
        id: "website", title: "Website URL",
        points: 50, impact: "high", status: "complete",
        icon: <Globe size={13}/>,
        apiField: { fieldPath: "location.websiteUri", endpoint: "PATCH /v1/accounts/{accountId}/locations/{locationId}", readable: true, writable: true },
        what: "The URL that Google links from your profile — ideally a landing page relevant to your primary service.",
        why: "Website clicks are a conversion signal that loops back into ranking. Missing URL reduces profile completeness by 20–30%. Linking to a specific landing page (not just homepage) increases conversion rate by 45%.",
        how: "Don't just link to your homepage. If you primarily sell a specific product, link to that page. Ensure the linked page loads under 3 seconds and is mobile-optimised — Google checks this. Add UTM parameters to track GBP traffic.",
        aiInsight: "Consider linking to a location-specific landing page rather than your root domain. Pages with schema markup matching your GBP category get 2× more 'website' clicks from the profile.",
        googleDoc: "locations.websiteUri",
        current: "www.rudrakshawala.com", target: "Category-specific landing page",
      },
      {
        id: "hours", title: "Business Hours — All 7 Days",
        points: 60, impact: "critical", status: "partial",
        icon: <Clock size={13}/>,
        apiField: { fieldPath: "location.regularHours", endpoint: "PATCH /v1/accounts/{accountId}/locations/{locationId}", readable: true, writable: true },
        what: "Complete operating hours for every day of the week, including explicit 'Closed' days.",
        why: "Profiles without complete hours show 'Hours not available' — users skip such listings 64% of the time. Accurate hours enable the 'Open now' filter which drives the highest-intent traffic. Wrong hours generate 1-star reviews and frustrated calls.",
        how: "Set all 7 days. For closed days, explicitly mark 'Closed' rather than leaving blank — blank days confuse Google's algorithm. Add special hours for holidays 2–3 weeks in advance to prevent the 'Holiday hours may differ' warning banner.",
        aiInsight: "Weekend hours are missing. 31% of your category's customers search on Saturday. Incomplete hours cost you the 'Open now' filter eligibility on your highest-traffic days.",
        googleDoc: "locations.regularHours",
        current: "Mon–Fri set, Sat–Sun missing", target: "All 7 days + special hours",
      },
      {
        id: "special_hours", title: "Special Hours — Holidays",
        points: 25, impact: "medium", status: "missing",
        icon: <Clock size={13}/>,
        apiField: { fieldPath: "location.specialHours", endpoint: "PATCH /v1/accounts/{accountId}/locations/{locationId}", readable: true, writable: true },
        what: "Overriding hours for public holidays, festivals, and special closures.",
        why: "Google shows a prominent 'Holiday hours may differ' warning banner when special hours are absent — this suppresses clicks by up to 30% during the holiday season. India has 17+ national holidays where customers specifically check hours before visiting.",
        how: "GBP Dashboard → Edit Profile → Special Hours. Add 2–3 weeks before every major holiday: Republic Day, Holi, Eid, Diwali, Christmas, New Year. Set a recurring quarterly reminder to update.",
        aiInsight: "3 upcoming major holidays have no special hours set. The warning banner shown during Diwali season alone could suppress 200–400 potential customer visits.",
        googleDoc: "locations.specialHours",
        current: "0 special hours set", target: "All major holidays covered",
      },
      {
        id: "service_area", title: "Service Area — Defined Zones",
        points: 30, impact: "medium", status: "complete",
        icon: <Navigation size={13}/>,
        apiField: { fieldPath: "location.serviceArea", endpoint: "PATCH /v1/accounts/{accountId}/locations/{locationId}", readable: true, writable: true },
        what: "The geographic regions where you provide services (for businesses that travel to customers).",
        why: "Service area determines your 'near me' search eligibility outside your immediate radius. Businesses with defined service areas rank in 2.3× more locations. You can add up to 20 areas.",
        how: "Edit Profile → Service Area. Add city names, districts, and postal codes for every area you serve. Be specific: 'Jabalpur, Madhya Pradesh' outperforms 'Madhya Pradesh' because it signals precision to Google's distance algorithm.",
        aiInsight: "Expanding service area to include 3 adjacent high-search districts (Katni, Mandla, Narsinghpur) could add ~890 monthly impressions with zero additional cost.",
        googleDoc: "locations.serviceArea",
        current: "Jabalpur set", target: "All served districts/cities",
      },
    ],
  },

  /* ── 3. CONTENT & MEDIA ── */
  {
    id: "media", label: "Photos & Media", color: "#8b5cf6", accent: "#2d1b69",
    icon: <Camera size={15}/>,
    items: [
      {
        id: "logo", title: "Logo Photo — High Resolution",
        points: 30, impact: "high", status: "complete",
        icon: <Camera size={13}/>,
        apiField: { fieldPath: "location.media (category: LOGO)", endpoint: "POST /v1/accounts/{accountId}/locations/{locationId}/media", readable: true, writable: true },
        what: "A square logo image (minimum 250×250px, recommended 720×720px, PNG with transparent background).",
        why: "Logo appears in Knowledge Panel, Maps listing, and search result snippets. Profiles with logos get 5× more website clicks. It's the first brand impression — low resolution logos reduce click-through by 23%.",
        how: "Upload via GBP → Add Photo → Logo. Use PNG with transparent background, square crop, min 720×720px. Ensure readable at 40×40px (thumbnail size). Avoid text-heavy logos — they become illegible when compressed.",
        aiInsight: "Your logo is uploaded. Consider updating if rebranding — a stale logo vs current website creates brand inconsistency that reduces conversion trust.",
        googleDoc: "locations.media (LOGO category)",
        current: "Uploaded", target: "720×720px, under 5MB",
      },
      {
        id: "cover_photo", title: "Cover Photo — Compelling First Impression",
        points: 35, impact: "critical", status: "missing",
        icon: <Img size={13}/>,
        apiField: { fieldPath: "location.media (category: COVER)", endpoint: "POST /v1/accounts/{accountId}/locations/{locationId}/media", readable: true, writable: true },
        what: "The banner image shown at the top of your profile — minimum 1080×608px, ideally 1920×1080px.",
        why: "Cover photo is the #1 most-viewed element of any GBP profile. Businesses with compelling covers see 42% more direction requests and 35% more click-throughs. A blank or poor cover photo signals an abandoned/untrustworthy profile.",
        how: "Use a professional photo (not stock) of your storefront, interior, or best products. Shoot during the golden hour for warm tones. Show people if possible — photos with humans perform 2.6× better. Minimum 1080×608px, under 5MB.",
        aiInsight: "Critical gap: no cover photo detected. This is the most visible element of your profile. Competitors in your category average 1 cover + 3 exterior photos. Fixing this alone could increase profile views by 40%.",
        googleDoc: "locations.media (COVER category)",
        unit: "photos", current: "0 uploaded", target: "1 compelling cover, 1080×608px min",
      },
      {
        id: "exterior_photos", title: "Exterior Photos (3+)",
        points: 30, impact: "high", status: "complete",
        icon: <Camera size={13}/>,
        apiField: { fieldPath: "location.media (category: EXTERIOR)", endpoint: "POST /v1/accounts/{accountId}/locations/{locationId}/media", readable: true, writable: true },
        what: "Photos showing your building facade, signage, parking, and approach from the street.",
        why: "34% of first-time customers cite 'couldn't find the place' as a barrier to their first visit. Exterior photos help wayfinding and signal an established physical presence. Google also uses them for Maps Street View matching.",
        how: "Take photos from: street-level approach, front entrance (sign clearly visible), parking area, and any nearby landmarks. Take in daylight. Add at least one evening/night photo if you're open after dark — it shows your business is lit and approachable.",
        aiInsight: "Your exterior photos are 11+ months old. Refreshing quarterly signals an actively managed profile — a positive recency signal in Google's freshness algorithm.",
        googleDoc: "locations.media (EXTERIOR category)",
        unit: "photos", current: "3 uploaded", target: "5+ exterior photos",
      },
      {
        id: "interior_photos", title: "Interior Photos (5+)",
        points: 40, impact: "high", status: "missing",
        icon: <Img size={13}/>,
        apiField: { fieldPath: "location.media (category: INTERIOR)", endpoint: "POST /v1/accounts/{accountId}/locations/{locationId}/media", readable: true, writable: true },
        what: "Photos showcasing the inside of your business — decor, display areas, ambiance, and workspace.",
        why: "Interior photos reduce first-visit anxiety and increase walk-in conversion by 29%. They're critical for discovery-mode searchers deciding between 3–4 options in the local pack. Google scores profile completeness using photo category coverage.",
        how: "Shoot 8–12 photos: entrance/reception area, main display/service area, unique features (special decor, equipment). Use natural light or warm lighting. Ensure cleanliness and staging. No mirrors reflecting camera. Min 720×720px.",
        aiInsight: "0 interior photos — one of your biggest gaps. Competitors in your category average 12 interior photos. Every missing photo category reduces your 'completeness score' in Google's profile quality system.",
        googleDoc: "locations.media (INTERIOR category)",
        unit: "photos", current: "0 uploaded", target: "8–12 interior photos",
      },
      {
        id: "product_photos", title: "Product/Service Photos (10+)",
        points: 40, impact: "high", status: "partial",
        icon: <ShoppingBag size={13}/>,
        apiField: { fieldPath: "location.media (category: PRODUCT)", endpoint: "POST /v1/accounts/{accountId}/locations/{locationId}/media", readable: true, writable: true },
        what: "Close-up photos of individual products, service work, before/afters, and deliverables.",
        why: "Product photos are the deciding factor for 67% of purchase decisions. Profiles with 10+ product photos receive 94% more total profile views. They also feed Google's product knowledge graph for visual search.",
        how: "Photograph your 10 best-selling products individually on a clean/neutral background. Include: front view, detail close-up, lifestyle/in-use shot. For services: show the process and the result side-by-side. Min 720×720px, under 5MB each.",
        aiInsight: "You have 4 product photos — 6 more needed to reach the top 20% in your category. Upload your highest-margin items first for maximum commercial impact.",
        googleDoc: "locations.media (PRODUCT category)",
        unit: "photos", current: "4 uploaded", target: "15–20 product photos",
      },
      {
        id: "video", title: "Business Video (30sec–3min)",
        points: 40, impact: "medium", status: "missing",
        icon: <Video size={13}/>,
        apiField: { fieldPath: "location.media (mediaFormat: VIDEO)", endpoint: "POST /v1/accounts/{accountId}/locations/{locationId}/media", readable: true, writable: true },
        what: "A short video tour of your business, team in action, or product demonstration. Max 75MB, minimum 720p.",
        why: "Businesses with videos get 41% more web traffic and appear in a premium video carousel in search results. Video is the highest-engagement content type — users spend 3× longer on profiles with video vs without.",
        how: "Film a 30–60 second walkthrough with a modern smartphone: enter your space, pan across the main area, focus on your key products, end with your team. No fancy editing required. Upload directly to GBP (max 75MB). Stabilise with a grip or tripod.",
        aiInsight: "Video is the only media type that appears as a dedicated carousel in Google search results. Even a basic phone video increases profile dwell time by 2.8× and directly correlates with more calls/directions.",
        googleDoc: "locations.media (VIDEO format)",
        unit: "videos", current: "0 uploaded", target: "1+ video, min 720p",
      },
    ],
  },

  /* ── 4. SERVICES & PRODUCTS ── */
  {
    id: "services", label: "Services & Products", color: "#f97316", accent: "#431407",
    icon: <ShoppingBag size={15}/>,
    items: [
      {
        id: "services_menu", title: "Services Menu — Complete",
        points: 60, impact: "high", status: "partial",
        icon: <FileText size={13}/>,
        apiField: { fieldPath: "location.serviceList", endpoint: "PATCH /v1/accounts/{accountId}/locations/{locationId}", readable: true, writable: true },
        what: "A structured list of every service you offer with names, categories, prices, and descriptions.",
        why: "Service listings are indexed as keywords. Businesses with complete service menus appear for 3× more search query variations. Google also uses services data for featured snippet answers like 'how much does X cost near me'.",
        how: "Edit Profile → Services. Add every service with: (1) Specific name (not 'Service 1'), (2) Category, (3) Price or price range, (4) 2–3 sentence description with natural keywords. Minimum 8 services — match what competitors list.",
        aiInsight: "You have 3 services listed. Competitors in your category average 11. Each unlisted service is a missed keyword — e.g., not listing 'Panchmukhi Rudraksha' means you can't rank when someone searches for it specifically.",
        googleDoc: "locations.serviceList",
        current: "3 services listed", target: "All services, with descriptions",
      },
      {
        id: "products_catalog", title: "Products Catalogue",
        points: 40, impact: "medium", status: "missing",
        icon: <ShoppingBag size={13}/>,
        apiField: { fieldPath: "location.products (via Product Catalog API)", endpoint: "POST /v1/accounts/{accountId}/locations/{locationId}/products", readable: true, writable: true },
        what: "A product catalogue with individual product listings including photos, names, descriptions, and prices.",
        why: "Product listings appear in the 'Products' tab of your Knowledge Panel and in Google Shopping results. They create additional organic entry points that bypass standard local pack competition. 0 products = 0 product-intent traffic.",
        how: "Edit Profile → Products → Add Product. For each: high-res photo, specific name (include variant: '5 Mukhi Rudraksha Mala 108 Beads'), price, category, and 2–3 line description with the key benefits. Start with your top 10 best-sellers.",
        aiInsight: "0 products listed. Your category has significant product-intent search volume (people searching for specific items). Each product listing is a free organic ranking opportunity in Google Shopping.",
        googleDoc: "locations.products",
        current: "0 products listed", target: "Top 10–15 products",
      },
      {
        id: "attributes", title: "Business Attributes (8+ set)",
        points: 35, impact: "medium", status: "partial",
        icon: <CheckCircle2 size={13}/>,
        apiField: { fieldPath: "location.attributes", endpoint: "PATCH /v1/accounts/{accountId}/locations/{locationId}", readable: true, writable: true },
        what: "Factual attributes Google provides per category: payment methods, accessibility, amenities, certifications, service options.",
        why: "Attributes feed Google's filter system. When users search with filters ('wheelchair accessible', 'accepts cards', 'women-owned'), only businesses with those attributes appear. Missing attributes = invisible in filtered searches. Attributes also appear as visual badges on your listing.",
        how: "Edit Profile → More → Attributes. Set EVERY applicable attribute — it takes 3 minutes. Focus on: Health & Safety badges, Accessibility (wheelchair ramp, parking), Service Options (online/in-store), Payments, and any certification badges (ISO, government-registered).",
        aiInsight: "You have 3 of 12 applicable attributes set. Completing them opens you to 4 additional filter-based search segments. The 'Women-led' and 'Identifies as Indian-owned' attributes get dedicated promotional treatment from Google.",
        googleDoc: "locations.attributes",
        current: "3 / 12 attributes set", target: "All applicable attributes",
      },
      {
        id: "booking", title: "Booking / Appointment Link",
        points: 20, impact: "medium", status: "missing",
        icon: <Globe size={13}/>,
        apiField: { fieldPath: "location.mapsUrls.appointmentUrl", endpoint: "PATCH /v1/accounts/{accountId}/locations/{locationId}", readable: true, writable: true },
        what: "A direct URL to your booking system, appointment page, or enquiry form.",
        why: "The 'Book' or 'Enquire' CTA button appears prominently in your profile and Google search results. Profiles with booking links see 20% higher conversion rates — it removes the friction step of navigating to your website first.",
        how: "Even a WhatsApp link works: wa.me/91XXXXXXXXXX. Or link to Calendly, your website's contact page, or Google Forms. Edit Profile → Booking → Add link. Ensure the link opens correctly on mobile.",
        aiInsight: "48% of users prefer booking directly from search results without visiting a website. A booking link could convert 12–15 additional monthly customers who currently drop off at the website step.",
        googleDoc: "locations.mapsUrls.appointmentUrl",
        current: "Not set", target: "Any bookable link or WhatsApp",
      },
    ],
  },

  /* ── 5. REVIEWS & REPUTATION ── */
  {
    id: "reputation", label: "Reviews & Reputation", color: "#f59e0b", accent: "#451a03",
    icon: <Star size={15}/>,
    items: [
      {
        id: "review_count", title: "Review Volume (50+ reviews)",
        points: 70, impact: "critical", status: "partial",
        icon: <Star size={13}/>,
        apiField: { fieldPath: "location.metadata.totalReviewCount", endpoint: "GET /v1/accounts/{accountId}/locations/{locationId}", readable: true, writable: false },
        what: "The total count of Google reviews on your listing — a read-only metric calculated by Google.",
        why: "Review count is the #2 local ranking factor. Businesses with 50+ reviews appear in the local 3-pack 73% more often than those with <10. Volume signals popularity, recency, and social proof simultaneously.",
        how: "Create a short review link (maps.app.goo.gl/XXXXX) and embed it everywhere: WhatsApp broadcast after service, email footer, SMS follow-up 24hrs after purchase, business card QR code, invoice footer. Ask verbally: 'If you're happy, a quick Google review really helps us.'",
        aiInsight: "You need 32 more reviews to cross the 50-review trust threshold. At your current rate (~3/month), that's 10 weeks. A focused 2-week review campaign (WhatsApp broadcast + follow-up) could achieve this in 14 days.",
        googleDoc: "locations.metadata.totalReviewCount (read-only)",
        unit: "reviews", current: "18 reviews", target: "50+ reviews",
      },
      {
        id: "rating", title: "Average Rating (4.5★+)",
        points: 80, impact: "critical", status: "partial",
        icon: <Star size={13}/>,
        apiField: { fieldPath: "location.metadata.averageRating", endpoint: "GET /v1/accounts/{accountId}/locations/{locationId}", readable: true, writable: false },
        what: "Your average star rating (1–5) calculated from all Google reviews — read-only, computed by Google.",
        why: "Ratings below 4.0★ suppress CTR by 60%. Google's local pack algorithm uses rating as a quality signal — 4.5★+ profiles appear 2.4× more frequently. Star rating is the most visible trust signal in search results.",
        how: "You can't directly edit your rating — improve it by: (1) Responding professionally to all reviews, (2) Proactively asking happy customers to review, (3) Resolving negative experiences before they become reviews. Never incentivise or fake reviews — Google's spam detection is sophisticated.",
        aiInsight: "Moving from your current rating to 4.5★ would increase click-through rate by ~35% in search results. Focus on: acknowledging every review within 48hrs, resolving negative experiences offline, and asking your most loyal customers.",
        googleDoc: "locations.metadata.averageRating (read-only)",
        unit: "stars", current: "4.1★ avg", target: "4.5★ or above",
      },
      {
        id: "review_responses", title: "Owner Responses — 100% Rate",
        points: 60, impact: "high", status: "partial",
        icon: <MessageSquare size={13}/>,
        apiField: { fieldPath: "review.reviewReply (via Reviews API)", endpoint: "PUT /v1/accounts/{accountId}/locations/{locationId}/reviews/{reviewId}/reply", readable: true, writable: true },
        what: "Replying to every Google review — both positive and negative — as the verified business owner.",
        why: "Google's algorithm scores response rate as an engagement signal. Businesses that respond to all reviews are 1.7× more trusted. 45% of customers will give a business a second chance if the owner responds professionally to a negative review.",
        how: "Positive: Personalise with name + what they mentioned + thank them + soft CTA ('We look forward to seeing you again!'). Negative: Acknowledge → Apologise → Offer to resolve offline → Don't argue publicly. Respond within 48hrs — speed matters.",
        aiInsight: "You have 8 unanswered reviews (3 negative, 5 positive). Each unanswered negative review is visible to every future customer who reads your profile. AI-generated personalised replies can clear this backlog in 5 minutes.",
        googleDoc: "accounts.locations.reviews.reply",
        current: "67% response rate", target: "100% response rate",
      },
      {
        id: "review_recency", title: "Recent Reviews (last 30 days)",
        points: 30, impact: "high", status: "missing",
        icon: <RefreshCw size={13}/>,
        apiField: { fieldPath: "review.createTime (via Reviews API)", endpoint: "GET /v1/accounts/{accountId}/locations/{locationId}/reviews", readable: true, writable: false },
        what: "Having at least 2–3 fresh reviews published in the last 30 days.",
        why: "Review recency is a freshness signal in Google's ranking algorithm. A profile with 50 reviews all from 2 years ago ranks lower than one with 20 recent reviews. 'Recent reviews' are weighted 3× more heavily than older reviews.",
        how: "Build a steady drip of reviews rather than a burst. Set a personal goal: 2 new reviews per week. After every positive interaction, say: 'We'd love your Google review — it's the best way to help us.' Add a QR code at your checkout/counter.",
        aiInsight: "Your most recent review is 43 days old. Reviews older than 30 days lose their recency weighting in Google's algorithm. A single new review this week would restore your recency signal.",
        googleDoc: "accounts.locations.reviews (read-only timestamps)",
        current: "Last review: 43 days ago", target: "2+ reviews per month",
      },
      {
        id: "negative_handled", title: "Negative Reviews — All Addressed",
        points: 20, impact: "high", status: "complete",
        icon: <Shield size={13}/>,
        apiField: { fieldPath: "review.reviewReply (via Reviews API)", endpoint: "PUT /v1/accounts/{accountId}/locations/{locationId}/reviews/{reviewId}/reply", readable: true, writable: true },
        what: "Every 1–3 star review has a professional, empathetic owner response — no unaddressed negative reviews.",
        why: "88% of consumers read owner responses to negative reviews. An unanswered 1-star review is 10× more damaging than one with a professional response. Responding also signals to Google's quality evaluator that you're an engaged, trustworthy business.",
        how: "Template: 'Hi [Name], thank you for sharing this. We're sincerely sorry your experience fell short of our standards. Please contact us at [phone/email] so we can personally make this right.' Never argue, never dismiss. Always take it offline.",
        aiInsight: "All negative reviews addressed — this puts you in the top 28% of businesses. Businesses that respond to negative reviews recover 45% of potentially lost customers.",
        googleDoc: "accounts.locations.reviews.reply",
        current: "All 3 negative reviews replied", target: "100% negative review response",
      },
    ],
  },

  /* ── 6. POSTS & ACTIVITY ── */
  {
    id: "activity", label: "Posts & Engagement", color: "#10b981", accent: "#052e16",
    icon: <Zap size={15}/>,
    items: [
      {
        id: "posts_frequency", title: "Regular Posts (Weekly)",
        points: 60, impact: "high", status: "partial",
        icon: <FileText size={13}/>,
        apiField: { fieldPath: "location.localPost (via Local Posts API)", endpoint: "POST /v1/accounts/{accountId}/locations/{locationId}/localPosts", readable: true, writable: true },
        what: "Publishing at least 1 Google Post per week — updates, offers, events, or product highlights.",
        why: "Active posting signals to Google that your business is open and engaged. Businesses that post weekly appear in the local 3-pack 42% more often. Posts expire after 7 days (standard) or on their event date — requiring consistent fresh content.",
        how: "Plan a 4-post monthly calendar: Week 1: Product highlight. Week 2: Offer/discount. Week 3: Tip/educational. Week 4: Behind-the-scenes/team. Use 1 photo per post (posts with photos get 5× more views). Keep text under 300 words. Always add a CTA button.",
        aiInsight: "Your last post was 18 days ago. Posting today restores your 'active business' freshness signal. Use AI to generate a post in 30 seconds — include your top-selling product with a special weekend offer.",
        googleDoc: "accounts.locations.localPosts",
        current: "Last post: 18 days ago", target: "1+ post per week",
      },
      {
        id: "offer_post", title: "Active Offer Post",
        points: 30, impact: "medium", status: "missing",
        icon: <Tag size={13}/>,
        apiField: { fieldPath: "location.localPost (topicType: OFFER)", endpoint: "POST /v1/accounts/{accountId}/locations/{locationId}/localPosts", readable: true, writable: true },
        what: "A special 'Offer' type post with a discount, deal, or promotion with an expiry date.",
        why: "Offer posts display a visual 'Offer' badge in search results — a differentiator that increases CTR by 47% versus standard posts. They appear in a dedicated 'Offers' tab on your profile and trigger offer-intent searchers.",
        how: "Create an Offer post: title ('20% off all Rudraksha malas'), terms ('Valid while stocks last'), coupon code (optional), start/end date (2–4 week window), and a compelling product photo. Link to your product page or WhatsApp.",
        aiInsight: "No active offer post. Your competitors in this category average 1.8 active offers. Adding an offer post today could increase this week's profile interactions by 47% — it's the fastest single-action improvement available.",
        googleDoc: "accounts.locations.localPosts (OFFER type)",
        current: "0 active offers", target: "1 active offer at all times",
      },
      {
        id: "qa_section", title: "Q&A — Pre-Seeded (5+ entries)",
        points: 30, impact: "medium", status: "missing",
        icon: <MessageSquare size={13}/>,
        apiField: { fieldPath: "location.questions (via QA API)", endpoint: "POST /v1/accounts/{accountId}/locations/{locationId}/questions", readable: true, writable: true },
        what: "The Questions & Answers section populated with FAQs from the business — asked and answered by the owner.",
        why: "Q&As appear directly in search results. Unanswered questions can be answered by ANYONE — including competitors, trolls, or confused people. Pre-seeding with your own FAQ controls the narrative, adds keyword-rich content, and earns Google's 'answered' quality signal.",
        how: "Log into Google Maps as your personal account. Find your own listing. Click 'Ask a question'. Seed 5–10 questions: pricing, parking, delivery, unique products, opening hours. Then log in as the business owner and answer each professionally.",
        aiInsight: "0 Q&As. Competitors average 7 seeded Q&As. Q&As appear in Google's rich results and can earn Featured Snippet positions for conversational searches like 'does [business] do home delivery'.",
        googleDoc: "accounts.locations.questions",
        current: "0 questions seeded", target: "5+ Q&A pairs",
      },
      {
        id: "messaging", title: "Google Messaging — Enabled",
        points: 20, impact: "medium", status: "missing",
        icon: <MessageSquare size={13}/>,
        apiField: { fieldPath: "location.metadata.hasBusinessMessaging", endpoint: "PATCH /v1/accounts/{accountId}/locations/{locationId}", readable: true, writable: true },
        what: "The Google Business Messages feature that lets customers message you directly from your search listing.",
        why: "Messaging provides a zero-friction contact option preferred by 64% of consumers under 35. Businesses with messaging enabled see 17% more total customer interactions. Google promotes messaging-enabled profiles with a 'Message' button in results.",
        how: "GBP Dashboard → Messages → Turn on. Download the Google Business app to receive message notifications. Set an auto-reply for outside business hours. Respond to messages within 24hrs — Google may disable messaging if response time is poor.",
        aiInsight: "Messaging is off. Turning it on takes 30 seconds. It adds a prominent 'Message' button to your search listing — typically converting 8–12 additional monthly enquiries from users who won't call but will message.",
        googleDoc: "locations.metadata.hasBusinessMessaging",
        current: "Disabled", target: "Enabled + auto-reply set",
      },
      {
        id: "insights_reviewed", title: "Performance Insights — Monitored",
        points: 20, impact: "low", status: "complete",
        icon: <BarChart2 size={13}/>,
        apiField: { fieldPath: "location.performanceMetrics (via Performance API)", endpoint: "POST /v1/locations:getDailyMetricsTimeSeries", readable: true, writable: false },
        what: "Regularly reviewing your GBP performance data: impressions, searches, actions, and call trends.",
        why: "Insights reveal how customers find you (direct/discovery/branded), which actions they take, and trending search terms. Businesses that review insights monthly make 2× better optimisation decisions and catch ranking drops 2 weeks earlier.",
        how: "Review monthly: (1) Which queries drive impressions — update your description/posts to match. (2) Actions trend — if calls drop, check hours/phone. (3) Photo views — add photos in the categories with lowest views. Use this app's Analytics page for full data.",
        aiInsight: "Your top search query has shifted this month. Updating your business description and next post to reflect this new high-intent search term could capture 180+ additional impressions immediately.",
        googleDoc: "locations.performanceMetrics (read-only)",
        current: "Monitored via app", target: "Monthly review cadence",
      },
    ],
  },
];

/* ════════════════════════════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════════════════════════════ */
function calcScore(s: Record<string,Status>): number {
  let t = 0;
  CATEGORIES.forEach(c => c.items.forEach(i => {
    const cfg = STATUS_CFG[s[i.id] ?? i.status];
    t += Math.round(i.points * cfg.pts);
  }));
  return t;
}

function calcCatScore(cat: Category, s: Record<string,Status>) {
  const max = cat.items.reduce((a,i) => a + i.points, 0);
  let earned = 0;
  cat.items.forEach(i => { earned += Math.round(i.points * STATUS_CFG[s[i.id] ?? i.status].pts); });
  return { earned, max, pct: Math.round((earned/max)*100) };
}

function initStatuses(): Record<string,Status> {
  const m: Record<string,Status> = {};
  CATEGORIES.forEach(c => c.items.forEach(i => { m[i.id] = i.status; }));
  return m;
}

function scoreLabel(n: number): { tier: string; sub: string; color: string; glow: string; ring: string } {
  if (n >= 900) return { tier:"Elite",      sub:"Top 2% globally",           color:"#34d399", glow:"rgba(52,211,153,0.4)",  ring:"#34d399" };
  if (n >= 750) return { tier:"Advanced",   sub:"Strong — keep optimising",  color:"#000000", glow:"rgba(56,189,248,0.35)", ring:"#38bdf8" };
  if (n >= 550) return { tier:"Growing",    sub:"Solid foundation",          color:"#a78bfa", glow:"rgba(167,139,250,0.35)",ring:"#a78bfa" };
  if (n >= 350) return { tier:"Basic",      sub:"Key gaps need attention",   color:"#fb923c", glow:"rgba(251,146,60,0.35)", ring:"#fb923c" };
  return              { tier:"Incomplete", sub:"Critical items missing",    color:"#f87171", glow:"rgba(248,113,113,0.4)", ring:"#f87171" };
}

/* ════════════════════════════════════════════════════════════════════
   SKELETON
════════════════════════════════════════════════════════════════════ */
function Sk({ w, h, r = "rounded-xl", dark }: { w: string; h: string; r?: string; dark: boolean }) {
  return <div className={`${w} ${h} ${r} animate-pulse ${dark ? "bg-white/[0.06]" : "bg-blue-100/60"}`}/>;
}

/* ════════════════════════════════════════════════════════════════════
   SCAN OVERLAY
════════════════════════════════════════════════════════════════════ */
function ScanOverlay({ dark, onDone }: { dark: boolean; onDone: () => void }) {
  const [p, setP] = useState(0);
  const [step, setStep] = useState(0);
  const steps = [
    "Authenticating Google Business API…",
    "Fetching profile completeness data…",
    "Analysing local SEO signals…",
    "Benchmarking competitor profiles…",
    "Scoring 30 optimisation factors…",
    "Generating AI recommendations…",
    "Audit complete!",
  ];

  useEffect(() => {
    const t = setInterval(() => {
      setP(prev => {
        if (prev >= 100) { clearInterval(t); setTimeout(onDone, 700); return 100; }
        const n = Math.min(prev + Math.random() * 6 + 2, 100);
        setStep(Math.floor((n / 100) * (steps.length - 1)));
        return n;
      });
    }, 100);
    return () => clearInterval(t);
  }, []);

  return (
    <div className={`fixed inset-0 z-[600] flex flex-col items-center justify-center ${dark ? "bg-[#050d1a]" : "bg-[#eef4ff]"}`}>
      {/* scan lines */}
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 3px,#3b82f6 3px,#3b82f6 4px)" }}/>
      {/* corner brackets */}
      {[["top-8 left-8","border-t-2 border-l-2"],["top-8 right-8","border-t-2 border-r-2"],["bottom-8 left-8","border-b-2 border-l-2"],["bottom-8 right-8","border-b-2 border-r-2"]].map(([pos,cls],i) => (
        <div key={i} className={`absolute ${pos} w-8 h-8 border-blue-500/40 ${cls}`}/>
      ))}

      <div className="flex flex-col items-center gap-7 px-8 w-full max-w-xs">
        {/* brain pulse */}
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
            style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", boxShadow: "0 0 40px rgba(59,130,246,0.15)" }}>
            <Brain size={34} style={{ color: "#60a5fa" }}/>
          </div>
          <div className="absolute inset-0 rounded-3xl animate-ping opacity-20" style={{ border: "2px solid #3b82f6" }}/>
        </div>

        <div className="text-center w-full">
          <p className={`text-[21px] font-black mb-1 ${dark ? "text-white" : "text-slate-900"}`}
            style={{letterSpacing: "-0.04em" }}>
            AI Audit Running
          </p>
          <p className="text-[12px] font-medium" style={{ color: "#60a5fa", minHeight: 18 }}>
            {steps[Math.min(step, steps.length - 1)]}
          </p>
        </div>

        {/* progress */}
        <div className="w-full">
          <div className={`h-1.5 rounded-full overflow-hidden w-full ${dark ? "bg-white/[0.08]" : "bg-blue-100"}`}>
            <div className="h-full rounded-full transition-all duration-150"
              style={{ width: `${p}%`, background: "linear-gradient(90deg,#3b82f6,#60a5fa)", boxShadow: "0 0 12px rgba(59,130,246,0.6)" }}/>
          </div>
          <div className="flex justify-between mt-1.5">
            <span className={`text-[10px] ${dark ? "text-slate-600" : "text-slate-400"}`}>Scanning profile…</span>
            <span className="text-[10px] font-bold" style={{ color: "#60a5fa" }}>{Math.round(p)}%</span>
          </div>
        </div>

        {/* item checklist */}
        <div className="w-full flex flex-col gap-1.5">
          {["Business Identity","Contact & Location","Photos & Media","Services","Reviews","Posts & Engagement"].map((l,i) => (
            <div key={i} className={`flex items-center gap-2.5 transition-all duration-500 ${p > (i+1)*15 ? "opacity-100" : "opacity-25"}`}>
              <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${p > (i+1)*15 ? "bg-blue-500" : dark ? "bg-white/[0.06]" : "bg-blue-100"}`}>
                {p > (i+1)*15 && <Check size={8} className="text-white"/>}
              </div>
              <span className={`text-[11px] font-medium ${dark ? "text-slate-400" : "text-slate-600"}`}>{l}</span>
              {p > (i+1)*15 && <span className="text-[9px] font-bold text-blue-400 ml-auto">✓ Analysed</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   SCORE RING HERO — Blue theme, no glow, compact precision UI
════════════════════════════════════════════════════════════════════ */
function ScoreRing({ score, dark, animate }: { score: number; dark: boolean; animate: boolean }) {
  const MAX  = 1000;
  const R    = 44;
  const C    = 2 * Math.PI * R;
  const pct  = score / MAX;
  const dash = C * pct;

  // Blue-only tier system — no color changes, just blue intensity + label
  const tier =
    score >= 900 ? { label: "Elite",      sub: "Top 2% of all businesses",       rank: 5 } :
    score >= 750 ? { label: "Advanced",   sub: "Strong — keep optimising",        rank: 4 } :
    score >= 550 ? { label: "Growing",    sub: "Good foundation, gaps remain",    rank: 3 } :
    score >= 350 ? { label: "Basic",      sub: "Several key items need fixing",   rank: 2 } :
                   { label: "Incomplete", sub: "Critical optimisations needed",   rank: 1 };

  // Score changes shade of blue only — no rainbow colors
  const ringColor   = "#3b82f6";
  const trackColor  = dark ? "rgba(59,130,246,0.08)" : "rgba(59,130,246,0.1)";
  const tickMajor   = dark ? "rgba(59,130,246,0.2)"  : "rgba(59,130,246,0.18)";
  const tickMinor   = dark ? "rgba(59,130,246,0.08)" : "rgba(59,130,246,0.09)";

  // 40 tick marks (8 major every 45°, 32 minor)
  const ticks = Array.from({ length: 40 }, (_, i) => {
    const angle  = (i / 40) * 2 * Math.PI - Math.PI / 2;
    const isMaj  = i % 5 === 0;
    const r1     = R - (isMaj ? 5 : 3.5);
    const r2     = R - 1;
    return {
      x1: 60 + r1 * Math.cos(angle), y1: 60 + r1 * Math.sin(angle),
      x2: 60 + r2 * Math.cos(angle), y2: 60 + r2 * Math.sin(angle),
      isMaj,
    };
  });

  return (
    <div className="flex items-center gap-5">

      {/* ── LEFT: ring ── */}
      <div className="relative shrink-0" style={{ width: 120, height: 120 }}>
        <svg viewBox="0 0 120 120" width={120} height={120} className="-rotate-90">
          {/* track */}
          <circle cx="60" cy="60" r={R} fill="none" stroke={trackColor} strokeWidth="6"/>

          {/* tick marks */}
          {ticks.map((t, i) => (
            <line key={i}
              x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
              stroke={t.isMaj ? tickMajor : tickMinor}
              strokeWidth={t.isMaj ? 1.2 : 0.7}
              strokeLinecap="round"/>
          ))}

          {/* segment dots at 250/500/750 thresholds */}
          {[250, 500, 750].map((thresh, i) => {
            const a = (thresh / MAX) * 2 * Math.PI - Math.PI / 2;
            const cx = 60 + R * Math.cos(a);
            const cy = 60 + R * Math.sin(a);
            return (
              <circle key={i} cx={cx} cy={cy} r={2.5}
                fill={score >= thresh
                  ? ringColor
                  : dark ? "rgba(59,130,246,0.2)" : "rgba(59,130,246,0.15)"}/>
            );
          })}

          {/* progress arc */}
          <circle cx="60" cy="60" r={R} fill="none"
            stroke={ringColor} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={`${dash} ${C}`}
            style={{
              transition: animate
                ? "stroke-dasharray 1.4s cubic-bezier(0.34,1.56,0.64,1)"
                : "none",
            }}/>

        </svg>

        {/* center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-[30px] font-black leading-none text-blue-500`}
            style={{ letterSpacing: "-0.06em" }}>
            {score}
          </span>
          <span className={`text-[9px] font-bold mt-0.5 ${dark ? "text-blue-500/50" : "text-blue-400"}`}>
            / 1000
          </span>
        </div>
      </div>

      {/* ── RIGHT: tier info + mini stats ── */}
      <div className="flex flex-col gap-2.5 flex-1 min-w-0">

        {/* tier badge + label */}
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[18px] font-black leading-none text-blue-500"
              style={{letterSpacing: "-0.04em" }}>
              {tier.label}
            </span>
            {/* rank pips */}
            <div className="flex gap-0.5 items-center">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="rounded-sm transition-all"
                  style={{
                    width: 5, height: i < tier.rank ? 10 + i * 2 : 8,
                    background: i < tier.rank
                      ? `rgba(59,130,246,${0.4 + i * 0.12})`
                      : dark ? "rgba(255,255,255,0.07)" : "rgba(59,130,246,0.1)",
                  }}/>
              ))}
            </div>
          </div>
          <p className={`text-[11px] font-medium leading-tight ${dark ? "text-slate-500" : "text-slate-400"}`}>
            {tier.sub}
          </p>
        </div>

        {/* progress fraction */}
        <div className={`flex items-center justify-between px-3 py-2 rounded-xl border
          ${dark ? "bg-blue-500/[0.06] border-blue-500/[0.12]" : "bg-blue-50/80 border-blue-200/60"}`}>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[15px] font-black text-blue-500">
              {Math.round(pct * 100)}%
            </span>
            <span className={`text-[8.5px] font-semibold ${dark ? "text-slate-600" : "text-slate-400"}`}>Score</span>
          </div>
          <div className={`w-px h-7 ${dark ? "bg-blue-500/10" : "bg-blue-200/60"}`}/>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[15px] font-black text-blue-500">
              {MAX - score}
            </span>
            <span className={`text-[8.5px] font-semibold ${dark ? "text-slate-600" : "text-slate-400"}`}>To max</span>
          </div>
          <div className={`w-px h-7 ${dark ? "bg-blue-500/10" : "bg-blue-200/60"}`}/>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[15px] font-black text-blue-500">
              #{tier.rank < 3 ? tier.rank : "—"}
            </span>
            <span className={`text-[8.5px] font-semibold ${dark ? "text-slate-600" : "text-slate-400"}`}>Rank tier</span>
          </div>
        </div>

        {/* tier ladder — horizontal 5-step */}
        <div className="flex gap-1">
          {["Incomplete","Basic","Growing","Advanced","Elite"].map((t,i) => {
            const active = i + 1 === tier.rank;
            const passed = i + 1 < tier.rank;
            return (
              <div key={i} className="flex-1 flex flex-col gap-1 items-center">
                <div className={`h-1 w-full rounded-full transition-all`}
                  style={{
                    background: passed
                      ? "rgba(59,130,246,0.5)"
                      : active
                      ? "#3b82f6"
                      : dark ? "rgba(255,255,255,0.05)" : "rgba(59,130,246,0.1)",
                  }}/>
                {active && (
                  <span className="text-[7.5px] font-black text-blue-500" style={{ letterSpacing: "-0.01em" }}>
                    {t}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
/* ════════════════════════════════════════════════════════════════════
   CATEGORY PROGRESS BAR (compact row)
════════════════════════════════════════════════════════════════════ */
function CatBar({ cat, statuses, dark }: { cat: Category; statuses: Record<string,Status>; dark: boolean }) {
  const { earned, max, pct } = calcCatScore(cat, statuses);
  return (
    <div className="flex items-center gap-3">
      <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${cat.color}18`, color: cat.color }}>{cat.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between mb-1">
          <span className={`text-[10.5px] font-semibold truncate ${dark?"text-slate-300":"text-slate-700"}`}>{cat.label}</span>
          <span className="text-[10px] font-bold shrink-0 ml-1" style={{ color: cat.color }}>{earned}/{max}</span>
        </div>
        <div className={`h-1 rounded-full overflow-hidden ${dark?"bg-white/[0.06]":"bg-blue-50"}`}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width:`${pct}%`, background:`linear-gradient(90deg,${cat.color}90,${cat.color})`, boxShadow:`0 0 6px ${cat.color}50` }}/>
        </div>
      </div>
      <span className={`text-[10px] font-black w-7 text-right shrink-0 ${dark?"text-slate-500":"text-slate-400"}`}>{pct}%</span>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   API FIELD BADGE
════════════════════════════════════════════════════════════════════ */
function APIBadge({ field, dark }: { field: { fieldPath: string; readable: boolean; writable: boolean }; dark: boolean }) {
  return (
    <div className={`flex items-start gap-2 p-2.5 rounded-xl border text-[10px] font-mono
      ${dark ? "bg-blue-950/40 border-blue-800/30" : "bg-blue-50/80 border-blue-200/60"}`}>
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`font-bold ${dark?"text-blue-300":"text-blue-700"}`} style={{ wordBreak: "break-all" }}>
            {field.fieldPath}
          </span>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {field.readable && (
            <span className="px-1.5 py-0.5 rounded-md font-bold text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              READ
            </span>
          )}
          {field.writable ? (
            <span className="px-1.5 py-0.5 rounded-md font-bold text-[9px] bg-blue-500/15 text-blue-400 border border-blue-500/20">
              WRITE
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded-md font-bold text-[9px] bg-slate-500/15 text-slate-400 border border-slate-500/20 flex items-center gap-1">
              <Lock size={7}/>READ-ONLY
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   CHECK ITEM CARD
════════════════════════════════════════════════════════════════════ */
function ItemCard({ item, status, dark, catColor }: {
  item: CheckItem; status: Status; dark: boolean; catColor: string;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"what"|"why"|"how"|"api">("what");
  const cfg = STATUS_CFG[status];
  const imp = IMP[item.impact];

  const isDone = status === "complete";
  const isMissing = status === "missing";

  // Card border accent by status
  const cardBorder = isDone
    ? dark ? "border-emerald-500/20" : "border-emerald-300/50"
    : isMissing
    ? dark ? "border-red-500/15" : "border-red-200/50"
    : dark ? "border-amber-500/15" : "border-amber-200/40";

  const cardBg = isDone
    ? dark ? "bg-[#091810]" : "bg-emerald-50/40"
    : isMissing
    ? dark ? "bg-[#130a0a]" : "bg-red-50/30"
    : dark ? "bg-[#12100a]" : "bg-amber-50/30";

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${cardBg} ${cardBorder}`}>
      {/* ── TOP ROW ── */}
      <div className="flex items-start gap-3 px-4 py-3.5 cursor-pointer" onClick={() => setOpen(o => !o)}>
        {/* status indicator */}
        <div className="flex flex-col items-center gap-1 pt-0.5 shrink-0">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all`}
            style={{
              background: isDone ? "#22c55e" : "transparent",
              borderColor: isDone ? "#22c55e" : isMissing ? "#ef4444" : "#f59e0b",
            }}>
            {isDone && <Check size={10} className="text-white"/>}
            {!isDone && !isMissing && <div className="w-2 h-2 rounded-sm" style={{ background: "#f59e0b" }}/>}
          </div>
          {/* vertical connector for expanded state */}
          {open && <div className={`w-px flex-1 min-h-[12px] ${dark?"bg-white/[0.04]":"bg-blue-100"}`}/>}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className={`text-[12.5px] font-bold leading-snug ${dark?"text-white":"text-slate-900"}`}
              style={{ letterSpacing: "-0.015em" }}>
              {item.title}
            </p>
            <div className="flex items-center gap-1.5 shrink-0 ml-1">
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full border"
                style={{ color: imp.color, background: `${imp.dot}15`, borderColor: `${imp.dot}30` }}>
                {imp.label}
              </span>
            </div>
          </div>

          {/* meta row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {/* status chip */}
              <span className="flex items-center gap-1 text-[9.5px] font-bold px-2 py-0.5 rounded-full border"
                style={{ background: cfg.bg, color: cfg.color, borderColor: `${cfg.color}30` }}>
                {cfg.icon} {cfg.label}
              </span>
              {/* points */}
              <span className={`text-[9.5px] font-black ${dark?"text-slate-500":"text-slate-400"}`}>
                +{item.points} pts
              </span>
              {/* current value */}
              {item.current && (
                <span className={`text-[9.5px] font-mono truncate max-w-[120px] ${dark?"text-blue-400/60":"text-blue-500/70"}`}>
                  {item.current}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {/* API read/write indicator */}
              {item.apiField.writable ? (
                <span className={`text-[9px] font-bold ${dark?"text-blue-500":"text-blue-400"}`} title="Writable via API">R/W</span>
              ) : (
                <span className={`text-[9px] font-bold flex items-center gap-0.5 ${dark?"text-slate-600":"text-slate-400"}`} title="Read-only">
                  <Lock size={8}/>RO
                </span>
              )}
              {open ? <ChevronUp size={13} className={dark?"text-slate-600":"text-slate-400"}/> : <ChevronDown size={13} className={dark?"text-slate-600":"text-slate-400"}/>}
            </div>
          </div>
        </div>
      </div>

      {/* ── EXPANDED DETAIL PANEL ── */}
      {open && (
        <div className={`border-t ${dark?"border-white/[0.04]":"border-blue-100/60"}`}>
          {/* tab bar */}
          <div className={`flex gap-0 border-b ${dark?"border-white/[0.04]":"border-blue-100/60"}`}>
            {(["what","why","how","api"] as const).map(t => {
              const labels = { what:"What", why:"Why", how:"How", api:"API" };
              const active = tab === t;
              return (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 py-2 text-[10.5px] font-bold transition-all border-b-2 ${
                    active
                      ? dark ? "text-blue-400 border-blue-500" : "text-blue-600 border-blue-500"
                      : dark ? "text-slate-600 border-transparent" : "text-slate-400 border-transparent"
                  }`}>
                  {labels[t]}
                </button>
              );
            })}
          </div>

          {/* tab content */}
          <div className="px-4 py-3.5 flex flex-col gap-3">
            {tab === "what" && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Eye size={10} style={{ color: catColor }}/>
                  <span className="text-[9.5px] font-black uppercase tracking-widest" style={{ color: catColor }}>Definition</span>
                </div>
                <p className={`text-[12px] leading-relaxed ${dark?"text-slate-300":"text-slate-700"}`}>{item.what}</p>
                {item.target && (
                  <div className={`mt-2.5 flex items-center gap-2 px-3 py-2 rounded-xl border
                    ${dark?"bg-blue-500/[0.07] border-blue-500/20":"bg-blue-50 border-blue-200/60"}`}>
                    <Target size={11} style={{ color: catColor }}/>
                    <div>
                      <span className={`text-[9.5px] font-bold uppercase tracking-wide ${dark?"text-slate-500":"text-slate-400"}`}>Target: </span>
                      <span className={`text-[11px] font-bold ${dark?"text-white":"text-slate-900"}`}>{item.target}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === "why" && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp size={10} style={{ color: "#38bdf8" }}/>
                  <span className="text-[9.5px] font-black uppercase tracking-widest text-sky-400">Why It Matters</span>
                </div>
                <p className={`text-[12px] leading-relaxed ${dark?"text-slate-300":"text-slate-700"}`}>{item.why}</p>
              </div>
            )}

            {tab === "how" && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Zap size={10} className="text-emerald-400"/>
                  <span className="text-[9.5px] font-black uppercase tracking-widest text-emerald-400">Step-by-Step</span>
                </div>
                <p className={`text-[12px] leading-relaxed ${dark?"text-slate-300":"text-slate-700"}`}>{item.how}</p>
                {item.apiField.writable && (
                  <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-xl border
                    ${dark?"bg-emerald-500/[0.06] border-emerald-500/20":"bg-emerald-50 border-emerald-200/60"}`}>
                    <Wand2 size={11} className="text-emerald-400 shrink-0"/>
                    <p className={`text-[11px] ${dark?"text-emerald-300/80":"text-emerald-700"}`}>
                      This field can be updated automatically via Google Business API when the feature is enabled.
                    </p>
                  </div>
                )}
              </div>
            )}

            {tab === "api" && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Cpu size={10} style={{ color: "#60a5fa" }}/>
                  <span className="text-[9.5px] font-black uppercase tracking-widest text-blue-400">Google API Field</span>
                </div>
                <APIBadge field={item.apiField} dark={dark}/>
                <div className={`mt-2.5 p-2.5 rounded-xl border ${dark?"bg-white/[0.02] border-white/[0.05]":"bg-slate-50 border-slate-100"}`}>
                  <p className={`text-[10px] font-mono ${dark?"text-slate-400":"text-slate-600"}`} style={{ wordBreak: "break-all" }}>
                    {item.apiField.endpoint}
                  </p>
                </div>
                <p className={`text-[11px] mt-2.5 leading-relaxed ${dark?"text-slate-500":"text-slate-500"}`}>
                  Ref: Google Business Profile API — <span className={`font-mono ${dark?"text-blue-400":"text-blue-600"}`}>{item.googleDoc}</span>
                </p>
              </div>
            )}

            {/* AI Insight */}
            <div className={`flex items-start gap-2.5 p-3 rounded-xl border
              ${dark?"bg-[#0d1635] border-blue-800/30":"bg-blue-50/80 border-blue-200/60"}`}>
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${dark?"bg-blue-500/20":"bg-blue-100"}`}>
                <Brain size={12} style={{ color: "#60a5fa" }}/>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-0.5">
                  <Sparkles size={9} className="text-blue-400"/>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${dark?"text-blue-400":"text-blue-600"}`}>AI Insight</span>
                </div>
                <p className={`text-[11.5px] leading-relaxed ${dark?"text-blue-200/70":"text-blue-800"}`}>{item.aiInsight}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   CATEGORY SECTION
════════════════════════════════════════════════════════════════════ */
function CategorySection({ cat, statuses, dark, defaultOpen }: {
  cat: Category; statuses: Record<string,Status>; dark: boolean; defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const { earned, max, pct } = calcCatScore(cat, statuses);
  const done    = cat.items.filter(i => statuses[i.id] === "complete").length;
  const partial = cat.items.filter(i => statuses[i.id] === "partial").length;
  const missing = cat.items.filter(i => statuses[i.id] === "missing").length;

  return (
    <div className={`rounded-3xl border overflow-hidden transition-all
      ${dark ? "bg-[#0a1020] border-blue-900/40" : "bg-white border-blue-100/80 shadow-sm"}`}
      style={{ boxShadow: dark ? `0 0 40px ${cat.color}08` : `0 4px 24px rgba(59,130,246,0.06)` }}>

      {/* ── HEADER ── */}
      <button className="w-full flex items-center gap-3.5 px-4 py-4" onClick={() => setOpen(o=>!o)}>
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: `${cat.color}15`, border: `1px solid ${cat.color}25` }}>
          <span style={{ color: cat.color }}>{cat.icon}</span>
        </div>

        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center justify-between mb-1.5 gap-2">
            <p className={`text-[13.5px] font-black truncate ${dark?"text-white":"text-slate-900"}`}
              style={{ fontFamily:"-apple-system,'SF Pro Display',sans-serif", letterSpacing:"-0.025em" }}>
              {cat.label}
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-black" style={{ color: cat.color }}>{earned}/{max}</span>
              {open ? <ChevronUp size={14} className={dark?"text-slate-600":"text-slate-400"}/> : <ChevronDown size={14} className={dark?"text-slate-600":"text-slate-400"}/>}
            </div>
          </div>

          {/* progress */}
          <div className={`h-1.5 rounded-full overflow-hidden mb-2 ${dark?"bg-white/[0.05]":"bg-blue-50"}`}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width:`${pct}%`, background:`linear-gradient(90deg,${cat.color}80,${cat.color})`, boxShadow:`0 0 8px ${cat.color}50` }}/>
          </div>

          {/* status counts */}
          <div className="flex items-center gap-3">
            {done > 0 && <span className="text-[9.5px] font-bold text-emerald-400">{done} complete</span>}
            {partial > 0 && <span className="text-[9.5px] font-bold text-amber-400">{partial} partial</span>}
            {missing > 0 && <span className="text-[9.5px] font-bold text-red-400">{missing} missing</span>}
            <span className={`text-[9.5px] font-medium ml-auto ${dark?"text-slate-600":"text-slate-400"}`}>{pct}% done</span>
          </div>
        </div>
      </button>

      {/* ── ITEMS ── */}
      {open && (
        <div className={`border-t flex flex-col gap-2.5 p-3 ${dark?"border-blue-900/30":"border-blue-100/60"}`}>
          {cat.items.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              status={statuses[item.id]}
              dark={dark}
              catColor={cat.color}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   TOP QUICK WINS CARD
════════════════════════════════════════════════════════════════════ */
function QuickWins({ statuses, dark }: { statuses: Record<string,Status>; dark: boolean }) {
  const wins = CATEGORIES.flatMap(cat =>
    cat.items
      .filter(i => statuses[i.id] === "missing" && (i.impact === "critical" || i.impact === "high"))
      .map(i => ({ ...i, catColor: cat.color }))
  ).sort((a,b) => b.points - a.points).slice(0, 4);

  if (!wins.length) return (
    <div className={`rounded-2xl border px-4 py-3.5 flex items-center gap-3
      ${dark?"bg-emerald-500/[0.06] border-emerald-500/20":"bg-emerald-50 border-emerald-200/60"}`}>
      <CheckCircle2 size={18} className="text-emerald-400 shrink-0"/>
      <p className={`text-[12px] font-semibold ${dark?"text-emerald-300":"text-emerald-700"}`}>
        All critical items are complete! Focus on medium-priority items to push your score higher.
      </p>
    </div>
  );

  const pts = wins.reduce((a,i) => a + i.points, 0);

  return (
    <div className={`rounded-2xl border overflow-hidden
      ${dark?"bg-[#080f1e] border-blue-900/40":"bg-white border-blue-100 shadow-sm"}`}
      style={{ boxShadow: dark ? "0 8px 40px rgba(59,130,246,0.06)" : "0 4px 24px rgba(59,130,246,0.07)" }}>
      <div className={`px-4 py-3 flex items-center justify-between border-b ${dark?"border-blue-900/30":"border-blue-100/60"}`}>
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${dark?"bg-orange-500/15":"bg-orange-100"}`}>
            <Flame size={12} className="text-orange-400"/>
          </div>
          <p className={`text-[13px] font-black ${dark?"text-white":"text-slate-900"}`} style={{ letterSpacing:"-0.02em" }}>
            Top Quick Wins
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.2)" }}>
          <Sparkles size={9} className="text-blue-400"/>
          <span className="text-[10px] font-black text-blue-400">+{pts} pts available</span>
        </div>
      </div>
      <div className="p-3 flex flex-col gap-2">
        {wins.map((item, i) => (
          <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border
            ${dark?"bg-white/[0.03] border-white/[0.05]":"bg-slate-50 border-slate-100"}`}>
            <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${item.catColor}15`, color: item.catColor }}>
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-[11.5px] font-bold truncate ${dark?"text-white":"text-slate-900"}`}>{item.title}</p>
              <p className={`text-[10px] mt-0.5 ${dark?"text-slate-500":"text-slate-400"}`}>{IMP[item.impact].label} impact</p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-[12px] font-black" style={{ color: item.catColor }}>+{item.points}</span>
              {item.apiField.writable && (
                <span className="text-[8px] font-bold text-blue-400 flex items-center gap-0.5">
                  <Cpu size={7}/>API
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   AI RECOMMENDATIONS STRIP
════════════════════════════════════════════════════════════════════ */
function AIRecs({ statuses, dark }: { statuses: Record<string,Status>; dark: boolean }) {
  const score = calcScore(statuses);
  const recs = [
    score < 600 && {
      icon: <Brain size={13}/>, color: "#60a5fa",
      title: "Missing critical items",
      text: "Your profile has 3+ critical gaps. Fixing them alone could push your score above 700 and land you in the local 3-pack.",
    },
    !statuses["cover_photo"] || statuses["cover_photo"] === "missing" && {
      icon: <Camera size={13}/>, color: "#a78bfa",
      title: "No cover photo",
      text: "Cover photo is the most-viewed element of your profile. Adding one could increase views by 40% this week.",
    },
    (statuses["posts_frequency"] === "missing" || statuses["posts_frequency"] === "partial") && {
      icon: <Zap size={13}/>, color: "#34d399",
      title: "Post frequency low",
      text: "Weekly posting raises your 'active business' signal. Use AI to generate and schedule 4 posts in 2 minutes.",
    },
    (statuses["review_count"] === "partial" || statuses["review_count"] === "missing") && {
      icon: <Star size={13}/>, color: "#fbbf24",
      title: "Review volume below target",
      text: "50+ reviews unlocks a major ranking boost. Launch a WhatsApp review campaign to collect 5+ reviews this week.",
    },
  ].filter(Boolean) as { icon: JSX.Element; color: string; title: string; text: string }[];

  if (!recs.length) return null;

  return (
    <div className={`rounded-2xl border overflow-hidden ${dark?"bg-[#080f1e] border-blue-900/40":"bg-white border-blue-100 shadow-sm"}`}>
      <div className={`px-4 py-3 flex items-center gap-2 border-b ${dark?"border-blue-900/30":"border-blue-100/60"}`}>
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${dark?"bg-blue-500/15":"bg-blue-100"}`}>
          <Brain size={12} style={{ color: "#60a5fa" }}/>
        </div>
        <p className={`text-[13px] font-black ${dark?"text-white":"text-slate-900"}`} style={{ letterSpacing:"-0.02em" }}>AI Recommendations</p>
        <div className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full"
          style={{ background:"rgba(59,130,246,0.1)", border:"1px solid rgba(59,130,246,0.2)" }}>
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"/>
          <span className="text-[9px] font-black text-blue-400">Live</span>
        </div>
      </div>
      <div className="p-3 flex flex-col gap-2">
        {recs.slice(0,3).map((r,i) => (
          <div key={i} className={`flex items-start gap-2.5 p-3 rounded-xl border
            ${dark?"bg-white/[0.02] border-white/[0.04]":"bg-slate-50/70 border-slate-100"}`}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background:`${r.color}15`, color: r.color }}>{r.icon}</div>
            <div className="flex-1 min-w-0">
              <p className={`text-[11.5px] font-bold mb-0.5 ${dark?"text-white":"text-slate-900"}`}>{r.title}</p>
              <p className={`text-[11px] leading-relaxed ${dark?"text-slate-400":"text-slate-600"}`}>{r.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════════════ */
export default function ChecklistPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";
  const router = useRouter();

  const [statuses]   = useState<Record<string,Status>>(initStatuses);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned]   = useState(false);
  const [filter, setFilter]     = useState<"all"|"missing"|"partial"|"complete">("all");
  const [animate, setAnimate]   = useState(false);

  const score     = useMemo(() => calcScore(statuses), [statuses]);
  const info      = scoreLabel(score);
  const allItems  = CATEGORIES.flatMap(c => c.items);
  const counts    = {
    complete: allItems.filter(i => statuses[i.id] === "complete").length,
    partial:  allItems.filter(i => statuses[i.id] === "partial").length,
    missing:  allItems.filter(i => statuses[i.id] === "missing").length,
    total:    allItems.length,
  };

  useEffect(() => { setTimeout(() => setAnimate(true), 300); }, []);

  function visibleCats() {
    if (filter === "all") return CATEGORIES;
    return CATEGORIES.map(cat => ({
      ...cat,
      items: cat.items.filter(i => statuses[i.id] === filter),
    })).filter(c => c.items.length > 0);
  }

  return (
    <>
      {scanning && <ScanOverlay dark={dark} onDone={() => { setScanning(false); setScanned(true); }}/>}

      <div className={`min-h-screen transition-colors duration-300 ${dark ? "bg-[#050d1a]" : "bg-[#eef4ff]"}`}
        style={{ fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}>

        {/* subtle grid bg */}
        <div className="fixed inset-0 pointer-events-none opacity-[0.015]"
          style={{ backgroundImage: dark
            ? "radial-gradient(circle at 1px 1px,#3b82f6 1px,transparent 0)"
            : "radial-gradient(circle at 1px 1px,#2563eb 1px,transparent 0)",
            backgroundSize: "32px 32px" }}/>

        <div className="relative max-w-lg mx-auto px-4 pb-32">

          {/* ── HEADER ── */}
          <div className="pt-5 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9.5px] font-black uppercase tracking-widest
                    ${dark ? "bg-blue-500/10 border-blue-700 text-blue-400" : "bg-blue-50 border-blue-700 text-blue-600"}`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-700 animate-pulse"/>
                    AI Powered Audit
                  </div>
                </div>
                <h1 className={`text-md font-bold leading-normal ${dark?"text-white":"text-slate-900"}`}>
                  GBP Score Card
                </h1>
                <p className={`text-[12px] mt-1 ${dark?"text-slate-500":"text-blue-700"}`}>
                  30 factors · Google Business Profile API
                </p>
              </div>

              {/* AI Scan button */}
              <button onClick={() => setScanning(true)}
                className="flex flex-col items-center gap-1 px-3 py-2.5 rounded-2xl text-white transition-all active:scale-90 shrink-0"
                style={{ background: "linear-gradient(135deg,#1e40af,#3b82f6)", boxShadow: "0 8px 24px rgba(59,130,246,0.35)" }}>
                <Brain size={18}/>
                <span className="text-[9px] font-black uppercase tracking-wide">Re-scan</span>
              </button>
            </div>
          </div>

          {/* ── SCORE HERO CARD ── */}
          <div className={`rounded-3xl border mb-5 overflow-hidden
            ${dark?"bg-[#070f1f] border-blue-900/50":"bg-white border-blue-100 shadow-sm"}`}
            style={{ boxShadow: dark ? `0 20px 80px rgba(59,130,246,0.12)` : "0 8px 40px rgba(59,130,246,0.1)" }}>

            {/* top accent line */}
            <div className="h-px w-full" style={{ background: `linear-gradient(90deg,transparent,${info.color}60,transparent)` }}/>

            <div className="p-5">
              {/* score ring + labels */}
              <div className="flex flex-col items-center gap-1">
                <ScoreRing score={score} dark={dark} animate={animate}/>

                {/* right side stats */}
                <div className="flex-1 flex flex-col gap-3 w-full">
                  {/* completion counts */}
                  <div className={`rounded-2xl p-3 grid grid-cols-3 gap-1 border
                    ${dark?"bg-blue-950/30 border-blue-900/30":"bg-blue-50/60 border-blue-100"}`}>
                    {[
                      { n: counts.complete, label: "Done",    color: "#59AC77" },
                      { n: counts.partial,  label: "Partial", color: "#fbbf24" },
                      { n: counts.missing,  label: "Missing", color: "#f87171" },
                    ].map((r,i) => (
                      <div key={i} className="flex flex-col items-center gap-0.5">
                        <span className="text-[20px] font-black leading-none"
                          style={{ fontFamily:"-apple-system,'SF Pro Display',sans-serif", color: r.color }}>
                          {r.n}
                        </span>
                        <span className={`text-[9px] font-bold ${dark?"text-slate-600":"text-slate-400"}`}>{r.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* top 2 cat scores */}
                  <div className="flex flex-col gap-2">
                    {CATEGORIES.slice(0,3).map(cat => (
                      <CatBar key={cat.id} cat={cat} statuses={statuses} dark={dark}/>
                    ))}
                  </div>
                </div>
                
              </div>
            </div>

            {/* ── CATEGORY BARS FULL ── */}
            <div className={`border-t px-5 py-4 flex flex-col gap-2.5 ${dark?"border-blue-900/30":"border-blue-100/60"}`}>
              <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${dark?"text-slate-600":"text-slate-400"}`}>
                All Categories
              </p>
              {CATEGORIES.slice(3).map(cat => (
                <CatBar key={cat.id} cat={cat} statuses={statuses} dark={dark}/>
              ))}
            </div>

            {/* ── SCORE GRADE STRIP ── */}
            <div className={`border-t grid grid-cols-5 ${dark?"border-blue-900/30":"border-blue-100/60"}`}>
              {[
                { label: "Incomplete", range: "0–349",  color: "#f87171", active: score < 350 },
                { label: "Basic",      range: "350–549", color: "#fb923c", active: score >= 350 && score < 550 },
                { label: "Growing",    range: "550–749", color: "#a78bfa", active: score >= 550 && score < 750 },
                { label: "Advanced",   range: "750–899", color: "#38bdf8", active: score >= 750 && score < 900 },
                { label: "Elite",      range: "900+",    color: "#34d399", active: score >= 900 },
              ].map((tier,i) => (
                <div key={i} className={`flex flex-col items-center py-3 gap-0.5 border-r last:border-r-0
                  ${dark?"border-blue-900/30":"border-blue-100/60"}
                  ${tier.active ? dark ? "bg-white/[0.03]" : "bg-blue-50/60" : ""}`}>
                  <div className="w-2 h-2 rounded-full mb-0.5" style={{ background: tier.active ? tier.color : dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)",
                    boxShadow: tier.active ? `0 0 6px ${tier.color}` : "none" }}/>
                  <span className={`text-[8.5px] font-black ${tier.active ? "" : dark?"text-slate-700":"text-slate-300"}`}
                    style={{ color: tier.active ? tier.color : undefined }}>
                    {tier.label}
                  </span>
                  <span className={`text-[8px] ${dark?"text-slate-700":"text-slate-300"}`}>{tier.range}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── QUICK WINS ── */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <p className={`text-[14px] font-black ${dark?"text-white":"text-slate-900"}`}
                style={{ letterSpacing:"-0.03em" }}>Quick Wins</p>
              <span className={`text-[11px] font-semibold ${dark?"text-slate-500":"text-blue-400"}`}>
                Highest impact, lowest effort
              </span>
            </div>
            <QuickWins statuses={statuses} dark={dark}/>
          </div>

          {/* ── AI RECOMMENDATIONS ── */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <p className={`text-[14px] font-black ${dark?"text-white":"text-slate-900"}`}
                style={{ letterSpacing:"-0.03em" }}>AI Recommendations</p>
            </div>
            <AIRecs statuses={statuses} dark={dark}/>
          </div>

          {/* ── FILTER TABS ── */}
          <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
            {(["all","missing","partial","complete"] as const).map(f => {
              const labels = {
                all: `All (${counts.total})`,
                missing: `Missing (${counts.missing})`,
                partial: `Partial (${counts.partial})`,
                complete: `Done (${counts.complete})`,
              };
              const colors = { all: "#60a5fa", missing: "#f87171", partial: "#fbbf24", complete: "#4ade80" };
              const active = filter === f;
              return (
                <button key={f} onClick={() => setFilter(f)}
                  className="shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all active:scale-95 border"
                  style={active
                    ? { background:`${colors[f]}15`, color: colors[f], borderColor:`${colors[f]}35` }
                    : { background: dark?"rgba(255,255,255,0.03)":"rgba(59,130,246,0.04)", color: dark?"#475569":"#94a3b8", borderColor:"transparent" }}>
                  {labels[f]}
                </button>
              );
            })}
          </div>

          {/* ── CATEGORY SECTIONS ── */}
          <div className="flex flex-col gap-4">
            {visibleCats().map((cat, i) => (
              <CategorySection key={cat.id} cat={cat} statuses={statuses} dark={dark} defaultOpen={i === 0}/>
            ))}
          </div>

          {/* ── BOTTOM CTA ── */}
          <div className="mt-6">
            <div className={`rounded-3xl border p-5 relative overflow-hidden
              ${dark?"bg-[#070f1f] border-blue-900/50":"bg-white border-blue-100 shadow-sm"}`}
              style={{ boxShadow: dark ? "0 20px 60px rgba(59,130,246,0.1)" : "0 8px 40px rgba(59,130,246,0.08)" }}>

              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle,rgba(59,130,246,0.1),transparent 70%)" }}/>
              <div className="h-px w-full mb-5" style={{ background: "linear-gradient(90deg,transparent,rgba(59,130,246,0.4),transparent)" }}/>

              <div className="flex items-center gap-3 mb-4">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${dark?"bg-blue-500/15":"bg-blue-100"}`}
                  style={{ border: "1px solid rgba(59,130,246,0.2)" }}>
                  <Wand2 size={20} style={{ color: "#60a5fa" }}/>
                </div>
                <div>
                  <p className={`text-[15px] font-black ${dark?"text-white":"text-slate-900"}`}
                    style={{ fontFamily:"-apple-system,'SF Pro Display',sans-serif", letterSpacing:"-0.03em" }}>
                    Auto-Fix with AI
                  </p>
                  <p className={`text-[11px] mt-0.5 ${dark?"text-slate-500":"text-blue-400"}`}>
                    Let AI write, optimise, and post for you
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { icon: <FileText size={11}/>, label:"AI Description",    color:"#60a5fa" },
                  { icon: <Zap size={11}/>,      label:"Weekly Posts",       color:"#4ade80" },
                  { icon: <MessageSquare size={11}/>, label:"Review Replies", color:"#a78bfa" },
                  { icon: <Tag size={11}/>,      label:"Offer Generator",   color:"#fbbf24" },
                ].map((f,i) => (
                  <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-xl border
                    ${dark?"bg-white/[0.03] border-white/[0.05]":"bg-slate-50 border-slate-100"}`}>
                    <span style={{ color: f.color }}>{f.icon}</span>
                    <span className={`text-[10.5px] font-semibold ${dark?"text-slate-300":"text-slate-600"}`}>{f.label}</span>
                  </div>
                ))}
              </div>

              <button onClick={() => router.push("/post/create")}
                className="w-full py-3.5 rounded-2xl text-[13px] font-black text-white flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
                style={{ background: "linear-gradient(135deg,#1e40af,#3b82f6,#60a5fa)", boxShadow: "0 8px 28px rgba(59,130,246,0.38)" }}>
                <Sparkles size={15}/> Start AI Optimisation
                <ArrowUpRight size={14} className="ml-1 opacity-70"/>
              </button>

              <p className={`text-center text-[10px] mt-3 ${dark?"text-slate-600":"text-slate-400"}`}>
                Read-only data from Google API · Write updates coming soon
              </p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
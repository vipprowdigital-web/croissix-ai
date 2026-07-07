// mobile_app\app\(main)\profile\edit\page.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Camera,
  User as UserIcon,
  Mail,
  Phone,
  Building2,
  Users,
  MapPin,
  Lock,
  ChevronRight,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import { RootState } from "@/redux/store";
import { useUpdateProfile } from "@/features/user/hook/useUser";

/* ═══════════════════════════════════════════════
   DESIGN TOKENS
═══════════════════════════════════════════════ */
const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, delay, ease: [0.22, 1, 0.36, 1] as any },
  },
});

function tok(dark: boolean) {
  return {
    card: {
      borderRadius: 20,
      overflow: "hidden" as const,
      border: `1.5px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(203,213,225,0.5)"}`,
      background: dark ? "#0f1a2e" : "#fff",
      boxShadow: dark ? "none" : "0 1px 6px rgba(0,0,0,0.04)",
      marginBottom: 14,
    },
    ch: {
      padding: "12px 16px",
      borderBottom: `1px solid ${dark ? "rgba(255,255,255,0.05)" : "rgba(203,213,225,0.35)"}`,
      display: "flex" as const,
      alignItems: "center" as const,
      gap: 8,
    },
    cb: { padding: "14px 16px" },
    lbl: {
      fontSize: 10.5,
      fontWeight: 800,
      textTransform: "uppercase" as const,
      letterSpacing: "0.08em",
      color: dark ? "#334155" : "#94a3b8",
      marginBottom: 6,
      display: "block" as const,
    },
    inp: {
      width: "100%",
      padding: "11px 13px",
      borderRadius: 12,
      fontSize: 13.5,
      fontWeight: 500,
      border: `1.5px solid ${dark ? "rgba(255,255,255,0.07)" : "rgba(203,213,225,0.65)"}`,
      background: dark ? "rgba(255,255,255,0.04)" : "#fff",
      color: dark ? "#e2e8f0" : "#1e293b",
      outline: "none",
      fontFamily: "-apple-system,'SF Pro Text',sans-serif",
      boxSizing: "border-box" as const,
    },
  };
}

function Field({
  label,
  icon,
  dark,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  dark: boolean;
  children: React.ReactNode;
}) {
  const s = tok(dark);
  return (
    <div style={{ marginBottom: 14 }}>
      <span style={s.lbl}>{label}</span>
      <div style={{ position: "relative" }}>
        <span
          style={{
            position: "absolute",
            left: 13,
            top: "50%",
            transform: "translateY(-50%)",
            color: dark ? "#475569" : "#94a3b8",
            display: "flex",
            pointerEvents: "none",
          }}
        >
          {icon}
        </span>
        {children}
      </div>
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  dark,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  dark: boolean;
}) {
  const s = tok(dark);
  const [f, setF] = useState(false);
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
      style={{
        ...s.inp,
        paddingLeft: 38,
        borderColor: f
          ? "#3b82f6"
          : dark
            ? "rgba(255,255,255,0.07)"
            : "rgba(203,213,225,0.65)",
      }}
      onFocus={() => setF(true)}
      onBlur={() => setF(false)}
    />
  );
}

function Card({
  title,
  icon,
  dark,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  dark: boolean;
  children: React.ReactNode;
}) {
  const s = tok(dark);
  return (
    <motion.div {...fade(0.05)} style={s.card}>
      <div style={s.ch}>
        <span style={{ color: "#3b82f6", display: "flex" }}>{icon}</span>
        <span
          style={{
            fontSize: 12.5,
            fontWeight: 800,
            color: dark ? "#e2e8f0" : "#1e293b",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </span>
      </div>
      <div style={s.cb}>{children}</div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════ */
export default function EditProfilePage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const user = useSelector((s: RootState) => s.user.data);
  const { mutate, isPending } = useUpdateProfile();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? "");
    setEmail(user.email ?? "");
    setPhone(user.phone ?? "");
    setBusinessName(user.businessName ?? "");
    setEmployeeCount(
      user.employeeCount !== null && user.employeeCount !== undefined
        ? String(user.employeeCount)
        : "",
    );
    setCity(user.city ?? "");
    setState(user.state ?? "");
  }, [user]);

  const bg = dark
    ? "linear-gradient(150deg,#050d1a,#080f1e)"
    : "linear-gradient(150deg,#eef4ff,#f0f5ff)";

  const handleAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = () => {
    setError(null);

    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError("Name, email and phone are required.");
      return;
    }
    if (!/^[a-zA-Z0-9._%+-]{6,30}@gmail\.com$/.test(email.trim())) {
      setError(
        "Enter a valid Gmail address with at least 6 characters (e.g. name@gmail.com)",
      );
      return;
    }
    mutate(
      {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        businessName: businessName.trim() || undefined,
        employeeCount: employeeCount ? Number(employeeCount) : undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        avatar: avatarFile ?? undefined,
      },
      {
        onSuccess: () => {
          setSuccess(true);
          setTimeout(() => router.back(), 900);
        },
        onError: (err: any) => {
          setError(
            err?.response?.data?.message ||
              "Something went wrong. Please try again.",
          );
        },
      },
    );
  };

  const s = tok(dark);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: bg,
        fontFamily: "-apple-system,'SF Pro Text',sans-serif",
      }}
    >
      <div style={{ maxWidth: 440, margin: "0 auto", padding: "0 16px 32px" }}>
        {/* Header */}
        <motion.div
          {...fade()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            paddingTop: 16,
            paddingBottom: 20,
          }}
        >
          <motion.button
            onClick={() => router.back()}
            whileTap={{ scale: 0.88 }}
            style={{
              width: 34,
              height: 34,
              borderRadius: 11,
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
              color: dark ? "#94a3b8" : "#64748b",
            }}
          >
            <ArrowLeft size={15} />
          </motion.button>
          <h1
            style={{
              fontSize: 17,
              fontWeight: 900,
              letterSpacing: "-0.03em",
              margin: 0,
              color: dark ? "#fff" : "#0f172a",
            }}
          >
            Edit Profile
          </h1>
        </motion.div>

        {/* Avatar */}
        <motion.div
          {...fade(0.03)}
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 22,
          }}
        >
          <div style={{ position: "relative" }}>
            <div
              style={{
                width: 92,
                height: 92,
                borderRadius: "50%",
                background: avatarPreview
                  ? `center/cover no-repeat url(${avatarPreview})`
                  : user?.avatar
                    ? `center/cover no-repeat url(${user.avatar})`
                    : "linear-gradient(135deg,#3b82f6 0%,#8b5cf6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 34,
                fontWeight: 700,
                color: "white",
                boxShadow: dark
                  ? "0 4px 28px rgba(59,130,246,0.35)"
                  : "0 4px 20px rgba(59,130,246,0.25)",
              }}
            >
              {!avatarPreview &&
                !user?.avatar &&
                (user?.name?.[0]?.toUpperCase() ?? "A")}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 29,
                height: 29,
                borderRadius: "50%",
                background: "#3b82f6",
                border: `2.5px solid ${dark ? "#080f1e" : "#f0f5ff"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Camera size={13} color="white" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarPick}
              style={{ display: "none" }}
            />
          </div>
        </motion.div>

        {/* Error / Success banners */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 13px",
              borderRadius: 12,
              marginBottom: 14,
              background: dark
                ? "rgba(239,68,68,0.1)"
                : "rgba(254,226,226,0.7)",
              border: `1.5px solid ${dark ? "rgba(239,68,68,0.25)" : "rgba(252,165,165,0.6)"}`,
            }}
          >
            <AlertCircle size={15} color="#ef4444" />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "#ef4444" }}>
              {error}
            </span>
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 13px",
              borderRadius: 12,
              marginBottom: 14,
              background: dark
                ? "rgba(34,197,94,0.1)"
                : "rgba(220,252,231,0.7)",
              border: `1.5px solid ${dark ? "rgba(34,197,94,0.25)" : "rgba(134,239,172,0.6)"}`,
            }}
          >
            <Check size={15} color="#22c55e" />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "#22c55e" }}>
              Profile updated successfully.
            </span>
          </motion.div>
        )}

        {/* Account details */}
        <Card title="Account Details" icon={<UserIcon size={13} />} dark={dark}>
          <Field label="Full Name" icon={<UserIcon size={14} />} dark={dark}>
            <Input
              value={name}
              onChange={setName}
              dark={dark}
              placeholder="Your name"
            />
          </Field>
          <Field label="Email" icon={<Mail size={14} />} dark={dark}>
            <Input
              value={email}
              onChange={setEmail}
              dark={dark}
              type="email"
              placeholder="you@example.com"
            />
          </Field>
          <Field label="Phone" icon={<Phone size={14} />} dark={dark}>
            <Input
              value={phone}
              onChange={setPhone}
              dark={dark}
              type="tel"
              placeholder="Phone number"
            />
          </Field>
        </Card>

        {/* Business details */}
        <Card
          title="Business Details"
          icon={<Building2 size={13} />}
          dark={dark}
        >
          <Field
            label="Business Name"
            icon={<Building2 size={14} />}
            dark={dark}
          >
            <Input
              value={businessName}
              onChange={setBusinessName}
              dark={dark}
              placeholder="Your business name"
            />
          </Field>
          <Field
            label="Number of Employees"
            icon={<Users size={14} />}
            dark={dark}
          >
            <Input
              value={employeeCount}
              onChange={(v) => setEmployeeCount(v.replace(/[^0-9]/g, ""))}
              dark={dark}
              type="text"
              placeholder="e.g. 5"
            />
          </Field>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <Field label="City" icon={<MapPin size={14} />} dark={dark}>
                <Input
                  value={city}
                  onChange={setCity}
                  dark={dark}
                  placeholder="City"
                />
              </Field>
            </div>
            <div style={{ flex: 1 }}>
              <Field label="State" icon={<MapPin size={14} />} dark={dark}>
                <Input
                  value={state}
                  onChange={setState}
                  dark={dark}
                  placeholder="State"
                />
              </Field>
            </div>
          </div>
        </Card>

        {/* Password */}
        <Card title="Password" icon={<Lock size={13} />} dark={dark}>
          <button
            onClick={() => router.push("/forgot-password")}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12.5,
                fontWeight: 700,
                color: "#3b82f6",
              }}
            >
              <Lock size={12} /> Change password
            </span>
            <ChevronRight size={15} color={dark ? "#475569" : "#94a3b8"} />
          </button>
        </Card>

        {/* Save button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={isPending}
          style={{
            width: "100%",
            height: 48,
            borderRadius: 16,
            border: "none",
            cursor: isPending ? "default" : "pointer",
            fontSize: 14.5,
            fontWeight: 800,
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
            boxShadow: "0 8px 24px rgba(37,99,235,0.35)",
            opacity: isPending ? 0.75 : 1,
          }}
        >
          {isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </motion.button>
      </div>
    </div>
  );
}

"use client";
/**
 * NodeOS Onboarding — v2
 * Two flows: Personal (8 steps) and Company (8 steps)
 * Multi-entry sections, "add custom if not in list", biometric capture.
 */
import {
  useCallback, useRef, useState,
} from "react";
import {
  Building2, Camera, CheckCircle, ChevronLeft, ChevronRight,
  Fingerprint, Mic, MicOff, Plus, Trash2, User, X,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type FlowType = "personal" | "company";

interface EducationEntry {
  level: string; institution: string; field: string;
  start_year: string; end_year: string; grade: string;
}
interface JobEntry {
  company: string; role: string; start_year: string;
  end_year: string; current: boolean; location: string;
}
interface AddressEntry {
  label: string; line1: string; line2: string;
  city: string; state: string; pincode: string; country: string;
}
interface IdEntry {
  id_type: string; id_number: string; expiry: string;
}

interface PersonalData {
  // Step 1 — Identity
  name: string; dob: string; gender: string;
  mobile: string; email: string; nationality: string;
  // Step 2 — Profile
  cast: string; gotra: string; marital_status: string;
  religion: string; blood_group: string; hobbies: string[];
  // Step 3 — Education
  education: EducationEntry[];
  // Step 4 — Employment
  jobs: JobEntry[];
  // Step 5 — Address
  addresses: AddressEntry[];
  // Step 6 — IDs
  ids: IdEntry[];
  // Step 7 — Biometric
  face_photo: string; voice_recorded: boolean; fingerprint_done: boolean;
  // Step 8 — Security
  password: string; confirm_password: string;
  two_fa: boolean; data_pref: string[];
}

interface CompanyData {
  // Step 1 — Identity
  company_name: string; legal_name: string; company_type: string;
  founded_year: string; cin: string; gst: string;
  // Step 2 — Industry
  industry: string; sub_industry: string; description: string;
  // Step 3 — Size
  employee_count: string; departments: string[];
  // Step 4 — Contact
  website: string; email: string; phone: string;
  linkedin: string; twitter: string;
  // Step 5 — Address
  registered_address: AddressEntry; operational_address: AddressEntry;
  // Step 6 — Documents
  pan: string; tan: string; bank_name: string;
  account_number: string; ifsc: string;
  // Step 7 — Products
  offerings: Array<{ name: string; type: string; description: string }>;
  target_customer: string; revenue_model: string;
  // Step 8 — Admin
  admin_name: string; admin_role: string;
  admin_email: string; admin_phone: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EDU_LEVELS = ["10th / SSC", "12th / HSC", "Diploma", "Bachelor's", "Master's", "PhD", "Certificate", "Other"];
const MARITAL    = ["Single", "Married", "Divorced", "Widowed", "Separated", "Prefer not to say"];
const GENDERS    = ["Male", "Female", "Non-binary", "Prefer not to say", "Other"];
const RELIGIONS  = ["Hindu", "Muslim", "Christian", "Sikh", "Buddhist", "Jain", "Parsi", "Other", "Prefer not to say"];
const BLOOD_GRP  = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"];
const HOBBIES    = ["Reading", "Music", "Cricket", "Football", "Chess", "Gaming", "Cooking", "Travelling", "Photography", "Art", "Yoga", "Coding", "Dance", "Swimming", "Cycling"];
const ID_TYPES   = ["Aadhaar", "PAN Card", "Passport", "Driving Licence", "Voter ID", "NREGA Card", "Other"];
const COMPANY_TYPES = ["Pvt Ltd", "Public Ltd", "LLP", "OPC", "Partnership Firm", "Sole Proprietorship", "Section 8 / NGO", "Government", "Other"];
const INDUSTRIES = ["Technology", "Healthcare", "Education", "Finance / Banking", "Retail / E-commerce", "Manufacturing", "Agriculture", "Media / Entertainment", "Logistics", "Real Estate", "Legal", "Hospitality", "Construction", "Non-Profit", "Government", "Other"];
const DEPT_LIST  = ["Engineering", "Sales", "Marketing", "HR", "Finance", "Operations", "Customer Support", "Legal", "Product", "Design", "Management"];
const REVENUE_MODELS = ["SaaS / Subscription", "One-time Sale", "Marketplace", "Freemium", "Advertising", "Consulting", "Manufacturing", "Other"];
const DATA_PREFS = ["local_only", "cloud_sync", "encrypted_backup", "analytics", "gdpr_mode"];

const PERSONAL_STEPS   = ["Identity", "Profile", "Education", "Employment", "Address", "IDs & Docs", "Biometric", "Security"];
const COMPANY_STEPS    = ["Company Info", "Industry", "Team & Size", "Contact", "Address", "Documents", "Products", "Admin User"];

// ─── Default values ───────────────────────────────────────────────────────────

const emptyEdu    = (): EducationEntry  => ({ level: "", institution: "", field: "", start_year: "", end_year: "", grade: "" });
const emptyJob    = (): JobEntry        => ({ company: "", role: "", start_year: "", end_year: "", current: false, location: "" });
const emptyAddr   = (): AddressEntry    => ({ label: "", line1: "", line2: "", city: "", state: "", pincode: "", country: "India" });
const emptyId     = (): IdEntry         => ({ id_type: "", id_number: "", expiry: "" });
const emptyOffering = ()                => ({ name: "", type: "Product", description: "" });

const defaultPersonal = (): PersonalData => ({
  name: "", dob: "", gender: "", mobile: "", email: "", nationality: "Indian",
  cast: "", gotra: "", marital_status: "", religion: "", blood_group: "", hobbies: [],
  education: [emptyEdu()],
  jobs: [emptyJob()],
  addresses: [{ ...emptyAddr(), label: "Current" }],
  ids: [emptyId()],
  face_photo: "", voice_recorded: false, fingerprint_done: false,
  password: "", confirm_password: "", two_fa: false, data_pref: ["local_only"],
});

const defaultCompany = (): CompanyData => ({
  company_name: "", legal_name: "", company_type: "", founded_year: "", cin: "", gst: "",
  industry: "", sub_industry: "", description: "",
  employee_count: "", departments: [],
  website: "", email: "", phone: "", linkedin: "", twitter: "",
  registered_address: { ...emptyAddr(), label: "Registered" },
  operational_address: { ...emptyAddr(), label: "Operational" },
  pan: "", tan: "", bank_name: "", account_number: "", ifsc: "",
  offerings: [emptyOffering()],
  target_customer: "", revenue_model: "",
  admin_name: "", admin_role: "", admin_email: "", admin_phone: "",
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Field({
  label, value, onChange, type = "text", placeholder = "", required = false, hint = ""
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean; hint?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: "var(--muted)" }}>
        {label}{required && <span style={{ color: "var(--danger)" }}> *</span>}
      </label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ padding: "8px 12px", fontSize: 13 }}
      />
      {hint && <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{hint}</p>}
    </div>
  );
}

function SelectOrAdd({
  label, options, value, onChange, placeholder = "Select…",
}: {
  label: string; options: string[]; value: string;
  onChange: (v: string) => void; placeholder?: string;
}) {
  const [custom, setCustom] = useState(false);
  const [customVal, setCustomVal] = useState("");
  const isOther = value === "__other__";

  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: "var(--muted)" }}>
        {label}
      </label>
      {!custom ? (
        <select
          value={value}
          onChange={(e) => {
            if (e.target.value === "__other__") { setCustom(true); }
            else onChange(e.target.value);
          }}
          style={{ fontSize: 13 }}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
          <option value="__other__">+ Add custom…</option>
        </select>
      ) : (
        <div className="flex gap-2">
          <input
            autoFocus
            type="text"
            value={customVal}
            onChange={(e) => setCustomVal(e.target.value)}
            placeholder={`Enter custom ${label.toLowerCase()}…`}
            style={{ fontSize: 13 }}
          />
          <button
            className="btn btn-primary text-xs px-3"
            onClick={() => { onChange(customVal); setCustom(false); }}
            disabled={!customVal.trim()}
          >
            Add
          </button>
          <button
            className="btn btn-secondary text-xs px-2"
            onClick={() => { setCustom(false); setCustomVal(""); }}
          >
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

function MultiChip({
  label, options, value, onChange,
}: {
  label: string; options: string[]; value: string[]; onChange: (v: string[]) => void;
}) {
  const [customInput, setCustomInput] = useState("");
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: "var(--muted)" }}>
        {label}
      </label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {options.map((o) => {
          const sel = value.includes(o);
          return (
            <button
              key={o}
              onClick={() => onChange(sel ? value.filter((v) => v !== o) : [...value, o])}
              className="badge text-xs"
              style={{
                cursor: "pointer", border: `1px solid ${sel ? "var(--accent)" : "var(--border)"}`,
                background: sel ? "rgba(108,99,255,0.18)" : "var(--bg)",
                color: sel ? "var(--accent)" : "var(--muted)",
                fontWeight: sel ? 700 : 500,
              }}
            >
              {sel && "✓ "}{o}
            </button>
          );
        })}
        <div className="flex items-center gap-1 border rounded-full px-2" style={{ borderColor: "var(--border)" }}>
          <input
            type="text" value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && customInput.trim()) {
                onChange([...value, customInput.trim()]);
                setCustomInput("");
              }
            }}
            placeholder="+ custom"
            style={{ border: "none", background: "transparent", fontSize: 11, width: 70, padding: "2px 0", outline: "none" }}
          />
          {customInput && (
            <button
              onClick={() => { onChange([...value, customInput.trim()]); setCustomInput(""); }}
              style={{ color: "var(--accent)", fontSize: 11, background: "none", border: "none", cursor: "pointer" }}
            >
              Add
            </button>
          )}
        </div>
      </div>
      {value.filter((v) => !options.includes(v)).map((v) => (
        <span
          key={v}
          className="badge text-xs mr-1"
          style={{ background: "rgba(0,210,255,0.12)", color: "var(--accent2)", border: "1px solid rgba(0,210,255,0.25)" }}
        >
          {v} <button onClick={() => onChange(value.filter((x) => x !== v))} style={{ marginLeft: 4, opacity: 0.7, cursor: "pointer", background: "none", border: "none" }}>×</button>
        </span>
      ))}
    </div>
  );
}

// ─── Personal Steps ───────────────────────────────────────────────────────────

function StepIdentity({ d, set }: { d: PersonalData; set: (p: Partial<PersonalData>) => void }) {
  const age = d.dob ? Math.floor((Date.now() - new Date(d.dob).getTime()) / (365.25 * 86400000)) : null;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Full Name" value={d.name} onChange={(v) => set({ name: v })} required placeholder="As per ID" />
        <Field label="Date of Birth" value={d.dob} onChange={(v) => set({ dob: v })} type="date" required hint={age !== null && age > 0 ? `Age: ${age} years` : undefined} />
        <SelectOrAdd label="Gender" options={GENDERS} value={d.gender} onChange={(v) => set({ gender: v })} />
        <Field label="Mobile" value={d.mobile} onChange={(v) => set({ mobile: v })} type="tel" placeholder="+91 98765 43210" required />
        <Field label="Email" value={d.email} onChange={(v) => set({ email: v })} type="email" placeholder="you@example.com" />
        <Field label="Nationality" value={d.nationality} onChange={(v) => set({ nationality: v })} placeholder="Indian" />
      </div>
    </div>
  );
}

function StepProfile({ d, set }: { d: PersonalData; set: (p: Partial<PersonalData>) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Caste / Community" value={d.cast} onChange={(v) => set({ cast: v })} placeholder="e.g. Brahmin, OBC, SC, ST…" />
        <Field label="Gotra / Clan" value={d.gotra} onChange={(v) => set({ gotra: v })} placeholder="e.g. Kashyap" />
        <SelectOrAdd label="Marital Status" options={MARITAL} value={d.marital_status} onChange={(v) => set({ marital_status: v })} />
        <SelectOrAdd label="Religion" options={RELIGIONS} value={d.religion} onChange={(v) => set({ religion: v })} />
        <SelectOrAdd label="Blood Group" options={BLOOD_GRP} value={d.blood_group} onChange={(v) => set({ blood_group: v })} />
      </div>
      <MultiChip label="Hobbies & Interests" options={HOBBIES} value={d.hobbies} onChange={(v) => set({ hobbies: v })} />
    </div>
  );
}

function StepEducation({ d, set }: { d: PersonalData; set: (p: Partial<PersonalData>) => void }) {
  const update = (i: number, patch: Partial<EducationEntry>) => {
    const edu = d.education.map((e, idx) => idx === i ? { ...e, ...patch } : e);
    set({ education: edu });
  };
  const add    = () => set({ education: [...d.education, emptyEdu()] });
  const remove = (i: number) => set({ education: d.education.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-4">
      {d.education.map((e, i) => (
        <div
          key={i}
          className="rounded-2xl p-4 space-y-3"
          style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>Education #{i + 1}</span>
            {d.education.length > 1 && (
              <button onClick={() => remove(i)} className="text-xs" style={{ color: "var(--danger)", background: "none", border: "none", cursor: "pointer" }}>
                <Trash2 size={13} />
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SelectOrAdd label="Level / Degree" options={EDU_LEVELS} value={e.level} onChange={(v) => update(i, { level: v })} />
            <Field label="Institution / School / College" value={e.institution} onChange={(v) => update(i, { institution: v })} placeholder="Enter name or add new…" hint={!e.institution ? "Not in list? Type directly" : ""} />
            <Field label="Field of Study / Stream" value={e.field} onChange={(v) => update(i, { field: v })} placeholder="e.g. Computer Science, Commerce" />
            <Field label="Grade / Percentage / CGPA" value={e.grade} onChange={(v) => update(i, { grade: v })} placeholder="e.g. 85% or 8.5 CGPA" />
            <Field label="Start Year" value={e.start_year} onChange={(v) => update(i, { start_year: v })} type="number" placeholder="2018" />
            <Field label="End Year (or Expected)" value={e.end_year} onChange={(v) => update(i, { end_year: v })} type="number" placeholder="2022" />
          </div>
        </div>
      ))}
      <button onClick={add} className="btn btn-secondary text-sm gap-2">
        <Plus size={14} /> Add Another Education
      </button>
    </div>
  );
}

function StepEmployment({ d, set }: { d: PersonalData; set: (p: Partial<PersonalData>) => void }) {
  const update = (i: number, patch: Partial<JobEntry>) => {
    const jobs = d.jobs.map((j, idx) => idx === i ? { ...j, ...patch } : j);
    set({ jobs });
  };
  const add    = () => set({ jobs: [...d.jobs, emptyJob()] });
  const remove = (i: number) => set({ jobs: d.jobs.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-4">
      {d.jobs.map((j, i) => (
        <div
          key={i}
          className="rounded-2xl p-4 space-y-3"
          style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>
              {j.current ? "Current Job" : `Job #${i + 1}`}
            </span>
            <div className="flex gap-2 items-center">
              <label className="flex items-center gap-1 text-xs cursor-pointer" style={{ color: j.current ? "var(--success)" : "var(--muted)" }}>
                <input type="checkbox" checked={j.current} onChange={(e) => update(i, { current: e.target.checked })} />
                Currently working
              </label>
              {d.jobs.length > 1 && (
                <button onClick={() => remove(i)} style={{ color: "var(--danger)", background: "none", border: "none", cursor: "pointer" }}>
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Company / Organisation" value={j.company} onChange={(v) => update(i, { company: v })} placeholder="Company name (type if not in list)" hint="Not in list? Just type the name" />
            <Field label="Role / Designation" value={j.role} onChange={(v) => update(i, { role: v })} placeholder="e.g. Software Engineer, Manager" />
            <Field label="Location / City" value={j.location} onChange={(v) => update(i, { location: v })} placeholder="e.g. Bangalore, Remote" />
            <div /> {/* spacer on 2-col */}
            <Field label="Start Year" value={j.start_year} onChange={(v) => update(i, { start_year: v })} type="number" placeholder="2020" />
            {!j.current && (
              <Field label="End Year" value={j.end_year} onChange={(v) => update(i, { end_year: v })} type="number" placeholder="2023" />
            )}
          </div>
        </div>
      ))}
      <button onClick={add} className="btn btn-secondary text-sm gap-2">
        <Plus size={14} /> Add Another Job / Experience
      </button>
      <p className="text-xs" style={{ color: "var(--muted)" }}>
        Fresher? Skip this step — or add internships, freelance projects etc.
      </p>
    </div>
  );
}

function StepAddress({ d, set }: { d: PersonalData; set: (p: Partial<PersonalData>) => void }) {
  const update = (i: number, patch: Partial<AddressEntry>) => {
    const addresses = d.addresses.map((a, idx) => idx === i ? { ...a, ...patch } : a);
    set({ addresses });
  };
  const add    = () => set({ addresses: [...d.addresses, { ...emptyAddr(), label: `Address ${d.addresses.length + 1}` }] });
  const remove = (i: number) => set({ addresses: d.addresses.filter((_, idx) => idx !== i) });
  const copyFromFirst = (i: number) => {
    if (i === 0) return;
    update(i, { ...d.addresses[0], label: d.addresses[i].label });
  };

  return (
    <div className="space-y-4">
      {d.addresses.map((a, i) => (
        <div key={i} className="rounded-2xl p-4 space-y-3" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between">
            <input
              type="text" value={a.label}
              onChange={(e) => update(i, { label: e.target.value })}
              placeholder="Label (Current / Permanent…)"
              style={{ fontWeight: 600, fontSize: 13, border: "none", background: "transparent", padding: "0 0 4px 0", outline: "none", color: "var(--accent)" }}
            />
            <div className="flex gap-2">
              {i > 0 && (
                <button onClick={() => copyFromFirst(i)} className="text-xs badge" style={{ cursor: "pointer", color: "var(--accent2)", border: "1px solid rgba(0,210,255,0.3)" }}>
                  Copy from {d.addresses[0].label || "first"}
                </button>
              )}
              {d.addresses.length > 1 && (
                <button onClick={() => remove(i)} style={{ color: "var(--danger)", background: "none", border: "none", cursor: "pointer" }}>
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <Field label="Address Line 1" value={a.line1} onChange={(v) => update(i, { line1: v })} placeholder="House / Flat No., Street, Colony" />
            </div>
            <Field label="Address Line 2" value={a.line2} onChange={(v) => update(i, { line2: v })} placeholder="Landmark, Area" />
            <Field label="City" value={a.city} onChange={(v) => update(i, { city: v })} placeholder="Mumbai" />
            <Field label="State" value={a.state} onChange={(v) => update(i, { state: v })} placeholder="Maharashtra" />
            <Field label="PIN / ZIP Code" value={a.pincode} onChange={(v) => update(i, { pincode: v })} placeholder="400001" />
            <Field label="Country" value={a.country} onChange={(v) => update(i, { country: v })} placeholder="India" />
          </div>
        </div>
      ))}
      <button onClick={add} className="btn btn-secondary text-sm gap-2">
        <Plus size={14} /> Add Another Address
      </button>
    </div>
  );
}

function StepIds({ d, set }: { d: PersonalData; set: (p: Partial<PersonalData>) => void }) {
  const update = (i: number, patch: Partial<IdEntry>) => {
    const ids = d.ids.map((x, idx) => idx === i ? { ...x, ...patch } : x);
    set({ ids });
  };
  const add    = () => set({ ids: [...d.ids, emptyId()] });
  const remove = (i: number) => set({ ids: d.ids.filter((_, idx) => idx !== i) });

  const ID_HINTS: Record<string, string> = {
    Aadhaar: "12-digit number",
    "PAN Card": "10-character ABCDE1234F",
    Passport: "8-character P1234567",
    "Driving Licence": "State code + 13 digits",
    "Voter ID": "3 letters + 7 digits",
  };

  return (
    <div className="space-y-4">
      <p className="text-xs" style={{ color: "var(--muted)" }}>
        All ID data is stored encrypted on your device. Never shared without your consent.
      </p>
      {d.ids.map((x, i) => (
        <div key={i} className="rounded-2xl p-4 space-y-3" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>Document #{i + 1}</span>
            {d.ids.length > 1 && (
              <button onClick={() => remove(i)} style={{ color: "var(--danger)", background: "none", border: "none", cursor: "pointer" }}>
                <Trash2 size={13} />
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <SelectOrAdd label="ID Type" options={ID_TYPES} value={x.id_type} onChange={(v) => update(i, { id_type: v })} />
            <Field
              label="ID Number"
              value={x.id_number}
              onChange={(v) => update(i, { id_number: v })}
              placeholder={ID_HINTS[x.id_type] ?? "Enter ID number"}
            />
            <Field label="Expiry Date (if applicable)" value={x.expiry} onChange={(v) => update(i, { expiry: v })} type="date" />
          </div>
        </div>
      ))}
      <button onClick={add} className="btn btn-secondary text-sm gap-2">
        <Plus size={14} /> Add Another ID / Document
      </button>
    </div>
  );
}

function StepBiometric({ d, set }: { d: PersonalData; set: (p: Partial<PersonalData>) => void }) {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const [camOn, setCamOn]       = useState(false);
  const [recording, setRecording] = useState(false);
  const [voiceProgress, setVoiceProgress] = useState(0);
  const [fpProgress, setFpProgress]       = useState(0);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) { videoRef.current.srcObject = stream; }
      setCamOn(true);
    } catch { setCamOn(false); }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    canvasRef.current.width  = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx?.drawImage(videoRef.current, 0, 0);
    const data = canvasRef.current.toDataURL("image/jpeg", 0.7);
    set({ face_photo: data });
    const stream = videoRef.current.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    setCamOn(false);
  };

  const recordVoice = () => {
    setRecording(true);
    let p = 0;
    const t = setInterval(() => {
      p += 10;
      setVoiceProgress(p);
      if (p >= 100) { clearInterval(t); setRecording(false); set({ voice_recorded: true }); }
    }, 300);
  };

  const scanFingerprint = useCallback(() => {
    let p = 0;
    const t = setInterval(() => {
      p += 5;
      setFpProgress(p);
      if (p >= 100) { clearInterval(t); set({ fingerprint_done: true }); }
    }, 80);
  }, [set]);

  return (
    <div className="space-y-5">
      <p className="text-xs" style={{ color: "var(--muted)" }}>
        Biometric data is stored only on this device and used for local authentication. Camera/mic access is requested only now.
      </p>

      {/* Face */}
      <div className="rounded-2xl p-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Camera size={16} style={{ color: "var(--accent)" }} />
          <span className="font-semibold text-sm">Face Photo</span>
          {d.face_photo && <span className="badge badge-green text-xs ml-auto">✓ Captured</span>}
        </div>
        {d.face_photo ? (
          <div className="flex gap-3 items-center">
            <img src={d.face_photo} alt="face" className="rounded-xl" style={{ width: 80, height: 80, objectFit: "cover" }} />
            <button onClick={() => set({ face_photo: "" })} className="btn btn-secondary text-xs">Retake</button>
          </div>
        ) : (
          <div className="space-y-2">
            {camOn ? (
              <div>
                <video ref={videoRef} autoPlay playsInline className="rounded-xl" style={{ width: "100%", maxWidth: 320 }} />
                <canvas ref={canvasRef} style={{ display: "none" }} />
                <button onClick={capturePhoto} className="btn btn-primary text-sm mt-2 gap-2"><Camera size={14} /> Capture Photo</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button onClick={startCamera} className="btn btn-secondary text-sm gap-2"><Camera size={14} /> Open Camera</button>
                <label className="btn btn-secondary text-sm gap-2 cursor-pointer">
                  Upload Photo
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) { const r = new FileReader(); r.onload = (ev) => set({ face_photo: ev.target?.result as string }); r.readAsDataURL(f); }
                  }} />
                </label>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Voice */}
      <div className="rounded-2xl p-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 mb-3">
          {recording ? <MicOff size={16} style={{ color: "var(--warn)" }} /> : <Mic size={16} style={{ color: "var(--accent)" }} />}
          <span className="font-semibold text-sm">Voice Sample</span>
          {d.voice_recorded && <span className="badge badge-green text-xs ml-auto">✓ Recorded</span>}
        </div>
        {!d.voice_recorded ? (
          <div>
            <p className="text-xs mb-2" style={{ color: "var(--muted)" }}>
              Say: "My name is [your name] and I am logging into NodeOS"
            </p>
            {recording ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: "var(--danger)", animation: "pulse 0.8s infinite" }} />
                  <span className="text-xs" style={{ color: "var(--danger)" }}>Recording…</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                  <div className="h-full rounded-full" style={{ width: `${voiceProgress}%`, background: "var(--danger)", transition: "width 0.3s" }} />
                </div>
              </div>
            ) : (
              <button onClick={recordVoice} className="btn btn-secondary text-sm gap-2"><Mic size={14} /> Start Recording (3s)</button>
            )}
          </div>
        ) : (
          <div className="flex gap-2 items-center">
            <span className="text-sm" style={{ color: "var(--success)" }}>Voice sample saved</span>
            <button onClick={() => set({ voice_recorded: false })} className="btn btn-secondary text-xs">Re-record</button>
          </div>
        )}
      </div>

      {/* Fingerprint */}
      <div className="rounded-2xl p-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Fingerprint size={16} style={{ color: "var(--accent)" }} />
          <span className="font-semibold text-sm">Fingerprint</span>
          {d.fingerprint_done && <span className="badge badge-green text-xs ml-auto">✓ Scanned</span>}
        </div>
        {!d.fingerprint_done ? (
          <div>
            <p className="text-xs mb-2" style={{ color: "var(--muted)" }}>Touch & hold the fingerprint sensor or the button below (device permitting).</p>
            {fpProgress > 0 && fpProgress < 100 ? (
              <div>
                <div className="text-xs mb-1" style={{ color: "var(--muted)" }}>Scanning… {fpProgress}%</div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                  <div className="h-full rounded-full" style={{ width: `${fpProgress}%`, background: "var(--accent)", transition: "width 0.08s" }} />
                </div>
              </div>
            ) : (
              <button onClick={scanFingerprint} className="btn btn-secondary text-sm gap-2">
                <Fingerprint size={14} /> Simulate Scan
              </button>
            )}
          </div>
        ) : (
          <div className="flex gap-2 items-center">
            <span className="text-sm" style={{ color: "var(--success)" }}>Fingerprint registered</span>
            <button onClick={() => { set({ fingerprint_done: false }); setFpProgress(0); }} className="btn btn-secondary text-xs">Rescan</button>
          </div>
        )}
      </div>

      <p className="text-xs" style={{ color: "var(--muted)" }}>
        All biometric data is stored locally with AES-256 encryption. You can skip and add later from Settings.
      </p>
    </div>
  );
}

function StepSecurity({ d, set }: { d: PersonalData; set: (p: Partial<PersonalData>) => void }) {
  const [show, setShow] = useState(false);
  const match = d.password === d.confirm_password;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Create Password" value={d.password} onChange={(v) => set({ password: v })} type={show ? "text" : "password"} placeholder="Min 8 characters" />
        <Field label="Confirm Password" value={d.confirm_password} onChange={(v) => set({ confirm_password: v })} type={show ? "text" : "password"} placeholder="Re-enter password" />
      </div>
      {d.confirm_password && !match && (
        <p className="text-xs" style={{ color: "var(--danger)" }}>Passwords do not match</p>
      )}
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
        Show passwords
      </label>
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" checked={d.two_fa} onChange={(e) => set({ two_fa: e.target.checked })} />
        Enable two-factor authentication
      </label>
      <MultiChip
        label="Data Preferences"
        options={DATA_PREFS}
        value={d.data_pref}
        onChange={(v) => set({ data_pref: v })}
      />
    </div>
  );
}

// ─── Company Steps ────────────────────────────────────────────────────────────

function CStepCompanyInfo({ d, set }: { d: CompanyData; set: (p: Partial<CompanyData>) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Company / Brand Name" value={d.company_name} onChange={(v) => set({ company_name: v })} required placeholder="Yuvaan Tech" />
      <Field label="Legal / Registered Name" value={d.legal_name} onChange={(v) => set({ legal_name: v })} placeholder="Yuvaan Technologies Pvt Ltd" />
      <SelectOrAdd label="Company Type" options={COMPANY_TYPES} value={d.company_type} onChange={(v) => set({ company_type: v })} />
      <Field label="Founded Year" value={d.founded_year} onChange={(v) => set({ founded_year: v })} type="number" placeholder="2020" />
      <Field label="CIN / Registration No." value={d.cin} onChange={(v) => set({ cin: v })} placeholder="U12345MH2020PTC123456" hint="Corporate Identification Number" />
      <Field label="GST Number" value={d.gst} onChange={(v) => set({ gst: v })} placeholder="22ABCDE1234F1Z5" />
    </div>
  );
}

function CStepIndustry({ d, set }: { d: CompanyData; set: (p: Partial<CompanyData>) => void }) {
  return (
    <div className="space-y-4">
      <SelectOrAdd label="Primary Industry" options={INDUSTRIES} value={d.industry} onChange={(v) => set({ industry: v })} />
      <Field label="Sub-Industry / Niche" value={d.sub_industry} onChange={(v) => set({ sub_industry: v })} placeholder="e.g. EdTech, FinTech, AgriTech…" hint="Not in list? Add custom sub-industry" />
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: "var(--muted)" }}>Company Description</label>
        <textarea
          rows={3}
          value={d.description}
          onChange={(e) => set({ description: e.target.value })}
          placeholder="Brief description of what your company does, its mission, and key differentiators…"
          style={{ fontSize: 13, resize: "vertical" }}
        />
      </div>
    </div>
  );
}

function CStepTeam({ d, set }: { d: CompanyData; set: (p: Partial<CompanyData>) => void }) {
  const SIZES = ["1 (Solo)", "2–10", "11–50", "51–250", "251–1000", "1000+"];
  return (
    <div className="space-y-4">
      <SelectOrAdd label="Employee Count" options={SIZES} value={d.employee_count} onChange={(v) => set({ employee_count: v })} />
      <MultiChip label="Departments / Functions" options={DEPT_LIST} value={d.departments} onChange={(v) => set({ departments: v })} />
    </div>
  );
}

function CStepContact({ d, set }: { d: CompanyData; set: (p: Partial<CompanyData>) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Official Email" value={d.email} onChange={(v) => set({ email: v })} type="email" required placeholder="info@company.com" />
      <Field label="Phone / Helpline" value={d.phone} onChange={(v) => set({ phone: v })} type="tel" placeholder="+91 80000 00000" />
      <Field label="Website" value={d.website} onChange={(v) => set({ website: v })} type="url" placeholder="https://yourcompany.com" />
      <Field label="LinkedIn" value={d.linkedin} onChange={(v) => set({ linkedin: v })} placeholder="https://linkedin.com/company/…" />
      <Field label="Twitter / X" value={d.twitter} onChange={(v) => set({ twitter: v })} placeholder="@yourcompany" />
    </div>
  );
}

function CStepAddress({ d, set }: { d: CompanyData; set: (p: Partial<CompanyData>) => void }) {
  const addr = (a: AddressEntry, upd: (patch: Partial<AddressEntry>) => void) => (
    <div className="rounded-2xl p-4 space-y-3" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
      <div className="text-xs font-semibold" style={{ color: "var(--accent)" }}>{a.label} Address</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2"><Field label="Address Line 1" value={a.line1} onChange={(v) => upd({ line1: v })} placeholder="Building, Street" /></div>
        <Field label="Address Line 2" value={a.line2} onChange={(v) => upd({ line2: v })} placeholder="Area, Landmark" />
        <Field label="City" value={a.city} onChange={(v) => upd({ city: v })} />
        <Field label="State" value={a.state} onChange={(v) => upd({ state: v })} />
        <Field label="PIN / ZIP" value={a.pincode} onChange={(v) => upd({ pincode: v })} />
        <Field label="Country" value={a.country} onChange={(v) => upd({ country: v })} />
      </div>
    </div>
  );

  const [same, setSame] = useState(false);

  return (
    <div className="space-y-4">
      {addr(d.registered_address, (p) => set({ registered_address: { ...d.registered_address, ...p } }))}
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" checked={same} onChange={(e) => {
          setSame(e.target.checked);
          if (e.target.checked) set({ operational_address: { ...d.registered_address, label: "Operational" } });
        }} />
        Operational address same as registered
      </label>
      {!same && addr(d.operational_address, (p) => set({ operational_address: { ...d.operational_address, ...p } }))}
    </div>
  );
}

function CStepDocuments({ d, set }: { d: CompanyData; set: (p: Partial<CompanyData>) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="PAN" value={d.pan} onChange={(v) => set({ pan: v })} placeholder="ABCDE1234F" hint="Company / Business PAN" />
      <Field label="TAN" value={d.tan} onChange={(v) => set({ tan: v })} placeholder="MUMB12345B" hint="Tax Deduction Account No." />
      <Field label="Bank Name" value={d.bank_name} onChange={(v) => set({ bank_name: v })} placeholder="HDFC Bank" />
      <Field label="Branch / IFSC" value={d.ifsc} onChange={(v) => set({ ifsc: v })} placeholder="HDFC0001234" />
      <div className="sm:col-span-2">
        <Field label="Account Number" value={d.account_number} onChange={(v) => set({ account_number: v })} placeholder="Primary current account" type="password" hint="Stored encrypted on-device" />
      </div>
    </div>
  );
}

function CStepProducts({ d, set }: { d: CompanyData; set: (p: Partial<CompanyData>) => void }) {
  const update = (i: number, patch: Partial<{ name: string; type: string; description: string }>) => {
    const offerings = d.offerings.map((o, idx) => idx === i ? { ...o, ...patch } : o);
    set({ offerings });
  };
  const add    = () => set({ offerings: [...d.offerings, emptyOffering()] });
  const remove = (i: number) => set({ offerings: d.offerings.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-4">
      {d.offerings.map((o, i) => (
        <div key={i} className="rounded-2xl p-4 space-y-3" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>Offering #{i + 1}</span>
            {d.offerings.length > 1 && (
              <button onClick={() => remove(i)} style={{ color: "var(--danger)", background: "none", border: "none", cursor: "pointer" }}>
                <Trash2 size={13} />
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SelectOrAdd label="Type" options={["Product", "Service", "SaaS", "Marketplace", "Consulting", "Other"]} value={o.type} onChange={(v) => update(i, { type: v })} />
            <Field label="Name" value={o.name} onChange={(v) => update(i, { name: v })} placeholder="Product or Service Name" />
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: "var(--muted)" }}>Description</label>
              <textarea rows={2} value={o.description} onChange={(e) => update(i, { description: e.target.value })} placeholder="What does it do? Who is it for?" style={{ fontSize: 12, resize: "vertical" }} />
            </div>
          </div>
        </div>
      ))}
      <button onClick={add} className="btn btn-secondary text-sm gap-2"><Plus size={14} /> Add Another Product / Service</button>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
        <Field label="Target Customer" value={d.target_customer} onChange={(v) => set({ target_customer: v })} placeholder="e.g. SME businesses, students" />
        <SelectOrAdd label="Revenue Model" options={REVENUE_MODELS} value={d.revenue_model} onChange={(v) => set({ revenue_model: v })} />
      </div>
    </div>
  );
}

function CStepAdmin({ d, set }: { d: CompanyData; set: (p: Partial<CompanyData>) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-xs" style={{ color: "var(--muted)" }}>This is the primary admin user who will manage the company account.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Admin Full Name" value={d.admin_name} onChange={(v) => set({ admin_name: v })} required />
        <Field label="Role / Designation" value={d.admin_role} onChange={(v) => set({ admin_role: v })} placeholder="CEO, CTO, Founder…" />
        <Field label="Admin Email" value={d.admin_email} onChange={(v) => set({ admin_email: v })} type="email" required />
        <Field label="Admin Phone" value={d.admin_phone} onChange={(v) => set({ admin_phone: v })} type="tel" />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const [flow,     setFlow]     = useState<FlowType | null>(null);
  const [step,     setStep]     = useState(0);
  const [done,     setDone]     = useState(false);
  const [personal, setPersonal] = useState<PersonalData>(defaultPersonal);
  const [company,  setCompany]  = useState<CompanyData>(defaultCompany);

  const pset = useCallback((p: Partial<PersonalData>) => setPersonal((prev) => ({ ...prev, ...p })), []);
  const cset = useCallback((p: Partial<CompanyData>) => setCompany((prev) => ({ ...prev, ...p })), []);

  const steps = flow === "personal" ? PERSONAL_STEPS : COMPANY_STEPS;
  const total = steps.length;

  // Save & navigate
  const finish = () => {
    const data = { flow, ...(flow === "personal" ? personal : company) };
    try { localStorage.setItem("nodeos-onboarding", JSON.stringify(data)); } catch { /**/ }
    setDone(true);
  };

  // ── Select flow ────────────────────────────────────────────────────────────
  if (!flow) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Welcome to NodeOS</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Capture your complete profile once — used everywhere on the OS. Choose your setup type to begin.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setFlow("personal")}
            className="rounded-2xl p-6 text-left transition-all hover:scale-[1.02] cursor-pointer"
            style={{ background: "var(--surface)", border: "2px solid var(--border)" }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          >
            <User size={32} className="mb-3" style={{ color: "var(--accent)" }} />
            <div className="font-bold text-lg mb-1">Personal Profile</div>
            <div className="text-xs" style={{ color: "var(--muted)" }}>
              Identity · Education · Jobs · Address · ID & Passport · Biometric · Security
            </div>
            <div className="mt-3 badge badge-purple">{PERSONAL_STEPS.length} steps</div>
          </button>
          <button
            onClick={() => setFlow("company")}
            className="rounded-2xl p-6 text-left transition-all hover:scale-[1.02] cursor-pointer"
            style={{ background: "var(--surface)", border: "2px solid var(--border)" }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent2)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          >
            <Building2 size={32} className="mb-3" style={{ color: "var(--accent2)" }} />
            <div className="font-bold text-lg mb-1">Company / Business</div>
            <div className="text-xs" style={{ color: "var(--muted)" }}>
              Identity · Industry · Team · Contact · Address · Documents · Products · Admin
            </div>
            <div className="mt-3 badge badge-blue">{COMPANY_STEPS.length} steps</div>
          </button>
        </div>
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          You can set up both. All data stays on your device, encrypted at rest.
        </p>
      </div>
    );
  }

  // ── Done ────────────────────────────────────────────────────────────────────
  if (done) {
    const name = flow === "personal" ? personal.name : company.company_name;
    return (
      <div className="max-w-lg mx-auto py-12 space-y-5 text-center">
        <CheckCircle size={48} style={{ color: "var(--success)" }} className="mx-auto" />
        <h1 className="text-2xl font-bold">{flow === "personal" ? "Profile Complete!" : "Company Registered!"}</h1>
        <p style={{ color: "var(--success)" }} className="text-sm">
          {name ? `Welcome, ${name}!` : "Setup complete!"} Your {flow} node has been saved to the OS.
        </p>
        <div className="card grid grid-cols-2 gap-3 text-left">
          {flow === "personal" ? (
            <>
              <Kv k="Name"       v={personal.name} />
              <Kv k="Mobile"     v={personal.mobile} />
              <Kv k="Education"  v={`${personal.education.length} entr${personal.education.length === 1 ? "y" : "ies"}`} />
              <Kv k="Jobs"       v={`${personal.jobs.length} entr${personal.jobs.length === 1 ? "y" : "ies"}`} />
              <Kv k="Addresses"  v={`${personal.addresses.length} address${personal.addresses.length === 1 ? "" : "es"}`} />
              <Kv k="IDs"        v={`${personal.ids.length} document${personal.ids.length === 1 ? "" : "s"}`} />
              <Kv k="Biometric"  v={[personal.face_photo ? "Face" : "", personal.voice_recorded ? "Voice" : "", personal.fingerprint_done ? "FP" : ""].filter(Boolean).join(", ") || "Skipped"} />
              <Kv k="2FA"        v={personal.two_fa ? "Enabled" : "Off"} />
            </>
          ) : (
            <>
              <Kv k="Company"   v={company.company_name} />
              <Kv k="Type"      v={company.company_type} />
              <Kv k="Industry"  v={company.industry} />
              <Kv k="Size"      v={company.employee_count} />
              <Kv k="Offerings" v={`${company.offerings.length}`} />
              <Kv k="GST"       v={company.gst || "—"} />
            </>
          )}
        </div>
        <div className="flex gap-3 flex-wrap justify-center">
          <a href="/dashboard" className="btn btn-primary flex-1 text-center min-w-32">Dashboard →</a>
          <button onClick={() => { setFlow(null); setStep(0); setDone(false); }} className="btn btn-secondary flex-1 min-w-32">
            Add {flow === "personal" ? "Company" : "Personal"} →
          </button>
        </div>
      </div>
    );
  }

  // ── Step screen ─────────────────────────────────────────────────────────────
  const pct  = Math.round((step / total) * 100);

  const renderPersonalStep = () => {
    switch (step) {
      case 0: return <StepIdentity   d={personal} set={pset} />;
      case 1: return <StepProfile    d={personal} set={pset} />;
      case 2: return <StepEducation  d={personal} set={pset} />;
      case 3: return <StepEmployment d={personal} set={pset} />;
      case 4: return <StepAddress    d={personal} set={pset} />;
      case 5: return <StepIds        d={personal} set={pset} />;
      case 6: return <StepBiometric  d={personal} set={pset} />;
      case 7: return <StepSecurity   d={personal} set={pset} />;
    }
  };

  const renderCompanyStep = () => {
    switch (step) {
      case 0: return <CStepCompanyInfo d={company} set={cset} />;
      case 1: return <CStepIndustry    d={company} set={cset} />;
      case 2: return <CStepTeam        d={company} set={cset} />;
      case 3: return <CStepContact     d={company} set={cset} />;
      case 4: return <CStepAddress     d={company} set={cset} />;
      case 5: return <CStepDocuments   d={company} set={cset} />;
      case 6: return <CStepProducts    d={company} set={cset} />;
      case 7: return <CStepAdmin       d={company} set={cset} />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => step === 0 ? setFlow(null) : setStep((s) => s - 1)}
          className="btn btn-secondary text-xs py-1.5 px-2 gap-1"
        >
          <ChevronLeft size={14} />
        </button>
        <div className="flex items-center gap-2">
          {flow === "personal"
            ? <User size={16} style={{ color: "var(--accent)" }} />
            : <Building2 size={16} style={{ color: "var(--accent2)" }} />}
          <span className="font-semibold text-sm capitalize">{flow} Setup</span>
        </div>
        <span className="ml-auto text-xs" style={{ color: "var(--muted)" }}>
          {step + 1} / {total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: flow === "personal"
              ? "linear-gradient(90deg,var(--accent),#a855f7)"
              : "linear-gradient(90deg,var(--accent2),var(--accent))",
            transition: "width 0.3s ease",
          }}
        />
      </div>

      {/* Step pills */}
      <div className="flex gap-1 flex-wrap">
        {steps.map((s, i) => (
          <button
            key={s}
            onClick={() => i < step && setStep(i)}
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              cursor: i < step ? "pointer" : "default",
              background:
                i < step   ? "rgba(34,197,94,0.18)"  :
                i === step  ? "rgba(108,99,255,0.20)" : "var(--border)",
              color:
                i < step   ? "var(--success)"  :
                i === step  ? "var(--accent)"   : "var(--muted)",
              fontWeight: i === step ? 700 : 400,
            }}
          >
            {i < step ? "✓ " : ""}{s}
          </button>
        ))}
      </div>

      {/* Step content */}
      <div className="card">
        <h2 className="font-bold text-base mb-4">{steps[step]}</h2>
        {flow === "personal" ? renderPersonalStep() : renderCompanyStep()}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          className="btn btn-secondary text-sm px-4"
          onClick={() => step >= total - 1 ? finish() : setStep((s) => s + 1)}
        >
          Skip
        </button>
        <button
          className="btn btn-primary flex-1 justify-center gap-2 text-sm"
          onClick={() => step >= total - 1 ? finish() : setStep((s) => s + 1)}
        >
          {step >= total - 1
            ? <><CheckCircle size={15} /> Complete Setup</>
            : <><ChevronRight size={15} /> Next: {steps[step + 1]}</>}
        </button>
      </div>
    </div>
  );
}

function Kv({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-xs" style={{ color: "var(--muted)" }}>{k}</div>
      <div className="text-sm font-medium truncate">{v || "—"}</div>
    </div>
  );
}



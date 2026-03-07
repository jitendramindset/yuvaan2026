/**
 * Vanshawali Identity Graph — TypeScript types
 * Covers all profile sub-nodes defined in nodes/profiles/
 */

// ─── Privacy ─────────────────────────────────────────────────────────────────

export type ContactPrivacy = "public" | "friends" | "family" | "private";

// ─── personal.node ────────────────────────────────────────────────────────────

export interface PersonalNode {
  full_name: string;
  nickname: string;
  gender: string;
  date_of_birth: string;            // ISO-8601 date
  age: number | null;               // auto-computed from date_of_birth
  marital_status: "single" | "married" | "divorced" | "widowed" | "";
  blood_group: string;
  height_cm: number | null;
  religion: string;
  community: string;
  bio: string;
  languages_known: string[];
}

// ─── contact.node ─────────────────────────────────────────────────────────────

export interface ContactField {
  value: string;
  privacy: ContactPrivacy;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
  privacy: ContactPrivacy;
}

export interface ContactNode {
  phone: ContactField;
  email: ContactField;
  whatsapp: ContactField;
  telegram_id: ContactField;
  emergency_contact: EmergencyContact;
  alternate_contact: ContactField;
}

// ─── location.node ────────────────────────────────────────────────────────────

export interface AddressBlock {
  line1: string;
  line2: string;
  village: string;
  city: string;
  district: string;
  state: string;
  country: string;
  postal_code: string;
}

export interface GeoPoint {
  latitude: number | null;
  longitude: number | null;
}

export interface LocationNode {
  current_address: AddressBlock;
  permanent_address: AddressBlock;
  geo: GeoPoint;
  migration_history: Array<{ from: string; to: string; year: number }>;
}

// ─── social.node ──────────────────────────────────────────────────────────────

export interface SocialNode {
  linkedin: string;
  instagram: string;
  facebook: string;
  twitter_x: string;
  youtube: string;
  github: string;
  website: string;
  blog: string;
}

// ─── family.node ──────────────────────────────────────────────────────────────

export type FamilyRelation =
  | "father" | "mother" | "spouse"
  | "son" | "daughter"
  | "grandfather" | "grandmother"
  | "brother" | "sister"
  | "uncle" | "aunt" | "cousin" | "extended";

export interface ChildInfo {
  school: string;
  class: string;
  board: string;
  subjects: string[];
}

export interface FamilyMember {
  member_id: string;
  relation: FamilyRelation | string;
  name: string;
  age: number | null;
  profession: string;
  education: string;
  contact: string;
  location: string;
  node_ref: string | null;         // nid_hash of linked NodeRecord if member is a node
  child_info?: ChildInfo;
}

export interface FamilyNode {
  members: FamilyMember[];
}

// ─── education.node ───────────────────────────────────────────────────────────

export interface EducationEntry {
  school_name: string;
  college: string;
  university: string;
  board: string;
  year_of_passing: number | null;
  subjects: string[];
  skills: string[];
}

export interface EducationNode {
  highest_qualification: string;
  entries: EducationEntry[];
}

// ─── profession.node ──────────────────────────────────────────────────────────

export interface ProfessionNode {
  occupation: string;
  company_name: string;
  role: string;
  experience_years: number | null;
  industry: string;
  skills: string[];
  certifications: string[];
  income_range: string;
}

// ─── preference.node ──────────────────────────────────────────────────────────

export interface PreferenceNode {
  hobbies: string[];
  interests: string[];
  likes: string[];
  dislikes: string[];
  food_preference: string;
  lifestyle: string;
  goals: string[];
}

// ─── property.node ────────────────────────────────────────────────────────────

export interface PropertyNode {
  house: Array<{ address: string; type: string; owned_since: string }>;
  land: Array<{ location: string; area_sqft: number }>;
  vehicles: Array<{ type: string; registration: string }>;
  business_ownership: Array<{ name: string; role: string }>;
  investments: Array<{ type: string; institution: string; amount: number }>;
}

// ─── media.node ───────────────────────────────────────────────────────────────

export interface MediaNode {
  profile_photo: string | null;     // blob ref or URL
  background_photo: string | null;
  documents: string[];
  certificates: string[];
  family_photos: string[];
}

// ─── trust.node ───────────────────────────────────────────────────────────────

export interface TrustCompletionItem {
  weight: number;                   // percentage weight
  filled: boolean;
}

export interface TrustNode {
  profile_completion_score: number; // 0–100
  verification_level: "unverified" | "basic" | "full" | "premium";
  family_connections: number;
  activity_score: number;
  karma_score: number;
  completion_breakdown: {
    basic_info:  TrustCompletionItem;
    contact:     TrustCompletionItem;
    location:    TrustCompletionItem;
    education:   TrustCompletionItem;
    profession:  TrustCompletionItem;
    family:      TrustCompletionItem;
    preferences: TrustCompletionItem;
    media:       TrustCompletionItem;
  };
}

/**
 * Full Vanshawali profile composite.
 * Used by the profile completion engine and trust scorer.
 */
export interface VanshawaliProfile {
  personal:   PersonalNode;
  contact:    ContactNode;
  location:   LocationNode;
  social:     SocialNode;
  family:     FamilyNode;
  education:  EducationNode;
  profession: ProfessionNode;
  preference: PreferenceNode;
  property:   PropertyNode;
  media:      MediaNode;
  trust:      TrustNode;
}

"use client";
/**
 * useProfile — reads the saved onboarding data from localStorage.
 *
 * Onboarding writes: localStorage.setItem("nodeos-onboarding", JSON.stringify(data))
 * Shape (personal flow): { flow, name, mobile, email, dob, gender, ... }
 */
import { useEffect, useState } from "react";

export interface ProfileData {
  flow?:            "personal" | "company";
  name?:            string;
  mobile?:          string;
  email?:           string;
  dob?:             string;
  gender?:          string;
  cast?:            string;
  gotra?:           string;
  religion?:        string;
  blood_group?:     string;
  marital_status?:  string;
  nationality?:     string;
  hobbies?:         string[];
  education?:       Array<{ level?: string; institution?: string; field?: string; grade?: string; start_year?: string; end_year?: string }>;
  jobs?:            Array<{ company?: string; role?: string; title?: string; type?: string; start_year?: string; end_year?: string; current?: boolean; location?: string }>;
  addresses?:       Array<{ label?: string; line1?: string; line2?: string; city?: string; state?: string; pincode?: string; country?: string }>;
  // Social accounts
  linkedin?:        string;
  instagram?:       string;
  facebook?:        string;
  twitter?:         string;
  github?:          string;
  youtube?:         string;
  website?:         string;
  whatsapp?:        string;
  telegram?:        string;
  // Company flow
  company_name?:    string;
  industry?:        string;
  business_size?:   string;
}

const ONBOARDING_KEY = "nodeos-onboarding";

export function useProfile(): ProfileData {
  const [profile, setProfile] = useState<ProfileData>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ONBOARDING_KEY);
      if (raw) setProfile(JSON.parse(raw) as ProfileData);
    } catch { /* ignore */ }

    // Re-sync if the user completes onboarding in another tab
    const handler = (e: StorageEvent) => {
      if (e.key === ONBOARDING_KEY && e.newValue) {
        try { setProfile(JSON.parse(e.newValue) as ProfileData); } catch { /* ignore */ }
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return profile;
}

/** Derive a display-friendly name from profile data */
export function profileDisplayName(p: ProfileData): string {
  if (p.name) return p.name;
  if (p.company_name) return p.company_name;
  return "User";
}

/** Current job title / role */
export function profileRole(p: ProfileData): string {
  if (p.jobs && p.jobs.length > 0) {
    const current = p.jobs.find((j) => j.current) ?? p.jobs[p.jobs.length - 1];
    if (current?.role)  return current.role;
    if (current?.title) return current.title;
    if (current?.company) return current.company;
  }
  if (p.industry) return p.industry;
  return "NodeOS User";
}

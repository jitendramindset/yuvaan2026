"use client";
import { useEffect, useState } from "react";

const OB_KEY = "nodeos-onboarding";

// ─── OBData type ──────────────────────────────────────────────────────────────

export interface OBData {
  flow?: "personal" | "company";
  name?: string;
  mobile?: string;
  email?: string;
  cast?: string;
  gotra?: string;
  religion?: string;
  blood_group?: string;
  hobbies?: string[];
  education?: Array<{
    level: string;
    institution: string;
    field: string;
    start_year: string;
    end_year: string;
    grade: string;
  }>;
  jobs?: Array<{
    company: string;
    role: string;
    start_year: string;
    end_year: string;
    current: boolean;
    location: string;
  }>;
  addresses?: Array<{
    label: string;
    city: string;
    state: string;
    country: string;
    line1: string;
    pincode: string;
  }>;
  nationality?: string;
  dob?: string;
  gender?: string;
  whatsapp?: string;
  telegram?: string;
  linkedin?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  youtube?: string;
  github?: string;
  website?: string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useOBData(): OBData {
  const [data, setData] = useState<OBData>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(OB_KEY);
      if (raw) setData(JSON.parse(raw) as OBData);
    } catch { /**/ }

    const handler = (e: StorageEvent) => {
      if (e.key === OB_KEY && e.newValue) {
        try { setData(JSON.parse(e.newValue) as OBData); } catch { /**/ }
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return data;
}

// ─── Profile completion ───────────────────────────────────────────────────────

const WEIGHTS: Record<string, number> = {
  basic_info: 20, contact: 10, location: 10, education: 10,
  profession: 10, family: 20, preferences: 10, media: 10,
};

export function computeOBCompletion(ob: OBData): { score: number; breakdown: Record<string, boolean> } {
  const bd = {
    basic_info:  Boolean(ob.name && ob.dob),
    contact:     Boolean(ob.mobile || ob.email),
    location:    Boolean(ob.addresses?.[0]?.city),
    education:   Boolean(ob.education?.some((e) => e.institution)),
    profession:  Boolean(ob.jobs?.some((j) => j.company)),
    family:      false,         // filled by family tree interactions
    preferences: Boolean(ob.hobbies?.length),
    media:       false,         // filled by photo uploads
  };
  const score = Object.entries(bd).reduce(
    (acc, [k, v]) => acc + (v ? (WEIGHTS[k] ?? 0) : 0), 0,
  );
  return { score, breakdown: bd };
}

export function karmaLevel(score: number): string {
  if (score >= 80) return "Elder";
  if (score >= 60) return "Root";
  if (score >= 40) return "Sprout";
  return "Seed";
}

// ─── Onboarding & Company System Types ───────────────────────────────────────

// ── Industry ──────────────────────────────────────────────────────────────────
export type Industry =
  | "retail" | "manufacturing" | "software" | "education" | "healthcare"
  | "finance" | "consulting" | "restaurant" | "logistics" | "construction"
  | "agriculture" | "media" | "real_estate" | "travel" | "personal";

// ── Business size bucket ──────────────────────────────────────────────────────
export type BusinessSize = "solo" | "small" | "medium" | "large" | "enterprise";

// ── Business type ─────────────────────────────────────────────────────────────
export type BusinessType =
  | "company" | "freelancer" | "startup" | "personal" | "enterprise";

// ── Operational modules the user can select ───────────────────────────────────
export type OperationModule =
  | "sales" | "inventory" | "accounting" | "hr" | "project_management"
  | "crm" | "customer_support" | "marketing" | "manufacturing" | "ecommerce"
  | "analytics" | "documents" | "tasks";

// ── Data models the user wants to manage ─────────────────────────────────────
export type DataPreference =
  | "customers" | "suppliers" | "inventory" | "projects" | "tasks"
  | "documents" | "analytics" | "employees" | "orders" | "invoices";

// ─── Onboarding Steps ─────────────────────────────────────────────────────────
export type OnboardingStep =
  | "user_identity"       // Step 1 — personal info
  | "company_setup"       // Step 2 — company or freelancer selection
  | "industry_selection"  // Step 3 — industry + sub-industry
  | "business_size"       // Step 4 — headcount bucket
  | "operations"          // Step 5 — what modules do you need
  | "team_structure"      // Step 6 — departments, roles
  | "product_service"     // Step 7 — products / services
  | "data_preferences"    // Step 8 — which data models to generate
  | "complete";           // Final — all nodes & UI generated

// ─── Per-step data payloads ───────────────────────────────────────────────────

export interface UserIdentityPayload {
  full_name:      string;
  nickname?:      string;
  gender?:        "male" | "female" | "other" | "prefer_not";
  date_of_birth?: string;   // ISO date
  phone:          string;
  email:          string;
  profile_photo?: string;   // URL or base64
  bio?:           string;
  language:       string;   // e.g. "en", "hi"
  timezone:       string;   // e.g. "Asia/Kolkata"
  // Location
  country:        string;
  state?:         string;
  city?:          string;
  village?:       string;
  postal_code?:   string;
  // Social links
  linkedin?:      string;
  instagram?:     string;
  twitter?:       string;
  website?:       string;
}

export interface CompanySetupPayload {
  business_type:      BusinessType;
  company_name?:      string;
  company_logo?:      string;
  registration_type?: string;    // "pvt_ltd" | "llp" | "sole_prop" | ...
  tax_id?:            string;
  year_founded?:      number;
  company_website?:   string;
}

export interface IndustryPayload {
  industry:     Industry;
  sub_industry?: string;
}

export interface BusinessSizePayload {
  size: BusinessSize;
  employee_count?: number;
}

export interface OperationsPayload {
  modules: OperationModule[];
}

export interface TeamStructurePayload {
  departments: string[];          // e.g. ["Sales", "HR", "Finance"]
  roles: {
    title: string;
    department: string;
    permissions: string[];
  }[];
}

export interface ProductServicePayload {
  products: {
    name: string;
    sku?: string;
    price?: number;
    category?: string;
  }[];
  services: {
    name: string;
    rate?: number;
    unit?: string;               // "hour" | "project" | "month"
  }[];
  pricing_model: "one_time" | "subscription" | "usage" | "custom";
  subscription_plans?: {
    name: string;
    price_monthly: number;
    features: string[];
  }[];
}

export interface DataPreferencesPayload {
  preferences: DataPreference[];
}

// ─── Onboarding Session ───────────────────────────────────────────────────────

export interface OnboardingSession {
  session_id:    string;
  user_id:       string;
  current_step:  OnboardingStep;
  completed:     boolean;
  voice_mode:    boolean;          // true if driven by voice
  data: {
    user_identity?:    UserIdentityPayload;
    company_setup?:    CompanySetupPayload;
    industry?:         IndustryPayload;
    business_size?:    BusinessSizePayload;
    operations?:       OperationsPayload;
    team_structure?:   TeamStructurePayload;
    product_service?:  ProductServicePayload;
    data_preferences?: DataPreferencesPayload;
  };
  generated_nodes: string[];       // node_ids created at completion
  created_at:    string;
  updated_at:    string;
}

// ─── Company Node (runtime representation) ───────────────────────────────────

export interface CompanyNode {
  node_id:           string;       // "company.<slug>"
  node_type:         "company";
  owner_id:          string;
  company_name:      string;
  business_type:     BusinessType;
  industry:          Industry;
  sub_industry?:     string;
  size:              BusinessSize;
  operations:        OperationModule[];
  departments:       string[];
  products:          string[];
  services:          string[];
  data_preferences:  DataPreference[];
  ui_layout_id:      string;       // generated dashboard layout node_id
  created_at:        string;
  updated_at:        string;
}

// ─── Generated node manifest from onboarding ─────────────────────────────────

export interface OnboardingResult {
  user_id:       string;
  company_id?:   string;
  nodes_created: {
    type: string;
    node_id: string;
    description: string;
  }[];
  dashboard_id:  string;
  ui_schema: {
    platform:    string;
    widget_count: number;
    layout_id:   string;
  };
  workflows_created: string[];
  voice_prompt:  string;           // What to say to user on completion
}

// ─── Social / Family / Location features ─────────────────────────────────────

export interface LiveLocationShare {
  share_id:    string;
  owner_id:    string;
  recipients:  string[];           // user_ids
  group_id?:   string;
  lat:         number;
  lng:         number;
  accuracy?:   number;
  shared_at:   string;
  expires_at?: string;
}

export interface FamilyTreeNode {
  node_id:     string;
  user_id:     string;
  relation:    "self" | "parent" | "sibling" | "child" | "spouse" | "grandparent" | "grandchild" | "cousin" | "friend";
  related_to:  string;             // user_id
  label?:      string;             // custom label
  merged_node?: string;            // if two similar nodes merged
}

export interface NodeMergeRequest {
  source_id:   string;
  target_id:   string;
  strategy:    "keep_target" | "keep_source" | "merge_fields";
  requested_by: string;
}

export interface UserTimeline {
  user_id:  string;
  events: {
    event_id:    string;
    type:        "action" | "transaction" | "social" | "location" | "system";
    description: string;
    data?:       Record<string, unknown>;
    timestamp:   string;
  }[];
}

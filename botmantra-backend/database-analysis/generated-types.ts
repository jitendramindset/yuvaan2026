// Auto-generated TypeScript types from Supabase database
// Generated: 2026-02-15T23:08:43.546Z

export interface Users {
  id: string;
  telegram_id: string;
  email: string;
  full_name: string;
  business_name: any;
  industry: any;
  created_at?: string;
  business_id: string;
  user_type: string;
  mobile: string;
  whatsapp: string;
  password: string;
  updated_at?: string;
  created_by: any;
  changed_by: any;
  role: string;
  email_hash: any;
  mobile_hash: string;
  is_verified: boolean;
  last_login: any;
  bio_hash: any;
  pass_hash: string;
  auth_method: any;
  first_name: string;
  last_name: string;
}

export interface Roles {
  id: string;
  business_id: string;
  role_name: string;
  description?: string;
  is_system: boolean;
  created_at?: string;
}

export interface Permissions {
  id: string;
  business_id: string;
  code: string;
  module: string;
  created_at?: string;
  function: string;
  description?: any;
}

export interface RolePermissions {
  role_id: string;
  permission_id: string;
}

export interface NodePermission {
  perm_id: string;
  nid_hash: string;
  owner_id: string;
  target_owner_id: string;
  permission_type: string;
  can_read: boolean;
  can_write: boolean;
  can_delete: boolean;
  valid_from: string;
  valid_until: any;
  is_revoked: boolean;
  created_at?: string;
  ui_access: boolean;
}

export interface DharmaRules {
  rule_id: string;
  rule_name: string;
  source_type: string;
  principle: string;
  severity_level: number;
  karma_impact: number;
  trust_impact: number;
  is_global: boolean;
  created_at?: string;
}

export interface ChatHistory {
  id: string;
  role: string;
  content: string;
  created_at?: string;
  session_id: string;
  user_id: string;
}


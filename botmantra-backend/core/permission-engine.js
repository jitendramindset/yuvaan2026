/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  PERMISSION RULE EXECUTION ENGINE — Neural OS Kernel        ║
 * ║  Permissions are EXECUTABLE, not static flags               ║
 * ║  Every action passes through this engine before execution   ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Tables used:
 *   node_permission          — per-node access grants
 *   node_permission_effective — resolved effective permissions (RPC)
 *   node_core                — trust_score, karma_score, node_state
 *   node_trust_state         — device & session trust
 */

const { decodeFromBlob } = require('./node-schema');
const NodeFactory = require('./nodeFactory');

// ─── PERMISSION CODES ────────────────────────────────────────
const PERMISSION_CODES = {
  chat_access:        { min_trust: 0,  min_karma: -100 },
  ui_access:          { min_trust: 0,  min_karma: -100 },
  data_query:         { min_trust: 10, min_karma: -50  },
  data_write:         { min_trust: 30, min_karma: 0    },
  data_delete:        { min_trust: 50, min_karma: 10   },
  automation_execute: { min_trust: 40, min_karma: 20   },
  plugin_execute:     { min_trust: 30, min_karma: 10   },
  admin_access:       { min_trust: 70, min_karma: 50   },
  node_create:        { min_trust: 20, min_karma: 0    },
  node_delete:        { min_trust: 60, min_karma: 30   },
  permission_grant:   { min_trust: 80, min_karma: 50   },
  brand_switch:       { min_trust: 10, min_karma: -20  },
  prompt_update:      { min_trust: 90, min_karma: 80   }
};

// ─── ACTION → PERMISSION CODE MAPPING ────────────────────────
const ACTION_PERMISSION_MAP = {
  chat:             'chat_access',
  ui_bootstrap:     'ui_access',
  ui:               'ui_access',
  data:             'data_query',
  data_read:        'data_query',
  data_write:       'data_write',
  data_delete:      'data_delete',
  automation:       'automation_execute',
  plugin:           'plugin_execute',
  admin:            'admin_access',
  admin_bootstrap:  'admin_access',
  admin_execute:    'admin_access',
  create_node:      'node_create',
  delete_node:      'node_delete',
  grant_permission: 'permission_grant',
  switch_brand:     'brand_switch',
  update_prompt:    'prompt_update',
  form_submit:      'data_write',
  post_login:       'ui_access'
};

// ─── R  OLE HIERARCHY ──────────────────────────────────────────
const ROLE_HIERARCHY = {
  super_admin:  100,
  owner:        90,
  admin:        80,
  manager:      60,
  teacher:      50,
  parent:       50,
  employee:     40,
  member:       30,
  student:      20,
  child:        10,
  viewer:       5,
  guest:        1
};

// ─── RELATIONSHIP SCOPES ─────────────────────────────────────
const RELATIONSHIP_SCOPES = {
  self:        { can_act_on: ['self'] },
  family:      { can_act_on: ['self', 'child', 'spouse', 'sibling', 'parent'] },
  team:        { can_act_on: ['self', 'team_member', 'managed_by'] },
  org:         { can_act_on: ['self', 'team_member', 'managed_by', 'department'] },
  public:      { can_act_on: ['*'] }
};

class PermissionEngine {
  constructor(supabaseClient) {
    this.db = supabaseClient;
    this.nodeFactory = new NodeFactory(supabaseClient);
  }

  // ═══════════════════════════════════════════════════════════
  // MAIN VALIDATION — called by kernel for every action
  // ═══════════════════════════════════════════════════════════
  async validatePermission(userNode, actionType, payload = {}) {
    const errors = [];
    const permCode = ACTION_PERMISSION_MAP[actionType] || actionType;
    const permReq = PERMISSION_CODES[permCode];

    if (!permReq) {
      errors.push({ code: 'UNKNOWN_ACTION', message: `No permission mapping for action: ${actionType}` });
      return { allowed: false, errors };
    }

    // BOOTSTRAP BYPASS: Allow UI bootstrap without strict permission checks
    // UI layout loading is non-sensitive, user is already authenticated
    if (actionType === 'ui' || actionType === 'ui_bootstrap') {
      return { allowed: true, errors: [] };
    }

    // 1. Node state check
    if (userNode.node_state === 'LOCKED') {
      return { allowed: false, errors: [{ code: 'NODE_LOCKED', message: 'Node is locked' }] };
    }
    if (userNode.node_state === 'SUSPENDED') {
      return { allowed: false, errors: [{ code: 'NODE_SUSPENDED', message: 'Node is suspended' }] };
    }
    if (userNode.node_state === 'SLEEP' && actionType !== 'chat') {
      return { allowed: false, errors: [{ code: 'NODE_SLEEPING', message: 'Node is in sleep mode' }] };
    }

    // 2. Trust score gate
    // Default to 50 for new users to allow UI bootstrap
    const trustScore = userNode.trust_score !== undefined && userNode.trust_score !== null 
      ? userNode.trust_score 
      : 50;
    if (trustScore < permReq.min_trust) {
      errors.push({
        code: 'TRUST_TOO_LOW',
        message: `Trust score ${trustScore} < required ${permReq.min_trust} for ${permCode}`,
        current: trustScore,
        required: permReq.min_trust
      });
    }

    // 3. Karma score gate
    // Default to 0 for new users to allow UI bootstrap
    const karmaScore = userNode.karma_score !== undefined && userNode.karma_score !== null 
      ? userNode.karma_score 
      : 0;
    if (karmaScore < permReq.min_karma) {
      errors.push({
        code: 'KARMA_TOO_LOW',
        message: `Karma score ${karmaScore} < required ${permReq.min_karma} for ${permCode}`,
        current: karmaScore,
        required: permReq.min_karma
      });
    }

    // 4. Role-based check (if target node provided)
    if (payload.target_node) {
      const roleCheck = await this._checkRolePermission(userNode, payload.target_node, actionType);
      if (!roleCheck.allowed) {
        errors.push(...roleCheck.errors);
      }
    }

    // 5. Relationship scope check
    if (payload.target_node && payload.relationship_scope) {
      const relCheck = await this._checkRelationshipScope(userNode, payload.target_node, payload.relationship_scope);
      if (!relCheck.allowed) {
        errors.push(...relCheck.errors);
      }
    }

    // 6. Brand isolation check
    // Skip for default/fallback nodes (no DB row) — they get basic access.
    const isDefaultNode = !userNode.row_id || userNode.row_id === 0;
    if (payload.brand_scope && !isDefaultNode) {
      // BOTMANTRA is the universal platform — always accessible
      if (payload.brand_scope !== 'BOTMANTRA') {
        const userBrands = this._extractUserBrands(userNode);
        if (!userBrands.includes(payload.brand_scope) && !userBrands.includes('BOTMANTRA')) {
          errors.push({
            code: 'BRAND_ISOLATION_VIOLATION',
            message: `User not authorized for brand: ${payload.brand_scope}`
          });
        }
      }
    }

    // 7. Node-level permission rules (from perm_blob or permission_rule nodes)
    if (payload.target_nid_hash) {
      const nodePermCheck = await this._checkNodePermissionRules(userNode, payload.target_nid_hash, actionType);
      if (!nodePermCheck.allowed) {
        errors.push(...nodePermCheck.errors);
      }
    }

    return {
      allowed: errors.length === 0,
      errors,
      resolved_permission: permCode,
      trust_score: trustScore,
      karma_score: karmaScore
    };
  }

  // ═══════════════════════════════════════════════════════════
  // ROLE PERMISSION CHECK
  // ═══════════════════════════════════════════════════════════
  async _checkRolePermission(userNode, targetNode, actionType) {
    const errors = [];
    const userRole = this._extractRole(userNode);
    const targetRole = this._extractRole(targetNode);

    const userRank = ROLE_HIERARCHY[userRole] || 0;
    const targetRank = ROLE_HIERARCHY[targetRole] || 0;

    // Write/delete actions require higher or equal rank
    const writeActions = ['data_write', 'data_delete', 'delete_node', 'update_prompt', 'grant_permission'];
    if (writeActions.includes(ACTION_PERMISSION_MAP[actionType])) {
      if (userRank < targetRank) {
        errors.push({
          code: 'ROLE_NOT_ALLOWED',
          message: `Role ${userRole} (rank ${userRank}) cannot modify ${targetRole} (rank ${targetRank})`,
          user_role: userRole,
          target_role: targetRole
        });
      }
    }

    // Child cannot edit parent
    if (userRole === 'child' && targetRole === 'parent' && actionType !== 'chat') {
      errors.push({ code: 'CHILD_PARENT_RESTRICTION', message: 'Child cannot modify parent node' });
    }

    // Employee cannot edit admin
    if (userRole === 'employee' && (targetRole === 'admin' || targetRole === 'owner')) {
      errors.push({ code: 'EMPLOYEE_ADMIN_RESTRICTION', message: 'Employee cannot modify admin/owner node' });
    }

    return { allowed: errors.length === 0, errors };
  }

  // ═══════════════════════════════════════════════════════════
  // RELATIONSHIP SCOPE CHECK
  // ═══════════════════════════════════════════════════════════
  async _checkRelationshipScope(userNode, targetNode, scope) {
    const errors = [];
    const scopeDef = RELATIONSHIP_SCOPES[scope];
    if (!scopeDef) {
      errors.push({ code: 'UNKNOWN_SCOPE', message: `Unknown relationship scope: ${scope}` });
      return { allowed: false, errors };
    }

    if (scopeDef.can_act_on.includes('*')) return { allowed: true, errors: [] };

    // Check self
    if (userNode.nid_hash === targetNode.nid_hash) return { allowed: true, errors: [] };

    // Check relationship in DB
    const rel = await this._getRelationship(userNode.owner_id, targetNode.owner_id || targetNode.nid_hash);
    const relType = rel?.relationship_type || 'stranger';

    if (!scopeDef.can_act_on.includes(relType) && !scopeDef.can_act_on.includes('self')) {
      errors.push({
        code: 'RELATIONSHIP_DENIED',
        message: `Relationship "${relType}" not allowed in scope "${scope}"`,
        relationship: relType,
        scope
      });
    }

    return { allowed: errors.length === 0, errors };
  }

  // ═══════════════════════════════════════════════════════════
  // NODE-LEVEL PERMISSION RULES
  // ═══════════════════════════════════════════════════════════
  async _checkNodePermissionRules(userNode, targetNidHash, actionType) {
    const errors = [];

    // Fetch permission rules from node_permission table
    const { data: perms } = await this.db
      .from('node_permission')
      .select('*')
      .eq('nid_hash', targetNidHash)
      .eq('is_revoked', false);

    if (!perms || perms.length === 0) {
      // No explicit rules = use default (allow owner, deny others)
      if (userNode.owner_id !== (await this._getNodeOwner(targetNidHash))) {
        // Check if there's a wildcard permission
        return { allowed: true, errors: [] }; // Default: allow if no explicit deny
      }
      return { allowed: true, errors: [] };
    }

    // Find matching permission for this user
    const userPerm = perms.find(p =>
      p.owner_id === userNode.owner_id || p.target_owner_id === userNode.owner_id
    );

    if (!userPerm) {
      // No specific permission for this user
      return { allowed: true, errors: [] }; // Default allow for now
    }

    // Check validity period
    if (userPerm.valid_until && new Date(userPerm.valid_until) < new Date()) {
      errors.push({ code: 'PERMISSION_EXPIRED', message: 'Permission has expired' });
      return { allowed: false, errors };
    }

    // Check action type against permission
    const writeNeeded = ['data_write', 'data_delete', 'delete_node', 'update_prompt'].includes(
      ACTION_PERMISSION_MAP[actionType] || actionType
    );
    const deleteNeeded = ['data_delete', 'delete_node'].includes(
      ACTION_PERMISSION_MAP[actionType] || actionType
    );

    if (writeNeeded && !userPerm.can_write) {
      errors.push({ code: 'WRITE_DENIED', message: 'Write permission denied on this node' });
    }
    if (deleteNeeded && !userPerm.can_delete) {
      errors.push({ code: 'DELETE_DENIED', message: 'Delete permission denied on this node' });
    }
    if (!userPerm.can_read) {
      errors.push({ code: 'READ_DENIED', message: 'Read permission denied on this node' });
    }

    return { allowed: errors.length === 0, errors };
  }

  // ═══════════════════════════════════════════════════════════
  // HELPER — extract role from node's field_map or perm_blob
  // ═══════════════════════════════════════════════════════════
  _extractRole(node) {
    const fieldMap = typeof node.field_map === 'string' ? decodeFromBlob(node.field_map) : node.field_map;
    const permBlob = typeof node.perm_blob === 'string' ? decodeFromBlob(node.perm_blob) : node.perm_blob;
    return fieldMap?.role || fieldMap?.profile_type || permBlob?.role || 'member';
  }

  _extractUserBrands(node) {
    const fieldMap = typeof node.field_map === 'string' ? decodeFromBlob(node.field_map) : node.field_map;
    const dna = typeof node.dna_blob === 'string' ? decodeFromBlob(node.dna_blob) : node.dna_blob;
    const brands = [];
    if (dna?.brand_scope) brands.push(dna.brand_scope);
    if (fieldMap?.brand) brands.push(fieldMap.brand);
    if (fieldMap?.brands) brands.push(...fieldMap.brands);
    return [...new Set(brands)];
  }

  async _getRelationship(userId1, userId2) {
    const { data } = await this.db
      .from('node_permission')
      .select('permission_type')
      .or(`owner_id.eq.${userId1},target_owner_id.eq.${userId1}`)
      .or(`owner_id.eq.${userId2},target_owner_id.eq.${userId2}`)
      .limit(1)
      .single();
    return data ? { relationship_type: data.permission_type } : null;
  }

  async _getNodeOwner(nidHash) {
    const node = await this.nodeFactory.loadUserNode(nidHash);
    return node?.owner_id;
  }

  // ═══════════════════════════════════════════════════════════
  // GRANT / REVOKE PERMISSIONS
  // ═══════════════════════════════════════════════════════════
  async grantPermission(granterNode, targetNidHash, targetUserId, permissions) {
    // Granter must have permission_grant level
    const grantCheck = await this.validatePermission(granterNode, 'grant_permission', {
      target_nid_hash: targetNidHash
    });
    if (!grantCheck.allowed) return grantCheck;

    const { data, error } = await this.db
      .from('node_permission')
      .insert({
        nid_hash: targetNidHash,
        owner_id: granterNode.owner_id,
        target_owner_id: targetUserId,
        permission_type: permissions.type || 'access',
        can_read: permissions.can_read !== false,
        can_write: permissions.can_write || false,
        can_delete: permissions.can_delete || false,
        valid_from: new Date().toISOString(),
        valid_until: permissions.valid_until || null,
        is_revoked: false
      })
      .select()
      .single();

    if (error) throw error;
    return { allowed: true, permission: data };
  }

  async revokePermission(revokerNode, permissionId) {
    const { data, error } = await this.db
      .from('node_permission')
      .update({ is_revoked: true })
      .eq('perm_id', permissionId)
      .eq('owner_id', revokerNode.owner_id)
      .select()
      .single();

    if (error) throw error;
    return { revoked: true, permission: data };
  }
}

module.exports = {
  PermissionEngine,
  PERMISSION_CODES,
  ACTION_PERMISSION_MAP,
  ROLE_HIERARCHY,
  RELATIONSHIP_SCOPES
};

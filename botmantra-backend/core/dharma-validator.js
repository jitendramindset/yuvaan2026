/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  DHARMA VALIDATOR — Neural OS Kernel                        ║
 * ║  System integrity rules — non-negotiable system law         ║
 * ║  Dharma = structural truth the system MUST obey             ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Dharma checks:
 *   1. Data structure integrity
 *   2. Node parent-child validity
 *   3. Brand isolation enforcement
 *   4. Age restriction compliance
 *   5. Child safety enforcement
 *   6. Node type validity
 *   7. Root node protection
 *   8. Hierarchy depth limits
 *
 * Priority: Security > Permission > Dharma > User Request
 */

const { BRANDS, decodeFromBlob } = require('./node-schema');
const NodeFactory = require('./nodeFactory');

// ─── DHARMA RULES ────────────────────────────────────────────
const DHARMA_RULES = {
  // Brand isolation: no cross-brand data mutation
  BRAND_ISOLATION: {
    code: 'BRAND_ISOLATION_VIOLATION',
    severity: 'critical',
    message: 'Cross-brand data mutation is forbidden'
  },

  // Root node protection: brand_root nodes are immutable
  ROOT_PROTECTION: {
    code: 'CANNOT_MODIFY_ROOT',
    severity: 'critical',
    message: 'Brand root nodes cannot be modified or deleted'
  },

  // Age restriction: Junior brand limited to age ≤ 12
  AGE_RESTRICTION: {
    code: 'AGE_DHARMA_VIOLATION',
    severity: 'critical',
    message: 'Age restriction violated for brand'
  },

  // Child safety: no unsupervised child actions
  CHILD_SAFETY: {
    code: 'CHILD_SAFETY_VIOLATION',
    severity: 'critical',
    message: 'Child safety rules violated'
  },

  // Hierarchy depth: max tree depth 20
  HIERARCHY_DEPTH: {
    code: 'HIERARCHY_TOO_DEEP',
    severity: 'warning',
    message: 'Node hierarchy exceeds maximum depth'
  },

  // Parent-child: living node must have valid parent
  PARENT_CHILD: {
    code: 'INVALID_PARENT_CHILD',
    severity: 'error',
    message: 'Invalid parent-child relationship'
  },

  // Data integrity: required fields must exist
  DATA_INTEGRITY: {
    code: 'DATA_INTEGRITY_VIOLATION',
    severity: 'error',
    message: 'Required data fields missing or invalid'
  },

  // Permission escalation: cannot self-promote
  PERMISSION_ESCALATION: {
    code: 'PERMISSION_ESCALATION',
    severity: 'critical',
    message: 'Permission self-escalation is forbidden'
  },

  // Node type mutation: cannot change node type after creation
  TYPE_MUTATION: {
    code: 'TYPE_MUTATION_FORBIDDEN',
    severity: 'critical',
    message: 'Node type cannot be changed after creation'
  },

  // Orphan prevention: cannot delete parent with children
  ORPHAN_PREVENTION: {
    code: 'ORPHAN_PREVENTION',
    severity: 'error',
    message: 'Cannot delete a node that has children'
  }
};

// ─── CHILD SAFETY BLOCKED ACTIONS ────────────────────────────
const CHILD_BLOCKED_ACTIONS = [
  'grant_permission', 'delete_node', 'update_prompt',
  'admin_execute', 'automation', 'plugin',
  'data_delete', 'permission_grant', 'switch_brand'
];

// ─── BRAND AGE RULES ─────────────────────────────────────────
const BRAND_AGE_RULES = {
  JUNIOR:     { max_age: 12,  min_age: 0,  strict: true },
  JEETMANTRA: { max_age: 25,  min_age: 10, strict: false },
  MANTRAVAT:  { max_age: 150, min_age: 18, strict: true },
  VANSHAWALI: { max_age: 150, min_age: 0,  strict: false },
  BOTMANTRA:  { max_age: 150, min_age: 0,  strict: false }
};

const MAX_HIERARCHY_DEPTH = 20;

class DharmaValidator {
  constructor(supabaseClient) {
    this.db = supabaseClient;
    this.nodeFactory = new NodeFactory(supabaseClient);
  }

  // ═══════════════════════════════════════════════════════════
  // MAIN VALIDATION — runs ALL dharma checks
  // ═══════════════════════════════════════════════════════════
  async validate(userNode, actionType, payload = {}) {
    const violations = [];

    // 1. Root node protection
    this._checkRootProtection(actionType, payload, violations);

    // 2. Brand isolation
    this._checkBrandIsolation(userNode, payload, violations);

    // 3. Age restriction
    this._checkAgeRestriction(userNode, payload, violations);

    // 4. Child safety
    this._checkChildSafety(userNode, actionType, violations);

    // 5. Node type mutation
    this._checkTypeMutation(actionType, payload, violations);

    // 6. Permission escalation
    this._checkPermissionEscalation(userNode, actionType, payload, violations);

    // 7. Hierarchy depth
    if (actionType === 'create_node' && payload.parent_nid_hash) {
      await this._checkHierarchyDepth(payload.parent_nid_hash, violations);
    }

    // 8. Orphan prevention
    if (actionType === 'delete_node' && payload.target_nid_hash) {
      await this._checkOrphanPrevention(payload.target_nid_hash, violations);
    }

    // 9. Data integrity
    this._checkDataIntegrity(actionType, payload, violations);

    // Separate critical from warnings
    const critical = violations.filter(v => v.severity === 'critical');
    const warnings = violations.filter(v => v.severity !== 'critical');

    // Log dharma evaluation
    await this._logDharmaEvaluation(userNode, actionType, violations);

    return {
      valid: critical.length === 0,
      violations,
      critical_count: critical.length,
      warning_count: warnings.length,
      blocked: critical.length > 0
    };
  }

  // ═══════════════════════════════════════════════════════════
  // INDIVIDUAL DHARMA CHECKS
  // ═══════════════════════════════════════════════════════════

  _checkRootProtection(actionType, payload, violations) {
    const mutatingActions = ['data_write', 'data_delete', 'delete_node', 'update_prompt'];
    if (mutatingActions.includes(actionType) && payload.node_type === 'brand_root') {
      violations.push({
        ...DHARMA_RULES.ROOT_PROTECTION,
        context: { action: actionType, target: payload.target_nid_hash }
      });
    }
  }

  _checkBrandIsolation(userNode, payload, violations) {
    if (!payload.brand_scope) return;

    const userDna = typeof userNode.dna_blob === 'string'
      ? decodeFromBlob(userNode.dna_blob) : userNode.dna_blob;
    const userBrand = userDna?.brand_scope;

    // User's brand must match target brand (unless BOTMANTRA which bridges all)
    if (userBrand && userBrand !== 'BOTMANTRA' && payload.brand_scope !== userBrand) {
      // Check if the target is a shared/public resource
      if (payload.exposure_mode !== 'PUBLIC' && payload.brand_scope !== 'BOTMANTRA') {
        violations.push({
          ...DHARMA_RULES.BRAND_ISOLATION,
          context: { user_brand: userBrand, target_brand: payload.brand_scope }
        });
      }
    }
  }

  _checkAgeRestriction(userNode, payload, violations) {
    const brand = payload.brand_scope || payload.brand;
    if (!brand) return;

    const ageRule = BRAND_AGE_RULES[brand];
    if (!ageRule) return;

    const fieldMap = typeof userNode.field_map === 'string'
      ? decodeFromBlob(userNode.field_map) : userNode.field_map;
    const userAge = fieldMap?.age;

    if (userAge === null || userAge === undefined) return; // Age unknown, skip

    if (ageRule.strict) {
      if (userAge > ageRule.max_age) {
        violations.push({
          ...DHARMA_RULES.AGE_RESTRICTION,
          context: { user_age: userAge, brand, max_age: ageRule.max_age }
        });
      }
      if (userAge < ageRule.min_age) {
        violations.push({
          ...DHARMA_RULES.AGE_RESTRICTION,
          context: { user_age: userAge, brand, min_age: ageRule.min_age }
        });
      }
    }
  }

  _checkChildSafety(userNode, actionType, violations) {
    const fieldMap = typeof userNode.field_map === 'string'
      ? decodeFromBlob(userNode.field_map) : userNode.field_map;

    const isChild = fieldMap?.profile_type === 'child' ||
                    fieldMap?.role === 'child' ||
                    (fieldMap?.age !== undefined && fieldMap.age < 13);

    if (isChild && CHILD_BLOCKED_ACTIONS.includes(actionType)) {
      violations.push({
        ...DHARMA_RULES.CHILD_SAFETY,
        context: { action: actionType, profile_type: fieldMap?.profile_type, age: fieldMap?.age }
      });
    }
  }

  _checkTypeMutation(actionType, payload, violations) {
    if (actionType === 'data_write' && payload.change_node_type) {
      violations.push({
        ...DHARMA_RULES.TYPE_MUTATION,
        context: { attempted_change: payload.change_node_type }
      });
    }
  }

  _checkPermissionEscalation(userNode, actionType, payload, violations) {
    if (actionType === 'grant_permission' && payload.target_owner_id === userNode.owner_id) {
      violations.push({
        ...DHARMA_RULES.PERMISSION_ESCALATION,
        context: { user: userNode.owner_id }
      });
    }
  }

  async _checkHierarchyDepth(parentNidHash, violations) {
    try {
      const parentNode = await this.nodeFactory.loadUserNode(parentNidHash);
      if (parentNode && (parentNode.node_depth || 0) >= MAX_HIERARCHY_DEPTH) {
        violations.push({
          ...DHARMA_RULES.HIERARCHY_DEPTH,
          context: { parent_depth: parentNode.node_depth, max: MAX_HIERARCHY_DEPTH }
        });
      }
    } catch { /* parent not found — will be caught elsewhere */ }
  }

  async _checkOrphanPrevention(targetNidHash, violations) {
    try {
      const children = await this.nodeFactory.queryNodes({
        parent_nid_hash: targetNidHash
      });

      if (children && children.length > 0) {
        violations.push({
          ...DHARMA_RULES.ORPHAN_PREVENTION,
          context: { child_count: children.length, target: targetNidHash }
        });
      }
    } catch { /* silent */ }
  }

  _checkDataIntegrity(actionType, payload, violations) {
    if (actionType === 'create_node') {
      if (!payload.node_type) {
        violations.push({
          ...DHARMA_RULES.DATA_INTEGRITY,
          context: { missing: 'node_type' }
        });
      }
      if (!payload.metadata && !payload.field_map) {
        violations.push({
          ...DHARMA_RULES.DATA_INTEGRITY,
          context: { missing: 'metadata/field_map' }
        });
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // DHARMA LOG
  // ═══════════════════════════════════════════════════════════
  async _logDharmaEvaluation(userNode, actionType, violations) {
    try {
      await this.db
        .from('node_dharma_log')
        .insert({
          nid_hash: userNode.nid_hash,
          owner_id: userNode.owner_id,
          action_type: actionType,
          violations: violations.length,
          violation_codes: violations.map(v => v.code),
          passed: violations.filter(v => v.severity === 'critical').length === 0,
          created_at: new Date().toISOString()
        });
    } catch {
      // Fallback to dharma_logs
      try {
        await this.db
          .from('dharma_logs')
          .insert({
            user_id: userNode.owner_id,
            action: actionType,
            passed: violations.filter(v => v.severity === 'critical').length === 0,
            violations: JSON.stringify(violations.map(v => v.code)),
            created_at: new Date().toISOString()
          });
      } catch { /* silent */ }
    }
  }
}

module.exports = {
  DharmaValidator,
  DHARMA_RULES,
  BRAND_AGE_RULES,
  CHILD_BLOCKED_ACTIONS,
  MAX_HIERARCHY_DEPTH
};

/**
 * 🔐 AUTHENTICATION API ENDPOINTS
 * 
 * Handles:
 * - Login/Signup
 * - Logout/Session management
 * - Password reset
 * - OAuth integration
 * - MFA setup & validation
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { requireAuth } = require('../middleware/auth-permission');
const NodeCoreManager = require('../core/nodeCore');
const NodeFactory = require('../core/nodeFactory');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY
);

const nodeFactory = new NodeFactory(supabase);

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '24h';

// ═════════════════════════════════════════════════════════════════
// NODE CORE INITIALIZATION HELPERS
// ═════════════════════════════════════════════════════════════════

/**
 * Generate nid_hash from userId
 */
function generateNidHash(userId) {
  return crypto.createHash('sha256').update(userId).digest('hex');
}

/**
 * Generate unique node_code for a user
 */
function generateNodeCode(userId, nodeType) {
  const short = userId.replace(/-/g, '').substring(0, 8);
  return `${nodeType}_${short}_${Date.now()}`;
}

/**
 * Determine brand based on user age
 */
function getActiveBrandByAge(age) {
  if (!age) return 'vanshawali'; // Default to social
  if (age < 10) return 'junior_mantra';
  if (age < 18) return 'jeetmantra';
  return 'mantravat';
}

/**
 * Initialize Node Core for a user on signup/login
 * Creates: user root node (core_node), profile child node,
 *          node permissions, default relationships, vector document entry
 *
 * Flow: user → core_node(user) → core_node(profile) + node_relationship + node_permission + vector_documents
 */
async function initializeNodeCore(user) {
  const userId = user.id;
  const nidHash = generateNidHash(userId);

  try {
    // ── 1. Check if user already has a root node ──────────────────
    const { data: existingNode } = await supabase
      .from('core_node')
      .select('id')
      .eq('owner_id', userId)
      .eq('node_type', 'living')
      .eq('is_default', true)
      .single();

    if (existingNode) {
      // Node core already initialized, return existing
      return { success: true, already_exists: true, root_node_id: existingNode.id };
    }

    // ── 2. Create User Root Node (core_node) ─────────────────────
    const userNodeCode = generateNodeCode(userId, 'USR');
    const { data: rootNode, error: rootErr } = await supabase
      .from('core_node')
      .insert({
        node_code: userNodeCode,
        node_type: 'living',
        node_category: 'root',
        owner_id: userId,
        name: user.full_name || user.email.split('@')[0],
        description: `Root node for ${user.email}`,
        status: 'active',
        is_default: true,
        email: user.email,
        created_by: userId,
        metadata: {
          nid_hash: nidHash,
          initialized_at: new Date().toISOString(),
          node_version: 1,
          capabilities: ['profile', 'friends', 'posts', 'messages']
        }
      })
      .select()
      .single();

    if (rootErr) throw rootErr;

    // ── 3. Create Profile Child Node ─────────────────────────────
    const profileNodeCode = generateNodeCode(userId, 'PRF');
    const { data: profileNode, error: profErr } = await supabase
      .from('core_node')
      .insert({
        node_code: profileNodeCode,
        node_type: 'living',
        node_category: 'child',
        owner_id: userId,
        parent_node_id: rootNode.id,
        name: `${user.full_name || 'User'}'s Profile`,
        description: 'Personal profile data',
        status: 'active',
        email: user.email,
        created_by: userId,
        metadata: {
          nid_hash: nidHash,
          profile_type: 'personal',
          avatar_url: user.avatar_url || null,
          mobile_no: user.mobile_no || null
        }
      })
      .select()
      .single();

    if (profErr) throw profErr;

    // ── 4. Create Relationship: root → profile (parent_child) ────
    await supabase.from('node_relationship').insert({
      source_node_id: rootNode.id,
      target_node_id: profileNode.id,
      relationship_type: 'parent_child',
      relationship_label: 'has_profile',
      is_bidirectional: false,
      is_active: true,
      metadata: { auto_created: true }
    });

    // ── 5. Create Node Permissions (owner full-access) ───────────
    await supabase.from('node_permission').insert([
      {
        node_id: rootNode.id,
        user_id: userId,
        role: 'owner',
        permission_level: 4,
        can_view: true,
        can_create: true,
        can_edit: true,
        can_delete: true,
        can_manage_permissions: true,
        can_manage_users: true,
        is_active: true,
        granted_by: userId
      },
      {
        node_id: profileNode.id,
        user_id: userId,
        role: 'owner',
        permission_level: 4,
        can_view: true,
        can_create: true,
        can_edit: true,
        can_delete: true,
        can_manage_permissions: true,
        can_manage_users: false,
        is_active: true,
        granted_by: userId
      }
    ]);

    // ── 6. Create Default Node Roles ─────────────────────────────
    await supabase.from('node_role').insert([
      {
        node_id: rootNode.id,
        role_code: 'owner',
        role_name: 'Owner',
        role_description: 'Full control of this node',
        can_view: true, can_create: true, can_edit: true,
        can_delete: true, can_manage_roles: true, can_manage_permissions: true,
        is_custom: false, is_active: true
      },
      {
        node_id: rootNode.id,
        role_code: 'friend',
        role_name: 'Friend',
        role_description: 'Can view shared content',
        can_view: true, can_create: false, can_edit: false,
        can_delete: false, can_manage_roles: false, can_manage_permissions: false,
        is_custom: false, is_active: true
      },
      {
        node_id: rootNode.id,
        role_code: 'viewer',
        role_name: 'Viewer',
        role_description: 'Read-only access',
        can_view: true, can_create: false, can_edit: false,
        can_delete: false, can_manage_roles: false, can_manage_permissions: false,
        is_custom: false, is_active: true
      }
    ]);

    // ── 7. Store User Profile in Vector DB for RAG ───────────────
    await supabase.from('vector_documents').insert({
      user_id: userId,
      document_name: `user_profile_${userId}`,
      content: JSON.stringify({
        user_id: userId,
        nid_hash: nidHash,
        email: user.email,
        full_name: user.full_name || '',
        root_node_id: rootNode.id,
        profile_node_id: profileNode.id,
        created_at: new Date().toISOString()
      }),
      metadata: {
        type: 'user_profile',
        nid_hash: nidHash,
        root_node_id: rootNode.id,
        searchable: true
      }
    });

    // ── 7B. Create Node Core Row for Kernel Compatibility ────────
    // This ensures kernel-executor.js can find and work with the node
    const brandRoot = getActiveBrandByAge(user.age || null);
    
    const nodeMetadata = {
      email: user.email,
      full_name: user.full_name || '',
      root_node_id: rootNode.id,
      profile_node_id: profileNode.id,
      initialized_at: new Date().toISOString(),
      node_version: 1,
      capabilities: ['profile', 'friends', 'posts', 'messages']
    };
    
    const nodeCoreRow = await nodeFactory.createNonLiveNode('user', userId, nodeMetadata, {
      brand_scope: brandRoot
    });

    // ── 8. Assign default user role (user_roles → roles) ─────────
    const { data: defaultRole } = await supabase
      .from('roles')
      .select('id')
      .eq('role_code', 'viewer')
      .single();

    if (defaultRole) {
      await supabase.from('user_roles').insert({
        user_id: userId,
        role_id: defaultRole.id,
        assigned_by: userId
      }).then(() => {}).catch(() => {}); // ignore if already assigned
    }

    console.log(`✅ Node Core initialized for user ${userId} | nid_hash: ${nidHash}`);

    return {
      success: true,
      root_node_id: rootNode.id,
      profile_node_id: profileNode.id,
      nid_hash: nidHash,
      node_code: userNodeCode
    };

  } catch (error) {
    console.error(`❌ Node Core init failed for user ${userId}:`, error.message);
    return { success: false, error: error.message };
  }
}

// ═════════════════════════════════════════════════════════════════
// TOKEN MANAGEMENT
// ═════════════════════════════════════════════════════════════════

/**
 * Generate JWT token
 */
function generateToken(userId, email) {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRE }
  );
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// ═════════════════════════════════════════════════════════════════
// LOGIN / SIGNUP
// ═════════════════════════════════════════════════════════════════

/**
 * POST /auth/signup
 * Register new user
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password, full_name, mobile_no } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: hashedPassword,
        full_name: full_name || '',
        mobile_no: mobile_no || '',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Generate token
    const token = generateToken(user.id, user.email);

    // ── Initialize Node Core (legacy core_node) ──
    const nodeInit = await initializeNodeCore(user);

    // ── Initialize Modern Node Core (node_core) with all nodes ──
    // This creates: user root node + vector + relationship + layout + permissions
    const nodeCoreManager = new NodeCoreManager();
    let nodeCoreInit = { success: false };
    try {
      nodeCoreInit = await nodeCoreManager.initializeUserNode(user.id, {
        email: user.email,
        name: user.full_name || '',
        age: 18, // Default age for signup (can be updated later in profile)
        phone: user.mobile_no || '',
        profile_picture: null
      });
      console.log(`✅ Node Core initialized for new user ${user.id}`);
    } catch (nodeErr) {
      console.error(`⚠️  Node Core initialization warning: ${nodeErr.message}`);
      // Don't fail signup if node core fails - fallback to default profile
    }

    // Create default dashboard for user
    await supabase
      .from('dashboards')
      .insert({
        user_id: user.id,
        name: 'My Dashboard',
        type: 'default',
        is_default: true,
        config: {},
        created_at: new Date().toISOString()
      })
      .catch(err => console.warn('Dashboard creation warning:', err.message));

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name
        },
        node_core: {
          root_node_id: nodeInit?.root_node_id,
          profile_node_id: nodeInit?.profile_node_id,
          nid_hash: nodeInit?.nid_hash,
          brand_root: nodeCoreInit?.active_brand || 'vanshawali',
          node_state: 'ACTIVE'
        }
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /auth/login
 * Login with email/password
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password, mfa_token } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check if MFA is enabled
    if (user.mfa_enabled && !mfa_token) {
      // Generate temporary MFA token
      const tempToken = jwt.sign(
        { userId: user.id, type: 'mfa' },
        JWT_SECRET,
        { expiresIn: '10m' }
      );

      return res.json({
        success: false,
        requires_mfa: true,
        mfa_token: tempToken,
        message: 'MFA verification required'
      });
    }

    // Verify MFA if provided
    if (mfa_token) {
      const decoded = verifyToken(mfa_token);
      if (!decoded || decoded.type !== 'mfa' || decoded.userId !== user.id) {
        return res.status(401).json({
          success: false,
          error: 'Invalid MFA token'
        });
      }
    }

    // Generate auth token
    const token = generateToken(user.id, user.email);

    // Update last login
    await supabase
      .from('users')
      .update({
        last_login: new Date().toISOString()
      })
      .eq('id', user.id);

    // ── Ensure Node Core exists (lazy init for legacy users) ──
    const nodeInit = await initializeNodeCore(user);

    // Get user's node_core row for response (kernel-compatible)
    const nodeQuery = await nodeFactory.queryNodes({ owner_id: user.id, node_type: 'user' });
    const nodeCoreRow = nodeQuery.length > 0 ? nodeQuery[0] : null;

    // Get user's root node from core_node for backward compatibility
    const { data: rootNode } = await supabase
      .from('core_node')
      .select('id, node_code, metadata')
      .eq('owner_id', user.id)
      .eq('node_type', 'living')
      .eq('is_default', true)
      .single();

    const nidHash = nodeCoreRow?.nid_hash || nodeInit?.nid_hash || generateNidHash(user.id);
    const brandRoot = nodeCoreRow?.brand_root || getActiveBrandByAge(user.age || null);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name
        },
        node_core: {
          root_node_id: rootNode?.id,
          node_code: rootNode?.node_code,
          nid_hash: nidHash,
          node_state: nodeCoreRow?.node_state || 'ACTIVE',
          brand_root: brandRoot
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 🔴 POST /auth/logout
 * Logout user - invalidate session
 */
router.post('/logout', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Optional: Mark session as invalid in database
    // await supabase
    //   .from('user_sessions')
    //   .update({ is_active: false })
    //   .eq('user_id', userId);

    // Clear cookies if using them
    res.clearCookie('auth_token');
    res.clearCookie('user_id');

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /auth/refresh
 * Refresh authentication token
 */
router.post('/refresh', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    const token = generateToken(user.id, user.email);

    res.json({
      success: true,
      data: { token }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ═════════════════════════════════════════════════════════════════
// PROFILE MANAGEMENT
// ═════════════════════════════════════════════════════════════════

/**
 * GET /auth/profile
 * Get current user profile
 */
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, full_name, mobile_no, avatar_url, mfa_enabled, created_at')
      .eq('id', userId)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /auth/profile
 * Update user profile
 */
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name, mobile_no, avatar_url } = req.body;

    const { data: user, error } = await supabase
      .from('users')
      .update({
        ...(full_name && { full_name }),
        ...(mobile_no && { mobile_no }),
        ...(avatar_url && { avatar_url }),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ═════════════════════════════════════════════════════════════════
// PASSWORD MANAGEMENT
// ═════════════════════════════════════════════════════════════════

/**
 * POST /auth/password/change
 * Change password
 */
router.post('/password/change', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', userId)
      .single();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify current password
    const passwordMatch = await bcrypt.compare(current_password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update password
    const { error } = await supabase
      .from('users')
      .update({
        password_hash: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /auth/password/reset-request
 * Request password reset
 */
router.post('/password/reset-request', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Check if user exists
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (!user) {
      // Return success even if user doesn't exist (security)
      return res.json({
        success: true,
        message: 'If email exists, reset link has been sent'
      });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user.id, type: 'password_reset' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Store reset token
    await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        token: resetToken,
        expires_at: new Date(Date.now() + 3600000).toISOString()
      });

    // TODO: Send email with reset link
    // const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    res.json({
      success: true,
      message: 'Reset link sent to email'
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /auth/password/reset-confirm
 * Confirm password reset
 */
router.post('/password/reset-confirm', async (req, res) => {
  try {
    const { token, new_password } = req.body;

    if (!token || !new_password) {
      return res.status(400).json({
        success: false,
        error: 'Token and new password are required'
      });
    }

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded || decoded.type !== 'password_reset') {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
    }

    // Check if token still valid in database
    const { data: resetRecord } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .eq('user_id', decoded.userId)
      .single();

    if (!resetRecord || new Date(resetRecord.expires_at) < new Date()) {
      return res.status(401).json({
        success: false,
        error: 'Reset token expired'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update password
    await supabase
      .from('users')
      .update({
        password_hash: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', decoded.userId);

    // Delete reset token
    await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('token', token);

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Password reset confirm error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ═════════════════════════════════════════════════════════════════
// MFA SETUP
// ═════════════════════════════════════════════════════════════════

/**
 * POST /auth/mfa/setup
 * Setup MFA (already in Evolution A, kept for reference)
 */
router.post('/mfa/setup', requireAuth, async (req, res) => {
  try {
    // Implementation from evolution-a-enterprise-security.js
    res.json({
      success: true,
      message: 'See evolution-a-enterprise-security.js for MFA implementation'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

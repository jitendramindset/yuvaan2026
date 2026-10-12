/**
 * 🔐 Authentication Routes
 * Complete auth API endpoints: signin, signup, forgot password, reset, biometric, etc.
 * Date: January 29, 2026
 */

const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { sendPasswordResetEmail, sendOtpEmail, initializeEmailService } = require('./services/emailService');
const { buildNodeCoreRow, defaultUserMetadata, validateNodeData } = require('./core/node-schema');
const { VectorManager } = require('./core/vector-manager');

module.exports = function(app, supabaseClient) {
  const router = express.Router();
  
  // Initialize email service on startup
  initializeEmailService();

  /**
   * Helper: Hash password using crypto (simple version - use bcrypt in production)
   */
  const hashPassword = (password) => {
    return crypto.createHash('sha256').update(password).digest('hex');
  };

  /**
   * Helper: Generate OTP
   */
  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  /**
   * Helper: Generate JWT token
   */
  const generateToken = (userId, email, fullName, mobile, deviceId) => {
    return jwt.sign(
      { userId, email, fullName, mobile, deviceId, iat: Date.now() },
      process.env.JWT_SECRET || 'botmantra-secret-key',
      { expiresIn: '7d' }
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // NODE CORE INITIALIZATION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Generate nid_hash from userId
   */
  const generateNidHash = (userId) => {
    return crypto.createHash('sha256').update(userId).digest('hex');
  };

  /**
   * Initialize Node Core for a user via node-schema.js
   * Uses: node_core, node_permission, vector_documents/vector_chunks
   * Idempotent — skips if node already exists.
   */
  const initializeNodeCore = async (userId, userData) => {

    try {
      // Fetch user table data
      const { data: userRows } = await supabaseClient
        .from('users')
        .select('id, mobile_hash, email_hash, pass_hash')
        .eq('id', userId);

      let nodeCoreId = null;
      if (userRows && userRows.length > 0) {
        const user = userRows[0];
        // Compute mobile_hash
        const mobileHash = user.mobile_hash ? user.mobile_hash : null;
        if (mobileHash) {
          // Match with owner table
          const { data: ownerRows } = await supabaseClient
            .from('owner')
            .select('id, mobile_hash')
            .eq('mobile_hash', mobileHash);
          if (ownerRows && ownerRows.length > 0) {
            nodeCoreId = ownerRows[0].id;
          }
        }
      }

      // Try to find node_core by nodeCoreId
      let existingNode = null;
      if (nodeCoreId) {
        const { data: nodeByHash } = await supabaseClient
          .from('node_core')
          .select('row_id, nid_hash, node_type, node_state')
          .eq('owner_id', nodeCoreId)
          .eq('node_type', 'living')
          .limit(1)
          .single();
        if (nodeByHash) existingNode = nodeByHash;
      }
      // Fallback: check by owner_id
      if (!existingNode) {
        const { data: nodeByOwner } = await supabaseClient
          .from('node_core')
          .select('row_id, nid_hash, node_type, node_state')
          .eq('owner_id', userId)
          .eq('node_type', 'living')
          .limit(1)
          .single();
        if (nodeByOwner) existingNode = nodeByOwner;
      }

      if (existingNode) {
        return { success: true, already_exists: true, row_id: existingNode.row_id, nid_hash: existingNode.nid_hash };
      }

      // Build metadata using schema system
      const metadata = defaultUserMetadata(userData);

      // Build full node_core row (binary blobs auto-generated)
      const row = buildNodeCoreRow('user_node', userId, metadata, {
        brand_scope: 'BOTMANTRA',
        permission_scope: 'ALL',
        system_prompt: `You are the personal node for ${userData.full_name || 'User'}. Manage profile, friends, posts, and messages.`
      });

      // Insert node_core
      const { data: newNode, error: nodeErr } = await supabaseClient
        .from('node_core')
        .insert(row)
        .select('row_id, nid_hash')
        .single();

      if (nodeErr) throw nodeErr;

      // Create node_permission (owner full-access)
      await supabaseClient.from('node_permission').insert({
        nid_hash: newNode.nid_hash,
        owner_id: userId,
        target_owner_id: userId,
        permission_type: 'OWNER',
        can_read: true,
        can_write: true,
        can_delete: true
      });

      // Store profile in vector system
      const vectorManager = new VectorManager(supabaseClient);
      try {
        await vectorManager.store(newNode.nid_hash, 'user_memory_vectors', JSON.stringify({
          user_id: userId, nid_hash: newNode.nid_hash,
          email: userData.email, full_name: userData.full_name || '',
          mobile: userData.mobile || '', created_at: new Date().toISOString()
        }), {
          owner_id: userId,
          brand_scope: 'BOTMANTRA',
          semantic_tags: ['user_profile', 'identity'],
          role_access: ['owner']
        });
      } catch (vecErr) {
        console.warn(`⚠ Vector store skipped for ${userId}:`, vecErr.message);
      }

      console.log(`✅ Node Core initialized for user ${userId} | nid: ${newNode.nid_hash}`);
      return { success: true, row_id: newNode.row_id, nid_hash: newNode.nid_hash };
    } catch (error) {
      console.error(`❌ Node Core init failed for ${userId}:`, error.message);
      return { success: false, error: error.message };
    }
  };

  // ============================================
  // POST /api/auth/signup
  // Register new user with email/phone and password
  // ============================================
  router.post('/auth/signup', async (req, res) => {
    try {
      const { fullName, email, mobileNo, password, confirmPassword } = req.body;
      
      console.log('📝 [SIGNUP] Request received:', { fullName, email, mobileNo, passwordLength: password?.length });

      // Validation
      if (!fullName || !email || !mobileNo || !password || !confirmPassword) {
        console.error('❌ [SIGNUP] Missing required fields');
        return res.status(400).json({
          success: false,
          error: 'All fields are required'
        });
      }

      if (password !== confirmPassword) {
        console.error('❌ [SIGNUP] Passwords do not match');
        return res.status(400).json({
          success: false,
          error: 'Passwords do not match'
        });
      }

      if (password.length < 6) {
        console.error('❌ [SIGNUP] Password too short');
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 6 characters'
        });
      }

      // Check if user already exists
      console.log('📝 [SIGNUP] Checking if user exists:', email);
      const { data: existingUser, error: existError } = await supabaseClient
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (existingUser) {
        console.error('❌ [SIGNUP] User already exists:', email);
        return res.status(409).json({
          success: false,
          error: 'User with this email already exists'
        });
      }
      
      console.log('✅ [SIGNUP] Email is available:', email);

      // Hash password
      const hashedPassword = hashPassword(password);

      // Create new user
      console.log('📝 [SIGNUP] Creating user in database');
      const { data, error } = await supabaseClient
        .from('users')
        .insert([
          {
            full_name: fullName,
            email: email,
            mobile: mobileNo,
            password: hashedPassword,
            pass_hash: hashedPassword,
            auth_method: 'password',
            is_verified: false,
            created_at: new Date()
          }
        ])
        .select();

      if (error) {
        console.error('❌ [SIGNUP] Database insert error:', error);
        throw error;
      }

      const userId = data[0]?.id;
      console.log('✅ [SIGNUP] User created with ID:', userId);

      // 🔥 AUTO-ASSIGN DEFAULT ROLE (owner) and node_permission
      try {
        console.log('📝 [SIGNUP] Assigning default role');
        const { data: ownerRole } = await supabaseClient
          .from('roles')
          .select('id, role_name')
          .eq('role_name', 'Owner')
          .single();

        if (ownerRole) {
          await supabaseClient
            .from('user_roles')
            .insert({
              user_id: userId,
              role_id: ownerRole.id,
              assigned_at: new Date()
            });
          console.log(`✅ [SIGNUP] Auto-assigned owner role to user ${userId}`);

          // Assign node_permission based on role
          await supabaseClient
            .from('node_permission')
            .insert({
              owner_id: userId,
              target_owner_id: userId,
              permission_type: ownerRole.role_name,
              can_read: true,
              can_write: true,
              can_delete: true,
              ui_access: true,
              created_at: new Date()
            });
          console.log(`✅ [SIGNUP] Node permission assigned for role ${ownerRole.role_name} to user ${userId}`);
        }
      } catch (roleError) {
        console.warn('⚠️ [SIGNUP] Failed to auto-assign role or node_permission:', roleError.message);
      }

      // Generate token
      const token = generateToken(userId, email, fullName, mobileNo, req.body.deviceId || null);
      console.log('📝 [SIGNUP] JWT token generated for user:', userId);

      // 🔥 Initialize Node Core (root node, profile, relationships, vector DB)
      // Call kernel-v2-api for node_core initialization
      const axios = require('axios');
      let nodeInit = { success: false };
      try {
        console.log('📝 [SIGNUP] Initializing Node Core via kernel v2');
        const kernelRes = await axios.post(
          `${process.env.API_BASE_URL || 'http://localhost:3000'}/api/kernel/v2/execute`,
          {
            action_type: 'init_node_core',
            payload: {
              email,
              full_name: fullName,
              mobile: mobileNo
            },
            user_id: userId
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        nodeInit = kernelRes.data;
        console.log('✅ [SIGNUP] Node Core initialized:', nodeInit.success ? 'YES' : 'NO');
      } catch (kernelErr) {
        console.error('❌ [SIGNUP] Kernel v2 node_core init error:', kernelErr.message);
      }

      console.log('✅ [SIGNUP] SUCCESS - User registered:', userId);
      res.status(201).json({
        success: true,
        message: 'Signup successful',
        user: {
          id: userId,
          email: data[0]?.email,
          fullName: data[0]?.full_name
        },
        token: token,
        node_core: nodeInit.success ? {
          root_node_id: nodeInit.root_node_id,
          profile_node_id: nodeInit.profile_node_id,
          nid_hash: nodeInit.nid_hash,
          node_code: nodeInit.node_code
        } : null
      });
    } catch (error) {
      console.error('❌ [SIGNUP] Signup error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Signup failed'
      });
    }
  });

  // ============================================
  // POST /api/auth/signin (Password-based)
  // POST /api/auth/login (Alias)
  // Login with email/phone and password
  // ============================================
  const handleSignin = async (req, res) => {
    try {
      const { emailOrPhone, password } = req.body;
      
      console.log('🔐 [LOGIN] Request received:', { emailOrPhone, passwordLength: password?.length });
      console.log('🔐 [LOGIN] Full body:', req.body);

      if (!emailOrPhone || !password) {
        console.error('❌ [LOGIN] Missing credentials - emailOrPhone:', emailOrPhone, 'password:', !!password);
        return res.status(400).json({
          success: false,
          error: 'Email/Phone and password are required'
        });
      }

      // Find user by email or phone
      console.log('🔐 [LOGIN] Querying users table for:', emailOrPhone);
      const { data: users, error: queryError } = await supabaseClient
        .from('users')
        .select('*')
        .or(`email.eq.${emailOrPhone},mobile.eq.${emailOrPhone}`);
      
      console.log('🔐 [LOGIN] Query result - users found:', users?.length, 'error:', queryError?.message);
      if (users) {
        console.log('🔐 [LOGIN] User records:', users.map(u => ({ id: u.id, email: u.email, mobile: u.mobile })));
      }

      let user = users?.[0] || null;

      // ── Supabase Auth fallback ──────────────────────────────────
      // If the user signed up via supabase.auth.signUp() (frontend flow),
      // they won't have a row in the users table. Verify via Supabase auth
      // and auto-provision the row on first login.
      if (!user || !user.password) {
        console.log('🔐 [LOGIN] Local user not found or no password — trying Supabase auth...');
        const { data: sbData, error: sbError } = await supabaseClient.auth.signInWithPassword({
          email: emailOrPhone,
          password
        });

        if (sbError || !sbData?.user) {
          console.error('❌ [LOGIN] Supabase auth also failed:', sbError?.message);
          return res.status(401).json({ success: false, error: 'Invalid email or password' });
        }

        const sbUser = sbData.user;
        console.log('✅ [LOGIN] Supabase auth OK for:', sbUser.id);

        // Upsert into local users table so subsequent logins hit the fast path
        const hashedPassword = hashPassword(password);
        const { data: upserted } = await supabaseClient
          .from('users')
          .upsert({
            id: sbUser.id,
            email: sbUser.email,
            full_name: sbUser.user_metadata?.full_name || sbUser.email,
            mobile: sbUser.user_metadata?.phone || '',
            password: hashedPassword,
            pass_hash: hashedPassword,
            auth_method: 'supabase',
            is_verified: !!sbUser.email_confirmed_at,
            created_at: sbUser.created_at || new Date().toISOString()
          }, { onConflict: 'id' })
          .select();

        user = upserted?.[0] || {
          id: sbUser.id,
          email: sbUser.email,
          full_name: sbUser.user_metadata?.full_name || sbUser.email,
          mobile: sbUser.user_metadata?.phone || ''
        };
        console.log('✅ [LOGIN] Local user row upserted for Supabase user:', user.id);
      } else {
        // Local user found — verify SHA256 password
        const hashedPassword = hashPassword(password);
        if (user.password !== hashedPassword && user.pass_hash !== hashedPassword && user.password_hash !== hashedPassword) {
          console.error('❌ [LOGIN] Password mismatch for user:', user.id);
          return res.status(401).json({ success: false, error: 'Invalid email or password' });
        }
        console.log('✅ [LOGIN] Password verified for user:', user.id);
      }

      // 🔥 CHECK AND AUTO-ASSIGN ROLE IF MISSING, and node_permission
      try {
        const { data: userRoles } = await supabaseClient
          .from('user_roles')
          .select('role_id')
          .eq('user_id', user.id);

        if (!userRoles || userRoles.length === 0) {
          console.log(`⚠️ User ${user.id} has no roles, auto-assigning owner...`);
          
          const { data: ownerRole } = await supabaseClient
            .from('roles')
            .select('id, role_name')
            .eq('role_name', 'Owner')
            .single();

          if (ownerRole) {
            await supabaseClient
              .from('user_roles')
              .insert({
                user_id: user.id,
                role_id: ownerRole.id,
                assigned_at: new Date()
              });
            console.log(`✅ Auto-assigned owner role to user ${user.id}`);

            // Assign node_permission based on role
            await supabaseClient
              .from('node_permission')
              .insert({
                owner_id: user.id,
                target_owner_id: user.id,
                permission_type: ownerRole.role_name,
                can_read: true,
                can_write: true,
                can_delete: true,
                ui_access: true,
                created_at: new Date()
              });
            console.log(`✅ Node permission assigned for role ${ownerRole.role_name} to user ${user.id}`);
          }
        }
      } catch (roleError) {
        console.warn('⚠️ Role check/assignment or node_permission failed:', roleError.message);
      }

      // Generate JWT token
      const token = generateToken(
        user.id,
        user.email,
        user.full_name,
        user.mobile_no || user.mobile,
        req.body.deviceId || null
      );
      console.log('🔐 [LOGIN] JWT token generated for user:', user.id);

      // 🔥 Ensure Node Core exists (lazy init for legacy users)
      const nodeInit = await initializeNodeCore(user.id, {
        email: user.email, full_name: user.full_name, mobile: user.mobile_no || user.mobile
      });
      console.log('🔐 [LOGIN] Node Core initialized:', nodeInit.success ? 'YES' : 'NO');

      console.log('✅ [LOGIN] SUCCESS - User logged in:', user.id);
      res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          mobile: user.mobile_no || user.mobile
        },
        token: token,
        node_core: nodeInit.success ? {
          root_node_id: nodeInit.root_node_id,
          nid_hash: nodeInit.nid_hash,
          node_code: nodeInit.node_code,
          already_exists: nodeInit.already_exists || false
        } : null
      });
    } catch (error) {
      console.error('❌ [LOGIN] Signin error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Login failed'
      });
    }
  };

  router.post('/auth/signin', handleSignin);
  router.post('/auth/login', handleSignin);

  // ============================================
  // POST /api/auth/send-otp
  // Send OTP for phone or email verification
  // ============================================
  router.post('/auth/send-otp', async (req, res) => {
    try {
      const { email, method = 'email' } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email is required'
        });
      }

      // Generate OTP
      const otp = generateOTP();

      // In production: Send via email/SMS service
      console.log(`📧 OTP for ${email}: ${otp}`);

      // Store OTP in database (with expiry)
      const { error } = await supabaseClient
        .from('otp_store')
        .insert([
          {
            email: email,
            otp_code: otp,
            method: method,
            expires_at: new Date(Date.now() + 10 * 60000), // 10 minutes
            created_at: new Date()
          }
        ]);

      if (error && !error.message.includes('violates unique constraint')) {
        throw error;
      }

      res.json({
        success: true,
        message: `OTP sent via ${method}`,
        email: email
      });
    } catch (error) {
      console.error('Send OTP error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to send OTP'
      });
    }
  });

  // ============================================
  // POST /api/auth/verify-otp
  // Verify OTP code
  // ============================================
  router.post('/auth/verify-otp', async (req, res) => {
    try {
      const { email, otpCode } = req.body;

      if (!email || !otpCode) {
        return res.status(400).json({
          success: false,
          error: 'Email and OTP code are required'
        });
      }

      // Check OTP in database
      const { data: otpRecords } = await supabaseClient
        .from('otp_store')
        .select('*')
        .eq('email', email)
        .eq('otp_code', otpCode)
        .gt('expires_at', new Date());

      if (!otpRecords || otpRecords.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired OTP'
        });
      }

      // Delete used OTP
      await supabaseClient
        .from('otp_store')
        .delete()
        .eq('id', otpRecords[0].id);

      res.json({
        success: true,
        message: 'OTP verified successfully',
        email: email
      });
    } catch (error) {
      console.error('Verify OTP error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'OTP verification failed'
      });
    }
  });

  // ============================================
  // POST /api/auth/forgot-password
  // Request password reset via email
  // ============================================
  router.post('/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email is required'
        });
      }

      // Check if user exists
      const { data: users } = await supabaseClient
        .from('users')
        .select('*')
        .eq('email', email);

      if (!users || users.length === 0) {
        // Don't reveal if email exists (security)
        return res.json({
          success: true,
          message: 'If email exists, reset link has been sent'
        });
      }

      // Generate reset token and OTP
      const resetToken = crypto.randomBytes(32).toString('hex');
      const otp = generateOTP();

      // Store reset request
      const { error } = await supabaseClient
        .from('password_reset_store')
        .insert([
          {
            email: email,
            reset_token: resetToken,
            otp_code: otp,
            is_used: false,
            expires_at: new Date(Date.now() + 60 * 60000), // 1 hour
            created_at: new Date()
          }
        ]);

      if (error && !error.message.includes('violates')) {
        throw error;
      }

      // Send password reset email with OTP
      console.log(`🔐 Reset request for ${email}`);
      console.log(`📧 Reset OTP: ${otp}`);
      console.log(`🔗 Reset token: ${resetToken}`);
      
      // Send email with password reset link
      const emailResult = await sendPasswordResetEmail(email, otp);
      
      if (!emailResult.success && !emailResult.sentViaConsole) {
        console.warn(`⚠️  Failed to send email but continuing: ${emailResult.error}`);
      }

      res.json({
        success: true,
        message: 'Password reset code sent to your email',
        email: email
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to process password reset'
      });
    }
  });

  // ============================================
  // POST /api/auth/verify-reset-otp
  // Verify password reset OTP
  // ============================================
  router.post('/auth/verify-reset-otp', async (req, res) => {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(400).json({
          success: false,
          error: 'Email and OTP are required'
        });
      }

      // Check reset OTP in database
      const nowIso = new Date().toISOString();
      const { data: resetRecords, error: resetError } = await supabaseClient
        .from('password_reset_store')
        .select('*')
        .eq('email', email)
        .eq('otp_code', otp)
        .eq('is_used', false)
        .gt('expires_at', nowIso);

      if (resetError) throw resetError;

      if (!resetRecords || resetRecords.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired OTP'
        });
      }

      res.json({
        success: true,
        message: 'OTP verified successfully'
      });
    } catch (error) {
      console.error('Verify reset OTP error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'OTP verification failed'
      });
    }
  });

  // ============================================
  // POST /api/auth/verify-reset-token
  // Verify password reset token
  // ============================================
  router.post('/auth/verify-reset-token', async (req, res) => {
    try {
      const { email, resetToken, otp } = req.body;

      if (!email || !resetToken || !otp) {
        return res.status(400).json({
          success: false,
          error: 'Email, reset token, and OTP are required'
        });
      }

      // Check reset token
      const nowIso = new Date().toISOString();
      const { data: resetRecords, error: resetError } = await supabaseClient
        .from('password_reset_store')
        .select('*')
        .eq('email', email)
        .eq('reset_token', resetToken)
        .eq('otp_code', otp)
        .eq('is_used', false)
        .gt('expires_at', nowIso);

      if (resetError) throw resetError;

      if (!resetRecords || resetRecords.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired reset token'
        });
      }

      res.json({
        success: true,
        message: 'Reset token verified',
        email: email
      });
    } catch (error) {
      console.error('Verify reset token error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Token verification failed'
      });
    }
  });

  // ============================================
  // POST /api/auth/reset-password
  // Reset password with OTP
  // ============================================
  router.post('/auth/reset-password', async (req, res) => {
    try {
      const { email, otp, newPassword } = req.body;

      if (!email || !otp || !newPassword) {
        return res.status(400).json({
          success: false,
          error: 'Email, OTP, and new password are required'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 6 characters'
        });
      }

      // Verify reset OTP
      const nowIso = new Date().toISOString();
      const { data: resetRecords, error: resetError } = await supabaseClient
        .from('password_reset_store')
        .select('*')
        .eq('email', email)
        .eq('otp_code', otp)
        .eq('is_used', false)
        .gt('expires_at', nowIso);

      if (resetError) throw resetError;

      if (!resetRecords || resetRecords.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired OTP'
        });
      }

      // Hash new password
      const hashedPassword = hashPassword(newPassword);

      // Update user password
      const { error: updateError } = await supabaseClient
        .from('users')
        .update({ password: hashedPassword, pass_hash: hashedPassword })
        .eq('email', email);

      if (updateError) throw updateError;

      // Mark reset OTP as used
      await supabaseClient
        .from('password_reset_store')
        .update({ is_used: true })
        .eq('id', resetRecords[0].id);

      res.json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Password reset failed'
      });
    }
  });

  // ============================================
  // POST /api/auth/biometric-login
  // Login using biometric (fingerprint/face)
  // ============================================
  router.post('/auth/biometric-login', async (req, res) => {
    try {
      const { userId, biometricData } = req.body;

      if (!userId || !biometricData) {
        return res.status(400).json({
          success: false,
          error: 'User ID and biometric data are required'
        });
      }

      // Find user
      const { data: users } = await supabaseClient
        .from('users')
        .select('*')
        .eq('id', userId);

      if (!users || users.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'User not found'
        });
      }

      const user = users[0];

      // In production: Verify biometric data against stored biometric
      // This is a simplified version
      console.log(`🔐 Biometric login attempt for user: ${userId}`);

      // Generate token
      const token = generateToken(user.id);

      res.json({
        success: true,
        message: 'Biometric login successful',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name
        },
        token: token
      });
    } catch (error) {
      console.error('Biometric login error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Biometric login failed'
      });
    }
  });

  // ============================================
  // POST /api/auth/register-biometric
  // Register biometric for a user
  // ============================================
  router.post('/auth/register-biometric', async (req, res) => {
    try {
      const { userId, biometricData, biometricType } = req.body;

      if (!userId || !biometricData || !biometricType) {
        return res.status(400).json({
          success: false,
          error: 'User ID, biometric data, and type are required'
        });
      }

      // Store biometric data
      const { data, error } = await supabaseClient
        .from('biometric_store')
        .insert([
          {
            user_id: userId,
            biometric_type: biometricType, // 'fingerprint', 'face', etc.
            biometric_data: biometricData,
            is_verified: false,
            created_at: new Date()
          }
        ]);

      if (error) throw error;

      res.json({
        success: true,
        message: 'Biometric registered successfully',
        biometricId: data[0]?.id
      });
    } catch (error) {
      console.error('Register biometric error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to register biometric'
      });
    }
  });

  // ============================================
  // POST /api/auth/logout
  // Logout user
  // ============================================
  router.post('/auth/logout', async (req, res) => {
    try {
      const { userId } = req.body;

      // In production: Invalidate token, clear sessions, etc.
      console.log(`👋 User ${userId} logged out`);

      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Logout failed'
      });
    }
  });

  // ============================================
  // GET /api/auth/user/:userId
  // Get user profile
  // ============================================
  router.get('/auth/user/:userId', async (req, res) => {
    try {
      const { userId } = req.params;

      const { data: users, error } = await supabaseClient
        .from('users')
        .select('id, email, full_name, mobile_no, is_verified, auth_method, created_at')
        .eq('id', userId);

      if (error) throw error;

      if (!users || users.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        user: users[0]
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch user'
      });
    }
  });

  // ============================================
  // PUT /api/auth/user/:userId
  // Update user profile
  // ============================================
  router.put('/auth/user/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const { fullName, mobileNo, email } = req.body;

      const { data, error } = await supabaseClient
        .from('users')
        .update({
          full_name: fullName,
          mobile_no: mobileNo,
          email: email,
          updated_at: new Date()
        })
        .eq('id', userId)
        .select();

      if (error) throw error;

      res.json({
        success: true,
        message: 'User updated successfully',
        user: data[0]
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update user'
      });
    }
  });

  // ============================================
  // POST /api/auth/change-password
  // Change password (requires old password)
  // ============================================
  router.post('/auth/change-password', async (req, res) => {
    try {
      const { userId, oldPassword, newPassword, confirmPassword } = req.body;

      if (!userId || !oldPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({
          success: false,
          error: 'All fields are required'
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,
          error: 'New passwords do not match'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'New password must be at least 6 characters'
        });
      }

      // Get user
      const { data: users } = await supabaseClient
        .from('users')
        .select('*')
        .eq('id', userId);

      if (!users || users.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Verify old password
      const hashedOldPassword = hashPassword(oldPassword);
      if (users[0].password_hash !== hashedOldPassword) {
        return res.status(401).json({
          success: false,
          error: 'Current password is incorrect'
        });
      }

      // Hash new password
      const hashedNewPassword = hashPassword(newPassword);

      // Update password
      const { error } = await supabaseClient
        .from('users')
        .update({ password_hash: hashedNewPassword })
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
        error: error.message || 'Failed to change password'
      });
    }
  });

  // ============================================
  // POST /api/auth/assign-role
  // Manually assign role to authenticated user
  // ============================================
  router.post('/auth/assign-role', async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Verify JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'botmantra-secret-key');
      const userId = decoded.userId;

      // Check existing roles
      const { data: existingRoles } = await supabaseClient
        .from('user_roles')
        .select('role_id, roles(role_code, role_name)')
        .eq('user_id', userId);

      if (existingRoles && existingRoles.length > 0) {
        return res.json({
          success: true,
          message: 'User already has roles assigned',
          roles: existingRoles
        });
      }

      // Get owner role
      const { data: ownerRole, error: roleError } = await supabaseClient
        .from('roles')
        .select('id, role_name')
        .eq('role_name', 'Owner')
        .single();

      if (roleError || !ownerRole) {
        return res.status(404).json({
          success: false,
          error: 'Owner role not found in database'
        });
      }

      // Assign owner role
      const { data: assignment, error: assignError } = await supabaseClient
        .from('user_roles')
        .insert({
          user_id: userId,
          role_id: ownerRole.id,
          assigned_at: new Date()
        })
        .select('*, roles(role_code, role_name)')
        .single();

      if (assignError) throw assignError;

      console.log(`✅ Manually assigned owner role to user ${userId}`);

      res.json({
        success: true,
        message: 'Owner role assigned successfully',
        assignment: {
          userId: userId,
          roleId: ownerRole.id,
          roleName: ownerRole.role_name,
          roleCode: ownerRole.role_code,
          assignedAt: new Date()
        }
      });

    } catch (error) {
      console.error('❌ Assign role error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to assign role'
      });
    }
  });

  app.use('/api', router);
};

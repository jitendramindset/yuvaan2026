const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

const decodeUserId = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  try {
    const payload = jwt.decode(token);
    return payload?.sub || null;
  } catch {
    return null;
  }
};

router.post('/ui-bootstrap', async (req, res) => {
  const supabase = req.supabase;
  const { user_id, business_id, device = 'web', screen = 'dashboard' } = req.body || {};

  const userId = user_id || decodeUserId(req.headers.authorization);

  if (!userId) {
    return res.status(401).json({
      status: 'error',
      code: 'MISSING_USER',
      message: 'User context required'
    });
  }

  let businessId = business_id;

  if (!businessId) {
    const { data: businessUser } = await supabase
      .from('business_users')
      .select('business_id')
      .eq('user_id', userId)
      .limit(1)
      .single();

    businessId = businessUser?.business_id || null;
  }

  if (!businessId) {
    return res.status(400).json({
      status: 'error',
      code: 'MISSING_BUSINESS',
      message: 'Business context required'
    });
  }

  try {
    // Call Supabase RPCs with proper error handling
    const getUiContext = supabase
      .rpc('get_ui_context', { p_user_id: userId, p_business_id: businessId })
      .then(res => res)
      .catch(() => ({ data: null }));

    const resolveTemplate = supabase
      .rpc('resolve_active_template', { p_user_id: userId, p_business_id: businessId })
      .then(res => res)
      .catch(() => ({ data: null }));

    const loadUiSchema = supabase
      .rpc('load_dynamic_template_ui', { p_user_id: userId, p_business_id: businessId })
      .then(res => res)
      .catch(() => ({ data: null }));

    const getBranding = supabase
      .rpc('get_branding', { p_business_id: businessId })
      .then(res => res)
      .catch(() => ({ data: null }));

    const [{ data: uiContext }, { data: templateCode }, { data: uiSchema }, { data: branding }] = await Promise.all([
      getUiContext,
      resolveTemplate,
      loadUiSchema,
      getBranding
    ]);

    const resolvedUiSchema = uiSchema?.ui || uiSchema || {
      layout: 'grid',
      widgets: []
    };

    return res.json({
      screen,
      device,
      theme: uiContext?.theme || branding?.theme || 'light',
      layout: resolvedUiSchema,
      floating_chat: uiContext?.floating_chat ?? true,
      widgets: resolvedUiSchema.widgets || [],
      permissions: uiContext?.permissions || {},
      template_code: templateCode || uiContext?.template_code || null,
      brand: branding || {
        name: 'botmantra'
      },
      ui: resolvedUiSchema
    });
  } catch (error) {
    console.error('UI bootstrap error:', error);
    return res.status(500).json({
      status: 'error',
      code: 'UI_BOOTSTRAP_FAILED',
      message: error.message
    });
  }
});

module.exports = router;

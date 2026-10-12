'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const { listNodes, getNode } = require('../services/admin-nodeos-service');

module.exports = function setupAdminNodeOSRoutes(app, supabaseClient) {
  const router = express.Router();

  async function authenticate(req, res, next) {
    try {
      const header = req.headers.authorization || '';
      if (!header.startsWith('Bearer ')) return res.status(401).json({ success: false, error: 'Authentication required' });
      const token = header.slice(7);
      const supabaseUser = await supabaseClient.auth.getUser(token);
      if (supabaseUser.data?.user) {
        req.user = supabaseUser.data.user;
      } else {
        const claims = jwt.verify(token, process.env.JWT_SECRET || 'botmantra-secret-key');
        if (!claims.userId && !claims.sub) throw new Error('Invalid token');
        req.user = { id: claims.userId || claims.sub, email: claims.email };
      }
      next();
    } catch {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }
  }

  async function requireAdmin(req, res, next) {
    const userId = req.user.id;
    const userResult = await supabaseClient.from('users').select('business_role').eq('id', userId).maybeSingle();
    if (String(userResult.data?.business_role || '').toLowerCase().includes('admin')) return next();
    const permissionResult = await supabaseClient.from('admin_permissions').select('admin_id').eq('admin_id', userId).limit(1);
    if (permissionResult.data?.length) return next();
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }

  router.use(authenticate, requireAdmin);

  router.get('/nodes', async (req, res) => {
    try {
      const result = await listNodes(supabaseClient, req.query);
      return res.json({ success: true, ...result });
    } catch (error) {
      console.error('Admin NodeOS list error:', error);
      return res.status(500).json({ success: false, error: 'Failed to list NodeOS nodes' });
    }
  });

  router.get('/nodes/:nidHash', async (req, res) => {
    try {
      const node = await getNode(supabaseClient, req.params.nidHash);
      if (!node) return res.status(404).json({ success: false, error: 'Node not found' });
      return res.json({ success: true, node });
    } catch (error) {
      console.error('Admin NodeOS detail error:', error);
      return res.status(500).json({ success: false, error: 'Failed to load NodeOS node' });
    }
  });

  app.use('/api/admin/nodeos', router);
};

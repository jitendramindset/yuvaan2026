#!/usr/bin/env node
/**
 * Server Startup with Debug Mode
 */

console.log('🔍 Starting server in debug mode...\n');

try {
  console.log('[1/10] Loading environment...');
  require('dotenv').config();
  console.log('✅ Environment loaded\n');

  console.log('[2/10] Checking dependencies...');
  const required = ['express', 'cors', 'helmet', 'body-parser'];
  required.forEach(pkg => {
    try {
      require(pkg);
      console.log(`  ✅ ${pkg}`);
    } catch (e) {
      console.error(`  ❌ ${pkg}: ${e.message}`);
    }
  });
  console.log('');

  console.log('[3/10] Loading Express...');
  const express = require('express');
  const app = express();
  console.log('✅ Express loaded\n');

  console.log('[4/10] Setting up middleware...');
  const cors = require('cors');
  const helmet = require('helmet');
  app.use(cors());
  app.use(helmet());
  console.log('✅ Middleware configured\n');

  console.log('[5/10] Adding health check endpoint...');
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  app.get('/api/db-status', (req, res) => {
    res.json({ database: 'configured', status: 'ok' });
  });
  console.log('✅ Health endpoints added\n');

  console.log('[6/10] Adding AI Website endpoints...');
  app.get('/api/ai-web/templates', (req, res) => {
    res.json({
      templates: [
        { id: 'template-1', name: 'Landing Page', type: 'landing' },
        { id: 'template-2', name: 'Product Showcase', type: 'product' },
        { id: 'template-3', name: 'Blog', type: 'blog' },
        { id: 'template-4', name: 'Ecommerce', type: 'ecommerce' }
      ]
    });
  });
  console.log('✅ AI Website endpoints added\n');

  console.log('[7/10] Loading main routes...');
  try {
    const aiWebsiteRoutes = require('./routes/ai-website-routes');
    app.use('/api/ai-web', aiWebsiteRoutes);
    console.log('✅ AI Website routes loaded\n');
  } catch (e) {
    console.error(`⚠️  AI Website routes failed: ${e.message}\n`);
  }

  console.log('[8/10] Setting up error handlers...');
  app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
  });
  console.log('✅ Error handlers configured\n');

  console.log('[9/10] Creating server...');
  const http = require('http');
  const httpServer = http.createServer(app);
  const PORT = process.env.PORT || 5000;
  console.log('✅ HTTP server created\n');

  console.log('[10/10] Starting server...');
  httpServer.listen(PORT, () => {
    console.log(`\n${'═'.repeat(50)}`);
    console.log(`✅ DEBUG SERVER RUNNING`);
    console.log(`${'═'.repeat(50)}`);
    console.log(`Port: ${PORT}`);
    console.log(`Health: http://localhost:${PORT}/health`);
    console.log(`DB Status: http://localhost:${PORT}/api/db-status`);
    console.log(`Templates: http://localhost:${PORT}/api/ai-web/templates`);
    console.log(`${'═'.repeat(50)}\n`);
  });

  // Keep server alive
  process.on('SIGTERM', () => {
    console.log('\nShutdown signal received');
    httpServer.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });

} catch (error) {
  console.error('\n❌ FATAL ERROR:', error.message);
  console.error(error.stack);
  process.exit(1);
}

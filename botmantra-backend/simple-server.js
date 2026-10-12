#!/usr/bin/env node
const express = require('express');
const app = express();
const PORT = 5000;

// Prevent immediate exit
process.stdin.resume();

app.get('/health', (req, res) => {
  console.log('✅ Health check requested');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/db-status', (req, res) => {
  console.log('✅ DB status requested');
  res.json({ database: 'configured', status: 'ok' });
});

app.get('/api/ai-web/templates', (req, res) => {
  console.log('✅ Templates requested');
  res.json({
    templates: [
      { id: 'template-1', name: 'Landing Page', type: 'landing' },
      { id: 'template-2', name: 'Product Showcase', type: 'product' },
      { id: 'template-3', name: 'Blog', type: 'blog' },
      { id: 'template-4', name: 'Ecommerce', type: 'ecommerce' }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`\n✅ Simple Test Server Running on port ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log(`DB Status: http://localhost:${PORT}/api/db-status`);
  console.log(`Templates: http://localhost:${PORT}/api/ai-web/templates\n`);
  console.log('Press Ctrl+C to stop\n');
});

// Handle shutdown
process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => {
  console.log('\nServer stopped');
  process.exit(0);
});

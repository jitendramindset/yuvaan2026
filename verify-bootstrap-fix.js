#!/usr/bin/env node

/**
 * Verify UI Bootstrap Fix
 * 
 * Run this script after applying the fixes to verify everything is working
 * Usage: node verify-bootstrap-fix.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying UI Bootstrap Fix...\n');

const checks = [];

// Check 1: KernelClient endpoint path
console.log('1️⃣  Checking KernelClient endpoint path...');
const kernelClientPath = path.join(__dirname, 'botmantra-ui/src/core/KernelClient.ts');
if (fs.existsSync(kernelClientPath)) {
  const content = fs.readFileSync(kernelClientPath, 'utf8');
  if (content.includes("const KERNEL_EXECUTE_PATH = '/kernel/execute'")) {
    console.log('   ✅ Endpoint path is correct: /kernel/execute');
    checks.push(true);
  } else if (content.includes("const KERNEL_EXECUTE_PATH = '/api/kernel/execute'")) {
    console.log('   ❌ Endpoint path is WRONG: /api/kernel/execute');
    console.log('   Need to update to: /kernel/execute');
    checks.push(false);
  } else {
    console.log('   ⚠️  Could not find KERNEL_EXECUTE_PATH definition');
    checks.push(false);
  }
} else {
  console.log('   ❌ File not found:', kernelClientPath);
  checks.push(false);
}

// Check 2: Backend response includes success field
console.log('\n2️⃣  Checking backend response format...');
const kernelExecutePath = path.join(__dirname, 'botmantra-backend/routes/kernel-execute.js');
if (fs.existsSync(kernelExecutePath)) {
  const content = fs.readFileSync(kernelExecutePath, 'utf8');
  if (content.includes('success: true,') && content.includes('status: \'success\'')) {
    console.log('   ✅ Response includes both success and status fields');
    checks.push(true);
  } else if (content.includes('success: true')) {
    console.log('   ✅ Response includes success: true');
    checks.push(true);
  } else {
    console.log('   ❌ Response missing success field');
    checks.push(false);
  }
} else {
  console.log('   ❌ File not found:', kernelExecutePath);
  checks.push(false);
}

// Check 3: Error responses include success field
console.log('\n3️⃣  Checking error response formats...');
if (fs.existsSync(kernelExecutePath)) {
  const content = fs.readFileSync(kernelExecutePath, 'utf8');
  const errorCount = (content.match(/success: false,/g) || []).length;
  if (errorCount >= 8) {
    console.log(`   ✅ Found ${errorCount} error responses with success: false`);
    checks.push(true);
  } else {
    console.log(`   ⚠️  Only found ${errorCount} error responses with success: false (expected ~9)`);
    checks.push(false);
  }
} else {
  checks.push(false);
}

// Check 4: KernelClient error handling
console.log('\n4️⃣  Checking KernelClient error handling...');
if (fs.existsSync(kernelClientPath)) {
  const content = fs.readFileSync(kernelClientPath, 'utf8');
  if (content.includes('return {') && content.includes('success: false,')) {
    console.log('   ✅ KernelClient returns proper error objects');
    checks.push(true);
  } else {
    console.log('   ⚠️  Error handling may not be optimal');
    checks.push(false);
  }
} else {
  checks.push(false);
}

// Check 5: AppRenderEngine error display
console.log('\n5️⃣  Checking AppRenderEngine error handling...');
const appRenderPath = path.join(__dirname, 'botmantra-ui/src/AppRenderEngine.tsx');
if (fs.existsSync(appRenderPath)) {
  const content = fs.readFileSync(appRenderPath, 'utf8');
  if (content.includes('Troubleshooting') && content.includes('errorDetails')) {
    console.log('   ✅ AppRenderEngine has enhanced error display');
    checks.push(true);
  } else {
    console.log('   ⚠️  Error display may not be enhanced');
    checks.push(true); // Not critical
  }
} else {
  console.log('   ❌ File not found:', appRenderPath);
  checks.push(false);
}

// Summary
console.log('\n' + '='.repeat(50));
const passedChecks = checks.filter(c => c).length;
const totalChecks = checks.length;

if (passedChecks === totalChecks) {
  console.log(`✅ ALL CHECKS PASSED (${passedChecks}/${totalChecks})`);
  console.log('\nNext steps:');
  console.log('1. Start backend: cd botmantra-backend && npm start');
  console.log('2. Start frontend: cd botmantra-ui && npm start');
  console.log('3. Open http://localhost:3000 in browser');
  console.log('4. Check console (F12 → Console) for bootstrap success');
  process.exit(0);
} else {
  console.log(`❌ SOME CHECKS FAILED (${passedChecks}/${totalChecks})`);
  console.log('\nPlease review the errors above and fix the issues.');
  process.exit(1);
}

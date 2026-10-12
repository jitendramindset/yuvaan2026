#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function getHostname(rawUrl) {
  if (!rawUrl) return '';
  try {
    return new URL(rawUrl).hostname.toLowerCase();
  } catch (error) {
    return String(rawUrl).trim().toLowerCase();
  }
}

function targetIsExplicitDev(rawUrl) {
  if (!rawUrl) return false;
  const hostname = getHostname(rawUrl);
  if (!hostname) return false;

  const blockedHosts = ['api.mantravat.cloud', 'mantravat.cloud', 'app.mantravat.cloud'];
  if (blockedHosts.includes(hostname)) return false;

  const suspectTerms = ['prod', 'production', 'live', 'main', 'default', 'staging', 'stage'];
  if (suspectTerms.some(term => hostname.includes(term))) return false;

  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) return false;

  return hostname.endsWith('.supabase.co') || hostname.endsWith('.supabase.in') || hostname.endsWith('.supabase.io');
}

const backendRoot = path.resolve(__dirname, '../..');
const devEnvPath = path.join(backendRoot, '.env.development');

process.env.NODE_ENV = 'development';
process.env.VANSHAVALI_ENV = 'development';

if (!fs.existsSync(devEnvPath)) {
  console.log('NODE_ENV = development');
  console.log('VANSHAVALI_ENV = development');
  console.log('SUPABASE_TARGET = not set');
  console.log('SUPABASE_TARGET_CLASSIFICATION = UNKNOWN');
  console.log('SAFE_FOR_DEV_SEED = NO');
  console.log('');
  console.log('DEV CONFIG ERROR: missing ' + path.relative(process.cwd(), devEnvPath));
  console.log('Failing closed: no fallback to production .env is allowed.');
  process.exit(1);
}

const devResult = dotenv.config({ path: devEnvPath, override: true });
if (!devResult || devResult.error || !devResult.parsed) {
  console.log('NODE_ENV = development');
  console.log('VANSHAVALI_ENV = development');
  console.log('SUPABASE_TARGET = not set');
  console.log('SUPABASE_TARGET_CLASSIFICATION = UNKNOWN');
  console.log('SAFE_FOR_DEV_SEED = NO');
  console.log('');
  console.log('DEV CONFIG ERROR: failed to parse ' + path.relative(process.cwd(), devEnvPath));
  console.log('Failing closed: no fallback to production .env is allowed.');
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL || '';
const hostname = getHostname(supabaseUrl);
const classification = hostname === 'api.mantravat.cloud' ? 'PRODUCTION' : targetIsExplicitDev(supabaseUrl) ? 'DEVELOPMENT' : 'UNKNOWN';
const safeForDevSeed = ['development', 'test'].includes(normalize(process.env.VANSHAVALI_ENV || process.env.NODE_ENV || '')) && supabaseUrl && classification === 'DEVELOPMENT';

console.log('NODE_ENV = ' + normalize(process.env.NODE_ENV || 'development'));
console.log('VANSHAVALI_ENV = ' + normalize(process.env.VANSHAVALI_ENV || 'development'));
console.log('SUPABASE_TARGET = ' + (hostname || 'not set'));
console.log('SUPABASE_TARGET_CLASSIFICATION = ' + classification);
console.log('SAFE_FOR_DEV_SEED = ' + (safeForDevSeed ? 'YES' : 'NO'));

if (!safeForDevSeed) {
  process.exit(0);
}

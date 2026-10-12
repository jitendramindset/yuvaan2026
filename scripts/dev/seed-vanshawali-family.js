#!/usr/bin/env node

const args = new Set(process.argv.slice(2));
const isDryRun = args.has('--dry-run');
const confirmDevSeed = args.has('--confirm-dev-seed');

function requireNodeFactorySafely() {
  if (!process.env.SUPABASE_URL) {
    process.env.SUPABASE_URL = 'https://dry-run.supabase.co';
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'dry-run-service-role-key';
  }
  return require('../../botmantra-backend/core/nodeFactory');
}

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

function safeProjectName(rawUrl) {
  if (!rawUrl) return 'unknown';
  try {
    const url = new URL(rawUrl);
    return url.hostname.replace(/\.supabase\.co$/i, '').replace(/\./g, '-');
  } catch (error) {
    return 'unknown';
  }
}

function targetIsExplicitDev(rawUrl) {
  if (!rawUrl) return false;

  const hostname = getHostname(rawUrl);
  if (!hostname) return false;

  const blockedHosts = ['api.mantravat.cloud', 'mantravat.cloud', 'app.mantravat.cloud'];
  if (blockedHosts.includes(hostname)) {
    return false;
  }

  const suspiciousTerms = ['prod', 'production', 'live', 'main', 'default', 'staging', 'stage'];
  if (suspiciousTerms.some(term => hostname.includes(term))) {
    return false;
  }

  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    return false;
  }

  const projectName = safeProjectName(rawUrl);
  if (projectName && projectName.includes('production')) {
    return false;
  }

  return hostname.endsWith('.supabase.co') || hostname.endsWith('.supabase.in') || hostname.endsWith('.supabase.io');
}

function projectLooksProduction(rawUrl) {
  if (!rawUrl) return true;

  const hostname = getHostname(rawUrl);
  if (!hostname) return true;

  const blockedHosts = ['api.mantravat.cloud', 'mantravat.cloud', 'app.mantravat.cloud'];
  if (blockedHosts.includes(hostname)) {
    return true;
  }

  const suspiciousTerms = ['prod', 'production', 'live', 'main', 'default', 'staging', 'stage'];
  if (suspiciousTerms.some(term => hostname.includes(term))) {
    return true;
  }

  const projectName = safeProjectName(rawUrl);
  if (projectName && projectName.includes('production')) {
    return true;
  }

  return false;
}

const explicitEnvName = normalize(process.env.VANSHAVALI_ENV || process.env.NODE_ENV);
const envName = normalize(process.env.NODE_ENV);
const environmentCheck = ['development', 'test'].includes(explicitEnvName) ? 'PASS' : 'FAIL';
const supabaseUrl = process.env.SUPABASE_URL || '';
const databaseTargetCheck = environmentCheck === 'PASS' && supabaseUrl && targetIsExplicitDev(supabaseUrl) ? 'PASS' : 'FAIL';

let nodeFactory = null;
let familyMemberType = null;
let userNodeType = null;

if (['development', 'test'].includes(normalize(process.env.NODE_ENV)) && !projectLooksProduction(process.env.SUPABASE_URL || '')) {
  const NodeFactory = requireNodeFactorySafely();
  nodeFactory = new NodeFactory();
  familyMemberType = nodeFactory.getNodeTypeDefinition ? nodeFactory.getNodeTypeDefinition('family_member') : null;
  userNodeType = nodeFactory.getNodeTypeDefinition ? nodeFactory.getNodeTypeDefinition('user') : null;
}

const plannedNodes = [
  {
    role: 'Grandparent',
    node_type: 'family_member',
    owner_id: 'vanshawali-e2e-grandparent',
    relation_type: 'grandparent',
    parent_nid_hash: null,
    node_depth: 0,
    node_state: 'ACTIVE'
  },
  {
    role: 'Parent',
    node_type: 'family_member',
    owner_id: 'vanshawali-e2e-parent',
    relation_type: 'parent',
    parent_nid_hash: 'planned-grandparent-nid',
    node_depth: 1,
    node_state: 'ACTIVE'
  },
  {
    role: 'Child',
    node_type: 'family_member',
    owner_id: 'vanshawali-e2e-child',
    relation_type: 'child',
    parent_nid_hash: 'planned-parent-nid',
    node_depth: 2,
    node_state: 'ACTIVE'
  }
];

function printPlan() {
  console.log('ENVIRONMENT_CHECK = ' + environmentCheck);
  console.log('DATABASE_TARGET_CHECK = ' + databaseTargetCheck);
  console.log('environment = ' + (environmentCheck === 'PASS' ? envName || 'development' : 'unsafe'));
  console.log('target = ' + (databaseTargetCheck === 'PASS' ? 'safe' : 'unsafe'));
  console.log('');
  console.log('Planned nodes:');
  for (const node of plannedNodes) {
    console.log(`- ${node.role}: node_type=${node.node_type}, owner_id=${node.owner_id}, parent_nid_hash=${node.parent_nid_hash || 'null'}, node_depth=${node.node_depth}`);
  }
  console.log('');
  console.log('Planned hierarchy:');
  console.log('Grandparent depth 0');
  console.log('Parent depth 1');
  console.log('Child depth 2');
  console.log('');
  console.log('NodeFactory path: NodeFactory -> NodeCore -> node_core');
  console.log('Write operation: blocked in dry-run mode');
  console.log('No database writes were performed.');
}

function printBlockedBySafety() {
  console.log('ENVIRONMENT_CHECK = ' + environmentCheck);
  console.log('DATABASE_TARGET_CHECK = ' + databaseTargetCheck);
  console.log('environment = ' + (environmentCheck === 'PASS' ? envName || 'unsafe' : 'unsafe'));
  console.log('target = ' + (databaseTargetCheck === 'PASS' ? 'safe' : 'unsafe'));
  console.log('');
  console.log('Development seed is blocked by safety checks.');
  console.log('Require NODE_ENV=development or NODE_ENV=test and a non-production Supabase target.');
  console.log('No database writes were performed.');
}

if (!isDryRun && !confirmDevSeed) {
  console.log('Default mode is dry-run.');
  console.log('Use --dry-run to preview the safe development hierarchy.');
  console.log('No database writes were performed.');
  process.exit(0);
}

if (isDryRun) {
  if (environmentCheck !== 'PASS' || databaseTargetCheck !== 'PASS') {
    printBlockedBySafety();
    process.exit(1);
  }

  if (!familyMemberType || !userNodeType) {
    console.log('NodeFactory type validation failed.');
    console.log('No database writes were performed.');
    process.exit(1);
  }

  printPlan();
  process.exit(0);
}

if (confirmDevSeed) {
  console.log('ENVIRONMENT_CHECK = ' + environmentCheck);
  console.log('DATABASE_TARGET_CHECK = ' + databaseTargetCheck);
  console.log('');
  console.log('Write operation would require a confirmed development seed, but this phase intentionally stops at dry-run validation.');
  console.log('No database writes were performed in this phase.');
  process.exit(0);
}

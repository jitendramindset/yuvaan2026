// ═══════════════════════════════════════════════════════════════════════════════
// REVENUE PAYOUT - Automated Cron Job
// ═══════════════════════════════════════════════════════════════════════════════
// Runs every 5 minutes to process pending revenue distributions

const cron = require('node-cron');
const { processPendingDistributions } = require('../services/revenue-engine');

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const CRON_SCHEDULE = process.env.REVENUE_CRON_SCHEDULE || '*/5 * * * *'; // Every 5 minutes
const ENABLED = process.env.REVENUE_CRON_ENABLED !== 'false'; // Enabled by default
const SKIP_MISSING_TABLES = process.env.SKIP_MISSING_TABLES === 'true'; // Skip if tables missing

let isRunning = false;
let stats = {
  total_runs: 0,
  successful_runs: 0,
  failed_runs: 0,
  total_distributions: 0,
  last_run: null,
  last_success: null,
  last_error: null
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN CRON JOB FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

async function runRevenuePayouts() {
  if (isRunning) {
    console.log('[REVENUE-CRON] ⏭️  Skipping - previous run still in progress');
    return;
  }

  isRunning = true;
  const runStart = new Date();

  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  REVENUE PAYOUT CRON JOB                                     ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log(`⏰ Started at: ${runStart.toISOString()}`);
  console.log(`📊 Total Runs: ${stats.total_runs + 1}`);
  console.log('');

  try {
    stats.total_runs++;

    // Process pending distributions
    const result = await processPendingDistributions();

    const runEnd = new Date();
    const duration = ((runEnd - runStart) / 1000).toFixed(2);

    stats.last_run = runEnd.toISOString();

    if (result.success) {
      stats.successful_runs++;
      stats.last_success = runEnd.toISOString();
      stats.total_distributions += (result.processed || 0);

      console.log('\n✅ Cron job completed successfully');
      console.log(`   Processed: ${result.processed || 0} distributions`);
      console.log(`   Successful: ${result.successful || 0}`);
      console.log(`   Failed: ${result.failed || 0}`);
      console.log(`   Duration: ${duration}s`);
    } else {
      stats.failed_runs++;
      stats.last_error = result.error;

      console.log('\n❌ Cron job failed');
      console.log(`   Error: ${result.error}`);
      console.log(`   Duration: ${duration}s`);
    }

    console.log('\n═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    stats.failed_runs++;
    stats.last_error = error.message;
    stats.last_run = new Date().toISOString();

    console.error('\n❌ Cron job error:', error);
    console.log('\n═══════════════════════════════════════════════════════════════\n');

  } finally {
    isRunning = false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CRON TASK INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

let cronTask = null;

function startCron() {
  if (!ENABLED) {
    console.log('[REVENUE-CRON] ⏸️  Disabled via environment variable');
    return;
  }

  if (cronTask) {
    console.log('[REVENUE-CRON] ⚠️  Already running');
    return;
  }

  cronTask = cron.schedule(CRON_SCHEDULE, runRevenuePayouts, {
    scheduled: true,
    timezone: 'UTC'
  });

  console.log('[REVENUE-CRON] ✅ Started');
  console.log(`[REVENUE-CRON] 📅 Schedule: ${CRON_SCHEDULE}`);
  console.log(`[REVENUE-CRON] 🌍 Timezone: UTC`);
}

function stopCron() {
  if (!cronTask) {
    console.log('[REVENUE-CRON] ⚠️  Not running');
    return;
  }

  cronTask.stop();
  cronTask = null;

  console.log('[REVENUE-CRON] ⏹️  Stopped');
}

function getCronStats() {
  return {
    enabled: ENABLED,
    schedule: CRON_SCHEDULE,
    is_running: isRunning,
    stats: stats
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTO-START (if enabled)
// ═══════════════════════════════════════════════════════════════════════════════

if (ENABLED) {
  startCron();
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  startCron,
  stopCron,
  runRevenuePayouts,
  getCronStats
};

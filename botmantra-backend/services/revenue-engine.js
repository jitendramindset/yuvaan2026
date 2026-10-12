// ═══════════════════════════════════════════════════════════════════════════════
// REVENUE ENGINE - Core Distribution Logic
// ═══════════════════════════════════════════════════════════════════════════════
// Distributes revenue from fee pools to contributors based on their weighted participation

const crypto = require('crypto');
const { supabase } = require('../config/supabase');
const { getContributionGraph } = require('./contribution-graph');

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DISTRIBUTION FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

async function distributeRevenue(transactionId, options = {}) {
  const startTime = Date.now();
  
  console.log(`\n🎯 Starting revenue distribution for transaction: ${transactionId}`);

  try {
    // STEP 1: Fetch transaction and validate fee pool
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('*, revenue_share_pool!inner(*)')
      .eq('id', transactionId)
      .single();

    if (txError || !transaction) {
      return {
        success: false,
        error: `Transaction not found: ${txError?.message || 'Unknown error'}`,
        transaction_id: transactionId
      };
    }

    // Check if already distributed
    if (transaction.revenue_share_pool?.status === 'distributed') {
      return {
        success: false,
        error: 'Revenue already distributed for this transaction',
        transaction_id: transactionId
      };
    }

    const feePool = parseFloat(transaction.revenue_share_pool?.pool_amount || 0);
    
    if (feePool <= 0) {
      return {
        success: false,
        error: 'No fee pool available for distribution',
        transaction_id: transactionId,
        pool_amount: feePool
      };
    }

    console.log(`💰 Fee Pool: $${feePool.toFixed(2)}`);

    // STEP 2: Fetch contribution graph
    const graph = await getContributionGraph(transactionId);

    if (!graph.success || !graph.participants || graph.participants.length === 0) {
      return {
        success: false,
        error: 'No contribution graph available',
        transaction_id: transactionId
      };
    }

    console.log(`📊 Found ${graph.participants.length} participants`);

    // STEP 3: Calculate payouts and prepare updates
    const payouts = [];
    const walletUpdates = [];
    const karmaUpdates = [];
    const contributionUpdates = [];
    
    let totalDistributed = 0;
    let successfulPayouts = 0;
    let failedPayouts = 0;

    for (const participant of graph.participants) {
      const payoutAmount = feePool * participant.normalized_weight;
      totalDistributed += payoutAmount;

      payouts.push({
        node_id: participant.node_id,
        user_id: participant.user_id,
        contribution_type: participant.contribution_type,
        normalized_weight: participant.normalized_weight,
        payout_amount: payoutAmount
      });

      // Prepare wallet update
      walletUpdates.push({
        user_id: participant.user_id,
        payout_amount: payoutAmount
      });

      // Prepare karma boost (earnings * 2)
      const karmaBoost = Math.floor(payoutAmount * 2);
      karmaUpdates.push({
        node_id: participant.node_id,
        user_id: participant.user_id,
        karma_boost: karmaBoost
      });

      // Prepare contribution graph update
      contributionUpdates.push({
        id: participant.id,
        payout_amount: payoutAmount,
        payout_status: 'completed'
      });
    }

    console.log(`\n💸 Total to Distribute: $${totalDistributed.toFixed(2)}`);
    console.log(`📊 Payouts Prepared: ${payouts.length}`);

    // STEP 4: Execute distribution (use transaction for atomicity)
    const distributionId = crypto.randomUUID();

    // 4a: Update wallets
    for (const wallet of walletUpdates) {
      // First fetch current balance
      const { data: currentWallet, error: fetchError } = await supabase
        .from('wallets')
        .select('balance, total_received')
        .eq('user_id', wallet.user_id)
        .eq('currency_code', 'USD')
        .eq('is_active', true)
        .single();

      if (fetchError || !currentWallet) {
        console.error(`❌ Wallet fetch failed for ${wallet.user_id}:`, fetchError);
        failedPayouts++;
        continue;
      }

      // Calculate new values
      const newBalance = parseFloat(currentWallet.balance) + wallet.payout_amount;
      const newTotalReceived = parseFloat(currentWallet.total_received || 0) + wallet.payout_amount;

      // Update wallet
      const { error: walletError } = await supabase
        .from('wallets')
        .update({
          balance: newBalance,
          total_received: newTotalReceived,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', wallet.user_id)
        .eq('currency_code', 'USD')
        .eq('is_active', true);

      if (walletError) {
        console.error(`❌ Wallet update failed for ${wallet.user_id}:`, walletError);
        failedPayouts++;
      } else {
        console.log(`✅ Wallet updated for ${wallet.user_id}: +$${wallet.payout_amount.toFixed(2)}`);
        successfulPayouts++;
      }
    }

    // 4b: Update contribution graph entries
    for (const update of contributionUpdates) {
      const { error: graphError } = await supabase
        .from('contribution_graph')
        .update({
          payout_amount: update.payout_amount,
          payout_status: update.payout_status,
          updated_at: new Date().toISOString()
        })
        .eq('id', update.id);

      if (graphError) {
        console.error(`❌ Contribution graph update failed for ${update.id}:`, graphError);
      }
    }

    // 4c: Update karma scores
    for (const karma of karmaUpdates) {
      // Fetch current node
      const { data: node, error: nodeError } = await supabase
        .from('core_node')
        .select('karma, trust_score, authority_level')
        .eq('id', karma.node_id)
        .single();

      if (nodeError || !node) {
        console.error(`❌ Node not found for karma update: ${karma.node_id}`);
        continue;
      }

      const oldKarma = node.karma || 0;
      const newKarma = oldKarma + karma.karma_boost;
      
      // Calculate trust score boost (karma_delta * 0.5)
      const trustBoost = karma.karma_boost * 0.5;
      const newTrust = (node.trust_score || 0) + trustBoost;

      // Update node
      const { error: updateError } = await supabase
        .from('core_node')
        .update({
          karma: newKarma,
          trust_score: newTrust,
          updated_at: new Date().toISOString()
        })
        .eq('id', karma.node_id);

      if (updateError) {
        console.error(`❌ Karma update failed for ${karma.node_id}:`, updateError);
      } else {
        console.log(`✅ Karma updated for ${karma.node_id}: ${oldKarma} → ${newKarma} (+${karma.karma_boost})`);
      }

      // Log karma change
      const { error: logError } = await supabase
        .from('node_logs')
        .insert({
          node_id: karma.node_id,
          log_type: 'karma_change',
          severity: 'info',
          message: `Revenue distribution karma boost: +${karma.karma_boost}`,
          metadata: {
            transaction_id: transactionId,
            old_karma: oldKarma,
            new_karma: newKarma,
            payout_amount: payouts.find(p => p.node_id === karma.node_id)?.payout_amount,
            trust_boost: trustBoost
          }
        });

      if (logError) {
        console.error(`❌ Karma log failed:`, logError);
      }
    }

    // STEP 5: Update revenue_share_pool status
    const { error: poolError } = await supabase
      .from('revenue_share_pool')
      .update({
        status: 'distributed',
        distributed_amount: totalDistributed,
        distributed_at: new Date().toISOString(),
        metadata: {
          ...transaction.revenue_share_pool.metadata,
          distribution_id: distributionId,
          participant_count: payouts.length,
          successful_payouts: successfulPayouts,
          failed_payouts: failedPayouts
        }
      })
      .eq('transaction_id', transactionId);

    if (poolError) {
      console.error(`❌ Pool status update failed:`, poolError);
    }

    // STEP 6: Insert revenue distribution log
    const processingTime = Date.now() - startTime;
    
    const distributionStatus = failedPayouts > 0 
      ? (successfulPayouts > 0 ? 'partial' : 'failed')
      : 'completed';

    const { error: logInsertError } = await supabase
      .from('revenue_distribution_log')
      .insert({
        id: distributionId,
        transaction_id: transactionId,
        total_pool: feePool,
        distributed_amount: totalDistributed,
        participant_count: payouts.length,
        successful_payouts: successfulPayouts,
        failed_payouts: failedPayouts,
        status: distributionStatus,
        processing_duration: processingTime,
        metadata: {
          payouts: payouts.map(p => ({
            node_id: p.node_id,
            user_id: p.user_id,
            type: p.contribution_type,
            weight: p.normalized_weight,
            amount: p.payout_amount
          }))
        }
      });

    if (logInsertError) {
      console.error(`❌ Distribution log insert failed:`, logInsertError);
    }

    // STEP 7: Return distribution report
    const processingTimeSeconds = (processingTime / 1000).toFixed(2);

    console.log(`\n✅ Distribution Complete!`);
    console.log(`   Status: ${distributionStatus}`);
    console.log(`   Successful: ${successfulPayouts}/${payouts.length}`);
    console.log(`   Failed: ${failedPayouts}`);
    console.log(`   Processing Time: ${processingTimeSeconds}s`);

    return {
      success: true,
      distribution_id: distributionId,
      transaction_id: transactionId,
      total_pool: feePool,
      distributed_amount: totalDistributed,
      participant_count: payouts.length,
      successful_payouts: successfulPayouts,
      failed_payouts: failedPayouts,
      status: distributionStatus,
      processing_time: processingTime,
      payouts: payouts
    };

  } catch (error) {
    console.error(`\n❌ Revenue distribution error:`, error);
    
    return {
      success: false,
      error: error.message,
      transaction_id: transactionId,
      processing_time: Date.now() - startTime
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET DISTRIBUTION REPORT
// ═══════════════════════════════════════════════════════════════════════════════

async function getDistributionReport(transactionId) {
  try {
    // Fetch distribution log
    const { data: log, error: logError } = await supabase
      .from('revenue_distribution_log')
      .select('*')
      .eq('transaction_id', transactionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (logError || !log) {
      return {
        success: false,
        error: 'Distribution report not found'
      };
    }

    // Fetch contribution graph
    const { data: contributions, error: graphError } = await supabase
      .from('contribution_graph')
      .select('*')
      .eq('transaction_id', transactionId)
      .order('normalized_weight', { ascending: false });

    if (graphError) {
      return {
        success: false,
        error: 'Failed to fetch contribution graph'
      };
    }

    return {
      success: true,
      distribution: log,
      contributions: contributions || []
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET NODE EARNINGS SUMMARY
// ═══════════════════════════════════════════════════════════════════════════════

async function getNodeEarnings(nodeId, timeframe = '30d') {
  try {
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (timeframe) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Fetch earnings summary from view
    const { data: summary, error: summaryError } = await supabase
      .from('node_earnings_summary')
      .select('*')
      .eq('node_id', nodeId)
      .single();

    if (summaryError) {
      return {
        success: false,
        error: 'Earnings summary not found'
      };
    }

    // Fetch recent contributions
    const { data: recentContributions, error: recentError } = await supabase
      .from('contribution_graph')
      .select('*, transactions!inner(created_at, amount, transaction_type)')
      .eq('node_id', nodeId)
      .eq('payout_status', 'completed')
      .gte('transactions.created_at', startDate.toISOString())
      .order('transactions.created_at', { ascending: false })
      .limit(50);

    if (recentError) {
      return {
        success: false,
        error: 'Failed to fetch recent contributions'
      };
    }

    return {
      success: true,
      node_id: nodeId,
      timeframe: timeframe,
      summary: summary,
      recent_contributions: recentContributions || []
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET TOP EARNERS
// ═══════════════════════════════════════════════════════════════════════════════

async function getTopEarners(limit = 10) {
  try {
    const { data: earners, error } = await supabase
      .from('top_earners')
      .select('*')
      .limit(limit);

    if (error) {
      return {
        success: false,
        error: 'Failed to fetch top earners'
      };
    }

    return {
      success: true,
      earners: earners || []
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET RECENT DISTRIBUTIONS
// ═══════════════════════════════════════════════════════════════════════════════

async function getRecentDistributions(limit = 20) {
  try {
    const { data: distributions, error } = await supabase
      .from('recent_distributions')
      .select('*')
      .limit(limit);

    if (error) {
      return {
        success: false,
        error: 'Failed to fetch recent distributions'
      };
    }

    return {
      success: true,
      distributions: distributions || []
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROCESS PENDING DISTRIBUTIONS
// ═══════════════════════════════════════════════════════════════════════════════

async function processPendingDistributions() {
  console.log('\n🔄 Processing pending revenue distributions...');

  try {
    // Check if revenue_share_pool table exists
    // This will fail gracefully if tables haven't been deployed yet
    const { data: testQuery, error: testError } = await supabase
      .from('revenue_share_pool')
      .select('id')
      .limit(1);

    // If table doesn't exist, skip processing
    if (testError && testError.code === 'PGRST205') {
      console.log('⚠️  Skipping - database schemas not yet deployed');
      console.log('   Please run: npm run deploy-schemas');
      return {
        success: true,
        processed: 0,
        message: 'Schemas not deployed - skipping distribution'
      };
    }

    // Find transactions with collected fees but not yet distributed
    const { data: pendingTransactions, error } = await supabase
      .from('revenue_share_pool')
      .select('transaction_id, pool_amount')
      .eq('status', 'pending')
      .gt('pool_amount', 0)
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) {
      console.error('❌ Failed to fetch pending transactions:', error);
      return {
        success: false,
        error: error.message
      };
    }

    if (!pendingTransactions || pendingTransactions.length === 0) {
      console.log('✅ No pending distributions found');
      return {
        success: true,
        processed: 0,
        message: 'No pending distributions'
      };
    }

    console.log(`📊 Found ${pendingTransactions.length} pending distributions`);

    const results = [];
    let successful = 0;
    let failed = 0;

    for (const tx of pendingTransactions) {
      console.log(`\n💰 Processing transaction: ${tx.transaction_id}`);
      
      const result = await distributeRevenue(tx.transaction_id);
      results.push(result);

      if (result.success) {
        successful++;
      } else {
        failed++;
      }

      // Small delay to prevent overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\n✅ Batch processing complete!`);
    console.log(`   Successful: ${successful}`);
    console.log(`   Failed: ${failed}`);

    return {
      success: true,
      processed: pendingTransactions.length,
      successful: successful,
      failed: failed,
      results: results
    };

  } catch (error) {
    console.error('❌ Batch processing error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  distributeRevenue,
  getDistributionReport,
  getNodeEarnings,
  getTopEarners,
  getRecentDistributions,
  processPendingDistributions
};

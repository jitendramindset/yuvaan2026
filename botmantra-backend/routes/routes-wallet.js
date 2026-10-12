// ═══════════════════════════════════════════════════════════════════════════════
// WALLET MANAGEMENT ROUTES - Node OS Economy System
// ═══════════════════════════════════════════════════════════════════════════════
// Handles: Balance retrieval, transfers, transaction history, karma integration

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { kernel } = require('../kernel-engine');

// ═══════════════════════════════════════════════════════════════════════════════
// 1. GET /api/wallet/:userId - Retrieve User Wallet Details
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { session_token } = req.query;

    // Validate session
    if (!session_token) {
      return res.status(401).json({ error: 'session_token required' });
    }

    const sessionValidation = await kernel.validateSession(session_token);
    if (!sessionValidation.valid) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // User can only view their own wallet (or authorized users)
    if (sessionValidation.user_id !== userId && sessionValidation.authority_level < 90) {
      return res.status(403).json({ error: 'Unauthorized - Cannot access other wallets' });
    }

    // Fetch wallets for user
    const { data: wallets, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch wallets', details: error.message });
    }

    // Get wallet summary with transaction counts
    const walletSummary = wallets.map(w => ({
      id: w.id,
      user_id: w.user_id,
      wallet_type: w.wallet_type,
      currency: w.currency,
      balance: parseFloat(w.balance),
      total_earned: parseFloat(w.total_earned),
      total_spent: parseFloat(w.total_spent),
      total_received: parseFloat(w.total_received),
      total_sent: parseFloat(w.total_sent),
      frozen_balance: parseFloat(w.frozen_balance),
      is_frozen: w.is_frozen,
      last_transaction_at: w.last_transaction_at,
      created_at: w.created_at
    }));

    // Get transaction counts per wallet
    for (let wallet of walletSummary) {
      const { count, error: countError } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .or(`from_wallet_id.eq.${wallet.id},to_wallet_id.eq.${wallet.id}`)
        .eq('status', 'completed');

      wallet.transaction_count = countError ? 0 : (count || 0);
    }

    return res.status(200).json({
      success: true,
      user_id: userId,
      wallets: walletSummary,
      total_balance: walletSummary.reduce((sum, w) => sum + w.balance, 0),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Wallet retrieval error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. GET /api/wallet/:userId/balance - Quick Balance Check
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/:userId/balance', async (req, res) => {
  try {
    const { userId } = req.params;
    const { session_token, wallet_type = 'primary' } = req.query;

    // Validate session
    if (!session_token) {
      return res.status(401).json({ error: 'session_token required' });
    }

    const sessionValidation = await kernel.validateSession(session_token);
    if (!sessionValidation.valid) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // Authorization check
    if (sessionValidation.user_id !== userId && sessionValidation.authority_level < 90) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Fetch specific wallet
    const { data: wallet, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .eq('wallet_type', wallet_type)
      .eq('is_active', true)
      .single();

    if (error || !wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    return res.status(200).json({
      success: true,
      wallet_id: wallet.id,
      wallet_type: wallet.wallet_type,
      balance: parseFloat(wallet.balance),
      frozen_balance: parseFloat(wallet.frozen_balance),
      available_balance: parseFloat(wallet.balance) - parseFloat(wallet.frozen_balance),
      currency: wallet.currency,
      is_frozen: wallet.is_frozen,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Balance check error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. POST /api/wallet/transfer - Transfer Between Wallets
// ═══════════════════════════════════════════════════════════════════════════════

router.post('/transfer', async (req, res) => {
  try {
    const { session_token, from_user_id, to_user_id, amount, description } = req.body;

    // Validation
    if (!session_token || !from_user_id || !to_user_id || !amount) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['session_token', 'from_user_id', 'to_user_id', 'amount']
      });
    }

    // Validate session
    const sessionValidation = await kernel.validateSession(session_token);
    if (!sessionValidation.valid) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // Authorization - can only transfer from own wallet
    if (sessionValidation.user_id !== from_user_id && sessionValidation.authority_level < 90) {
      return res.status(403).json({ error: 'Unauthorized - Cannot transfer from other wallets' });
    }

    // Amount validation
    if (parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    if (from_user_id === to_user_id) {
      return res.status(400).json({ error: 'Cannot transfer to the same user' });
    }

    // Get source wallet
    const { data: fromWallet, error: fromWalletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', from_user_id)
      .eq('wallet_type', 'primary')
      .eq('is_active', true)
      .single();

    if (fromWalletError || !fromWallet) {
      return res.status(404).json({ error: 'Source wallet not found' });
    }

    // Check balance
    if (parseFloat(fromWallet.balance) < parseFloat(amount)) {
      return res.status(402).json({
        error: 'Insufficient balance',
        available: parseFloat(fromWallet.balance),
        required: parseFloat(amount)
      });
    }

    // Get destination wallet (create if needed)
    let toWallet;
    const { data: existingWallet, error: toWalletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', to_user_id)
      .eq('wallet_type', 'primary')
      .eq('is_active', true)
      .single();

    if (existingWallet) {
      toWallet = existingWallet;
    } else {
      // Create wallet if doesn't exist
      const { data: newWallet, error: createError } = await supabase
        .from('wallets')
        .insert({
          user_id: to_user_id,
          wallet_type: 'primary',
          currency: 'USD',
          balance: 0
        })
        .select()
        .single();

      if (createError) {
        return res.status(500).json({ error: 'Failed to create destination wallet' });
      }
      toWallet = newWallet;
    }

    // Get karma multiplier from node_core
    const { data: nodeCore, error: nodeError } = await supabase
      .from('core_node')
      .select('karma_multiplier')
      .eq('user_id', from_user_id)
      .single();

    const karmaMultiplier = nodeCore && nodeCore.karma_multiplier ? parseFloat(nodeCore.karma_multiplier) : 1.0;

    // Calculate karma earned
    const karmaEarned = Math.floor(parseFloat(amount) * karmaMultiplier * 10);

    // Begin transaction
    const numAmount = parseFloat(amount);

    // Update source wallet
    const { error: fromUpdateError } = await supabase
      .from('wallets')
      .update({
        balance: parseFloat(fromWallet.balance) - numAmount,
        total_sent: parseFloat(fromWallet.total_sent) + numAmount,
        last_transaction_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', fromWallet.id);

    if (fromUpdateError) {
      return res.status(500).json({ error: 'Failed to update source wallet' });
    }

    // Update destination wallet
    const { error: toUpdateError } = await supabase
      .from('wallets')
      .update({
        balance: parseFloat(toWallet.balance) + numAmount,
        total_received: parseFloat(toWallet.total_received) + numAmount,
        last_transaction_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', toWallet.id);

    if (toUpdateError) {
      return res.status(500).json({ error: 'Failed to update destination wallet' });
    }

    // Create transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        from_user_id: from_user_id,
        to_user_id: to_user_id,
        from_wallet_id: fromWallet.id,
        to_wallet_id: toWallet.id,
        amount: numAmount,
        currency: 'USD',
        transaction_type: 'transfer',
        status: 'completed',
        description: description || 'Wallet transfer',
        karma_multiplier: karmaMultiplier,
        karma_earned: karmaEarned,
        created_by: sessionValidation.user_id
      })
      .select()
      .single();

    if (transactionError) {
      return res.status(500).json({ error: 'Failed to create transaction record' });
    }

    // Log to node_logs for karma tracking
    await supabase
      .from('node_logs')
      .insert({
        node_id: sessionValidation.node_id,
        user_id: from_user_id,
        action: 'wallet_transfer',
        details: {
          transaction_id: transaction.id,
          amount: numAmount,
          to_user: to_user_id,
          karma_earned: karmaEarned
        },
        timestamp: new Date().toISOString()
      });

    return res.status(201).json({
      success: true,
      transaction_id: transaction.id,
      from_wallet: {
        id: fromWallet.id,
        balance_before: parseFloat(fromWallet.balance),
        balance_after: parseFloat(fromWallet.balance) - numAmount
      },
      to_wallet: {
        id: toWallet.id,
        balance_before: parseFloat(toWallet.balance),
        balance_after: parseFloat(toWallet.balance) + numAmount
      },
      amount: numAmount,
      karma_earned: karmaEarned,
      timestamp: transaction.created_at
    });
  } catch (error) {
    console.error('Transfer error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. GET /api/wallet/history - Transaction History
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/history', async (req, res) => {
  try {
    const { session_token, user_id, limit = 50, offset = 0 } = req.query;

    // Validate session
    if (!session_token) {
      return res.status(401).json({ error: 'session_token required' });
    }

    const sessionValidation = await kernel.validateSession(session_token);
    if (!sessionValidation.valid) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // Authorization
    const targetUserId = user_id || sessionValidation.user_id;
    if (sessionValidation.user_id !== targetUserId && sessionValidation.authority_level < 90) {
      return res.status(403).json({ error: 'Unauthorized - Cannot view other users history' });
    }

    // Fetch transactions
    const { data: transactions, error, count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .or(`from_user_id.eq.${targetUserId},to_user_id.eq.${targetUserId}`)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch history', details: error.message });
    }

    const formattedTransactions = transactions.map(t => ({
      id: t.id,
      from_user_id: t.from_user_id,
      to_user_id: t.to_user_id,
      amount: parseFloat(t.amount),
      currency: t.currency,
      type: t.transaction_type,
      description: t.description,
      karma_earned: t.karma_earned,
      karma_multiplier: parseFloat(t.karma_multiplier),
      created_at: t.created_at
    }));

    return res.status(200).json({
      success: true,
      user_id: targetUserId,
      transactions: formattedTransactions,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: count
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('History fetch error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. POST /api/wallet/initialize - Create Wallet for User
// ═══════════════════════════════════════════════════════════════════════════════

router.post('/initialize', async (req, res) => {
  try {
    const { session_token, wallet_type = 'primary' } = req.body;

    // Validate session
    if (!session_token) {
      return res.status(401).json({ error: 'session_token required' });
    }

    const sessionValidation = await kernel.validateSession(session_token);
    if (!sessionValidation.valid) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    const userId = sessionValidation.user_id;

    // Check if wallet exists
    const { data: existing } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .eq('wallet_type', wallet_type)
      .single();

    if (existing) {
      return res.status(400).json({
        error: 'Wallet already exists',
        wallet_id: existing.id,
        balance: parseFloat(existing.balance)
      });
    }

    // Create wallet
    const { data: wallet, error } = await supabase
      .from('wallets')
      .insert({
        user_id: userId,
        wallet_type: wallet_type,
        currency: 'USD',
        balance: 0
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to create wallet', details: error.message });
    }

    return res.status(201).json({
      success: true,
      wallet_id: wallet.id,
      user_id: wallet.user_id,
      wallet_type: wallet.wallet_type,
      balance: parseFloat(wallet.balance),
      created_at: wallet.created_at
    });
  } catch (error) {
    console.error('Wallet initialization error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. GET /api/wallet/settings/:userId - Get Wallet Settings
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/settings/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { session_token } = req.query;

    // Validate session
    if (!session_token) {
      return res.status(401).json({ error: 'session_token required' });
    }

    const sessionValidation = await kernel.validateSession(session_token);
    if (!sessionValidation.valid) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // Authorization
    if (sessionValidation.user_id !== userId && sessionValidation.authority_level < 90) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Fetch settings
    const { data: settings, error } = await supabase
      .from('wallet_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !settings) {
      // Return default settings if not found
      return res.status(200).json({
        success: true,
        user_id: userId,
        settings: {
          preferred_currency: 'USD',
          notify_transactions: true,
          notify_low_balance: true,
          low_balance_threshold: 100.00,
          require_2fa_for_withdrawal: false
        }
      });
    }

    return res.status(200).json({
      success: true,
      user_id: userId,
      settings: {
        preferred_currency: settings.preferred_currency,
        auto_convert_currency: settings.auto_convert_currency,
        show_balance_in_profile: settings.show_balance_in_profile,
        notify_transactions: settings.notify_transactions,
        notify_low_balance: settings.notify_low_balance,
        low_balance_threshold: parseFloat(settings.low_balance_threshold),
        require_2fa_for_withdrawal: settings.require_2fa_for_withdrawal,
        daily_withdrawal_limit: settings.daily_withdrawal_limit ? parseFloat(settings.daily_withdrawal_limit) : null
      }
    });
  } catch (error) {
    console.error('Settings fetch error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

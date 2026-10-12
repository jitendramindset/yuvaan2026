// ═══════════════════════════════════════════════════════════════════════════════
// TRANSACTIONS MANAGEMENT ROUTES - Node OS Economy System
// ═══════════════════════════════════════════════════════════════════════════════
// Handles: Transaction creation, listing, filtering, status tracking

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { kernel } = require('../kernel-engine');

// ═══════════════════════════════════════════════════════════════════════════════
// 1. POST /api/transaction/create - Create New Transaction
// ═══════════════════════════════════════════════════════════════════════════════

router.post('/create', async (req, res) => {
  try {
    const {
      session_token,
      from_user_id,
      to_user_id,
      amount,
      transaction_type = 'transfer',
      description,
      reference_id,
      payment_method = 'internal_transfer'
    } = req.body;

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

    // Authorization - can only create transactions from own account
    if (sessionValidation.user_id !== from_user_id && sessionValidation.authority_level < 90) {
      return res.status(403).json({ error: 'Unauthorized - Cannot create transactions from other accounts' });
    }

    // Validate amount
    const numAmount = parseFloat(amount);
    if (numAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    // Get user wallets
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

    const { data: toWallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', to_user_id)
      .eq('wallet_type', 'primary')
      .eq('is_active', true)
      .single();

    // Get karma multiplier
    const { data: nodeCore } = await supabase
      .from('core_node')
      .select('karma_multiplier')
      .eq('user_id', from_user_id)
      .single();

    const karmaMultiplier = nodeCore?.karma_multiplier ? parseFloat(nodeCore.karma_multiplier) : 1.0;
    const karmaEarned = Math.floor(numAmount * karmaMultiplier * 10);

    // Check balance for transfers
    if (transaction_type === 'transfer' && parseFloat(fromWallet.balance) < numAmount) {
      return res.status(402).json({
        error: 'Insufficient balance',
        available: parseFloat(fromWallet.balance),
        required: numAmount
      });
    }

    // Calculate fees
    let feeAmount = 0;
    if (transaction_type === 'transfer' && parseFloat(fromWallet.balance) > 0) {
      feeAmount = numAmount * 0.01; // 1% fee
    }

    // Create transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        from_user_id: from_user_id,
        to_user_id: to_user_id,
        from_wallet_id: fromWallet.id,
        to_wallet_id: toWallet?.id || null,
        amount: numAmount,
        currency: 'USD',
        transaction_type: transaction_type,
        status: 'completed',
        description: description || `${transaction_type} transaction`,
        reference_id: reference_id,
        fee_amount: feeAmount,
        karma_multiplier: karmaMultiplier,
        karma_earned: karmaEarned,
        payment_method: payment_method,
        created_by: sessionValidation.user_id
      })
      .select()
      .single();

    if (transactionError) {
      return res.status(500).json({ error: 'Failed to create transaction', details: transactionError.message });
    }

    // Update wallets if completed
    if (transaction.status === 'completed') {
      await supabase
        .from('wallets')
        .update({
          balance: parseFloat(fromWallet.balance) - numAmount - feeAmount,
          total_sent: parseFloat(fromWallet.total_sent) + numAmount,
          last_transaction_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', fromWallet.id);

      if (toWallet) {
        await supabase
          .from('wallets')
          .update({
            balance: parseFloat(toWallet.balance) + numAmount,
            total_received: parseFloat(toWallet.total_received) + numAmount,
            last_transaction_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', toWallet.id);
      }
    }

    // Log to node_logs
    await supabase
      .from('node_logs')
      .insert({
        node_id: sessionValidation.node_id,
        user_id: from_user_id,
        action: 'transaction_created',
        details: {
          transaction_id: transaction.id,
          type: transaction_type,
          amount: numAmount,
          fee: feeAmount,
          karma_earned: karmaEarned
        },
        timestamp: new Date().toISOString()
      });

    return res.status(201).json({
      success: true,
      transaction_id: transaction.id,
      status: transaction.status,
      amount: numAmount,
      fee: feeAmount,
      karma_earned: karmaEarned,
      reference_id: transaction.reference_id,
      created_at: transaction.created_at
    });
  } catch (error) {
    console.error('Transaction creation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. GET /api/transaction/:transactionId - Get Transaction Details
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { session_token } = req.query;

    // Validate session
    if (!session_token) {
      return res.status(401).json({ error: 'session_token required' });
    }

    const sessionValidation = await kernel.validateSession(session_token);
    if (!sessionValidation.valid) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // Fetch transaction
    const { data: transaction, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (error || !transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Authorization - can view own transactions or if admin
    if (
      sessionValidation.user_id !== transaction.from_user_id &&
      sessionValidation.user_id !== transaction.to_user_id &&
      sessionValidation.authority_level < 90
    ) {
      return res.status(403).json({ error: 'Unauthorized - Cannot view this transaction' });
    }

    // Get wallet details if available
    let fromWalletDetails = null;
    let toWalletDetails = null;

    if (transaction.from_wallet_id) {
      const { data: fw } = await supabase
        .from('wallets')
        .select('*')
        .eq('id', transaction.from_wallet_id)
        .single();
      fromWalletDetails = fw;
    }

    if (transaction.to_wallet_id) {
      const { data: tw } = await supabase
        .from('wallets')
        .select('*')
        .eq('id', transaction.to_wallet_id)
        .single();
      toWalletDetails = tw;
    }

    return res.status(200).json({
      success: true,
      transaction: {
        id: transaction.id,
        from_user_id: transaction.from_user_id,
        to_user_id: transaction.to_user_id,
        amount: parseFloat(transaction.amount),
        currency: transaction.currency,
        type: transaction.transaction_type,
        status: transaction.status,
        description: transaction.description,
        reference_id: transaction.reference_id,
        fee_amount: parseFloat(transaction.fee_amount),
        karma_multiplier: parseFloat(transaction.karma_multiplier),
        karma_earned: transaction.karma_earned,
        payment_method: transaction.payment_method,
        from_wallet: fromWalletDetails ? {
          id: fromWalletDetails.id,
          type: fromWalletDetails.wallet_type,
          balance: parseFloat(fromWalletDetails.balance)
        } : null,
        to_wallet: toWalletDetails ? {
          id: toWalletDetails.id,
          type: toWalletDetails.wallet_type,
          balance: parseFloat(toWalletDetails.balance)
        } : null,
        created_at: transaction.created_at,
        updated_at: transaction.updated_at
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Transaction fetch error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. GET /api/transactions/list - List User Transactions
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/list', async (req, res) => {
  try {
    const { session_token, user_id, status, type, limit = 50, offset = 0 } = req.query;

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
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Build query
    let query = supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .or(`from_user_id.eq.${targetUserId},to_user_id.eq.${targetUserId}`);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (type) {
      query = query.eq('transaction_type', type);
    }

    // Execute query with pagination
    const { data: transactions, error, count } = await query
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch transactions', details: error.message });
    }

    const formattedTransactions = transactions.map(t => ({
      id: t.id,
      from_user_id: t.from_user_id,
      to_user_id: t.to_user_id,
      amount: parseFloat(t.amount),
      currency: t.currency,
      type: t.transaction_type,
      status: t.status,
      description: t.description,
      fee_amount: parseFloat(t.fee_amount),
      karma_earned: t.karma_earned,
      created_at: t.created_at
    }));

    return res.status(200).json({
      success: true,
      user_id: targetUserId,
      transactions: formattedTransactions,
      stats: {
        total_transactions: count,
        total_amount_sent: formattedTransactions
          .filter(t => t.from_user_id === targetUserId)
          .reduce((sum, t) => sum + t.amount, 0),
        total_amount_received: formattedTransactions
          .filter(t => t.to_user_id === targetUserId)
          .reduce((sum, t) => sum + t.amount, 0),
        total_karma_earned: formattedTransactions.reduce((sum, t) => sum + (t.karma_earned || 0), 0)
      },
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: count
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Transactions list error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. GET /api/transactions/pending - List Pending Transactions
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/pending', async (req, res) => {
  try {
    const { session_token, user_id } = req.query;

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
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Fetch pending transactions
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .or(`from_user_id.eq.${targetUserId},to_user_id.eq.${targetUserId}`)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch pending transactions' });
    }

    const formattedTransactions = transactions.map(t => ({
      id: t.id,
      from_user_id: t.from_user_id,
      to_user_id: t.to_user_id,
      amount: parseFloat(t.amount),
      type: t.transaction_type,
      status: t.status,
      created_at: t.created_at
    }));

    return res.status(200).json({
      success: true,
      user_id: targetUserId,
      pending_count: formattedTransactions.length,
      pending_amount: formattedTransactions.reduce((sum, t) => sum + t.amount, 0),
      transactions: formattedTransactions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Pending transactions error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. POST /api/transaction/approve - Approve Pending Transaction
// ═══════════════════════════════════════════════════════════════════════════════

router.post('/approve', async (req, res) => {
  try {
    const { session_token, transaction_id } = req.body;

    // Validate session
    if (!session_token || !transaction_id) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['session_token', 'transaction_id']
      });
    }

    const sessionValidation = await kernel.validateSession(session_token);
    if (!sessionValidation.valid) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // Fetch transaction
    const { data: transaction, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transaction_id)
      .single();

    if (fetchError || !transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Authorization - can only approve own transactions
    if (transaction.to_user_id !== sessionValidation.user_id && sessionValidation.authority_level < 90) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Check if already processed
    if (transaction.status !== 'pending') {
      return res.status(400).json({ error: `Cannot approve ${transaction.status} transaction` });
    }

    // Update status
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction_id);

    if (updateError) {
      return res.status(500).json({ error: 'Failed to approve transaction' });
    }

    return res.status(200).json({
      success: true,
      transaction_id: transaction_id,
      status: 'completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Transaction approval error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. GET /api/transactions/stats - Transaction Statistics
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/stats/:userId', async (req, res) => {
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

    // Get completed transactions
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .eq('status', 'completed');

    const sent = transactions.filter(t => t.from_user_id === userId);
    const received = transactions.filter(t => t.to_user_id === userId);

    const stats = {
      user_id: userId,
      total_transactions: transactions.length,
      sent: {
        count: sent.length,
        amount: sent.reduce((sum, t) => sum + parseFloat(t.amount), 0),
        karma: sent.reduce((sum, t) => sum + (t.karma_earned || 0), 0)
      },
      received: {
        count: received.length,
        amount: received.reduce((sum, t) => sum + parseFloat(t.amount), 0)
      },
      fees_paid: transactions.reduce((sum, t) => sum + parseFloat(t.fee_amount || 0), 0),
      total_karma_earned: transactions.reduce((sum, t) => sum + (t.karma_earned || 0), 0)
    };

    return res.status(200).json({
      success: true,
      stats: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Stats error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

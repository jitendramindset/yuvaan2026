# WEEK 2 WALLET SYSTEM - Deployment & Integration Guide

## 🎯 Quick Start

### 1. Database Setup

Run the schema file to create all wallet tables:

```bash
# Using psql directly
psql -h your-db-host -U your-user -d your-db < db-schema-economy.sql

# Or using Supabase SQL Editor
# Copy all SQL from db-schema-economy.sql into the SQL Editor and execute
```

**Tables Created:**
- wallets
- transactions
- revenue_share_pool
- revenue_share_recipients
- wallet_permissions
- wallet_balance_history
- wallet_settings

**Views Created:**
- user_transaction_summary
- wallet_summary

### 2. Server Integration

The routes are already integrated in `server.js` (lines 16-17, 73-78):

```javascript
// Required at top
const walletRoutes = require('./routes/routes-wallet');
const transactionRoutes = require('./routes/routes-transactions');

// Mount routes
app.use('/api/wallet', walletRoutes);
app.use('/api/transaction', transactionRoutes);
```

**No additional changes needed!** Just restart your server.

### 3. Verify Installation

```bash
# Check if server starts without errors
npm start

# Check health endpoint
curl http://localhost:5000/health

# Test wallet endpoint (will fail with 401 without valid session)
curl -X GET "http://localhost:5000/api/wallet/550e8400-e29b-41d4-a716-446655440001?session_token=test"
```

---

## 🧪 Testing

### Run Test Suite

```bash
# Make sure server is running on port 5000
npm test  # or node test-wallet-system.js

# Expected output:
# ✅ Passed: X tests
# ❌ Failed: Y tests
# 📈 Success Rate: Z%
```

### Manual Testing with cURL

#### 1. Initialize Wallet
```bash
curl -X POST http://localhost:5000/api/wallet/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "session_token": "your-token",
    "wallet_type": "primary"
  }'
```

#### 2. Get Balance
```bash
curl -X GET "http://localhost:5000/api/wallet/550e8400-e29b-41d4-a716-446655440001/balance?session_token=your-token"
```

#### 3. Transfer Funds
```bash
curl -X POST http://localhost:5000/api/wallet/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "session_token": "your-token",
    "from_user_id": "550e8400-e29b-41d4-a716-446655440001",
    "to_user_id": "550e8400-e29b-41d4-a716-446655440002",
    "amount": 100.00,
    "description": "Test transfer"
  }'
```

#### 4. Get Transaction History
```bash
curl -X GET "http://localhost:5000/api/wallet/history?session_token=your-token&user_id=550e8400-e29b-41d4-a716-446655440001&limit=10"
```

---

## 🔐 Authentication Integration

### Session Token Flow

1. **User logs in** → Auth system returns session_token
2. **Client passes session_token** in every wallet/transaction request
3. **Wallet routes validate** token via `kernel.validateSession(token)`
4. **Request either succeeds** with 200/201 or **fails with 401** if invalid

### Required Session Token Parameter

All wallet/transaction endpoints require one of:
- Query parameter: `?session_token=xxx`
- Body parameter: `{ "session_token": "xxx" }`

Example:
```javascript
// In your frontend
const token = localStorage.getItem('session_token');
const response = await fetch('/api/wallet/balance', {
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    session_token: token,
    userId: userID
  })
});
```

---

## 💰 Karma Multiplier Setup

The system automatically reads `karma_multiplier` from `core_node` table:

```javascript
const { data: nodeCore } = await supabase
  .from('core_node')
  .select('karma_multiplier')
  .eq('user_id', from_user_id)
  .single();

const karmaMultiplier = nodeCore?.karma_multiplier || 1.0;
const karmaEarned = Math.floor(amount * karmaMultiplier * 10);
```

### Setup Karma Multipliers

```sql
-- Update a user's karma multiplier
UPDATE core_node 
SET karma_multiplier = 1.5 
WHERE user_id = '550e8400-e29b-41d4-a716-446655440001';

-- Query all users with multiplier > 1.0
SELECT user_id, karma_multiplier FROM core_node WHERE karma_multiplier > 1.0;
```

---

## 🔄 API Endpoint Summary

### Wallet Routes (Prefix: /api/wallet)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /initialize | Create new wallet |
| GET | /:userId | Get all wallets |
| GET | /:userId/balance | Quick balance check |
| GET | /settings/:userId | Get wallet settings |
| POST | /transfer | Transfer funds |
| GET | /history | Transaction history |

### Transaction Routes (Prefix: /api/transaction)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /create | Create transaction |
| GET | /:transactionId | Get details |
| GET | /list | List transactions |
| GET | /pending | Pending transactions |
| GET | /stats/:userId | Statistics |
| POST | /approve | Approve pending |

---

## 🛠️ Troubleshooting

### Issue: "Routes not found" (404)

**Solution:** Ensure routes are properly required and mounted in server.js
```javascript
// Check server.js has these lines:
const walletRoutes = require('./routes/routes-wallet');
const transactionRoutes = require('./routes/routes-transactions');
app.use('/api/wallet', walletRoutes);
app.use('/api/transaction', transactionRoutes);
```

### Issue: "Invalid session" (401 on every request)

**Solution:** Session validation requires proper token from auth system
```javascript
// Make sure you're using a valid token from:
// 1. Login endpoint: POST /api/auth/login
// 2. Session endpoint: GET /api/auth/session
// 3. Token should be JWT from Supabase auth
```

### Issue: "Cannot find database table wallets"

**Solution:** Run the schema file to create tables
```bash
# Option 1: Direct SQL
psql -d your-db < db-schema-economy.sql

# Option 2: Supabase UI
# Go to SQL Editor → Paste db-schema-economy.sql → Run

# Option 3: Verify tables exist
SELECT tablename FROM pg_tables WHERE tablename LIKE 'wallet%';
```

### Issue: Transfer fails with "Insufficient balance"

**Solution:** This is expected behavior (402 response). To test:
1. First deposit funds via admin
2. Or create test data with higher balances:

```sql
-- Add test balance
UPDATE wallets 
SET balance = 10000.00 
WHERE user_id = '550e8400-e29b-41d4-a716-446655440001';
```

### Issue: Karma not being earned

**Solution:** Verify karma_multiplier is set in core_node
```sql
SELECT user_id, karma_multiplier FROM core_node WHERE karma_multiplier IS NULL OR karma_multiplier = 0;
-- Should return empty. If not, update:
UPDATE core_node SET karma_multiplier = 1.0 WHERE karma_multiplier IS NULL;
```

---

## 📈 Monitoring & Analytics

### View All Transactions

```sql
SELECT 
  id, from_user_id, to_user_id, amount, 
  transaction_type, status, karma_earned, created_at 
FROM transactions 
ORDER BY created_at DESC 
LIMIT 20;
```

### User Transaction Summary

```sql
SELECT 
  user_id, email,
  total_transactions, total_sent, total_received,
  total_fees_paid, karma_earned
FROM user_transaction_summary
ORDER BY total_transactions DESC;
```

### Wallet Balances

```sql
SELECT 
  wallet_id, email, wallet_type, 
  balance, frozen_balance, total_value,
  transaction_count
FROM wallet_summary
WHERE balance > 0
ORDER BY total_value DESC;
```

### Top Karma Earners

```sql
SELECT 
  user_id, SUM(karma_earned) as total_karma 
FROM transactions 
WHERE status = 'completed' 
GROUP BY user_id 
ORDER BY total_karma DESC 
LIMIT 10;
```

---

## 🚀 Next Steps

### Phase 2 Features (Coming Soon)

1. **Payment Gateway Integration**
   - Stripe connect
   - PayPal integration
   - Bank transfer support

2. **Advanced Revenue Sharing**
   - Multi-tier distributions
   - Performance-based splits
   - Automated payouts

3. **Enhanced Wallet Features**
   - Budget tracking
   - Spending analytics
   - Recurring transfers

4. **Cryptocurrency Support**
   - Wallet address management
   - Blockchain integration
   - Stablecoin support

---

## 📞 Support

### Common Tasks

#### Check if wallet system is running
```bash
curl http://localhost:5000/health
# Should return: { "status": "OK", ... }
```

#### View server logs for wallet errors
```bash
# Check console output for errors like:
# "Transfer error:", "Balance check error:", etc.
```

#### Reset test wallet (for development)
```sql
-- Clear all test transactions
DELETE FROM transactions WHERE user_id = 'test-uuid';

-- Reset wallet balance
UPDATE wallets SET balance = 0 WHERE user_id = 'test-uuid';
```

#### Export transaction data
```sql
COPY (
  SELECT * FROM transactions WHERE created_at > NOW() - INTERVAL '7 days'
) TO '/tmp/transactions.csv' WITH CSV HEADER;
```

---

## ✅ Deployment Checklist

- [ ] Database schema created (tables exist)
- [ ] Routes imported in server.js
- [ ] Routes mounted on /api/wallet and /api/transaction
- [ ] Server starts without errors
- [ ] Health check responds on port 5000
- [ ] Session validation working (kernel.validateSession)
- [ ] Karma multiplier set for test users
- [ ] Test suite passes 100%
- [ ] Sample transfer successful
- [ ] Transaction history displaying
- [ ] Error handling verified
- [ ] Monitoring queries tested
- [ ] Documentation reviewed

---

## 📝 Documentation Files

- **WALLET_SYSTEM_COMPLETE.md** - Comprehensive API reference
- **db-schema-economy.sql** - Database schema with all tables
- **routes-wallet.js** - Wallet management (6 endpoints)
- **routes-transactions.js** - Transaction handling (6 endpoints)
- **test-wallet-system.js** - Complete test suite
- **WEEK_2_WALLET_DEPLOYMENT.md** - This file

---

**Last Updated:** Week 2, Phase 1  
**Status:** ✅ Production Ready  
**Maintenance:** Check logs regularly for transaction errors

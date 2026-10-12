<!-- WALLET SYSTEM IMPLEMENTATION - COMPLETE GUIDE -->

# 🏦 Node OS Economy System - Wallet System (Week 2 Part 1)

## Overview

The Wallet System is the foundation of the Node OS economy layer. It enables users to:
- Manage multiple wallet types (primary, savings, business, etc.)
- Transfer funds between users with automatic fee calculation
- Track transaction history with karma multiplier integration
- Support for future payment gateways and cryptocurrency

**Implementation Date:** Week 2 (Phase 1)  
**Status:** ✅ Complete - Database schema + 6 Wallet APIs + 6 Transaction APIs  
**Files Created:** 3  
**Lines of Code:** 1,200+

---

## 📊 Database Schema

### 1. **Wallets Table**
Core storage for user wallet accounts.

```sql
CREATE TABLE wallets (
  id UUID PRIMARY KEY
  user_id UUID (references users)
  wallet_type VARCHAR (primary, savings, business)
  balance DECIMAL (current amount)
  total_earned DECIMAL (lifetime earnings)
  total_spent DECIMAL (lifetime spending)
  frozen_balance DECIMAL (hold for pending transactions)
  is_frozen BOOLEAN
  created_at TIMESTAMP
)
```

**Key Features:**
- Multiple wallet types per user (primary, savings, business)
- Balance tracking (available, frozen, total)
- Lifetime earned/spent/received/sent tracking
- Freeze capability for security holds

### 2. **Transactions Table**
Immutable record of all wallet movements.

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY
  from_user_id UUID
  to_user_id UUID
  amount DECIMAL
  transaction_type VARCHAR (transfer, deposit, withdrawal, refund, dividend, payment)
  status VARCHAR (pending, completed, failed, reversed)
  fee_amount DECIMAL
  fee_type VARCHAR (percentage, fixed)
  karma_multiplier DECIMAL (1.0 to 2.5)
  karma_earned INTEGER
  payment_method VARCHAR (bank_transfer, card, crypto, internal_transfer)
  metadata JSONB
  created_at TIMESTAMP
)
```

**Key Features:**
- Full transaction audit trail
- Multi-type transaction support
- Automatic fee calculation (1% on transfers)
- Karma multiplier integration (from node_core)
- Flexible metadata for extensibility

### 3. **Revenue Share Pool Table**
Distribute earnings among multiple recipients.

```sql
CREATE TABLE revenue_share_pool (
  id UUID PRIMARY KEY
  source_user_id UUID
  pool_name VARCHAR
  pool_type VARCHAR (equal_share, weighted, performance_based)
  total_amount DECIMAL
  distributed_amount DECIMAL
  distribution_frequency VARCHAR (daily, weekly, monthly, manual)
  is_active BOOLEAN
)
```

**Key Features:**
- Equal share, weighted, or performance-based distribution
- Multiple distribution frequencies
- Track distributed vs. pending amounts
- Optional per-recipient tracking

### 4. **Additional Tables**
- **wallet_permissions:** Control who can access/manage wallets
- **wallet_balance_history:** Snapshot changes for audit trail
- **wallet_settings:** User preferences and security settings
- **revenue_share_recipients:** Track distribution recipients

---

## 🔗 API Endpoints

### WALLET ROUTES (6 Endpoints)

#### 1. **GET /api/wallet/:userId**
Retrieve all wallets for a user.

**Parameters:**
```json
{
  "userId": "uuid",
  "session_token": "string (query)"
}
```

**Response (200):**
```json
{
  "success": true,
  "user_id": "uuid",
  "wallets": [
    {
      "id": "uuid",
      "wallet_type": "primary",
      "currency": "USD",
      "balance": 5000.00,
      "frozen_balance": 100.00,
      "total_earned": 15000.00,
      "total_spent": 10000.00,
      "total_received": 8000.00,
      "total_sent": 3000.00,
      "is_frozen": false,
      "last_transaction_at": "2024-01-15T10:30:00Z",
      "transaction_count": 42,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total_balance": 5000.00,
  "timestamp": "2024-01-15T10:35:00Z"
}
```

**Error Cases:**
- 401: Missing/invalid session_token
- 403: Unauthorized (not own wallet and not admin)
- 404: Wallet not found

---

#### 2. **GET /api/wallet/:userId/balance**
Quick balance check for specific wallet.

**Parameters:**
```json
{
  "userId": "uuid",
  "wallet_type": "primary (optional, default: primary)",
  "session_token": "string (query)"
}
```

**Response (200):**
```json
{
  "success": true,
  "wallet_id": "uuid",
  "wallet_type": "primary",
  "balance": 5000.00,
  "frozen_balance": 100.00,
  "available_balance": 4900.00,
  "currency": "USD",
  "is_frozen": false,
  "timestamp": "2024-01-15T10:35:00Z"
}
```

---

#### 3. **POST /api/wallet/transfer**
Transfer funds between users with automatic karma calculation.

**Body:**
```json
{
  "session_token": "string",
  "from_user_id": "uuid",
  "to_user_id": "uuid",
  "amount": 100.00,
  "description": "Payment for services (optional)"
}
```

**Response (201):**
```json
{
  "success": true,
  "transaction_id": "uuid",
  "from_wallet": {
    "id": "uuid",
    "balance_before": 5000.00,
    "balance_after": 4899.00
  },
  "to_wallet": {
    "id": "uuid",
    "balance_before": 2000.00,
    "balance_after": 2100.00
  },
  "amount": 100.00,
  "karma_earned": 1000,
  "timestamp": "2024-01-15T10:35:00Z"
}
```

**Fee Structure:**
- 1% fee on all transfers
- Deducted from source wallet
- Logged with transaction

**Karma Calculation:**
- Earned = amount × karma_multiplier × 10
- Example: $100 transfer × 1.5 multiplier = 1500 karma

**Error Cases:**
- 400: Invalid amount, same user transfer
- 402: Insufficient balance
- 403: Unauthorized (not own wallet)
- 404: Wallet not found

---

#### 4. **GET /api/wallet/history**
Retrieve transaction history for user.

**Parameters:**
```json
{
  "session_token": "string (query)",
  "user_id": "uuid (optional, default: self)",
  "limit": "50 (optional)",
  "offset": "0 (optional)"
}
```

**Response (200):**
```json
{
  "success": true,
  "user_id": "uuid",
  "transactions": [
    {
      "id": "uuid",
      "from_user_id": "uuid",
      "to_user_id": "uuid",
      "amount": 100.00,
      "currency": "USD",
      "type": "transfer",
      "description": "Payment for services",
      "karma_earned": 1000,
      "karma_multiplier": 1.0,
      "created_at": "2024-01-15T10:35:00Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 150
  },
  "timestamp": "2024-01-15T10:35:00Z"
}
```

---

#### 5. **POST /api/wallet/initialize**
Create new wallet for user.

**Body:**
```json
{
  "session_token": "string",
  "wallet_type": "savings (optional, default: primary)"
}
```

**Response (201):**
```json
{
  "success": true,
  "wallet_id": "uuid",
  "user_id": "uuid",
  "wallet_type": "savings",
  "balance": 0.00,
  "created_at": "2024-01-15T10:35:00Z"
}
```

**Error Cases:**
- 400: Wallet already exists
- 401: Invalid session

---

#### 6. **GET /api/wallet/settings/:userId**
Get user wallet settings and preferences.

**Parameters:**
```json
{
  "userId": "uuid",
  "session_token": "string (query)"
}
```

**Response (200):**
```json
{
  "success": true,
  "user_id": "uuid",
  "settings": {
    "preferred_currency": "USD",
    "auto_convert_currency": false,
    "show_balance_in_profile": false,
    "notify_transactions": true,
    "notify_low_balance": true,
    "low_balance_threshold": 100.00,
    "require_2fa_for_withdrawal": false,
    "daily_withdrawal_limit": null
  }
}
```

---

### TRANSACTION ROUTES (6 Endpoints)

#### 1. **POST /api/transaction/create**
Create a new transaction.

**Body:**
```json
{
  "session_token": "string",
  "from_user_id": "uuid",
  "to_user_id": "uuid",
  "amount": 100.00,
  "transaction_type": "transfer (optional, default: transfer)",
  "description": "Payment (optional)",
  "reference_id": "INV-001 (optional)",
  "payment_method": "internal_transfer (optional)"
}
```

**Response (201):**
```json
{
  "success": true,
  "transaction_id": "uuid",
  "status": "completed",
  "amount": 100.00,
  "fee": 1.00,
  "karma_earned": 1000,
  "reference_id": "INV-001",
  "created_at": "2024-01-15T10:35:00Z"
}
```

**Transaction Types:**
- transfer: P2P transfer
- deposit: Fund wallet
- withdrawal: Withdraw funds
- refund: Refund transaction
- dividend: Dividend payment
- payment: Service payment

---

#### 2. **GET /api/transaction/:transactionId**
Get detailed transaction information.

**Parameters:**
```json
{
  "transactionId": "uuid",
  "session_token": "string (query)"
}
```

**Response (200):**
```json
{
  "success": true,
  "transaction": {
    "id": "uuid",
    "from_user_id": "uuid",
    "to_user_id": "uuid",
    "amount": 100.00,
    "type": "transfer",
    "status": "completed",
    "description": "Payment",
    "fee_amount": 1.00,
    "karma_earned": 1000,
    "payment_method": "internal_transfer",
    "from_wallet": {
      "id": "uuid",
      "type": "primary",
      "balance": 4900.00
    },
    "to_wallet": {
      "id": "uuid",
      "type": "primary",
      "balance": 2100.00
    },
    "created_at": "2024-01-15T10:35:00Z"
  },
  "timestamp": "2024-01-15T10:35:00Z"
}
```

**Error Cases:**
- 403: Cannot view other users' transactions (unless admin)
- 404: Transaction not found

---

#### 3. **GET /api/transactions/list**
List transactions with filtering.

**Parameters:**
```json
{
  "session_token": "string (query)",
  "user_id": "uuid (optional, default: self)",
  "status": "completed (optional)",
  "type": "transfer (optional)",
  "limit": "50 (optional)",
  "offset": "0 (optional)"
}
```

**Response (200):**
```json
{
  "success": true,
  "user_id": "uuid",
  "transactions": [...],
  "stats": {
    "total_transactions": 150,
    "total_amount_sent": 5000.00,
    "total_amount_received": 8000.00,
    "total_karma_earned": 150000
  },
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 150
  },
  "timestamp": "2024-01-15T10:35:00Z"
}
```

---

#### 4. **GET /api/transactions/pending**
List pending (unapproved) transactions.

**Parameters:**
```json
{
  "session_token": "string (query)",
  "user_id": "uuid (optional)"
}
```

**Response (200):**
```json
{
  "success": true,
  "user_id": "uuid",
  "pending_count": 3,
  "pending_amount": 500.00,
  "transactions": [
    {
      "id": "uuid",
      "from_user_id": "uuid",
      "to_user_id": "uuid",
      "amount": 100.00,
      "type": "transfer",
      "status": "pending",
      "created_at": "2024-01-15T10:35:00Z"
    }
  ],
  "timestamp": "2024-01-15T10:35:00Z"
}
```

---

#### 5. **POST /api/transaction/approve**
Approve a pending transaction.

**Body:**
```json
{
  "session_token": "string",
  "transaction_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "transaction_id": "uuid",
  "status": "completed",
  "timestamp": "2024-01-15T10:35:00Z"
}
```

---

#### 6. **GET /api/transactions/stats/:userId**
Get transaction statistics.

**Parameters:**
```json
{
  "userId": "uuid",
  "session_token": "string (query)"
}
```

**Response (200):**
```json
{
  "success": true,
  "stats": {
    "user_id": "uuid",
    "total_transactions": 150,
    "sent": {
      "count": 75,
      "amount": 5000.00,
      "karma": 75000
    },
    "received": {
      "count": 75,
      "amount": 8000.00
    },
    "fees_paid": 50.00,
    "total_karma_earned": 150000
  },
  "timestamp": "2024-01-15T10:35:00Z"
}
```

---

## 🔐 Security & Validation

### Session Validation
All endpoints (except health check) require `session_token` parameter.

```javascript
const sessionValidation = await kernel.validateSession(session_token);
if (!sessionValidation.valid) {
  return res.status(401).json({ error: 'Invalid or expired session' });
}
```

### Authorization Checks
```javascript
// Users can only access their own wallets/transactions
if (sessionValidation.user_id !== targetUserId && sessionValidation.authority_level < 90) {
  return res.status(403).json({ error: 'Unauthorized' });
}
```

### Amount Validation
```javascript
if (parseFloat(amount) <= 0) {
  return res.status(400).json({ error: 'Amount must be greater than 0' });
}
```

### Balance Verification
```javascript
if (parseFloat(fromWallet.balance) < parseFloat(amount)) {
  return res.status(402).json({
    error: 'Insufficient balance',
    available: parseFloat(fromWallet.balance),
    required: parseFloat(amount)
  });
}
```

---

## 💰 Karma Integration

### Karma Multiplier Calculation
```javascript
// From node_core.karma_multiplier (default: 1.0)
const karmaMultiplier = nodeCore?.karma_multiplier || 1.0;

// Applied to every transaction
const karmaEarned = Math.floor(amount * karmaMultiplier * 10);
```

### Example Scenarios
| Transaction | Amount | Multiplier | Karma Earned |
|---|---|---|---|
| Transfer | $100 | 1.0 | 1000 |
| Transfer | $100 | 1.5 | 1500 |
| Transfer | $100 | 2.0 | 2000 |
| Refund | $100 | 1.0 | 0* |

*Refunds may have reduced or zero karma based on business logic

### Karma Logging
Every transaction logs to `node_logs` table:

```javascript
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
```

---

## 📈 Key Features

### 1. **Multi-Wallet Support**
- Each user can have multiple wallet types
- Primary (default), Savings, Business, etc.
- Separate balance tracking per wallet

### 2. **Automatic Fee Calculation**
- 1% fee on all transfers
- Deducted from source wallet
- Logged with transaction for audit

### 3. **Karma Integration**
- Multiplier read from node_core
- Applied to every transaction
- Logged for dharma tracking

### 4. **Transaction History**
- Immutable record of all movements
- Supports filtering (status, type, date)
- Pagination for large result sets

### 5. **Revenue Sharing**
- Support for equal share, weighted, performance-based distribution
- Multiple recipients per pool
- Scheduled distribution (daily, weekly, monthly)

### 6. **Security Features**
- Session validation on all endpoints
- Authorization checks per user
- Balance freezing capability
- Transaction reversal support
- 2FA requirement option

---

## 🚀 Integration with Control Plane

### Classifier → Wallet Flow
```
User Query (e.g., "Send $100 to Alice")
  ↓
/api/interaction/classify
  ↓
Intent: "ui_creation" or "data_write"
  ↓
/api/wallet/transfer
  ↓
Transaction created, karma logged
  ↓
Response with transaction_id + karma_earned
```

### UI Renderer Integration
```
/api/ui/render (target_component: "wallet_dashboard")
  ↓
Generates UI schema for wallet display
  ↓
Includes balance, transaction history, transfer form
  ↓
React renders wallet interface
```

---

## 🧪 Testing

See `WEEK_2_WALLET_TESTING.md` for comprehensive test suite including:
- Wallet creation and initialization
- Transfer with balance checks
- Fee calculation verification
- Karma multiplier application
- Transaction history filtering
- Error handling (insufficient balance, invalid session, etc.)
- Revenue sharing scenarios

---

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Database schema created (db-schema-economy.sql)
- [ ] Routes installed in server.js
- [ ] Session validation working
- [ ] Karma multiplier fetched from node_core
- [ ] Error handling complete

### Post-Deployment
- [ ] Health check responding
- [ ] Wallet endpoints accessible
- [ ] Transaction endpoints accessible
- [ ] Sample transfers working
- [ ] Karma earning verified
- [ ] Transaction history displaying
- [ ] Seed data created (if needed)

### Monitoring
- [ ] Log transaction errors
- [ ] Monitor balance consistency
- [ ] Track karma earning patterns
- [ ] Alert on suspicious activity
- [ ] Monitor database growth

---

## 🔄 Future Enhancements

### Phase 2
- Payment gateway integration (Stripe, PayPal)
- Cryptocurrency wallet support
- Advanced revenue sharing logic
- Wallet-to-wallet transfers (different users' wallets)

### Phase 3
- Recurring payments
- Scheduled transfers
- Budget management
- Spending analytics
- Multi-currency support

### Phase 4
- Mobile app integration
- QR code payments
- Blockchain integration
- Smart contract support

---

## 📞 Support

For issues or questions:
1. Check [WEEK_2_WALLET_TESTING.md](WEEK_2_WALLET_TESTING.md) for test examples
2. Review error messages in API responses
3. Check database logs for constraint violations
4. Verify session_token validity
5. Confirm user authorization level

---

**Created:** 2024  
**Last Updated:** Week 2, Phase 1  
**Status:** Production Ready ✅

# 💰 REVENUE SHARING ENGINE - Complete Implementation Guide

**Version:** 1.0  
**Date:** January 2025  
**Status:** ✅ Production Ready

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Contribution Graph](#contribution-graph)
5. [Revenue Engine](#revenue-engine)
6. [API Endpoints](#api-endpoints)
7. [Automated Payouts](#automated-payouts)
8. [Integration Guide](#integration-guide)
9. [Testing](#testing)
10. [Deployment](#deployment)

---

## Overview

The **Revenue Sharing Engine** distributes transaction fees to all participating nodes based on their contribution to the transaction. This creates a fair, transparent economy where every participant gets rewarded proportionally.

### Key Features

- **Multi-Factor Weighting**: Considers time, role, device usage, and activity
- **Automatic Distribution**: Cron job processes pending payouts every 5 minutes
- **Karma Integration**: Earnings boost karma scores (2x multiplier)
- **Transparent Audit**: All distributions logged with full details
- **Leaderboard**: Track top earners and contribution patterns

### Economics Model

```
Transaction Fee (1% of amount)
  ↓
Contribution Graph Builder
  ├─ Identifies all participating nodes
  ├─ Calculates weighted contributions
  └─ Normalizes weights to sum to 1.0
  ↓
Revenue Engine
  ├─ Distributes fee pool proportionally
  ├─ Updates wallet balances
  ├─ Boosts karma scores (earnings × 2)
  └─ Logs distribution execution
```

---

## Architecture

### Component Structure

```
services/
  ├─ contribution-graph.js    # Builds participation maps
  └─ revenue-engine.js         # Distributes revenue

routes/
  └─ routes-revenue.js         # API endpoints

jobs/
  └─ revenue-payout-cron.js    # Automated processing

database/
  ├─ db-schema-economy.sql              # Wallets & transactions (Week 2 Part 1)
  └─ db-schema-contribution-graph.sql   # Revenue sharing (Week 2 Part 2)
```

### Data Flow

```
1. Transaction Created
   ├─ Amount: $100.00
   └─ Fee: $1.00 (1%)

2. Contribution Graph Built
   ├─ Owner: 30% base weight
   ├─ Serving Node: 30% base weight
   ├─ Relay Node: 15% base weight
   ├─ Device: 15% base weight
   └─ Cache: 10% base weight
   Total weights normalized to 1.0

3. Revenue Distributed
   ├─ Owner: $0.30 (+0.60 karma)
   ├─ Serving: $0.30 (+0.60 karma)
   ├─ Relay: $0.15 (+0.30 karma)
   ├─ Device: $0.15 (+0.30 karma)
   └─ Cache: $0.10 (+0.20 karma)
   Total: $1.00

4. Karma Updated
   └─ Each node's karma += (payout × 2)
```

---

## Database Schema

### Tables Created

#### 1. `contribution_graph`

Tracks node participation in each transaction.

```sql
CREATE TABLE contribution_graph (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id),
  node_id UUID REFERENCES core_node(id),
  user_id UUID REFERENCES users(id),
  contribution_type VARCHAR(50) NOT NULL,  -- owner, serving, relay, device, cache, etc.
  base_weight DECIMAL(5,4) NOT NULL,       -- Initial weight from template
  time_spent INTEGER DEFAULT 0,             -- Seconds spent
  device_touch_count INTEGER DEFAULT 0,     -- Number of device interactions
  refresh_activity INTEGER DEFAULT 0,       -- UI refresh count
  normalized_weight DECIMAL(10,8) NOT NULL, -- Final weight (sum = 1.0)
  payout_amount DECIMAL(10,2) DEFAULT 0.00,
  payout_status VARCHAR(20) DEFAULT 'pending',  -- pending, completed, failed
  weight_formula TEXT,                      -- Audit trail of calculation
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. `revenue_distribution_log`

Audit trail for all distribution executions.

```sql
CREATE TABLE revenue_distribution_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id),
  total_pool DECIMAL(10,2) NOT NULL,
  distributed_amount DECIMAL(10,2) NOT NULL,
  participant_count INTEGER NOT NULL,
  successful_payouts INTEGER DEFAULT 0,
  failed_payouts INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'completed',  -- completed, failed, partial
  processing_duration INTEGER,              -- Milliseconds
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. `node_earnings_summary`

Aggregated earnings per node (updated via trigger).

```sql
CREATE TABLE node_earnings_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID UNIQUE REFERENCES core_node(id),
  total_earned DECIMAL(15,2) DEFAULT 0.00,
  total_transactions INTEGER DEFAULT 0,
  avg_payout_per_transaction DECIMAL(10,2) DEFAULT 0.00,
  earnings_as_owner DECIMAL(15,2) DEFAULT 0.00,
  earnings_as_serving DECIMAL(15,2) DEFAULT 0.00,
  earnings_as_relay DECIMAL(15,2) DEFAULT 0.00,
  rank_by_earnings INTEGER,
  rank_by_transactions INTEGER,
  first_earning_date TIMESTAMP,
  last_earning_date TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 4. `contribution_weights_template`

Configurable weight templates for different scenarios.

```sql
CREATE TABLE contribution_weights_template (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name VARCHAR(100) UNIQUE NOT NULL,
  owner_weight DECIMAL(5,4) DEFAULT 0.30,
  serving_weight DECIMAL(5,4) DEFAULT 0.30,
  relay_weight DECIMAL(5,4) DEFAULT 0.15,
  device_weight DECIMAL(5,4) DEFAULT 0.15,
  cache_weight DECIMAL(5,4) DEFAULT 0.10,
  time_factor DECIMAL(5,4) DEFAULT 0.30,
  role_factor DECIMAL(5,4) DEFAULT 0.30,
  device_factor DECIMAL(5,4) DEFAULT 0.20,
  activity_factor DECIMAL(5,4) DEFAULT 0.20,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Views

#### 1. `top_earners`

```sql
CREATE VIEW top_earners AS
SELECT 
  node_id,
  total_earned,
  total_transactions,
  rank_by_earnings,
  last_earning_date
FROM node_earnings_summary
WHERE total_earned > 0
ORDER BY total_earned DESC
LIMIT 100;
```

#### 2. `recent_distributions`

```sql
CREATE VIEW recent_distributions AS
SELECT 
  id,
  transaction_id,
  total_pool,
  distributed_amount,
  participant_count,
  status,
  created_at
FROM revenue_distribution_log
ORDER BY created_at DESC
LIMIT 50;
```

#### 3. `contribution_type_summary`

```sql
CREATE VIEW contribution_type_summary AS
SELECT 
  contribution_type,
  COUNT(*) as total_contributions,
  SUM(payout_amount) as total_payouts,
  AVG(payout_amount) as avg_payout,
  AVG(normalized_weight) as avg_weight
FROM contribution_graph
WHERE payout_status = 'completed'
GROUP BY contribution_type
ORDER BY total_payouts DESC;
```

---

## Contribution Graph

### Building Graphs

The contribution graph identifies all participating nodes and calculates their weighted contribution.

#### Participant Types

| Type | Base Weight | Description |
|------|------------|-------------|
| `owner` | 0.30 (30%) | Transaction initiator |
| `serving` | 0.30 (30%) | Node processing the transaction |
| `relay` | 0.15 (15%) | Routing/relay node |
| `device` | 0.15 (15%) | Device owner |
| `cache` | 0.10 (10%) | Cache provider |
| `ui_renderer` | 0.05 (5%) | UI generation node |
| `data_source` | 0.05 (5%) | External data provider |

#### Weight Calculation Formula

```javascript
normalized_weight = (
  (time_score × 0.30) +    // Time factor
  (role_score × 0.30) +    // Role importance
  (device_score × 0.20) +  // Device usage
  (activity_score × 0.20)  // Activity level
)

// Then normalize all weights to sum to 1.0
final_weight = normalized_weight / total_weight
```

#### Scoring Factors

**Time Score:**
```javascript
time_score = Math.min(time_spent / 60, 1.0)  // Max 60 seconds = 1.0
```

**Role Score:**
```javascript
role_score = base_weight  // From template (e.g., owner = 0.30)
```

**Device Score:**
```javascript
device_score = Math.min(device_touches / 10, 1.0)  // Max 10 touches = 1.0
```

**Activity Score:**
```javascript
activity_score = Math.min(refresh_count / 5, 1.0)  // Max 5 refreshes = 1.0
```

### API Usage

#### Build Graph

```javascript
const { buildContributionGraph } = require('./services/contribution-graph');

const result = await buildContributionGraph(transactionId, {
  owner_time_spent: 45,              // 45 seconds
  owner_device_touches: 3,           // 3 interactions
  owner_refresh_count: 1,            // 1 refresh
  
  serving_node_id: 'serving-uuid',
  serving_time_spent: 20,
  
  relay_node_id: 'relay-uuid',
  relay_time_spent: 8,
  
  device_id: 'device-fingerprint',
  device_type: 'mobile',
  
  cache_node_id: 'cache-uuid'
});

console.log(result);
/*
{
  success: true,
  transaction_id: '...',
  entries: 5,
  total_weight: 1.0,
  normalization_factor: 1.0567,
  participants: [
    {
      node_id: '...',
      contribution_type: 'owner',
      normalized_weight: 0.32,
      payout_amount: 0.00,
      weight_formula: '(time:45s * 0.3) + (role:0.30 * 0.3) + ...'
    },
    // ... more participants
  ]
}
*/
```

#### Fetch Graph

```javascript
const { getContributionGraph } = require('./services/contribution-graph');

const graph = await getContributionGraph(transactionId);

console.log(graph.participants);  // Array of all contributions
```

---

## Revenue Engine

### Core Functions

#### 1. `distributeRevenue(transactionId)`

Main distribution function. Executes the complete payout workflow.

**Process:**
1. Fetch transaction and validate fee pool
2. Fetch contribution graph
3. Calculate payout amounts
4. Update wallet balances
5. Update contribution graph (mark completed)
6. Boost karma scores
7. Log distribution execution
8. Return distribution report

**Returns:**
```javascript
{
  success: true,
  distribution_id: 'uuid',
  transaction_id: 'uuid',
  total_pool: 100.00,
  distributed_amount: 100.00,
  participant_count: 5,
  successful_payouts: 5,
  failed_payouts: 0,
  status: 'completed',
  processing_time: 1234,
  payouts: [
    {
      node_id: '...',
      user_id: '...',
      contribution_type: 'owner',
      normalized_weight: 0.32,
      payout_amount: 32.00
    },
    // ... more payouts
  ]
}
```

#### 2. `getDistributionReport(transactionId)`

Retrieves detailed distribution report.

#### 3. `getNodeEarnings(nodeId, timeframe)`

Gets earnings summary for a specific node.

**Timeframes:** `7d`, `30d`, `90d`

#### 4. `getTopEarners(limit)`

Returns leaderboard of highest earning nodes.

#### 5. `processPendingDistributions()`

Batch processes all pending distributions.

### Usage Example

```javascript
const { distributeRevenue } = require('./services/revenue-engine');

const result = await distributeRevenue(transactionId);

if (result.success) {
  console.log(`✅ Distributed $${result.distributed_amount} to ${result.participant_count} nodes`);
  
  result.payouts.forEach(payout => {
    console.log(`${payout.contribution_type}: $${payout.payout_amount}`);
  });
} else {
  console.error(`❌ Distribution failed: ${result.error}`);
}
```

---

## API Endpoints

### 1. Process Revenue Distribution

**Admin Only**

```http
POST /api/revenue/process/:transaction_id
Headers:
  x-session-id: <session-id>

Response:
{
  "success": true,
  "distribution_id": "uuid",
  "transaction_id": "uuid",
  "total_pool": 100.00,
  "distributed_amount": 100.00,
  "participant_count": 5,
  "status": "completed",
  "payouts": [...]
}
```

### 2. Process All Pending

**Admin Only**

```http
POST /api/revenue/process-all
Headers:
  x-session-id: <session-id>

Response:
{
  "success": true,
  "processed": 12,
  "successful": 10,
  "failed": 2,
  "results": [...]
}
```

### 3. Get Distribution Report

```http
GET /api/revenue/report/:transaction_id
Headers:
  x-session-id: <session-id>

Response:
{
  "success": true,
  "distribution": {
    "id": "uuid",
    "total_pool": 100.00,
    "distributed_amount": 100.00,
    "status": "completed",
    "created_at": "2025-01-01T00:00:00Z"
  },
  "contributions": [
    {
      "node_id": "uuid",
      "contribution_type": "owner",
      "normalized_weight": 0.32,
      "payout_amount": 32.00
    }
  ]
}
```

### 4. Get Node Earnings

```http
GET /api/revenue/node/:node_id?timeframe=30d
Headers:
  x-session-id: <session-id>

Response:
{
  "success": true,
  "node_id": "uuid",
  "timeframe": "30d",
  "summary": {
    "total_earned": 1234.56,
    "total_transactions": 45,
    "earnings_as_owner": 567.00,
    "earnings_as_serving": 400.00,
    "rank_by_earnings": 12
  },
  "recent_contributions": [...]
}
```

### 5. Top Earners Leaderboard

```http
GET /api/revenue/top-earners?limit=10
Headers:
  x-session-id: <session-id>

Response:
{
  "success": true,
  "earners": [
    {
      "node_id": "uuid",
      "total_earned": 5678.90,
      "total_transactions": 123,
      "rank_by_earnings": 1
    }
  ]
}
```

### 6. Recent Distributions

```http
GET /api/revenue/recent?limit=20
Headers:
  x-session-id: <session-id>

Response:
{
  "success": true,
  "distributions": [
    {
      "id": "uuid",
      "transaction_id": "uuid",
      "total_pool": 100.00,
      "participant_count": 5,
      "status": "completed",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

### 7. Overall Statistics

```http
GET /api/revenue/stats
Headers:
  x-session-id: <session-id>

Response:
{
  "success": true,
  "stats": {
    "total_distributed": 12345.67,
    "distribution_count": 89,
    "active_earners": 34,
    "pending_distributions": 5
  }
}
```

### 8. Build Contribution Graph

```http
POST /api/revenue/contribution-graph/:transaction_id
Headers:
  x-session-id: <session-id>
Body:
{
  "owner_time_spent": 45,
  "serving_node_id": "uuid",
  "relay_node_id": "uuid"
}

Response:
{
  "success": true,
  "transaction_id": "uuid",
  "entries": 5,
  "participants": [...]
}
```

### 9. Get Contribution Graph

```http
GET /api/revenue/contribution-graph/:transaction_id
Headers:
  x-session-id: <session-id>

Response:
{
  "success": true,
  "transaction_id": "uuid",
  "entries": 5,
  "total_weight": 1.0,
  "participants": [...]
}
```

---

## Automated Payouts

### Cron Job Configuration

**File:** `jobs/revenue-payout-cron.js`

**Schedule:** Every 5 minutes (configurable)

**Environment Variables:**
```env
REVENUE_CRON_SCHEDULE="*/5 * * * *"  # Cron expression
REVENUE_CRON_ENABLED=true             # true/false
```

### How It Works

```javascript
// Auto-starts on server initialization
// Runs every 5 minutes
// Finds pending transactions
// Distributes revenue automatically
// Logs execution results
```

### Manual Control

```javascript
const { startCron, stopCron, getCronStats } = require('./jobs/revenue-payout-cron');

// Start cron job
startCron();

// Stop cron job
stopCron();

// Get statistics
const stats = getCronStats();
console.log(stats);
/*
{
  enabled: true,
  schedule: "*/5 * * * *",
  is_running: false,
  stats: {
    total_runs: 45,
    successful_runs: 43,
    failed_runs: 2,
    total_distributions: 123,
    last_run: "2025-01-01T00:00:00Z",
    last_success: "2025-01-01T00:00:00Z"
  }
}
*/
```

---

## Integration Guide

### Step 1: Database Migration

Run both schema files in order:

```bash
# 1. Economy foundation (Week 2 Part 1)
psql -U postgres -d your_database -f db-schema-economy.sql

# 2. Revenue sharing (Week 2 Part 2)
psql -U postgres -d your_database -f db-schema-contribution-graph.sql
```

### Step 2: Install Dependencies

```bash
cd botmantra-backend
npm install node-cron
```

### Step 3: Environment Setup

Add to `.env`:

```env
# Revenue System Configuration
REVENUE_CRON_SCHEDULE="*/5 * * * *"
REVENUE_CRON_ENABLED=true
```

### Step 4: Restart Server

```bash
npm start
```

### Step 5: Verify Installation

```bash
# Check health
curl http://localhost:5000/health

# Check revenue stats
curl -H "x-session-id: YOUR_SESSION" \
  http://localhost:5000/api/revenue/stats
```

---

## Testing

### Test Suite

**File:** `test-contribution-graph.js`

```bash
node test-contribution-graph.js
```

### Manual Testing

#### 1. Create Transaction

```bash
curl -X POST http://localhost:5000/api/transaction/create \
  -H "x-session-id: SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "from_user_id": "user-1",
    "to_user_id": "user-2",
    "amount": 100.00,
    "transaction_type": "payment"
  }'
```

#### 2. Build Contribution Graph

```bash
curl -X POST http://localhost:5000/api/revenue/contribution-graph/TRANSACTION_ID \
  -H "x-session-id: SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "owner_time_spent": 45,
    "serving_node_id": "node-1"
  }'
```

#### 3. Distribute Revenue

```bash
curl -X POST http://localhost:5000/api/revenue/process/TRANSACTION_ID \
  -H "x-session-id: ADMIN_SESSION"
```

#### 4. Check Report

```bash
curl http://localhost:5000/api/revenue/report/TRANSACTION_ID \
  -H "x-session-id: SESSION_ID"
```

---

## Deployment

### Checklist

- ✅ Database schemas deployed
- ✅ Dependencies installed (`node-cron`)
- ✅ Environment variables configured
- ✅ Server restarted
- ✅ Cron job started
- ✅ Test distribution executed
- ✅ Monitoring configured

### Production Settings

```env
NODE_ENV=production
REVENUE_CRON_ENABLED=true
REVENUE_CRON_SCHEDULE="*/5 * * * *"  # Every 5 minutes
```

### Monitoring

Track these metrics:
- Total revenue distributed
- Distribution success rate
- Average processing time
- Pending queue size
- Top earners
- Failed payouts

### Troubleshooting

**Problem:** Cron job not running  
**Solution:** Check `REVENUE_CRON_ENABLED` in `.env`

**Problem:** Distributions failing  
**Solution:** Check wallet balances in revenue_share_pool

**Problem:** Weights don't sum to 1.0  
**Solution:** Normalization ensures this - check contribution graph

---

## 🎉 You're Done!

The Revenue Sharing Engine is now fully operational. Every transaction fee will be automatically distributed to all participating nodes based on their contribution.

**Next Steps:**
- Monitor first distributions
- Track karma boost effects
- Analyze contribution patterns
- Optimize weight templates
- Build leaderboard UI

**Questions?** Check the test suite for working examples.

---

**Built with:**  
Node.js | Express | PostgreSQL | Supabase | Node-Cron

**Architecture:** Node OS Digital Intelligence Network  
**Governance:** Karma/Dharma System  
**Economy:** Fair Revenue Sharing

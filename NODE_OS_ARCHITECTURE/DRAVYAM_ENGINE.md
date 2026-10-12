# DRAVYAM_ENGINE

**Economy / token layer.** The 1%-network contribution economy described in the vision is already modeled by existing tables. No new ledger tables needed.

## Tables (reuse)
| Table | Role |
|---|---|
| `node_wallet` | balance, frozen_balance, total_earned/spent/received/sent, wallet_address |
| `node_transaction` | from/to node+user, amount, currency, exchange_rate, fee_amount, **karma_multiplier**, **karma_earned**, gateway_transaction_id |
| `contribution_graph` | per-transaction contribution: role, base_weight, time_spent, device_touch_count, **normalized_weight**, payout_percentage, payout_amount |
| `revenue_distribution_log` | pool, platform_fee, distributed_amount, participant_count, weight_normalization_factor, total_karma_awarded |
| `node_earnings_summary` | rollups: earnings_as_owner/serving/relay/device/cache, ranks, last_7/30/90 |
| `contribution_weights_template` | tunable weight config (time/role/device/activity factors) |
| `node_rate_card`, `node_time_billing`, `node_usage_billing` | pricing & metering |

## Dravyam value model (maps to columns)
Every node already carries ownership/royalty/value/trust signals:
- Ownership → `node_core.owner_id`, `node_wallet.owner_id`
- Royalty % / payout → `contribution_graph.payout_percentage`
- Trust % → `node_core.trust_score` (drives authority_level in contribution_graph)
- Karma boost → `node_transaction.karma_multiplier`

## Transaction flow (already supported)
```
Transfer request
  → permission check (permission-engine: data_write/admin)
  → balance + freeze check (node_wallet)
  → if cross-currency: apply exchange_rate (node_transaction.exchange_rate)
  → write node_transaction (status=pending)
  → build contribution_graph entries (owner, serving, relay, device, cache)
  → normalize weights → revenue_distribution_log
  → deduct platform/network fee (fee_amount) → distribute payout_amount
  → roll up node_earnings_summary
  → commit (status=success) | rollback on >1min pending
```

## 1% network rule
The "deduct 1%, distribute to supporting nodes by contribution weight" rule = `revenue_distribution_log.platform_fee` + `contribution_graph.normalized_weight` × distributable pool. Tune via `contribution_weights_template` — **config, not code**.

## Gaps
- Wallet **UI screen** (Send/Receive/Convert/History/QR) — frontend only (see [`FRONTEND_INTEGRATION_PLAN.md`](./FRONTEND_INTEGRATION_PLAN.md)).
- Fiat↔Dravyam conversion + gateway: `node_transaction.gateway_transaction_id`/`exchange_rate` columns exist; the gateway adapter is the missing service.

## Guardrail
Money movement is a Prohibited action class for autonomous execution — the kernel may *record/route* transactions a user initiates, but never auto-execute transfers. Keep human-in-the-loop on `data_write` to wallet tables.

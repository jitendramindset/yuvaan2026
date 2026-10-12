╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                   🔐 PRODUCTION SAFETY CHECKLIST (Phase E)                   ║
║                                                                              ║
║           Before deploying Neural OS to production, verify ALL items         ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

═════════════════════════════════════════════════════════════════════════════════
✅ ENVIRONMENT & SECRETS
═════════════════════════════════════════════════════════════════════════════════

BEFORE DEPLOYMENT:

☐ OPENAI_API_KEY is set in environment variables (not hardcoded)
☐ JWT_SECRET is set and strong (minimum 32 characters)
☐ SUPABASE_SERVICE_ROLE_KEY is set (not public)
☐ DATABASE_URL is correct and points to production DB
☐ NODE_ENV=production is set
☐ No console.log() calls printing sensitive data
☐ No API keys logged anywhere
☐ .env file is in .gitignore
☐ Secrets are stored in secure vault (AWS Secrets Manager, etc.)
☐ Database credentials rotated before launch

Command to verify:
$ grep -r "console.log.*OPENAI\|console.log.*KEY\|console.log.*SECRET" botmantra-backend/

═════════════════════════════════════════════════════════════════════════════════
🔐 SECURITY HARDENING
═════════════════════════════════════════════════════════════════════════════════

API KEYS:

☐ OPENAI_API_KEY restricted to embedding + chat models only
☐ API key has spending limit set ($50/month recommended)
☐ API key cannot access file operations
☐ Supabase service key limited to specific tables
☐ JWT signing key is unique per environment

DATABASE:

☐ RLS policies are ACTIVE on all tables
☐ No SELECT * without WHERE clause enabled
☐ Supabase JWT disabled in favor of custom JWT
☐ Database connection uses SSL/TLS
☐ Anonymous role has zero permissions
☐ Database backups are enabled
☐ Point-in-time recovery is configured

AUTHENTICATION:

☐ JWT tokens expire after 1 hour
☐ Refresh tokens expire after 7 days
☐ Token revocation on logout works
☐ Password reset requires email verification
☐ Session hijacking detection enabled
☐ Rate limiting on login endpoint (5 attempts per minute)

RATE LIMITING:

☐ Embedding endpoint: max 10/minute per user
☐ RAG endpoint: max 5/minute per user
☐ Recommendation endpoint: max 20/minute per user
☐ General API: max 100/minute per user
☐ Admin endpoints: unlimited but logged

CORS:

☐ CORS whitelist does NOT include *
☐ CORS origin matches production domain only
☐ CORS credentials are restricted

═════════════════════════════════════════════════════════════════════════════════
📊 DATA ISOLATION & PERMISSIONS
═════════════════════════════════════════════════════════════════════════════════

BRAND ISOLATION:

☐ User A cannot see user B's data across brands
☐ Vanshavali data is isolated from JeetMantra
☐ JuniorMantra has age-gating (cannot access >13 age user data)
☐ Mantravat company data is never visible to other companies
☐ Cross-brand searches return 0 results

Test script:
User from Vanshavali queries JeetMantra course → ERROR (Permission Denied)

PERMISSION CHECKS:

☐ Every node_core query enforces visibility check
☐ Vector searches filter by visibility + owner
☐ Recommendations respect node_type restrictions
☐ Admin actions log user + action + timestamp
☐ Permission override requires 2 audit log entries (request + approval)

VECTOR SEARCH SAFETY:

☐ Vector search WHERE owner_node = current_user_root OR visibility = 'public'
☐ No raw embedding data exposed in API responses
☐ Similarity scores not revealing sensitive patterns
☐ RAG context truncated to 2000 chars max
☐ No parent/child relationship data leaked through vectors

═════════════════════════════════════════════════════════════════════════════════
⚡ PERFORMANCE & RESOURCE LIMITS
═════════════════════════════════════════════════════════════════════════════════

EMBEDDING GENERATION:

☐ Max text length for embedding: 8,191 characters
☐ Batch embedding rate limit: 10 per minute per user
☐ Caching enabled to avoid duplicate embeddings
☐ Embedding timeout: 30 seconds max
☐ Failed embeddings logged + alerts sent

RAG PIPELINE:

☐ Max context size: 2,000 tokens
☐ Max context vectors: 10
☐ LLM response timeout: 60 seconds max
☐ LLM max tokens: 1,000
☐ Temperature capped at 0.7 (no creativity in critical responses)

VECTOR SEARCH:

☐ Max results returned: 100
☐ Search timeout: 5 seconds max
☐ pgvector index is built (IVFFLAT)
☐ Query embedding dimension validation (must be 1536)

MEMORY:

☐ Cache max size: 500 entries
☐ Cache TTL: 1 hour
☐ Summary cache: 2 hours
☐ Old logs auto-pruned after 7 days
☐ Memory usage monitored (alert if >1GB)

═════════════════════════════════════════════════════════════════════════════════
🧠 RAG SAFETY VALIDATION
═════════════════════════════════════════════════════════════════════════════════

Test the complete RAG chain:

TEST 1 — Empty Vector DB
  ☐ Query "what is machine learning" → Returns "No results found" (not error)
  ☐ Graceful handling of missing context
  ☐ LLM still responds with general knowledge

TEST 2 — 10 Documents
  ☐ Query returns relevant documents
  ☐ Context assembled correctly
  ☐ LLM response matches context

TEST 3 — 1,000 Documents
  ☐ Search completes in <5 seconds
  ☐ Top-K results are relevant
  ☐ No timeout errors

TEST 4 — Permission Filtering
  ☐ User can only see public documents
  ☐ Private documents excluded from results
  ☐ Brand isolation enforced

TEST 5 — Cross-Brand Query
  ☐ JeetMantra user queries "family tree"
  ☐ Returns 0 results (no Vanshavali data visible)
  ☐ No privacy leakage

TEST 6 — Malicious Input
  ☐ Query with SQL injection attempt → Sanitized
  ☐ Query with HTML tags → Stripped
  ☐ Query with 100,000 characters → Truncated to 8,191

═════════════════════════════════════════════════════════════════════════════════
📋 OBSERVABILITY & MONITORING
═════════════════════════════════════════════════════════════════════════════════

LOGGING:

☐ All API calls logged (method, path, duration, status)
☐ Vector search duration tracked
☐ RAG request duration tracked
☐ Cache hit/miss ratio reported
☐ Permission denials logged
☐ Errors logged with stack trace

METRICS:

☐ API call count tracked
☐ Vector search count tracked
☐ RAG request count tracked
☐ Embedding count tracked
☐ Cache statistics collected
☐ Error rate calculated

ALERTS:

☐ Alert when error rate > 5%
☐ Alert when vector search avg time > 5 seconds
☐ Alert when RAG avg time > 30 seconds
☐ Alert when memory usage > 1GB
☐ Alert when embedding API cost > $10/hour

DASHBOARDS:

☐ Real-time API metrics visible
☐ Vector search performance dashboard
☐ RAG performance dashboard
☐ Error rate dashboard
☐ Cache statistics visible
☐ Permission denial tracking

═════════════════════════════════════════════════════════════════════════════════
🔍 AUDIT & COMPLIANCE
═════════════════════════════════════════════════════════════════════════════════

AUDIT LOGGING:

☐ All admin actions logged (who, what, when)
☐ Permission changes recorded
☐ Vector deletion tracked
☐ Brand modifications logged
☐ Audit logs cannot be deleted (immutable)

RETENTION:

☐ Audit logs retained 90 days minimum
☐ Performance logs retained 30 days
☐ Error logs retained 60 days
☐ User activity logs retained 180 days

GDPR COMPLIANCE:

☐ Data export endpoint works
☐ Data deletion endpoint soft-deletes node
☐ Right to be forgotten: vectors deleted with node
☐ User consent logged for vector generation
☐ Privacy policy links to RAG usage

═════════════════════════════════════════════════════════════════════════════════
🚀 DEPLOYMENT CHECKLIST
═════════════════════════════════════════════════════════════════════════════════

DATABASE:

☐ Migrations applied to production DB
☐ Indexes created on node_core (node_type, parent_node, owner_node)
☐ Vector index (IVFFLAT) created on node_vector_memory
☐ RLS policies enabled and tested
☐ Backup taken before migrations

API SERVER:

☐ All environment variables set
☐ SSL certificate valid
☐ Health check endpoint responds
☐ Graceful shutdown implemented
☐ Error handling middleware in place

FRONTEND:

☐ API endpoints updated to production URL
☐ Error messages don't expose internal errors
☐ Loading states implemented
☐ Offline handling graceful

MONITORING:

☐ Error monitoring active (Sentry/DataDog)
☐ Performance monitoring active
☐ Uptime monitoring configured (Uptime Robot)
☐ Alert recipients defined
☐ On-call rotation established

═════════════════════════════════════════════════════════════════════════════════
❌ DO NOT DEPLOY IF:
═════════════════════════════════════════════════════════════════════════════════

❌ OPENAI_API_KEY is hardcoded in source
❌ Database password visible in code
❌ RLS policies are disabled
❌ CORS allows *
❌ Rate limiting not implemented
❌ Cache disabled
❌ Logging disabled
❌ Error monitoring not configured
❌ Database backups not tested
❌ JWT secret is weak (<32 chars)
❌ Admin password is default
❌ Security headers not set
❌ HTTPS not enforced
❌ Cross-brand data isolation not tested
❌ Any TODO/FIXME in auth code
❌ Embedding endpoint has no rate limit

═════════════════════════════════════════════════════════════════════════════════
✅ FINAL PRE-DEPLOYMENT COMMAND
═════════════════════════════════════════════════════════════════════════════════

Run this security audit before deploy:

```bash
# 1. Check for exposed secrets
grep -r "OPENAI_API_KEY\|JWT_SECRET\|DATABASE_URL" botmantra-backend/ --include="*.js" --exclude-dir=node_modules

# 2. Check for dangerous patterns
grep -r "eval\|Function(\|exec(" botmantra-backend/ --include="*.js" --exclude-dir=node_modules

# 3. Check for unprotected routes
grep -r "app.get\|app.post\|app.delete" botmantra-backend/routes/ | grep -v "verifyToken\|requireAdmin"

# 4. Verify environment variables
node -e "console.log(process.env.OPENAI_API_KEY ? '✓ OPENAI_API_KEY set' : '✗ OPENAI_API_KEY missing')"
node -e "console.log(process.env.JWT_SECRET ? '✓ JWT_SECRET set' : '✗ JWT_SECRET missing')"

# 5. Test database connection
npm run test:db-connection
```

═════════════════════════════════════════════════════════════════════════════════
✨ PRODUCTION READINESS SIGN-OFF
═════════════════════════════════════════════════════════════════════════════════

System is PRODUCTION READY when:

✅ All checkboxes above are checked
✅ Security audit passes
✅ Performance tests pass (all RAG queries <5 seconds)
✅ Permission isolation tests pass (cross-brand queries blocked)
✅ Disaster recovery tested (DB restore works)
✅ Team sign-off obtained
✅ 24/7 monitoring configured
✅ Incident response plan documented

═════════════════════════════════════════════════════════════════════════════════

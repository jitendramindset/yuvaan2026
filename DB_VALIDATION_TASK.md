# DATABASE VALIDATION TASK

Scan Supabase folder and SQL migrations.

Compare tables and functions with architecture requirements.

Generate: `DATABASE_COVERAGE_REPORT.md`

---

## ANALYSIS STEPS

1. Find all SQL files in `/supabase` folder
2. Extract all table definitions
3. Extract all function definitions
4. Compare against ARCHITECTURE_BASELINE.md
5. Check for:
   - Missing tables (should be 21)
   - Missing functions
   - Missing indexes
   - Missing RLS policies
   - Missing triggers
   - Vector support (pgvector)

---

## REQUIRED TABLES (21)

**Core Identity (5):**
- [ ] node_identity
- [ ] trust_state
- [ ] users_core
- [ ] user_profiles
- [ ] business_profiles

**Authentication (5):**
- [ ] sso_accounts
- [ ] enterprise_users
- [ ] organization_map
- [ ] trusted_devices
- [ ] mfa_settings

**AI & Conversations (4):**
- [ ] ai_preferences
- [ ] onboarding_conversations
- [ ] voice_onboarding_sessions
- [ ] extraction_memory

**Growth (5):**
- [ ] referral_codes
- [ ] referral_logs
- [ ] vanshawali_connections
- [ ] reward_wallet
- [ ] karma_ledger

**Access & Audit (2):**
- [ ] feature_access
- [ ] node_execution_log

---

## REPORT FORMAT

### A. Table Coverage
- Total expected: 21
- Currently defined: ?
- Missing count: ?
- Coverage %: ?

**For each table:**
```
✅/❌ table_name
   - Columns: ? defined
   - Indexes: ? defined
   - RLS policies: ✅/❌
   - Triggers: ✅/❌
   - File: path/to/migration.sql
```

### B. Function Coverage
**Required functions:**
- [ ] create_user_identity()
- [ ] assign_permission()
- [ ] calculate_karma()
- [ ] verify_referral_code()
- [ ] create_vanshawali_connection()
- [ ] search_vectors()
- [ ] update_trust_score()

**For each function:**
```
✅/❌ function_name()
   - Parameters: ?
   - Returns: ?
   - Error handling: ✅/❌
   - File: path/to/migration.sql
```

### C. RLS Policy Coverage
- Total policies needed: ?
- Currently defined: ?
- Gaps: ?

**For each policy:**
```
✅/❌ policy_on_table_for_role
   - Effect: ALLOW/DENY
   - Condition: SQL expression
   - File: reference
```

### D. Index Strategy
**Expected indexes:**
- [ ] user_id indexes (20+ tables)
- [ ] Foreign key indexes (15+ tables)
- [ ] Vector similarity index (pgvector HNSW)
- [ ] Text search indexes
- [ ] Composite indexes

**For each index:**
```
✅/❌ index_name
   - Table: ?
   - Columns: ?
   - Type: BTREE/HASH/GIST/GIN/BRIN/HNSW
   - Coverage: affects ? queries
```

### E. Vector Support (pgvector)
- ✅/❌ Extension enabled
- ✅/❌ Vector column types
- ✅/❌ Similarity operators
- ✅/❌ HNSW indexes
- ✅/❌ Performance tuning

**Tables with vectors:**
```
✅/❌ vector_documents
✅/❌ document_chunks
✅/❌ embeddings
```

### F. Data Integrity
- ✅/❌ Foreign key constraints
- ✅/❌ Unique constraints
- ✅/❌ Not null constraints
- ✅/❌ Check constraints
- ✅/❌ Default values

**For each table:**
```
✅/❌ table_name
   - Constraints: ? defined
   - Triggers: ✅/❌ (update_at, created_at, etc)
```

### G. Missing Critical Components

List:
```
❌ Missing: component_name
   - Purpose: ?
   - Impact: CRITICAL/IMPORTANT/OPTIONAL
   - Effort: ? hours
   - Blocker for: ?
```

### H. Risk Assessment

🔴/🟡/🟢 Issue description
- Impact: ?
- Effort: ?
- Blocker: Yes/No

---

## OUTPUT REQUIREMENTS

Include in report:

**Summary Table:**
```
| Component | Expected | Implemented | Coverage | Status |
|-----------|----------|-------------|----------|--------|
| Tables | 21 | ? | ?% | ✅/❌ |
| Functions | ? | ? | ?% | ✅/❌ |
| Indexes | ? | ? | ?% | ✅/❌ |
| RLS Policies | ? | ? | ?% | ✅/❌ |
| Triggers | ? | ? | ?% | ✅/❌ |
| TOTAL | - | - | ?% | ✅/❌ |
```

**Compliance Score:**
- Tables: ?/21 (??%)
- Functions: ?/? (??%)
- Security: ?/? (??%)
- Indexes: ?/? (??%)
- Overall: ??%

**Top Issues:**
1. [Issue] - [Effort] - [Priority]
2. [Issue] - [Effort] - [Priority]
3. [Issue] - [Effort] - [Priority]

---

Start analysis.

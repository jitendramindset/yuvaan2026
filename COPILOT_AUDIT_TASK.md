# COPILOT AUDIT TASK - Platform Compliance

You are acting as **BotMantra Platform System Auditor**.

Your task:

1. **Scan entire repository** in `d:\React App\Yuvaan-v1`
2. **Compare code** with `ARCHITECTURE_BASELINE.md`
3. **Identify gaps** in:
   - Missing APIs
   - Missing database tables
   - Missing onboarding flows
   - Missing permission enforcement
   - Missing RAG integration
   - Missing UI render engine
   - Missing brand separation
   - Missing test coverage
   - Missing security layers

4. **Produce report** and save as: `PLATFORM_AUDIT_REPORT.md`

---

## REPORT SECTIONS REQUIRED

Create file with these sections:

### A. Kernel API Status
- ✅/❌ `/api/kernel/post-login-bootstrap`
- ✅/❌ `/api/kernel/ai-onboarding-chat`
- ✅/❌ `/api/kernel/voice-onboarding`
- ✅/❌ `/api/kernel/enterprise-sso-login`
- ✅/❌ `/api/kernel/referral-register`
- ✅/❌ `/api/kernel/onboarding-progress`
- Missing endpoints?
- File references

### B. UI Engine Status
- ✅/❌ UnifiedOnboardingEngine.ts
- ✅/❌ UnifiedOnboardingContainer.tsx
- ✅/❌ State management
- ✅/❌ Event subscription
- ✅/❌ WebSocket integration
- Missing methods?
- File references

### C. Database Schema Coverage
- ✅/❌ node_identity
- ✅/❌ trust_state
- ✅/❌ user_profiles
- ✅/❌ sso_accounts
- ✅/❌ vanshawali_connections
- ✅/❌ referral_codes
- ✅/❌ karma_ledger
- Missing tables? (should be 21 total)
- File references

### D. Onboarding Flow Coverage
**For each brand check:**
- ✅/❌ BOTMANTRA (AI Chat + Voice)
- ✅/❌ MANTRAVAT (Enterprise SSO + Form)
- ✅/❌ JEETMANTRA (Role selection)
- ✅/❌ JUNIOR MANTRA (Parent verification)
- ✅/❌ VANSHAWALI (Social graph)
- Component files
- Flow completeness
- Missing steps?

### E. RAG Engine Status
- ✅/❌ Vector database configured
- ✅/❌ Embedding pipeline
- ✅/❌ Search functionality
- ✅/❌ Augmentation logic
- Missing components
- File references

### F. AI Model Routing Status
- ✅/❌ Intent classification
- ✅/❌ OpenAI integration
- ✅/❌ Response generation
- ✅/❌ Voice synthesis
- ✅/❌ Speech-to-text
- Missing pieces

### G. Security & Permissions
- ✅/❌ Rate limiting
- ✅/❌ Device fingerprinting
- ✅/❌ Trust scoring
- ✅/❌ Audit logging
- ✅/❌ RLS policies
- ✅/❌ GDPR compliance
- ✅/❌ Data encryption
- Gaps identified

### H. Performance & Scaling Readiness
- ✅/❌ Stateless API design
- ✅/❌ Caching strategy
- ✅/❌ Database indexes
- ✅/❌ Query optimization
- ✅/❌ Load testing
- Bottlenecks identified

### I. Missing Critical Components
List each:
- Component name
- Purpose
- Priority (CRITICAL/IMPORTANT/OPTIONAL)
- Impact
- Effort estimate

### J. Risk Level Assessment

Rate:
- 🔴 HIGH - Must fix before production
- 🟡 MEDIUM - Should fix soon
- 🟢 LOW - Can fix later

List top 5 risks

### K. Priority Roadmap (Week 1–4)

**Week 1:**
- [ ] Fix CRITICAL issues
- [ ] Complete missing endpoints
- [ ] Add missing components

**Week 2:**
- [ ] Database validation
- [ ] Test implementation
- [ ] Security hardening

**Week 3:**
- [ ] RAG integration
- [ ] Performance optimization
- [ ] Load testing

**Week 4:**
- [ ] Documentation review
- [ ] Final audit
- [ ] Production checklist

---

## RULES

- **Be brutally honest** - Don't sugarcoat gaps
- **Mark missing items clearly** - Use ✅/❌
- **Reference file names** - Every claim needs source
- **Provide fix suggestions** - How to address each gap
- **Assign priority** - CRITICAL / IMPORTANT / OPTIONAL
- **Include metrics** - Coverage %, completion %, etc.

---

## OUTPUT FORMAT

Use markdown with:
- ✅ for implemented
- ❌ for missing
- ⏳ for partial/in-progress
- 🔴/🟡/🟢 for risk levels
- Code blocks for examples
- Tables for summaries

---

## QUALITY GATES

✅ Report generated  
✅ All sections included  
✅ All gaps identified  
✅ Priority assigned  
✅ Fixes suggested  
✅ Metrics included  

---

**After generating PLATFORM_AUDIT_REPORT.md, also create a summary of:**

1. Overall compliance %
2. Top 3 blocking issues
3. Next immediate actions
4. Estimated effort to 100%

---

Start analysis now.

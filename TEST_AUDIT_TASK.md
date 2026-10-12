# TEST COVERAGE AUDIT TASK

Scan tests folder.

Report test coverage for:
- Kernel API
- RAG engine
- Permission system
- Onboarding flows
- UI rendering
- Database queries

Generate: `TEST_COVERAGE_REPORT.md`

---

## ANALYSIS STEPS

1. Find all test files (*.test.js, *.test.ts, *.test.tsx)
2. Parse test structure
3. Identify coverage gaps
4. Check mock data
5. Check error scenarios
6. Check integration tests
7. Check E2E tests

---

## REQUIRED TEST COVERAGE

### Kernel API Tests (6 endpoints)
- [ ] POST /api/kernel/post-login-bootstrap
  - Happy path: ✅/❌
  - Error handling: ✅/❌
  - Validation: ✅/❌
  - Database writes: ✅/❌
  - File: tests/kernel/bootstrap.test.js

- [ ] POST /api/kernel/ai-onboarding-chat
  - Happy path: ✅/❌
  - Intent classification: ✅/❌
  - Data extraction: ✅/❌
  - Response generation: ✅/❌
  - File: tests/kernel/chat.test.js

- [ ] POST /api/kernel/voice-onboarding
  - Audio processing: ✅/❌
  - Speech-to-text: ✅/❌
  - Response generation: ✅/❌
  - Text-to-speech: ✅/❌
  - File: tests/kernel/voice.test.js

- [ ] POST /api/kernel/enterprise-sso-login
  - Provider auth: ✅/❌
  - User creation: ✅/❌
  - SSO linking: ✅/❌
  - Role assignment: ✅/❌
  - File: tests/kernel/sso.test.js

- [ ] POST /api/kernel/referral-register
  - Code validation: ✅/❌
  - Connection creation: ✅/❌
  - Reward allocation: ✅/❌
  - Karma assignment: ✅/❌
  - File: tests/kernel/referral.test.js

- [ ] GET /api/kernel/onboarding-progress/:userId
  - Data retrieval: ✅/❌
  - Calculation accuracy: ✅/❌
  - Caching: ✅/❌
  - File: tests/kernel/progress.test.js

### UI Engine Tests
- [ ] UnifiedOnboardingEngine.ts
  - initializeOnboarding(): ✅/❌
  - runAIChatOnboarding(): ✅/❌
  - runVoiceOnboarding(): ✅/❌
  - processEnterpriseSSOLogin(): ✅/❌
  - processReferralRegistration(): ✅/❌
  - subscribe/unsubscribe: ✅/❌
  - File: tests/ui/engine.test.ts

### Component Tests
- [ ] UnifiedOnboardingContainer
  - Rendering: ✅/❌
  - Brand routing: ✅/❌
  - Progress tracking: ✅/❌
  - Error handling: ✅/❌
  - File: tests/ui/container.test.tsx

- [ ] AIGuidedOnboarding
  - Chat rendering: ✅/❌
  - Message sending: ✅/❌
  - Data display: ✅/❌
  - Accessibility: ✅/❌
  - File: tests/ui/ai-onboarding.test.tsx

- [ ] VoiceOnboarding
  - Recording: ✅/❌
  - Playback: ✅/❌
  - Status display: ✅/❌
  - File: tests/ui/voice-onboarding.test.tsx

- [ ] EnterpriseSSO
  - Provider selection: ✅/❌
  - OTP flow: ✅/❌
  - Error states: ✅/❌
  - File: tests/ui/sso.test.tsx

- [ ] Brand Components
  - BotMantraOnboarding: ✅/❌
  - MantravatOnboarding: ✅/❌
  - JeetMantraOnboarding: ✅/❌
  - JuniorMantraOnboarding: ✅/❌
  - Files: tests/ui/brands/*.test.tsx

### Database Tests
- [ ] Schema validation
  - All tables exist: ✅/❌
  - Column types correct: ✅/❌
  - Indexes created: ✅/❌
  - File: tests/database/schema.test.js

- [ ] Function tests
  - All functions callable: ✅/❌
  - Parameters correct: ✅/❌
  - Returns correct: ✅/❌
  - File: tests/database/functions.test.js

- [ ] RLS tests
  - Auth policies work: ✅/❌
  - Row filtering works: ✅/❌
  - File: tests/database/rls.test.js

### Integration Tests
- [ ] Full onboarding flow
  - Login → Bootstrap → Setup complete: ✅/❌
  - File: tests/integration/onboarding.test.js

- [ ] AI Chat → Database
  - Chat message → Storage → Retrieval: ✅/❌
  - File: tests/integration/chat-flow.test.js

- [ ] SSO → User Creation
  - OAuth → User creation → Role assignment: ✅/❌
  - File: tests/integration/sso-flow.test.js

- [ ] Referral → Rewards
  - Code validation → Connection → Rewards: ✅/❌
  - File: tests/integration/referral-flow.test.js

### E2E Tests
- [ ] User onboarding complete journey
  - Open app → Select brand → Complete flow → Dashboard: ✅/❌
  - File: tests/e2e/onboarding.e2e.js

- [ ] Voice interaction end-to-end
  - Open app → Speak → AI responds → Save profile: ✅/❌
  - File: tests/e2e/voice.e2e.js

- [ ] SSO login end-to-end
  - Click SSO → Provider auth → User created → Logged in: ✅/❌
  - File: tests/e2e/sso.e2e.js

### Security Tests
- [ ] Rate limiting
  - Endpoint protection: ✅/❌
  - File: tests/security/rate-limit.test.js

- [ ] Input validation
  - XSS prevention: ✅/❌
  - SQL injection prevention: ✅/❌
  - File: tests/security/validation.test.js

- [ ] Authentication
  - JWT validation: ✅/❌
  - Session management: ✅/❌
  - File: tests/security/auth.test.js

---

## REPORT STRUCTURE

### A. Overall Coverage

```
Test Files Found: ?
Total Test Cases: ?
Lines of Test Code: ?

Coverage by Category:
├── Unit Tests: ?/?  (??%)
├── Integration Tests: ?/?  (??%)
├── E2E Tests: ?/?  (??%)
└── Security Tests: ?/?  (??%)

Overall Coverage Target: 80%
Current Coverage: ??%
Gap: ?? test cases
```

### B. Kernel API Coverage

```
POST /api/kernel/post-login-bootstrap
├── Happy Path: ✅/❌
├── Error Scenarios: ? cases
├── Edge Cases: ? cases
├── File: path/to/test.js
└── Coverage: ?%

POST /api/kernel/ai-onboarding-chat
├── Happy Path: ✅/❌
├── Intent Classification: ? cases tested
├── Data Extraction: ? cases tested
├── File: path/to/test.js
└── Coverage: ?%

[Continue for other 4 endpoints...]

Total API Coverage: ??%
```

### C. UI Component Coverage

```
UnifiedOnboardingEngine
├── Methods tested: ?/6
├── State transitions: ✅/❌
├── Error handling: ✅/❌
├── File: tests/ui/engine.test.ts
└── Coverage: ?%

AIGuidedOnboarding
├── Rendering: ✅/❌
├── Interactions: ✅/❌
├── File: tests/ui/ai-onboarding.test.tsx
└── Coverage: ?%

[Continue for other components...]

Total UI Coverage: ??%
```

### D. Database Coverage

```
Tables Tested: ?/21
├── Schema validation: ✅/❌
├── Functions tested: ?
├── RLS policies tested: ?
├── Indexes verified: ✅/❌
└── Overall: ?%

Functions Tested: ?/?
├── create_user_identity(): ✅/❌
├── calculate_karma(): ✅/❌
├── [Continue...]
└── Overall: ?%

RLS Policies: ?/?
├── Auth checks: ✅/❌
├── Row filtering: ✅/❌
└── Overall: ?%

Total DB Coverage: ??%
```

### E. Integration Test Status

```
Onboarding Flow: ✅/⏳/❌
├── Steps tested: ?/?
├── Happy path: ✅/❌
├── Error paths: ✅/❌
└── File: tests/integration/onboarding.test.js

AI Chat Flow: ✅/⏳/❌
├── Message sending: ✅/❌
├── Storage: ✅/❌
├── Retrieval: ✅/❌
└── File: tests/integration/chat-flow.test.js

[Continue for other flows...]

Total Integration Coverage: ??%
```

### F. E2E Test Status

```
E2E Scenarios: ?/?
├── Onboarding journey: ✅/⏳/❌
├── Voice interaction: ✅/⏳/❌
├── SSO login: ✅/⏳/❌
└── File paths: ?

Platform Coverage: ??%
```

### G. Security Test Status

```
Rate Limiting: ✅/⏳/❌
├── Tests: ? cases
├── File: tests/security/rate-limit.test.js
└── Coverage: ?%

Input Validation: ✅/⏳/❌
├── XSS tests: ? cases
├── SQL injection tests: ? cases
├── File: tests/security/validation.test.js
└── Coverage: ?%

Authentication: ✅/⏳/❌
├── JWT tests: ? cases
├── Session tests: ? cases
├── File: tests/security/auth.test.js
└── Coverage: ?%

Total Security Coverage: ??%
```

### H. Test Quality Metrics

```
Test Code Quality:
├── Descriptive names: ✅/⏳/❌
├── Proper mocking: ✅/⏳/❌
├── Error assertions: ✅/⏳/❌
├── Data cleanup: ✅/⏳/❌
└── Overall: ??%

Mock Data Quality:
├── Realistic data: ✅/⏳/❌
├── Edge case coverage: ✅/⏳/❌
├── Performance data: ✅/⏳/❌
└── Overall: ??%

Test Maintenance:
├── Flaky tests: ? identified
├── Slow tests: ? identified
├── Duplicates: ? found
└── Overall health: ??%
```

### I. Missing Critical Tests

```
CRITICAL (⏹️ must have):
❌ Test: API error handling
   - Endpoint: /api/kernel/post-login-bootstrap
   - Scenarios: network error, db error, validation error
   - Effort: ? hours
   - Blocker: YES

❌ Test: Complete onboarding flow
   - Scenarios: all 4 brands, happy path
   - Effort: ? hours
   - Blocker: YES

[Continue...]

IMPORTANT (🟡 should have):
⏳ Test: Voice audio processing
   - Scenarios: different audio formats
   - Effort: ? hours

[Continue...]

OPTIONAL (🟢 nice to have):
❌ Test: Performance benchmarks
   - Scenarios: API response time
   - Effort: ? hours

[Continue...]
```

### J. Test Coverage Matrix

```
| Component | Unit | Integration | E2E | Security | Coverage |
|-----------|------|-------------|-----|----------|----------|
| Kernel API | ✅ | ⏳ | ❌ | ⏳ | 40% |
| UI Engine | ⏳ | ❌ | ❌ | ⏳ | 30% |
| AI Chat | ⏳ | ❌ | ❌ | ❌ | 20% |
| Voice | ⏳ | ❌ | ❌ | ❌ | 20% |
| SSO | ⏳ | ❌ | ❌ | ⏳ | 25% |
| Referral | ⏳ | ❌ | ❌ | ❌ | 20% |
| Database | ⏳ | ⏳ | ❌ | ⏳ | 35% |
| OVERALL | - | - | - | - | 28% |
```

### K. Risk Assessment

🔴 HIGH (Production blocker):
- [ ] No E2E tests for onboarding
- [ ] No security tests for rate limiting
- [ ] API error handling untested
- [Continue...]

🟡 MEDIUM (Should fix):
- [ ] Incomplete UI tests
- [ ] Missing integration tests
- [ ] Weak mock data
- [Continue...]

🟢 LOW (Nice to have):
- [ ] Performance tests
- [ ] Visual regression tests
- [Continue...]

---

## PRIORITY ROADMAP

**Week 1:** Unit Tests
- [ ] Kernel API unit tests (30 hours)
- [ ] UI Engine unit tests (20 hours)
- [ ] Database tests (15 hours)

**Week 2:** Integration Tests
- [ ] Onboarding flow integration (25 hours)
- [ ] SSO flow integration (20 hours)
- [ ] Chat flow integration (20 hours)

**Week 3:** E2E + Security
- [ ] E2E onboarding tests (30 hours)
- [ ] Security tests (25 hours)
- [ ] Performance tests (20 hours)

**Week 4:** Coverage to 80%+
- [ ] Fill gaps (40 hours)
- [ ] Flaky test fixes (10 hours)
- [ ] Documentation (5 hours)

---

Start analysis.

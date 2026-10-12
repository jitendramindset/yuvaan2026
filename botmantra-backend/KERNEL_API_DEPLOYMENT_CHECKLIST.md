# KERNEL API DEPLOYMENT CHECKLIST

**Version**: 1.0.0  
**Status**: Production Ready  
**Last Updated**: 2026-02-03

---

## Pre-Deployment (Development)

### Environment Setup

- [ ] Create `.env.kernel` file with:
  ```
  KERNEL_PORT=5000
  KERNEL_ENV=development
  JWT_SECRET=<from Supabase>
  SUPABASE_URL=<your_supabase_url>
  SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
  SUPABASE_ANON_KEY=<anon_key>
  RATE_LIMIT_REQUESTS_PER_SECOND=5
  RATE_LIMIT_BURST=10
  LOG_LEVEL=debug
  ENABLE_METRICS=true
  ```

- [ ] Verify all env vars are set:
  ```bash
  npm run check:env
  ```

### Dependencies Installation

- [ ] Install required packages:
  ```bash
  npm install @supabase/supabase-js jsonwebtoken express cors
  npm install --save-dev jest supertest
  ```

- [ ] Verify installation:
  ```bash
  npm list @supabase/supabase-js jsonwebtoken express
  ```

### Code Integration

- [ ] Copy `routes/kernel-execute.js` to project:
  ```bash
  cp routes/kernel-execute.js <your-project>/routes/
  ```

- [ ] Mount in `app.js`:
  ```javascript
  const kernelRouter = require('./routes/kernel-execute');
  app.use('/kernel', kernelRouter);
  ```

- [ ] Verify routes are registered:
  ```bash
  npm run list:routes
  ```

### Database Verification

- [ ] Verify all required tables exist:
  ```sql
  SELECT COUNT(*) FROM information_schema.tables 
  WHERE table_schema='public' 
  AND table_name IN ('users', 'business_users', 'permissions', 'roles', 
                      'node_execution_log', 'node_event_queue', 'node_trust_state');
  ```

- [ ] Verify all RPC functions exist:
  ```sql
  SELECT routine_name FROM information_schema.routines 
  WHERE routine_schema='public'
  AND routine_name LIKE 'check_action_permission%';
  ```

- [ ] Test RPC function:
  ```bash
  npm run test:rpc -- check_action_permission
  ```

### Permission System

- [ ] Verify permission mapping:
  ```sql
  SELECT role_name, COUNT(*) as permission_count
  FROM roles r
  LEFT JOIN role_permissions rp ON r.id = rp.role_id
  GROUP BY r.id, r.role_name;
  ```

- [ ] Expected output: 4 roles (owner, admin, editor, viewer) with permissions assigned

- [ ] Test permission check:
  ```javascript
  const can = await supabase.rpc('check_action_permission', {
    user_id: 'test_user_id',
    business_id: 'test_business_id',
    action: 'chat'
  });
  expect(can).toBe(true);
  ```

### Logging Setup

- [ ] Create logging directory:
  ```bash
  mkdir -p logs
  chmod 755 logs
  ```

- [ ] Verify log permissions:
  ```bash
  ls -la logs/
  ```

### Rate Limiting Configuration

- [ ] Set rate limit parameters in `kernel-execute.js`:
  ```javascript
  const RATE_LIMIT = {
    requests_per_second: 5,
    burst_allowance: 10,
    window_seconds: 60,
    enforcement: 'soft' // 'soft' warns, 'hard' rejects
  };
  ```

- [ ] Test rate limiting:
  ```bash
  npm run test:rate-limit
  ```

---

## Testing (Local)

### Unit Tests

- [ ] Run kernel test suite:
  ```bash
  npm test -- kernel-execute.test.js
  ```

- [ ] Expected output: ✅ 40+ tests passing

- [ ] Verify all 8 test groups pass:
  - [ ] JWT Validation (4 tests)
  - [ ] User Resolution (2 tests)
  - [ ] Permission Gate (2 tests)
  - [ ] Trust Gate (2 tests)
  - [ ] Action Routing (5 tests)
  - [ ] Event Logging (2 tests)
  - [ ] Health Check (1 test)
  - [ ] Error Handling (2 tests)

### Integration Tests

- [ ] Start development server:
  ```bash
  npm run dev
  ```

- [ ] Test health endpoint:
  ```bash
  curl -X GET http://localhost:5000/kernel/health
  ```

- [ ] Expected: `{"status": "healthy", "timestamp": "ISO"}`

- [ ] Test with valid JWT:
  ```bash
  curl -X POST http://localhost:5000/kernel/execute \
    -H "Authorization: Bearer <VALID_JWT>" \
    -H "Content-Type: application/json" \
    -d '{"action": "chat", "payload": {"message": "Hello"}}'
  ```

- [ ] Expected: `{"status": "success", "response": {...}}`

- [ ] Test error scenarios:
  - [ ] Missing JWT → 401 MISSING_AUTH_HEADER
  - [ ] Invalid JWT → 401 INVALID_JWT
  - [ ] Permission denied → 403 PERMISSION_DENIED
  - [ ] Invalid action → 400 INVALID_ACTION

### Performance Testing

- [ ] Run performance test:
  ```bash
  npm run test:performance -- --duration=60
  ```

- [ ] Verify metrics:
  - [ ] p50 latency < 200ms
  - [ ] p99 latency < 1000ms
  - [ ] Error rate < 1%
  - [ ] Throughput > 100 requests/sec

---

## Staging Deployment

### Environment Preparation

- [ ] Create `.env.staging` with production-like values:
  ```
  KERNEL_ENV=staging
  LOG_LEVEL=info
  RATE_LIMIT_REQUESTS_PER_SECOND=10
  ENABLE_METRICS=true
  SUPABASE_URL=<staging_url>
  JWT_SECRET=<staging_secret>
  ```

- [ ] Create staging database backup:
  ```bash
  pg_dump -h <host> -U <user> -d <db> > staging_backup_$(date +%s).sql
  ```

### Code Deployment

- [ ] Build application:
  ```bash
  npm run build
  ```

- [ ] Copy to staging server:
  ```bash
  scp -r dist/ staging:/opt/kernel-api/
  ```

- [ ] Verify file permissions:
  ```bash
  ssh staging 'ls -la /opt/kernel-api/'
  ```

### Service Startup

- [ ] Start kernel service:
  ```bash
  ssh staging 'systemctl start kernel-api'
  ```

- [ ] Verify service is running:
  ```bash
  ssh staging 'systemctl status kernel-api'
  ```

- [ ] Check logs:
  ```bash
  ssh staging 'tail -f /var/log/kernel-api.log'
  ```

### Smoke Testing

- [ ] Test staging kernel endpoint:
  ```bash
  curl -X GET https://staging.botmantra.com/kernel/health
  ```

- [ ] Test with staging JWT:
  ```bash
  # Login to staging
  # Get JWT token
  # Make test request
  ```

- [ ] Test all action types:
  - [ ] chat action → success
  - [ ] ui action → success
  - [ ] data action → success
  - [ ] automation action → success
  - [ ] plugin action → success

### Database Validation

- [ ] Verify RLS policies are active:
  ```sql
  SELECT * FROM information_schema.table_constraints 
  WHERE constraint_type = 'POLICY';
  ```

- [ ] Test RLS enforcement:
  ```bash
  npm run test:rls -- staging
  ```

- [ ] Verify seed data is present:
  ```sql
  SELECT COUNT(*) FROM users;
  SELECT COUNT(*) FROM roles;
  SELECT COUNT(*) FROM permissions;
  ```

### Monitoring Setup

- [ ] Configure log aggregation (e.g., ELK, Datadog):
  ```javascript
  // In kernel-execute.js
  const logger = new ELKLogger({
    host: 'staging-elk.internal',
    service: 'kernel-api'
  });
  ```

- [ ] Set up performance monitoring:
  ```bash
  npm run setup:monitoring -- staging
  ```

- [ ] Create dashboard:
  - [ ] Response time graph
  - [ ] Error rate graph
  - [ ] Request volume graph
  - [ ] Trust score distribution

- [ ] Set up alerts:
  - [ ] Error rate > 5% → Page oncall
  - [ ] P99 latency > 2000ms → Warning
  - [ ] Service down → Critical alert

### Load Testing

- [ ] Run load test:
  ```bash
  npm run load:test -- staging --duration=300 --rps=1000
  ```

- [ ] Verify stability:
  - [ ] No errors under load
  - [ ] Latency remains acceptable
  - [ ] Database connection pool not exhausted
  - [ ] Memory usage stable

- [ ] Document results:
  ```
  Load Test Results (Staging)
  - Duration: 300 seconds
  - RPS: 1000
  - Total Requests: 300,000
  - Success Rate: 99.9%
  - P50: 150ms
  - P99: 800ms
  ```

---

## Production Deployment

### Pre-Production Checklist

- [ ] Security review completed:
  - [ ] No hardcoded secrets
  - [ ] JWT validation active
  - [ ] CORS properly configured
  - [ ] Rate limiting enabled
  - [ ] SQL injection protection verified

- [ ] Performance validated:
  - [ ] Staging tests passed
  - [ ] Load test successful
  - [ ] Latency acceptable
  - [ ] Memory stable

- [ ] Documentation complete:
  - [ ] Integration guide (KERNEL_API_INTEGRATION_GUIDE.md)
  - [ ] Deployment checklist (this file)
  - [ ] API documentation
  - [ ] Troubleshooting guide

- [ ] Rollback plan documented:
  - [ ] Previous version tag identified
  - [ ] Rollback procedure tested
  - [ ] Data recovery procedure documented

### Production Environment

- [ ] Create `.env.production`:
  ```
  KERNEL_ENV=production
  KERNEL_PORT=5000
  LOG_LEVEL=warn
  RATE_LIMIT_REQUESTS_PER_SECOND=20
  ENABLE_METRICS=true
  SUPABASE_URL=<prod_url>
  JWT_SECRET=<prod_secret>
  DATABASE_POOL_SIZE=20
  ```

- [ ] Secure environment variables:
  ```bash
  chmod 600 .env.production
  chown kernel:kernel .env.production
  ```

- [ ] Verify database connection:
  ```bash
  npm run test:db:connection -- production
  ```

### Code Deployment

- [ ] Create production release:
  ```bash
  git tag -a v1.0.0-kernel -m "Kernel API v1.0.0"
  git push origin v1.0.0-kernel
  ```

- [ ] Build production image:
  ```bash
  npm run build:prod
  docker build -t kernel-api:1.0.0 .
  docker tag kernel-api:1.0.0 registry.botmantra.com/kernel-api:1.0.0
  docker push registry.botmantra.com/kernel-api:1.0.0
  ```

- [ ] Deploy container:
  ```bash
  kubectl apply -f k8s/kernel-api-deployment.yaml
  kubectl set image deployment/kernel-api \
    kernel-api=registry.botmantra.com/kernel-api:1.0.0 \
    --namespace=production
  ```

- [ ] Verify rollout:
  ```bash
  kubectl rollout status deployment/kernel-api -n production
  ```

### Service Startup

- [ ] Start kernel API:
  ```bash
  systemctl start kernel-api
  systemctl enable kernel-api
  ```

- [ ] Verify service:
  ```bash
  systemctl status kernel-api
  curl -X GET https://api.botmantra.com/kernel/health
  ```

### Health Checks

- [ ] Kernel health endpoint:
  ```bash
  curl -X GET https://api.botmantra.com/kernel/health
  ```

- [ ] Response should be:
  ```json
  {
    "status": "healthy",
    "version": "1.0.0",
    "database": "connected",
    "uptime": 1234
  }
  ```

- [ ] Database connectivity:
  ```bash
  curl -X POST https://api.botmantra.com/kernel/execute \
    -H "Authorization: Bearer <admin_jwt>" \
    -H "Content-Type: application/json" \
    -d '{"action": "ui", "payload": {"screen": "health"}}'
  ```

### Monitoring & Alerting

- [ ] Verify monitoring active:
  ```bash
  curl -X GET https://metrics.botmantra.com/kernel-api
  ```

- [ ] Check alerts configured:
  - [ ] Error rate alert (> 1%)
  - [ ] Latency alert (P99 > 3000ms)
  - [ ] Service down alert
  - [ ] Database connection pool alert

- [ ] Set up on-call rotation:
  - [ ] PagerDuty integration
  - [ ] Escalation policy configured
  - [ ] Runbooks linked

### Logging & Analytics

- [ ] Verify centralized logging:
  ```bash
  # Query logs in Datadog/ELK
  service:kernel-api status:error
  ```

- [ ] Set up log retention:
  - [ ] Error logs: 90 days
  - [ ] Info logs: 30 days
  - [ ] Debug logs: 7 days

- [ ] Create dashboards:
  - [ ] Request volume (by action type)
  - [ ] Error rates (by error code)
  - [ ] Response times (p50, p95, p99)
  - [ ] Trust score distribution
  - [ ] Karma score distribution

### DNS & CDN

- [ ] Update DNS A record:
  ```bash
  kernel-api.botmantra.com → <production_ip>
  api.botmantra.com → <load_balancer_ip>
  ```

- [ ] Verify DNS propagation:
  ```bash
  nslookup kernel-api.botmantra.com
  ```

- [ ] Configure CDN caching:
  - [ ] Cache health endpoint: 60s
  - [ ] Cache GET requests: 300s
  - [ ] Cache /kernel/execute: no-cache

### Security Hardening

- [ ] Configure firewall:
  - [ ] Allow inbound: 443 (HTTPS only)
  - [ ] Allow outbound: 5432 (Supabase)
  - [ ] Block all other

- [ ] Enable HTTPS:
  ```bash
  certbot certonly --webroot -d kernel-api.botmantra.com
  ```

- [ ] Configure SSL/TLS:
  - [ ] Protocol: TLSv1.3+
  - [ ] Cipher suites: strong only
  - [ ] HSTS: enabled
  - [ ] Certificate pinning: optional

- [ ] API key management:
  - [ ] Service role key: in Vault only
  - [ ] Rotate every 90 days
  - [ ] Log all usage

- [ ] DDoS protection:
  - [ ] Rate limiting: enabled
  - [ ] WAF rules: enabled
  - [ ] CloudFlare/Akamai: optional

---

## Post-Deployment

### Smoke Tests (Production)

- [ ] Health check:
  ```bash
  curl -X GET https://api.botmantra.com/kernel/health
  ```

- [ ] Chat action test:
  ```bash
  curl -X POST https://api.botmantra.com/kernel/execute \
    -H "Authorization: Bearer <test_jwt>" \
    -d '{"action": "chat", "payload": {"message": "test"}}'
  ```

- [ ] Expected response: 200 with success status

- [ ] Monitor error logs:
  ```bash
  tail -f /var/log/kernel-api/error.log
  ```

- [ ] Check no errors for 5 minutes

### Verification Tests

- [ ] Run integration tests against production:
  ```bash
  npm test -- --env=production
  ```

- [ ] Verify all tests pass

- [ ] Run security scan:
  ```bash
  npm run security:scan
  ```

- [ ] Fix any vulnerabilities found

### Communication

- [ ] Notify team of deployment:
  - [ ] Slack message
  - [ ] Email notification
  - [ ] Status page update

- [ ] Document deployment:
  - [ ] Version deployed
  - [ ] Deployment timestamp
  - [ ] Deployed by (person)
  - [ ] Changes included

### Monitoring Window

- [ ] Establish 24-hour monitoring window:
  - [ ] Monitor logs every 15 minutes
  - [ ] Check metrics dashboard
  - [ ] Watch error rate
  - [ ] Monitor P99 latency
  - [ ] Have rollback plan ready

- [ ] Collect metrics for first 24 hours:
  - [ ] Total requests
  - [ ] Error rate
  - [ ] Average latency
  - [ ] Peak latency
  - [ ] Successful rate
  - [ ] Trust score distribution

---

## Rollback Plan

### Criteria for Rollback

- [ ] Error rate exceeds 5% for 5 minutes
- [ ] P99 latency exceeds 5000ms
- [ ] Service becomes unavailable
- [ ] Data corruption detected
- [ ] Security vulnerability discovered

### Rollback Procedure

1. **Declare Incident**:
   ```bash
   # Notify team
   # Page on-call engineer
   ```

2. **Stop Current Version**:
   ```bash
   kubectl rollout undo deployment/kernel-api -n production
   ```

3. **Verify Rollback**:
   ```bash
   kubectl rollout status deployment/kernel-api -n production
   curl -X GET https://api.botmantra.com/kernel/health
   ```

4. **Monitor Recovery**:
   - [ ] Error rate returns to normal
   - [ ] Latency acceptable
   - [ ] Users can access platform

5. **Post-Mortem**:
   - [ ] Document what went wrong
   - [ ] Schedule post-mortem meeting
   - [ ] Create action items

---

## Maintenance

### Regular Tasks

- [ ] Weekly:
  - [ ] Review error logs
  - [ ] Check performance metrics
  - [ ] Verify backups

- [ ] Monthly:
  - [ ] Security patch updates
  - [ ] Database optimization
  - [ ] Log retention cleanup

- [ ] Quarterly:
  - [ ] Capacity planning review
  - [ ] Security audit
  - [ ] Performance optimization

### Upgrade Plan

- [ ] Test upgrade on staging first
- [ ] Plan maintenance window
- [ ] Execute upgrade with rollback ready
- [ ] Verify all functionality post-upgrade

---

## Success Criteria

✅ **Deployment Successful When:**

- [ ] All health checks passing
- [ ] Error rate < 1%
- [ ] P99 latency < 1000ms
- [ ] All 5 action types working (chat, ui, data, automation, plugin)
- [ ] Database connectivity stable
- [ ] Rate limiting enforced
- [ ] Monitoring/alerting active
- [ ] Logs being collected
- [ ] No security vulnerabilities
- [ ] Team notified

---

## Support & Escalation

**Kernel API Support**: team@botmantra.com  
**On-Call**: Use PagerDuty  
**Incidents**: Create incident in Slack #incidents  
**Documentation**: See KERNEL_API_INTEGRATION_GUIDE.md

---

**Questions?** See troubleshooting section in Integration Guide or contact team.

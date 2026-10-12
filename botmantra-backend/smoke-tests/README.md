# Smoke Tests

## Purpose
Quickly validate core endpoints are reachable after DEPLOY_ALL.

## Prerequisites
- Server running on the target base URL
- Environment variables (optional):
  - BASE_URL (default: http://localhost:5000)
  - UI_TOOLS_TOKEN (required for RAG endpoint)

## Run
1) Kernel execute only:
```
node smoke-tests/kernel-execute-smoke.js
```

2) RAG engine only (requires token):
```
UI_TOOLS_TOKEN=your_token node smoke-tests/rag-engine-smoke.js
```

3) Run all smoke tests:
```
node smoke-tests/run-smoke-tests.js
```

## Expected
- Kernel test returns 200 and a JSON response (success may be false if validation fails).
- RAG test returns 200 and a JSON response when token is valid.

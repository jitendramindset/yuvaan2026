# Canonical API Selection

## Scope

This document identifies the canonical API path and contracts currently present in the workspace.

## Selected canonical API layer

Primary files:

- `botmantra-backend/server.js`
- `botmantra-backend/routes/kernel-v2-api.js`
- `botmantra-backend/routes-vanshawali.js`
- `botmantra-backend/routes/nodecore-chat.js`
- `botmantra-backend/routes/auth-api.js`

## Canonical endpoints

### 1. Kernel execution gateway

The strongest canonical runtime API is:

- `POST /api/kernel/v2/execute`

Evidence:

- `botmantra-backend/routes/kernel-v2-api.js` is explicitly titled as the canonical kernel API.
- `server.js` mounts the kernel route layer and exposes runtime orchestration.
- The route validates JWT, resolves user identity, and executes actions through `KernelExecutor`.

This is the most authoritative action API in the system.

### 2. NodeCore chat runtime

The authenticated AI/runtime endpoint is:

- `/api/nodecore-chat/chat`

Evidence:

- `botmantra-ui/src/App.js` calls this endpoint when authenticated.
- `server.js` mounts `/api/nodecore-chat` and `/api/nodecore` as active route aliases.
- The route integrates permissions, execution, and data operations.

### 3. BotMantra UI framework API

The public UI-generation endpoint is:

- `/api/botmantra-ai`

Evidence:

- `server.js` mounts the BotMantra AI framework route group.
- `botmantra-backend/routes/botmantra-ai-framework.js` implements a UI generation framework.

### 4. Family API

The domain-specific genealogy API is:

- `/api/vanshawali/user-lineage/:userId`
- `/api/vanshawali/family-tree/:familyId`
- `/api/vanshawali/create-lineage`

Evidence:

- `routes-vanshawali.js` defines real family endpoints.
- These are mounted through `server.js` and are responsible for genealogy reads and writes.

## Design decision

The canonical API system is a layered combination:

- Kernel API for actions and governance
- NodeCore API for chat and data operations
- BotMantra AI API for UI generation and dynamic framework behavior
- Family API for genealogy-specific requests

## Non-canonical API layers

These should be treated as compatibility or generated overlays until explicitly adopted:

- legacy route mounts
- generated CRUD APIs
- experimental service endpoints not connected to the kernel runtime

## Final decision

The canonical API contract is the mounted runtime surface in `server.js`, centered on the kernel action gateway in `kernel-v2-api.js`, the NodeCore chat flow, the BotMantra AI route, and the Vanshawali genealogy routes.

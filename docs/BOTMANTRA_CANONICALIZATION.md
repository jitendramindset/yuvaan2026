# Canonical BotMantra Selection

## Scope

This document identifies the canonical BotMantra AI/UI layer in the existing workspace.

## Selected canonical BotMantra implementation

Primary files:

- `botmantra-backend/routes/botmantra-ai-framework.js`
- `botmantra-backend/routes/nodecore-chat.js`
- `botmantra-backend/server.js`
- `botmantra-ui/src/App.js`

## Why this is canonical

### 1. It is the active route surface for AI-driven app flow

The backend `server.js` mounts the BotMantra AI framework at `/api/botmantra-ai` and NodeCore chat at `/api/nodecore-chat`. This demonstrates that both AI and node execution interfaces are part of the active runtime architecture.

### 2. The BotMantra framework is the UI-generation engine

`botmantra-ai-framework.js` defines the UI generation registry, field detection, and component generation logic. This is the clearest AI-to-UI engine in the codebase.

### 3. NodeCore chat is the authenticated AI execution path

`nodecore-chat.js` enforces the AI + permission + node data execution path. This is where the system enforces authentication, role checks, and execution contracts.

### 4. The frontend consumes the same AI stack

`App.js` sends chat messages to either `/api/nodecore-chat/chat` or `/api/botmantra-ai/chat` depending on authentication state. This confirms the AI stack is an active, integrated system rather than isolated documentation.

## Canonical decision

The canonical BotMantra layer is the combination of:

- the backend AI framework route at `botmantra-backend/routes/botmantra-ai-framework.js`
- the authenticated node-core chat route at `botmantra-backend/routes/nodecore-chat.js`
- the integration points exposed by `server.js`
- the frontend usage in `botmantra-ui/src/App.js`

## Non-canonical candidates

These should be treated as archive or compatibility material until explicitly merged:

- generated or experimental AI routes
- duplicate chat wrappers or legacy flow files
- documentation-only AI design artifacts

## Recommended policy

Use the frontend-to-backend flow through `App.js` and the backend route mounts in `server.js` as the canonical BotMantra integration path. Do not create a separate AI stack outside this route model.

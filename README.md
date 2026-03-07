# NodeOS (NodeCore OS) Blueprint

NodeOS is a node-driven operating environment where every entity is a node file executed by a kernel.

## Vision

NodeOS combines:

- Identity OS
- Automation OS
- Social graph
- Workflow builder
- Wallet + economy
- AI agent platform

Everything is executed via kernel-controlled nodes.

## Core Principles

1. Everything is a node.
2. Kernel executes nodes.
3. UI renders nodes dynamically.
4. Nodes can trigger other nodes.
5. Node execution is logged and permission checked.
6. Nodes are portable files.

## Repository Layout

```txt
kernel/        Core execution engine
nodes/         Node schema + seeded node files
ui/            Main dashboard + builder placeholders
agents/        YUNAAN agent node files
wallet/        Wallet + transaction node files
api/           API starter stubs
storage/       Storage engine stubs
backup/        Backup subsystem stubs
config/        Runtime config
shared/        Shared types/constants/errors
logs/          Node execution logs
migrations/    SQL schema artifacts
tests/         Test placeholders
```

## Kernel Pipeline

```txt
initialize node
validate node
check permissions
resolve dependencies
execute actions
update logs
recalculate hash
sync state
```

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Run a sample node execution:

```bash
npx tsc --noEmit
node --loader ts-node/esm kernel/kernel.engine.ts
```

3. Review seeded nodes in `nodes/` and extend actions/workflows.

## Copilot Instruction Block

All functionality in NodeOS must be implemented as node files.

Kernel must load nodes, validate permissions, execute actions, and log results.

Nodes contain:
data, ui_schema, actions, permissions, logs, and children.

Two UI systems must exist:
1) Main dashboard
2) Builder interface

Default profile type = Vanshawali.

Agents (YUNAAN) can automate workflows and device operations.

Economy engine = Dravyam with 1% transaction fee distribution.

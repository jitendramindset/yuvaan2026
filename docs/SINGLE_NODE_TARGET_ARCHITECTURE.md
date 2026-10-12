# Single Node Target Architecture

## Canonical target model

                    NODE_CORE
                        │
        ┌───────────────┼────────────────┐
        │               │                │
     Identity        Node State       Metadata
        │               │                │
        └───────────────┼────────────────┘
                        │
                  Node Graph
                        │
              Relationships / Edges
                        │
              ┌─────────┴─────────┐
              │                   │
          Vanshawali           BotMantra
              │                   │
              └─────────┬─────────┘
                        │
                  Projections
                        │
                  Family Tree

## Interpretation

This is the corrected target architecture based on the actual codebase evidence:

- `node_core` is the system identity and state root
- relationships are graph semantics layered over node identity
- the family tree is a projection used by Vanshawali flows
- BotMantra and Vanshawali are both consumers of the same node graph model

## Why this is the target

### Evidence from code

- `node-schema.js` defines the Node as the central object with metadata, state, lifecycle, permissions, and trust.
- `node-graph.js` models hierarchy and relationship traversal around nodes.
- `kernel-executor.js` orchestrates actions around nodes and permissions.
- `runtimeOrchestrator.js` bootstraps user nodes and brand flows, not separate domain roots.
- `permission-engine.js` validates access based on node state and relationship rules.
- `routes-vanshawali.js` exposes family APIs that query family-oriented data but do not redefine the canonical system model.

## Diagram interpretation

The diagram does not show family tables as independent roots. It shows:

- `NODE_CORE` at the center
- graph and relationships as infrastructure/edges
- Vanshawali and BotMantra as nodes or modules using the graph
- family tree as a projection of that graph

## Final target stance

The architecture should stay Node-first.

Family structure is real and useful, but it is a projection layer over the node graph, not the authoritative canonical model.

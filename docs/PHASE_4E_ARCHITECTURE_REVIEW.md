# Phase 4E Architecture Review

## Scope

This review inspects the previously proposed corrective migration and classifies each object against the actual single-Node architecture.

## Migration under review

`supabase/migrations/20260815023830_vanshawali_nodeos_reconciliation.sql`

## Classification

| Proposed object | Classification | Reason |
|---|---|---|
| `node_core` | KEEP | This is the canonical node model and must remain the primary durable object. |
| `node_relationships` | INFRASTRUCTURE ONLY | Useful as graph edge storage, but not a canonical domain table in a single node architecture. |
| `node_vector_memory` | INFRASTRUCTURE ONLY | This is node-owned memory infrastructure for semantic retrieval, not a top-level domain root. |
| `family_tree` | PROJECTION ONLY | This is a family-facing view derived from node relationships and lineage data. |
| `user_family_lineage` | PROJECTION ONLY / LEGACY | This is relationship-materialized data useful for family queries, but not the canonical node model. |
| `get_user_lineage` | PROJECTION ONLY | It serves family query needs, not core node identity. |
| `get_family_tree_with_members` | PROJECTION ONLY | It builds a domain-specific projection from the node graph and family data. |
| `search_families` | PROJECTION ONLY | It is a UI/API convenience function over a family projection. |
| RLS policies for family tables | PROJECTION SECURITY | Required only to protect projected family data, not to define core node identity. |
| RLS policies for vector memory | INFRASTRUCTURE SECURITY | Needed to protect retrieval memory, not to define the domain. |
| RLS policies for relationships | INFRASTRUCTURE SECURITY | Needed if graph edges are stored externally; still not a canonical domain entity. |
| `pgvector` extension | INFRASTRUCTURE ONLY | Required only if vector retrieval is used in runtime. |
| `pgcrypto` extension | AUTH / INFRASTRUCTURE | Needed for UUID generation, not a domain model. |

## Decision regarding the prior migration

The migration is not wrong as a compatibility or infrastructure patch, but it is not a canonical architecture migration for the single-Node model.

It overstates the status of the family and vector tables by treating them as independent domain roots rather than Node-supporting or projection layers.

## Final review verdict

- KEEP: `node_core`
- REMOVE FROM TARGET: independent family domain root assumption
- INFRASTRUCTURE ONLY: `node_relationships`, `node_vector_memory`
- PROJECTION ONLY: `family_tree`, `user_family_lineage`
- LEGACY: any broad assumption that these are competing canonical domain tables
- UNKNOWN: if a future implementation requires a materialized lineage cache for performance

## Final assessment

The prior migration is not approved for execution as a canonical target migration. It is a compatibility-oriented artifact, not a source-of-truth architecture definition.

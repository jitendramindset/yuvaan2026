/**
 * Node Index — lightweight in-memory LRU cache keyed by node_id / nid_hash.
 *
 * Prevents repeated disk scans for hot nodes.  The cache is evicted when
 * the process restarts (intentional — nodes on disk are the source of truth).
 */
import type { NodeRecord } from "../shared/types/node.types.js";

const MAX_ENTRIES = 2_000;

class NodeCache {
  private readonly _map = new Map<string, NodeRecord>();

  get(id: string): NodeRecord | undefined {
    const node = this._map.get(id);
    if (node) {
      // LRU touch: move to end
      this._map.delete(id);
      this._map.set(id, node);
    }
    return node;
  }

  set(id: string, node: NodeRecord): void {
    if (this._map.has(id)) this._map.delete(id);
    this._map.set(id, node);
    // Evict oldest when over capacity
    if (this._map.size > MAX_ENTRIES) {
      const oldest = this._map.keys().next().value;
      if (oldest !== undefined) this._map.delete(oldest);
    }
  }

  delete(id: string): void {
    this._map.delete(id);
  }

  clear(): void {
    this._map.clear();
  }

  get size(): number {
    return this._map.size;
  }

  /** Dump all cached node ids — useful for diagnostics. */
  keys(): string[] {
    return [...this._map.keys()];
  }
}

export const NodeIndex = new NodeCache();

"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, AdminNodeSummary, NodeGraph, NodeGraphNode, NodeGraphEdge } from "@/lib/api";
import {
  RefreshCw, List, GitBranch, Eye, Archive, Settings,
  ChevronRight, X, Search, Filter,
} from "lucide-react";

// ── Type colour map ───────────────────────────────────────────────────────────
const TYPE_COLOR: Record<string, string> = {
  system:      "#6c63ff", user:        "#00d2ff", profile:     "#22c55e",
  device:      "#f59e0b", widget:      "#a855f7", layout:      "#ec4899",
  workflow:    "#06b6d4", economy:     "#10b981", wallet:      "#10b981",
  transaction: "#f97316", dashboard:   "#8b5cf6", onboarding:  "#64748b",
  agent:       "#6366f1", permission:  "#dc2626", relation:    "#0ea5e9",
  data:        "#84cc16", plugin:      "#f43f5e", unknown:     "#4b5563",
};

const typeColor = (t: string) => TYPE_COLOR[t] ?? TYPE_COLOR.unknown;

// ── Simple force-sim (vanilla, no deps) ─────────────────────────────────────
interface SimNode {
  id: string; label: string; type: string; status: string;
  x: number;  y: number;   vx: number;   vy: number;
}
interface SimEdge { source: string; target: string; type: string }

function runSimulation(
  nodes: NodeGraphNode[],
  edges: NodeGraphEdge[],
  w: number,
  h: number,
  ticks = 120,
): SimNode[] {
  const sim: SimNode[] = nodes.map((n, i) => ({
    id: n.id, label: n.label, type: n.type, status: n.status,
    x: w / 2 + Math.cos((i / nodes.length) * 2 * Math.PI) * Math.min(w, h) * 0.35,
    y: h / 2 + Math.sin((i / nodes.length) * 2 * Math.PI) * Math.min(w, h) * 0.35,
    vx: 0, vy: 0,
  }));

  const byId = new Map(sim.map((n) => [n.id, n]));

  for (let t = 0; t < ticks; t++) {
    const alpha = 1 - t / ticks;

    // repulsion
    for (let i = 0; i < sim.length; i++) {
      for (let j = i + 1; j < sim.length; j++) {
        const a = sim[i]!; const b = sim[j]!;
        const dx = b.x - a.x; const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (3600 / (dist * dist)) * alpha;
        a.vx -= (dx / dist) * force; a.vy -= (dy / dist) * force;
        b.vx += (dx / dist) * force; b.vy += (dy / dist) * force;
      }
    }

    // attraction along edges
    for (const e of edges) {
      const a = byId.get(e.source); const b = byId.get(e.target);
      if (!a || !b) continue;
      const dx = b.x - a.x; const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const target = 90;
      const force = ((dist - target) / dist) * 0.07 * alpha;
      a.vx += dx * force; a.vy += dy * force;
      b.vx -= dx * force; b.vy -= dy * force;
    }

    // integrate + clamp to canvas
    const PAD = 36;
    for (const n of sim) {
      n.x = Math.max(PAD, Math.min(w - PAD, n.x + n.vx));
      n.y = Math.max(PAD, Math.min(h - PAD, n.y + n.vy));
      n.vx *= 0.65; n.vy *= 0.65;
    }
  }
  return sim;
}

// ── Graph canvas ─────────────────────────────────────────────────────────────
function GraphCanvas({
  graph,
  selected,
  onSelect,
  highlightType,
}: {
  graph: NodeGraph;
  selected: string | null;
  onSelect: (id: string) => void;
  highlightType: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef    = useRef<SimNode[]>([]);
  const [hover,   setHover]   = useState<string | null>(null);
  const raf       = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.width  = canvas.offsetWidth  * window.devicePixelRatio;
    const H = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    simRef.current = runSimulation(graph.nodes, graph.edges, W, H);
  }, [graph]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width; const H = canvas.height;
    const sim = simRef.current;
    const byId = new Map(sim.map((n) => [n.id, n]));

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#0f1117";
    ctx.fillRect(0, 0, W, H);

    // edges
    for (const e of graph.edges) {
      const a = byId.get(e.source); const b = byId.get(e.target);
      if (!a || !b) continue;
      const dim = highlightType && a.type !== highlightType && b.type !== highlightType;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = dim ? "rgba(42,45,62,0.6)"
        : e.type === "child"   ? "rgba(108,99,255,0.45)"
        : e.type === "parent"  ? "rgba(0,210,255,0.35)"
        : "rgba(100,116,139,0.4)";
      ctx.lineWidth = e.type === "child" ? 1.5 : 1;
      ctx.stroke();
    }

    // nodes
    const R = 11 * window.devicePixelRatio;
    for (const n of sim) {
      const isSel  = n.id === selected;
      const isHov  = n.id === hover;
      const isDim  = !!(highlightType && n.type !== highlightType);
      const col    = typeColor(n.type);

      ctx.beginPath();
      ctx.arc(n.x, n.y, isSel ? R * 1.5 : R, 0, Math.PI * 2);
      ctx.fillStyle = isDim ? "rgba(42,45,62,0.8)" : col;
      ctx.globalAlpha = isDim ? 0.35 : 1;
      ctx.fill();

      if (isSel || isHov) {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth   = 2 * window.devicePixelRatio;
        ctx.stroke();
      }

      // label
      if (!isDim && (isSel || isHov || sim.length < 30)) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#e8e9f0";
        ctx.font = `${10 * window.devicePixelRatio}px monospace`;
        ctx.textAlign = "center";
        const short = n.label.length > 18 ? n.label.slice(0, 16) + "…" : n.label;
        ctx.fillText(short, n.x, n.y + R + 13 * window.devicePixelRatio);
      }
      ctx.globalAlpha = 1;
    }
  }, [graph, selected, hover, highlightType]);

  useEffect(() => {
    const loop = () => { draw(); raf.current = requestAnimationFrame(loop); };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [draw]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr  = window.devicePixelRatio;
    const mx   = (e.clientX - rect.left) * dpr;
    const my   = (e.clientY - rect.top)  * dpr;
    const R = 11 * dpr;
    for (const n of simRef.current) {
      if (Math.hypot(n.x - mx, n.y - my) < R * 1.8) { onSelect(n.id); return; }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr  = window.devicePixelRatio;
    const mx   = (e.clientX - rect.left) * dpr;
    const my   = (e.clientY - rect.top)  * dpr;
    const R = 11 * dpr;
    for (const n of simRef.current) {
      if (Math.hypot(n.x - mx, n.y - my) < R * 1.8) {
        setHover(n.id);
        canvas.style.cursor = "pointer";
        return;
      }
    }
    setHover(null);
    canvas.style.cursor = "default";
  };

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      className="w-full h-full"
      style={{ display: "block", background: "#0f1117" }}
    />
  );
}

// ── Node inspector ────────────────────────────────────────────────────────────
function NodeInspector({
  nodeId,
  nodes,
  onClose,
  onArchive,
  onStatusChange,
}: {
  nodeId: string;
  nodes: AdminNodeSummary[];
  onClose: () => void;
  onArchive: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  const [full,    setFull]    = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState<"summary" | "raw">("summary");

  const node = nodes.find((n) => n.node_id === nodeId);

  useEffect(() => {
    setLoading(true);
    api.admin.nodeJson(nodeId)
      .then(setFull)
      .catch(() => setFull(null))
      .finally(() => setLoading(false));
  }, [nodeId]);

  if (!node) return null;
  const col = typeColor(node.node_type);

  return (
    <div
      className="card flex flex-col gap-3 overflow-hidden"
      style={{ height: "100%", borderLeft: `3px solid ${col}` }}
    >
      {/* Header */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm truncate" style={{ color: col }}>{node.node_id}</div>
          <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
            {node.node_type} · {node._file}
          </div>
        </div>
        <button onClick={onClose} style={{ color: "var(--muted)" }}><X size={14} /></button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["summary", "raw"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="text-xs px-2 py-1 rounded"
            style={{
              background: tab === t ? "rgba(108,99,255,0.2)" : "transparent",
              color:      tab === t ? "var(--accent)" : "var(--muted)",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "summary" && (
        <div className="space-y-2 text-xs overflow-auto flex-1">
          <Row k="Node ID"    v={node.node_id} />
          <Row k="Type"       v={node.node_type} color={col} />
          <Row k="Owner"      v={node.owner} />
          <Row k="Status"     v={node.status} />
          <Row k="Karma"      v={String(node.karma_score)} />
          <Row k="File"       v={node._file} />
          {node.parent && <Row k="Parent" v={node.parent} />}
          {node.children.length > 0 && (
            <div>
              <div style={{ color: "var(--muted)" }} className="mb-0.5">Children ({node.children.length})</div>
              {node.children.map((c) => (
                <div key={c} className="ml-2 py-0.5" style={{ color: "var(--accent)" }}>{c}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "raw" && (
        <div className="flex-1 overflow-auto">
          {loading ? (
            <p style={{ color: "var(--muted)" }}>Loading…</p>
          ) : (
            <pre
              className="text-xs p-2 rounded overflow-auto"
              style={{ background: "var(--bg)", fontSize: 10, color: "var(--muted)", whiteSpace: "pre-wrap", wordBreak: "break-all" }}
            >
              {JSON.stringify(full ?? node, null, 2)}
            </pre>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
        <select
          className="text-xs w-full"
          value={node.status}
          onChange={(e) => onStatusChange(node.node_id, e.target.value)}
          style={{ padding: "4px 8px", borderRadius: 6, borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }}
        >
          {["active", "suspended", "archived", "cold", "draft"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button
          className="btn btn-danger w-full text-xs py-1 flex items-center justify-center gap-1"
          onClick={() => onArchive(node.node_id)}
        >
          <Archive size={12} /> Archive Node
        </button>
      </div>
    </div>
  );
}

function Row({ k, v, color }: { k: string; v: string; color?: string }) {
  return (
    <div className="flex justify-between gap-2 py-0.5 border-b" style={{ borderColor: "var(--border)" }}>
      <span style={{ color: "var(--muted)" }}>{k}</span>
      <span className="text-right font-mono" style={{ color: color ?? "var(--text)" }}>{v || "—"}</span>
    </div>
  );
}

// ── Main admin page ─────────────────────────────────────────────────────────
export default function AdminPage() {
  const [graph,     setGraph]     = useState<NodeGraph | null>(null);
  const [nodes,     setNodes]     = useState<AdminNodeSummary[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState<"graph" | "table">("graph");
  const [selected,  setSelected]  = useState<string | null>(null);
  const [typeFilter,setTypeFilter]= useState("");
  const [search,    setSearch]    = useState("");
  const [error,     setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [g, n] = await Promise.all([api.admin.graph(), api.admin.nodes()]);
      setGraph(g);
      setNodes(n.nodes);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleArchive = async (nodeId: string) => {
    try {
      await api.admin.archive(nodeId);
      await load();
      if (selected === nodeId) setSelected(null);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  const handleStatusChange = async (nodeId: string, status: string) => {
    try {
      await api.admin.setStatus(nodeId, status);
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  const displayGraph: NodeGraph | null = graph && typeFilter
    ? {
        ...graph,
        nodes: graph.nodes.filter((n) => n.type === typeFilter),
        edges: graph.edges.filter(
          (e) =>
            graph.nodes.find((n) => n.id === e.source && n.type === typeFilter) &&
            graph.nodes.find((n) => n.id === e.target && n.type === typeFilter)
        ),
      }
    : graph;

  const filteredNodes = nodes.filter((n) => {
    const matchType = !typeFilter || n.node_type === typeFilter;
    const matchSearch = !search ||
      n.node_id.toLowerCase().includes(search.toLowerCase()) ||
      n.owner.toLowerCase().includes(search.toLowerCase()) ||
      n.node_type.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const allTypes = [...new Set(nodes.map((n) => n.node_type))].sort();

  return (
    <div className="py-6 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings size={24} style={{ color: "var(--accent)" }} />
            Admin — Node Graph
          </h1>
          {graph && (
            <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
              {graph.stats.total} nodes &middot; {graph.edges.length} edges &middot;&nbsp;
              {Object.entries(graph.stats.by_type).map(([t, c]) => `${c} ${t}`).join(", ")}
            </p>
          )}
        </div>
        <button className="btn btn-secondary flex items-center gap-2 ml-auto" onClick={load}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Stats row */}
      {graph && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(graph.stats.by_type).map(([t, c]) => (
            <button
              key={t}
              onClick={() => setTypeFilter(typeFilter === t ? "" : t)}
              className="badge flex items-center gap-1.5 text-xs cursor-pointer"
              style={{
                background: typeFilter === t ? `${typeColor(t)}30` : `${typeColor(t)}15`,
                color: typeColor(t),
                outline: typeFilter === t ? `1.5px solid ${typeColor(t)}` : "none",
              }}
            >
              <span
                style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: typeColor(t), display: "inline-block",
                }}
              />
              {t} ({c})
            </button>
          ))}
          {typeFilter && (
            <button
              className="badge text-xs flex items-center gap-1"
              style={{ color: "var(--muted)" }}
              onClick={() => setTypeFilter("")}
            >
              <X size={11} /> clear filter
            </button>
          )}
        </div>
      )}

      {/* Tab switch */}
      <div className="flex gap-2">
        <button
          className={`btn text-xs py-1.5 px-3 flex items-center gap-1.5 ${tab === "graph" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setTab("graph")}
        >
          <GitBranch size={13} /> Graph View
        </button>
        <button
          className={`btn text-xs py-1.5 px-3 flex items-center gap-1.5 ${tab === "table" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setTab("table")}
        >
          <List size={13} /> Table View
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg text-sm" style={{ background: "rgba(239,68,68,0.10)", color: "#ef4444" }}>
          {error} —{" "}
          <button className="underline" onClick={load}>retry</button>
        </div>
      )}

      {/* ── GRAPH TAB ─────────────────────────────────────────────────────── */}
      {tab === "graph" && (
        <div className="flex gap-4 h-[calc(100vh-280px)] min-h-[400px]">
          {/* Canvas */}
          <div
            className="flex-1 rounded-xl overflow-hidden border"
            style={{ borderColor: "var(--border)" }}
          >
            {loading ? (
              <div className="flex items-center justify-center h-full gap-3">
                <RefreshCw size={20} className="animate-spin" style={{ color: "var(--accent)" }} />
                <span style={{ color: "var(--muted)" }}>Laying out graph…</span>
              </div>
            ) : displayGraph ? (
              <GraphCanvas
                graph={displayGraph}
                selected={selected}
                onSelect={setSelected}
                highlightType={typeFilter}
              />
            ) : null}
          </div>

          {/* Inspector panel */}
          {selected && (
            <div className="w-72 shrink-0" style={{ height: "100%" }}>
              <NodeInspector
                nodeId={selected}
                nodes={nodes}
                onClose={() => setSelected(null)}
                onArchive={handleArchive}
                onStatusChange={handleStatusChange}
              />
            </div>
          )}
        </div>
      )}

      {/* ── TABLE TAB ─────────────────────────────────────────────────────── */}
      {tab === "table" && (
        <div className="space-y-3">
          {/* Search */}
          <div className="card flex items-center gap-2 py-2.5">
            <Search size={14} style={{ color: "var(--muted)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search node ID, type, owner…"
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: "var(--text)" }}
            />
            <Filter size={14} style={{ color: "var(--muted)" }} />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs"
              style={{ background: "var(--bg)", color: "var(--text)", borderColor: "var(--border)", borderRadius: 6, padding: "2px 6px" }}
            >
              <option value="">All types</option>
              {allTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <p className="text-xs" style={{ color: "var(--muted)" }}>
            {filteredNodes.length} of {nodes.length} nodes
          </p>

          {/* Table */}
          <div
            className="rounded-xl overflow-hidden border"
            style={{ borderColor: "var(--border)" }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                  {["Node ID", "Type", "Owner", "Status", "Karma", "Relations", ""].map((h) => (
                    <th key={h} className="text-left px-3 py-2 text-xs font-semibold" style={{ color: "var(--muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredNodes.map((n, i) => {
                  const col = typeColor(n.node_type);
                  const isSel = selected === n.node_id;
                  return (
                    <tr
                      key={n.node_id}
                      onClick={() => { setSelected(n.node_id); setTab("graph"); }}
                      className="cursor-pointer transition-colors"
                      style={{
                        background: isSel ? "rgba(108,99,255,0.10)" : i % 2 === 0 ? "var(--bg)" : "var(--surface)",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <td className="px-3 py-2 font-mono text-xs max-w-44 truncate" title={n.node_id}>
                        {n.node_id}
                      </td>
                      <td className="px-3 py-2">
                        <span className="badge text-xs" style={{ background: `${col}18`, color: col }}>
                          {n.node_type}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs" style={{ color: "var(--muted)" }}>{n.owner}</td>
                      <td className="px-3 py-2">
                        <span
                          className="badge text-xs"
                          style={{
                            background: n.status === "active" ? "rgba(34,197,94,0.15)" : "rgba(100,116,139,0.15)",
                            color:      n.status === "active" ? "#22c55e" : "var(--muted)",
                          }}
                        >
                          {n.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs font-mono">{n.karma_score}</td>
                      <td className="px-3 py-2 text-xs" style={{ color: "var(--muted)" }}>
                        {n.relations.length} edge{n.relations.length !== 1 ? "s" : ""}
                        {n.children.length > 0 && ` (${n.children.length} children)`}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          className="flex items-center gap-0.5 text-xs"
                          style={{ color: "var(--accent)" }}
                          onClick={(e) => { e.stopPropagation(); setSelected(n.node_id); setTab("graph"); }}
                        >
                          <Eye size={12} /> <ChevronRight size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredNodes.length === 0 && !loading && (
              <div className="text-center py-12" style={{ color: "var(--muted)" }}>
                No nodes match the current filters.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

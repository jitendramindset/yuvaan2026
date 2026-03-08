"use client";
/**
 * renderNode — resolves a raw NodeRecord into the correct UI widget.
 *
 * Priority order:
 *  1. Explicit `ui_schema.component` field on the node
 *  2. Mapping from node_type → default widget type
 *  3. Fallback to a generic card
 */
import React from "react";
import { renderWidget } from "./renderWidget";

// ── node_type → widget_type lookup ────────────────────────────────────────────

const NODE_TYPE_TO_WIDGET: Record<string, string> = {
  profile:       "ProfileCard",
  identity:      "ProfileCard",
  wallet:        "WalletCard",
  transaction:   "Table",
  ledger:        "Table",
  dashboard:     "Layout",
  layout:        "Layout",
  widget:        "Card",
  card_widget:   "Card",
  table_widget:  "Table",
  chart_widget:  "Chart",
  form_widget:   "Form",
  feed_widget:   "Feed",
  canvas_widget: "Canvas",
  timeline_widget: "Timeline",
  chat_widget:   "ChatWidget",
  post:          "Feed",
  group:         "Feed",
  system:        "OsStatus",
  device:        "DeviceStatus",
  sensor:        "DeviceStatus",
  agent:         "ChatWidget",
  assistant:     "ChatWidget",
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface NodeLike {
  node_id?:    string;
  nid_hash?:   string;
  node_type?:  string;
  ui_schema?:  Record<string, unknown>;
  data?:       Record<string, unknown>;
  [key: string]: unknown;
}

// ── Public component ──────────────────────────────────────────────────────────

export function RenderNode({ node }: { node: NodeLike }): React.ReactElement {
  const widgetType =
    (node.ui_schema?.["component"] as string | undefined) ??
    NODE_TYPE_TO_WIDGET[node.node_type ?? ""] ??
    "Card";

  return renderWidget({
    widget_type: widgetType,
    data:        node.data ?? {},
    config:      { title: String(node.data?.["title"] ?? node.node_type ?? "Node") },
    node_id:     node.nid_hash ?? node.node_id ?? "unknown",
  });
}

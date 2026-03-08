"use client";
/**
 * renderWidget — central widget dispatch.
 *
 * Maps a `widget_type` string to a concrete React component.
 * All kernel-generated widget render requests flow through here.
 */
import React from "react";

import { ProfileCard }  from "../widgets/ProfileCard";
import { WalletCard }   from "../widgets/WalletCard";
import { OsStatus }     from "../widgets/OsStatus";
import { NodeStats }    from "../widgets/NodeStats";
import { QuickActions } from "../widgets/QuickActions";
import { Timeline }     from "../widgets/Timeline";
import { ChatWidget }   from "../widgets/ChatWidget";
import { DeviceStatus } from "../widgets/DeviceStatus";
import { Card }         from "../widgets/Card";
import { Table }        from "../widgets/Table";
import { Chart }        from "../widgets/Chart";
import { Feed }         from "../widgets/Feed";
import { Form }         from "../widgets/Form";
import { Canvas }       from "../widgets/Canvas";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WidgetRenderInput {
  widget_type: string;
  config:      Record<string, unknown>;
  data?:       Record<string, unknown>;
  node_id?:    string;
}

type AnyWidget = React.ComponentType<{ config: Record<string, unknown>; data?: Record<string, unknown> }>;

// ── Registry ──────────────────────────────────────────────────────────────────

const REGISTRY: Record<string, AnyWidget> = {
  // Core
  ProfileCard,
  WalletCard,
  OsStatus,
  NodeStats,
  QuickActions,
  Timeline,
  ChatWidget,
  DeviceStatus,
  // New generic widgets
  Card,
  Table,
  Chart,
  Feed,
  Form,
  Canvas,
  // Aliases for node_type snake_case → PascalCase
  card_widget:     Card,
  table_widget:    Table,
  chart_widget:    Chart,
  feed_widget:     Feed,
  form_widget:     Form,
  canvas_widget:   Canvas,
  timeline_widget: Timeline,
  chat_widget:     ChatWidget,
};

// ── Public function ───────────────────────────────────────────────────────────

export function renderWidget(input: WidgetRenderInput): React.ReactElement {
  const Component = REGISTRY[input.widget_type];
  if (!Component) {
    return (
      <div className="rounded-xl border border-dashed border-white/20 p-4 text-sm text-white/40">
        Unknown widget: <code>{input.widget_type}</code>
      </div>
    );
  }
  return <Component config={input.config} data={input.data} />;
}

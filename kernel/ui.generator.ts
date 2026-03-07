// ─── UI Generator ─────────────────────────────────────────────────────────────
// Converts onboarding answers into a full dashboard layout (widget grid).
// Works alongside company.engine.ts and customization.engine.ts.
// ─────────────────────────────────────────────────────────────────────────────

import type { Industry, OperationModule } from "../shared/types/onboarding.types.js";
import type { WidgetType, WidgetConfig, GridLayout, CustomizationLayout, Platform } from "../shared/types/customization.types.js";

/** Map an industry to the nearest platform key used by the widget system. */
function industryToPlatform(industry: Industry): Platform {
  const map: Partial<Record<Industry, Platform>> = {
    retail: "erp", manufacturing: "erp", finance: "erp",
    consulting: "erp", restaurant: "erp", logistics: "erp",
    construction: "erp", agriculture: "erp", real_estate: "erp", travel: "erp",
    software: "workflow", education: "workflow",
    healthcare: "workflow", media: "social",
    personal: "vanshawali",
  };
  return map[industry] ?? "erp";
}

// ─── Widget slot definition ───────────────────────────────────────────────────

interface WidgetSlot {
  type:    WidgetType;
  title:   string;
  col:     number;   // 1-12 grid columns (start)
  span:    number;   // column span
  row:     number;   // row index (1-based)
  data_source?: string;
}

// ─── Module → widget slot templates ──────────────────────────────────────────

const MODULE_SLOTS: Record<OperationModule, WidgetSlot[]> = {
  sales: [
    { type: "kpi_card",   title: "Today's Revenue",      col: 1,  span: 3, row: 1, data_source: "sales.today" },
    { type: "kpi_card",   title: "Orders This Month",    col: 4,  span: 3, row: 1, data_source: "orders.month" },
    { type: "chart_bar",  title: "Monthly Sales",        col: 1,  span: 6, row: 2, data_source: "sales.monthly" },
    { type: "table",      title: "Recent Orders",        col: 7,  span: 6, row: 2, data_source: "orders.recent" },
  ],
  inventory: [
    { type: "kpi_card",   title: "Total SKUs",           col: 7,  span: 3, row: 1, data_source: "inventory.count" },
    { type: "kpi_card",   title: "Low Stock Alerts",     col: 10, span: 3, row: 1, data_source: "inventory.low_stock" },
    { type: "table",      title: "Stock Levels",         col: 1,  span: 6, row: 3, data_source: "inventory.all" },
    { type: "list",       title: "Suppliers",            col: 7,  span: 6, row: 3, data_source: "suppliers.list" },
  ],
  accounting: [
    { type: "chart_line", title: "Revenue vs Expenses",  col: 1,  span: 8, row: 4, data_source: "accounting.monthly" },
    { type: "chart_pie",  title: "Expense Breakdown",    col: 9,  span: 4, row: 4, data_source: "accounting.expenses" },
  ],
  hr: [
    { type: "kpi_card",   title: "Total Employees",      col: 1,  span: 3, row: 5, data_source: "hr.headcount" },
    { type: "chart_bar",  title: "Attendance",           col: 4,  span: 5, row: 5, data_source: "hr.attendance" },
    { type: "table",      title: "Leave Requests",       col: 9,  span: 4, row: 5, data_source: "hr.leave" },
  ],
  crm: [
    { type: "list",       title: "Lead Pipeline",        col: 1,  span: 4, row: 6, data_source: "crm.leads" },
    { type: "timeline",   title: "Contact Activity",     col: 5,  span: 4, row: 6, data_source: "crm.activity" },
    { type: "kpi_card",   title: "Conversion Rate",      col: 9,  span: 4, row: 6, data_source: "crm.conversion" },
  ],
  project_management: [
    { type: "step_list",  title: "Active Tasks",         col: 1,  span: 4, row: 7, data_source: "tasks.active" },
    { type: "timeline",   title: "Project Milestones",   col: 5,  span: 8, row: 7, data_source: "projects.milestones" },
  ],
  customer_support: [
    { type: "kpi_card",   title: "Open Tickets",         col: 1,  span: 3, row: 8, data_source: "support.open" },
    { type: "chart_line", title: "Resolution Time",      col: 4,  span: 5, row: 8, data_source: "support.resolution" },
    { type: "notification_panel", title: "Alerts",       col: 9,  span: 4, row: 8, data_source: "support.alerts" },
  ],
  marketing: [
    { type: "chart_bar",  title: "Campaign Reach",       col: 1,  span: 6, row: 9, data_source: "marketing.reach" },
    { type: "chart_pie",  title: "Channel Mix",          col: 7,  span: 3, row: 9, data_source: "marketing.channels" },
    { type: "heatmap",    title: "Engagement Heatmap",   col: 10, span: 3, row: 9, data_source: "marketing.heatmap" },
  ],
  manufacturing: [
    { type: "chart_gauge","title": "Production Rate",    col: 1,  span: 3, row: 10, data_source: "mfg.production" },
    { type: "chart_line", title: "Output Over Time",     col: 4,  span: 6, row: 10, data_source: "mfg.output" },
    { type: "kpi_card",   title: "Defect Rate",          col: 10, span: 3, row: 10, data_source: "mfg.defect_rate" },
  ],
  ecommerce: [
    { type: "kpi_card",   title: "GMV Today",            col: 1,  span: 3, row: 1, data_source: "ecom.gmv_today" },
    { type: "chart_bar",  title: "Orders by Category",   col: 4,  span: 5, row: 2, data_source: "ecom.orders_by_cat" },
    { type: "chart_pie",  title: "Cart Conversion",      col: 9,  span: 4, row: 2, data_source: "ecom.cart_conversion" },
  ],
  analytics: [
    { type: "chart_line", title: "Trend Analysis",       col: 1,  span: 8, row: 11, data_source: "analytics.trends" },
    { type: "heatmap",    title: "Activity Heatmap",     col: 9,  span: 4, row: 11, data_source: "analytics.activity" },
  ],
  documents: [
    { type: "list",       title: "Recent Documents",     col: 1,  span: 6, row: 12, data_source: "docs.recent" },
    { type: "tree_view",  title: "Folder Tree",          col: 7,  span: 6, row: 12, data_source: "docs.tree" },
  ],
  tasks: [
    { type: "step_list",  title: "My Tasks",             col: 1,  span: 6, row: 13, data_source: "tasks.mine" },
    { type: "kpi_card",   title: "Tasks Due Today",      col: 7,  span: 3, row: 13, data_source: "tasks.due_today" },
  ],
};

// ─── Base KPI header (always present) ────────────────────────────────────────

function baseKpiRow(industry: Industry): WidgetSlot[] {
  return [
    { type: "kpi_card", title: "Total Users",  col: 1, span: 3, row: 1, data_source: "system.users" },
    { type: "kpi_card", title: "Active Today", col: 4, span: 3, row: 1, data_source: "system.active_today" },
  ];
}

// ─── Main generator ───────────────────────────────────────────────────────────

/** Build a GridLayout from industry + selected operation modules. */
export function generateDashboardLayout(params: {
  userId:    string;
  industry:  Industry;
  modules:   OperationModule[];
  title?:    string;
}): CustomizationLayout {
  const platform  = industryToPlatform(params.industry);
  const layoutId  = `layout.${params.industry}.${params.userId.slice(0, 8)}`;
  const slots: WidgetSlot[] = [
    ...baseKpiRow(params.industry),
  ];

  for (const mod of params.modules) {
    const modSlots = MODULE_SLOTS[mod] ?? [];
    slots.push(...modSlots);
  }

  let widgetIndex = 0;
  const maxRow = slots.reduce((m, s) => Math.max(m, s.row), 1);

  const widgets: WidgetConfig[] = slots.map((slot) => ({
    widget_id:   `w_${widgetIndex++}_${slot.type}`,
    widget_type: slot.type,
    label:       slot.title,
    size:        slotToSize(slot.span),
    position:    { col: slot.col, row: slot.row, colSpan: slot.span, rowSpan: 1 },
    props:       { data_source: slot.data_source ?? "" },
    visible:     true,
    locked:      false,
  }));

  const grid: GridLayout = {
    layout_id:  layoutId,
    platform,
    columns:    12,
    rows:       maxRow + 1,
    gap:        16,
    widgets,
  };

  const layout: CustomizationLayout = {
    layout_id:    layoutId,
    owner_id:     params.userId,
    platform,
    status:       "draft",
    grid,
    created_at:   new Date().toISOString(),
    updated_at:   new Date().toISOString(),
    published_at: null,
  };

  return layout;
}

/** Build a minimal personal dashboard (for personal/freelancer). */
export function generatePersonalLayout(userId: string): CustomizationLayout {
  return generateDashboardLayout({
    userId,
    industry:  "personal",
    modules:   ["tasks", "analytics", "documents"],
    title:     "My Dashboard",
  });
}

/** Convert column span to WidgetSize label. */
function slotToSize(span: number): "xs" | "sm" | "md" | "lg" | "xl" | "full" {
  if (span <= 2)  return "xs";
  if (span <= 3)  return "sm";
  if (span <= 4)  return "md";
  if (span <= 6)  return "lg";
  if (span <= 8)  return "xl";
  return "full";
}

/** Generate a workflow node schema from a module. */
export function generateDefaultWorkflow(module: OperationModule, userId: string): Record<string, unknown> {
  const workflows: Record<OperationModule, Record<string, unknown>> = {
    sales: {
      node_id:    `workflow.new_order.${userId}`,
      node_type:  "workflow",
      title:      "New Order → Invoice",
      steps: [
        { id: "1", label: "New Order",         action: "create_order" },
        { id: "2", label: "Update Inventory",  action: "decrement_stock" },
        { id: "3", label: "Generate Invoice",  action: "create_invoice" },
        { id: "4", label: "Notify Customer",   action: "send_notification" },
      ],
    },
    inventory: {
      node_id:    `workflow.low_stock.${userId}`,
      node_type:  "workflow",
      title:      "Low Stock Alert",
      steps: [
        { id: "1", label: "Check Stock Levels",   action: "check_inventory" },
        { id: "2", label: "Threshold Reached",    action: "condition_check" },
        { id: "3", label: "Notify Procurement",   action: "send_notification" },
        { id: "4", label: "Create PO Draft",      action: "create_draft" },
      ],
    },
    hr: {
      node_id:    `workflow.employee_onboarding.${userId}`,
      node_type:  "workflow",
      title:      "Employee Onboarding",
      steps: [
        { id: "1", label: "Create Employee Node", action: "create_employee" },
        { id: "2", label: "Assign Role",          action: "assign_role" },
        { id: "3", label: "Send Welcome Email",   action: "send_email" },
        { id: "4", label: "Schedule Orientation", action: "create_task" },
      ],
    },
    crm: {
      node_id:    `workflow.lead_to_customer.${userId}`,
      node_type:  "workflow",
      title:      "Lead to Customer",
      steps: [
        { id: "1", label: "New Lead",        action: "capture_lead" },
        { id: "2", label: "Qualify",         action: "score_lead" },
        { id: "3", label: "Follow-up",       action: "schedule_task" },
        { id: "4", label: "Convert",         action: "create_customer" },
      ],
    },
    accounting:         { node_id: `workflow.invoice_approval.${userId}`, node_type: "workflow", title: "Invoice Approval", steps: [] },
    project_management: { node_id: `workflow.task_assign.${userId}`,       node_type: "workflow", title: "Task Assignment",   steps: [] },
    ecommerce:          { node_id: `workflow.order_fulfillment.${userId}`,  node_type: "workflow", title: "Order Fulfillment", steps: [] },
    customer_support:   { node_id: `workflow.ticket_escalation.${userId}`,  node_type: "workflow", title: "Ticket Escalation", steps: [] },
    marketing:          { node_id: `workflow.campaign_launch.${userId}`,    node_type: "workflow", title: "Campaign Launch",   steps: [] },
    manufacturing:      { node_id: `workflow.production_run.${userId}`,     node_type: "workflow", title: "Production Run",    steps: [] },
    analytics:          { node_id: `workflow.report_generation.${userId}`,  node_type: "workflow", title: "Report Generation", steps: [] },
    documents:          { node_id: `workflow.doc_approval.${userId}`,       node_type: "workflow", title: "Document Approval", steps: [] },
    tasks:              { node_id: `workflow.task_reminder.${userId}`,       node_type: "workflow", title: "Task Reminder",     steps: [] },
  };

  return workflows[module] ?? { node_id: `workflow.${module}.${userId}`, node_type: "workflow", steps: [] };
}

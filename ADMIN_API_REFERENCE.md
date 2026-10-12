# 📚 Admin API Reference & Examples

## Complete API Documentation

### Authentication
All requests require Bearer token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## 1️⃣ Admin Status Check

### Request
```
GET /api/admin/check-status/:userId
Authorization: Bearer <token>
```

### Example Usage (Frontend)
```javascript
// In React component
const status = await AdminService.checkAdminStatus(userId);
console.log(status);
// Output: { success: true, isAdmin: true, role: 'admin', permissions: [...] }
```

### Response
```json
{
  "success": true,
  "isAdmin": true,
  "role": "admin",
  "permissions": ["*"]
}
```

### Error Response
```json
{
  "success": false,
  "error": "Unauthorized - Admin access required"
}
```

---

## 2️⃣ Get UI Theme

### Request
```
GET /api/admin/ui-theme
Authorization: Bearer <token>
```

### Example Usage
```javascript
const theme = await AdminService.getUITheme();
console.log(theme);
// Output: { success: true, colors: {...}, layout: {...} }
```

### Response
```json
{
  "success": true,
  "theme": {},
  "colors": {
    "primary": "#667eea",
    "secondary": "#764ba2",
    "accent": "#fbbf24",
    "background": "#0f0c29",
    "success": "#10b981",
    "warning": "#f59e0b",
    "danger": "#ef4444"
  },
  "layout": {}
}
```

---

## 3️⃣ Update Theme Colors

### Request
```
POST /api/admin/theme/colors
Authorization: Bearer <token>
Content-Type: application/json

{
  "primary": "#ff0000",
  "secondary": "#00ff00",
  "accent": "#0000ff",
  "background": "#ffffff",
  "success": "#008000",
  "warning": "#ffff00",
  "danger": "#ff0000"
}
```

### Example Usage
```javascript
const result = await AdminService.updateThemeColors({
  primary: '#ff0000',
  secondary: '#00ff00',
  accent: '#0000ff'
});
console.log(result);
// Output: { success: true, colors: {...}, message: 'Theme colors updated' }
```

### Frontend Real-Time Update
```javascript
// AdminService automatically calls this to apply colors
AdminService.applyThemeColors(colors);
// Sets CSS variables: --hud-primary, --hud-secondary, etc.
```

### Response
```json
{
  "success": true,
  "colors": {
    "primary": "#ff0000",
    "secondary": "#00ff00"
  },
  "message": "Theme colors updated"
}
```

---

## 4️⃣ Get Available Widgets

### Request
```
GET /api/admin/widgets/available
Authorization: Bearer <token>
```

### Example Usage
```javascript
const result = await AdminService.getAvailableWidgets();
console.log(result.widgets);
// Output: [{ id, name, type, icon, ... }, ...]
```

### Response
```json
{
  "success": true,
  "widgets": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Revenue Chart",
      "type": "chart",
      "icon": "bar-chart-2",
      "description": "Shows revenue over time",
      "config": {},
      "default_size": {
        "width": 300,
        "height": 300
      },
      "created_at": "2024-02-09T10:00:00Z"
    }
  ],
  "categories": ["custom", "chart", "stats", "table", "form"]
}
```

---

## 5️⃣ Create Widget

### Request
```
POST /api/admin/widgets/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Sales Widget",
  "type": "chart",
  "description": "Weekly sales data",
  "icon": "trending-up",
  "config": {
    "chartType": "line",
    "dataSource": "sales_data"
  },
  "defaultSize": {
    "width": 400,
    "height": 300
  }
}
```

### Example Usage
```javascript
const result = await AdminService.createWidget({
  name: 'Sales Widget',
  type: 'chart',
  description: 'Weekly sales data',
  icon: 'trending-up'
});
console.log(result);
// Output: { success: true, widget: {...}, message: 'Widget created successfully' }
```

### Response
```json
{
  "success": true,
  "widget": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Sales Widget",
    "type": "chart",
    "created_at": "2024-02-09T10:00:00Z"
  },
  "message": "Widget created successfully"
}
```

---

## 6️⃣ Update Widget

### Request
```
PUT /api/admin/widgets/:widgetId/update
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Widget Name",
  "description": "Updated description",
  "config": {
    "chartType": "bar"
  }
}
```

### Example Usage
```javascript
const result = await AdminService.updateWidget('widget-id', {
  name: 'Updated Widget Name',
  description: 'Updated description'
});
console.log(result);
// Output: { success: true, widget: {...}, message: 'Widget updated successfully' }
```

### Response
```json
{
  "success": true,
  "widget": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Updated Widget Name",
    "updated_at": "2024-02-09T10:05:00Z"
  },
  "message": "Widget updated successfully"
}
```

---

## 7️⃣ Delete Widget

### Request
```
DELETE /api/admin/widgets/:widgetId/delete
Authorization: Bearer <token>
```

### Example Usage
```javascript
const result = await AdminService.deleteWidget('widget-id');
console.log(result);
// Output: { success: true, message: 'Widget deleted successfully' }
```

### Response
```json
{
  "success": true,
  "message": "Widget deleted successfully"
}
```

---

## 8️⃣ Save Widget Layout

### Request
```
POST /api/admin/layout/save
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Dashboard Layout",
  "description": "Main dashboard configuration",
  "widgets": [
    {
      "id": "widget-1",
      "position": { "x": 0, "y": 0 },
      "size": { "width": 300, "height": 300 }
    },
    {
      "id": "widget-2",
      "position": { "x": 320, "y": 0 },
      "size": { "width": 300, "height": 300 }
    }
  ],
  "gridConfig": {
    "columns": 3,
    "gap": 16
  }
}
```

### Example Usage
```javascript
const result = await AdminService.saveWidgetLayout({
  name: 'Dashboard Layout',
  description: 'Main dashboard',
  widgets: availableWidgets,
  gridConfig: { columns: 3, gap: 16 }
});
console.log(result);
// Output: { success: true, layout: {...}, message: 'Layout saved successfully' }
```

### Response
```json
{
  "success": true,
  "layout": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "name": "Dashboard Layout",
    "widgets": [...],
    "created_at": "2024-02-09T10:00:00Z"
  },
  "message": "Layout saved successfully"
}
```

---

## 9️⃣ Get All Layouts

### Request
```
GET /api/admin/layouts/list
Authorization: Bearer <token>
```

### Example Usage
```javascript
const result = await AdminService.getLayouts();
console.log(result.layouts);
// Output: [{ id, name, description, ... }, ...]
```

### Response
```json
{
  "success": true,
  "layouts": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "name": "Dashboard Layout",
      "description": "Main dashboard configuration",
      "widgets": [...],
      "created_at": "2024-02-09T10:00:00Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "name": "Analytics Layout",
      "description": "Analytics dashboard",
      "widgets": [...],
      "created_at": "2024-02-09T10:05:00Z"
    }
  ]
}
```

---

## 🔟 Apply Layout

### Request
```
POST /api/admin/layout/apply/:layoutId
Authorization: Bearer <token>
```

### Example Usage
```javascript
const result = await AdminService.applyLayout('layout-id');
console.log(result);
// Output: { success: true, layout: {...}, message: 'Layout applied successfully' }
```

### Response
```json
{
  "success": true,
  "layout": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "name": "Dashboard Layout",
    "widgets": [...]
  },
  "message": "Layout applied successfully"
}
```

---

## 1️⃣1️⃣ Reorder Widgets

### Request
```
POST /api/admin/widgets/reorder
Authorization: Bearer <token>
Content-Type: application/json

{
  "arrangement": [
    { "widgetId": "widget-1", "order": 1 },
    { "widgetId": "widget-2", "order": 2 },
    { "widgetId": "widget-3", "order": 3 }
  ]
}
```

### Example Usage
```javascript
const result = await AdminService.updateWidgetOrder([
  { widgetId: 'widget-1', order: 1 },
  { widgetId: 'widget-2', order: 2 }
]);
console.log(result);
// Output: { success: true, message: 'Widget order updated' }
```

### Response
```json
{
  "success": true,
  "message": "Widget order updated"
}
```

---

## 1️⃣2️⃣ Get Audit Logs

### Request
```
GET /api/admin/audit-logs?limit=50
Authorization: Bearer <token>
```

### Example Usage
```javascript
const result = await AdminService.getAuditLogs(50);
console.log(result.logs);
// Output: [{ id, admin_id, action, details, created_at }, ...]
```

### Response
```json
{
  "success": true,
  "logs": [
    {
      "id": "log-1",
      "admin_id": "user-123",
      "action": "UPDATE_THEME_COLORS",
      "details": {
        "colors": {
          "primary": "#ff0000"
        }
      },
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "created_at": "2024-02-09T10:00:00Z"
    },
    {
      "id": "log-2",
      "admin_id": "user-123",
      "action": "CREATE_WIDGET",
      "details": {
        "widget_name": "Sales Widget",
        "widget_type": "chart"
      },
      "created_at": "2024-02-09T10:05:00Z"
    }
  ]
}
```

---

## 🧪 Complete Example Workflow

```javascript
// 1. Check if user is admin
const status = await AdminService.checkAdminStatus(userId);
if (!status.isAdmin) {
  console.log('User is not admin');
  return;
}

// 2. Get current theme
const theme = await AdminService.getUITheme();
console.log('Current colors:', theme.colors);

// 3. Update colors
await AdminService.updateThemeColors({
  primary: '#ff0000',
  secondary: '#00ff00'
});

// 4. Get available widgets
const widgets = await AdminService.getAvailableWidgets();
console.log('Available widgets:', widgets.widgets);

// 5. Create new widget
const newWidget = await AdminService.createWidget({
  name: 'My Custom Widget',
  type: 'custom',
  description: 'Test widget',
  icon: 'star'
});

// 6. Get all layouts
const layouts = await AdminService.getLayouts();
console.log('Available layouts:', layouts.layouts);

// 7. Save current layout
const savedLayout = await AdminService.saveWidgetLayout({
  name: 'New Layout',
  description: 'My custom layout',
  widgets: widgets.widgets,
  gridConfig: { columns: 3, gap: 16 }
});

// 8. Apply a layout
await AdminService.applyLayout(savedLayout.layout.id);

// 9. Reorder widgets
await AdminService.updateWidgetOrder([
  { widgetId: 'widget-1', order: 1 },
  { widgetId: 'widget-2', order: 2 }
]);

// 10. Get audit logs
const logs = await AdminService.getAuditLogs(50);
console.log('All actions:', logs.logs);
```

---

## 🔐 Error Handling

### Common Error Responses

**Unauthorized (401)**
```json
{
  "success": false,
  "error": "No authentication token provided"
}
```

**Forbidden (403)**
```json
{
  "success": false,
  "error": "Unauthorized - Admin access required"
}
```

**Not Found (404)**
```json
{
  "success": false,
  "error": "Layout not found"
}
```

**Bad Request (400)**
```json
{
  "success": false,
  "error": "Missing required fields: name, type"
}
```

**Rate Limited (429)**
```json
{
  "success": false,
  "error": "Rate limit exceeded. Try again later."
}
```

**Server Error (500)**
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## 📊 Database Schema Reference

### user_roles
```sql
id (UUID) - Primary key
user_id (UUID) - Reference to auth.users
role (VARCHAR) - 'user', 'admin', 'moderator'
permissions (JSONB) - Array of permission strings
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### ui_customization
```sql
id (UUID) - Primary key
organization_id (UUID) - Organization reference
colors (JSONB) - Color config object
layout (JSONB) - Layout config object
active_layout_id (UUID) - Current layout
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### custom_widgets
```sql
id (UUID) - Primary key
organization_id (UUID) - Organization reference
name (VARCHAR) - Widget name
type (VARCHAR) - 'chart', 'stats', 'table', 'form', 'custom'
description (TEXT) - Widget description
icon (VARCHAR) - Icon name
config (JSONB) - Widget configuration
default_size (JSONB) - Default dimensions
order (INTEGER) - Display order
created_by (UUID) - Creator user ID
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### ui_layouts
```sql
id (UUID) - Primary key
organization_id (UUID) - Organization reference
name (VARCHAR) - Layout name
description (TEXT) - Layout description
widgets (JSONB) - Widget arrangement array
grid_config (JSONB) - Grid configuration
created_by (UUID) - Creator user ID
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### admin_audit_logs
```sql
id (UUID) - Primary key
admin_id (UUID) - Admin user ID
action (VARCHAR) - Action type
details (JSONB) - Action details
ip_address (INET) - IP address
user_agent (TEXT) - Browser user agent
created_at (TIMESTAMP)
```

---

## 🔒 Permission Levels

- **User**: Can view customizations
- **Admin**: Can create/update/delete everything, view audit logs
- **Moderator**: Can update existing items only

---

## ⚙️ Configuration Options

```javascript
// Environment variables
ADMIN_AUDIT_ENABLED=true
ADMIN_SESSION_TIMEOUT=3600
ADMIN_MAX_WIDGETS=100
ADMIN_MAX_LAYOUTS=50
ADMIN_API_RATE_LIMIT=100
```

---

## 📞 Quick Reference

| Action | Method | Endpoint |
|--------|--------|----------|
| Check Status | GET | `/api/admin/check-status/:userId` |
| Get Theme | GET | `/api/admin/ui-theme` |
| Update Colors | POST | `/api/admin/theme/colors` |
| Get Widgets | GET | `/api/admin/widgets/available` |
| Create Widget | POST | `/api/admin/widgets/create` |
| Update Widget | PUT | `/api/admin/widgets/:id/update` |
| Delete Widget | DELETE | `/api/admin/widgets/:id/delete` |
| Save Layout | POST | `/api/admin/layout/save` |
| Get Layouts | GET | `/api/admin/layouts/list` |
| Apply Layout | POST | `/api/admin/layout/apply/:id` |
| Reorder Widgets | POST | `/api/admin/widgets/reorder` |
| Get Audit Logs | GET | `/api/admin/audit-logs` |

---

**All endpoints require Bearer token authentication!** 🔐

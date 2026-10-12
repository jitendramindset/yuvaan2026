# Brand Dashboard Quick Reference

## ✅ What Was Done

Seeded **4 brand-specific dashboard templates** into the `ui_templates` table:

1. **BOTMANTRA** → `ai_dashboard` (Purple theme #6B5BFF)
2. **MANTRAVAT** → `admin_dashboard` (Blue theme #2563EB)
3. **JEETMANTRA** → `edu_dashboard` (Orange theme #F59E0B)
4. **JUNIORMANTRA** → `kids_dashboard` (Purple-pink theme #8B5CF6)

---

## 🚀 Run Seeder

```bash
cd botmantra-backend
node seed-templates.js
```

**Output:**
```
✅ ai_dashboard
✅ admin_dashboard
✅ edu_dashboard
✅ kids_dashboard
```

---

## 📋 Query Templates

```javascript
const { data } = await supabase
  .from('ui_templates')
  .select('*')
  .eq('template_code', 'ai_dashboard');
```

---

## 🎨 Template Structure

Each template has:
- **12-column grid layout**
- **Brand-specific colors**
- **Section definitions** (KPIs, charts, tables)
- **Unique template_code**

Example:
```json
{
  "brand": "BOTMANTRA",
  "cols": 12,
  "theme": {
    "primary": "#6B5BFF",
    "secondary": "#FF6B9D"
  },
  "sections": [
    { "type": "kpi", "cols": 4 },
    { "type": "chart", "cols": 8 },
    { "type": "table", "cols": 12 }
  ]
}
```

---

## ✨ Status

🟢 **PRODUCTION READY**
- Templates seeded successfully
- Idempotent operations (safe to re-run)
- Ready for UI Bootstrap integration

---

## 📖 Full Documentation

See `BRAND_DASHBOARD_SETUP_COMPLETE.md` for detailed information.

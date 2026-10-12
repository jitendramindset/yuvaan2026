🚀 AI UI DESIGNER - QUICK SETUP GUIDE
═══════════════════════════════════════════════════════════════════════════════

# Get AI UI Designer Running in 15 Minutes

═══════════════════════════════════════════════════════════════════════════════
STEP 1: Environment Configuration (2 minutes)
═══════════════════════════════════════════════════════════════════════════════

Add to .env file:

# Claude API (for AI UI Designer)
ANTHROPIC_API_KEY=sk-ant-... # Get from https://console.anthropic.com

# Existing variables (should already be set)
SUPABASE_URL=https://...supabase.co
SERVICE_ROLE_KEY=...
REDIS_URL=redis://... # Optional but recommended


═══════════════════════════════════════════════════════════════════════════════
STEP 2: Install Dependencies (1 minute)
═══════════════════════════════════════════════════════════════════════════════

npm install  # Should already have all dependencies

Files use only standard Node libraries:
  - https (built-in)
  - express (already installed)
  - @supabase/supabase-js (already installed)


═══════════════════════════════════════════════════════════════════════════════
STEP 3: Register Routes in Server (2 minutes)
═══════════════════════════════════════════════════════════════════════════════

Edit: botmantra-backend/server.js

Find this section (around line 1):
```javascript
const appBuilderRoutes = require('./routes/app-builder');
```

Add after it:
```javascript
const aiUIDesignerRoutes = require('./routes/ai-ui-designer-routes');
```

Find this section (around line 100):
```javascript
app.use('/api/app-builder', appBuilderRoutes);
```

Add after it:
```javascript
app.use('/api/ai-ui', aiUIDesignerRoutes);
```

Restart server:
```bash
node server.js
```


═══════════════════════════════════════════════════════════════════════════════
STEP 4: Integrate Kernel Handler (2 minutes)
═══════════════════════════════════════════════════════════════════════════════

Edit: botmantra-backend/routes-kernel.js

Find the kernel execute function (line ~200-300).

Add this import at top:
```javascript
const AIUIDesignerKernel = require('./ai-ui-designer-kernel');
```

Find the action switch statement (line ~150+):
```javascript
router.post('/kernel/execute', async (req, res) => {
  try {
    const { action, payload } = req.body;
    
    // Add this section
    if (action.startsWith('ai_ui_')) {
      const aiKernel = new AIUIDesignerKernel(supabaseClient);
      const result = await aiKernel.handleAction(action, payload);
      return res.json({ success: true, response: result });
    }
```

Restart server.


═══════════════════════════════════════════════════════════════════════════════
STEP 5: Test the Installation (3 minutes)
═══════════════════════════════════════════════════════════════════════════════

Test 1: Health Check
────────────────────
curl http://localhost:5000/health

Expected response:
  { "status": "ok" }


Test 2: Get Available Components
────────────────────────────────
curl -X GET http://localhost:5000/api/ai-ui/components \
  -H "Authorization: Bearer YOUR_TOKEN"

Expected response:
  {
    "success": true,
    "data": {
      "components": {
        "layouts": ["grid", "stack", ...],
        ...
      }
    }
  }


Test 3: Design Your First UI
───────────────────────────
curl -X POST http://localhost:5000/api/ai-ui/design \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create dashboard with sales metrics and customer table",
    "platform": "web",
    "brand": "BOTMANTRA",
    "theme": "dark"
  }'

Expected response:
  {
    "success": true,
    "data": {
      "template_id": "tpl_ai_...",
      "schema": {
        "widgets": [
          { "type": "kpi", ... },
          { "type": "table", ... }
        ],
        "theme": { ... }
      }
    }
  }


═══════════════════════════════════════════════════════════════════════════════
STEP 6: Frontend Integration (5 minutes)
═══════════════════════════════════════════════════════════════════════════════

Create a new page: frontend/web/src/pages/AIDesigner.tsx

```typescript
import { useState } from 'react';
import { DynamicScreenRenderer } from '../renderers/dynamic-renderer';

export function AIDesignerPage() {
  const [prompt, setPrompt] = useState('');
  const [schema, setSchema] = useState(null);
  const [loading, setLoading] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const handleDesign = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai-ui/design', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          prompt,
          platform: 'web',
          brand: 'BOTMANTRA',
          theme: 'dark'
        })
      });
      
      const data = await response.json();
      setSchema(data.data.schema);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!templateName) return;
    
    const response = await fetch('/api/ai-ui/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ template_name: templateName })
    });
    
    console.log(await response.json());
  };

  return (
    <div className="p-6">
      <h1>AI Dashboard Designer</h1>
      
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe your dashboard..."
        className="w-full p-4 border rounded"
      />
      
      <button 
        onClick={handleDesign}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? 'Designing...' : 'Design Dashboard'}
      </button>
      
      {schema && (
        <>
          <div className="mt-6 border rounded p-4">
            <h2>Preview:</h2>
            <DynamicScreenRenderer schema={schema} />
          </div>
          
          <input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Template name..."
            className="w-full p-2 border rounded mt-4"
          />
          
          <button
            onClick={handleSave}
            className="bg-green-600 text-white px-4 py-2 rounded mt-2"
          >
            Save Template
          </button>
        </>
      )}
    </div>
  );
}
```


═══════════════════════════════════════════════════════════════════════════════
STEP 7: Verify Everything Works (Continuous)
═══════════════════════════════════════════════════════════════════════════════

Check Server Logs:
  tail -f server-output.log | grep ai_ui

Monitor API Usage:
  SELECT action, COUNT(*) FROM node_execution_log 
  WHERE action LIKE 'ai_ui%' 
  GROUP BY action

Check Rate Limiting:
  Send 60+ requests in 1 minute → should get 429 error after 50th

Verify Claude Integration:
  Check for "🤖 AI Designing UI" in logs


═══════════════════════════════════════════════════════════════════════════════
TROUBLESHOOTING
═══════════════════════════════════════════════════════════════════════════════

ERROR: "Cannot find module './ai-ui-designer-routes'"
SOLUTION: Make sure ai-ui-designer-routes.js is in botmantra-backend/routes/

ERROR: "ANTHROPIC_API_KEY is not set"
SOLUTION: Add ANTHROPIC_API_KEY to .env file

ERROR: "Cannot read property 'handleAction' of undefined"
SOLUTION: Make sure AIUIDesignerKernel is imported and instantiated

ERROR: "Prompt is required"
SOLUTION: POST request must include "prompt" field in payload

ERROR: "502 Bad Gateway"
SOLUTION: Server crashed. Check logs: tail -100 server-output.log

ERROR: "401 Unauthorized"
SOLUTION: Missing or invalid Authorization header

ERROR: "429 Too Many Requests"
SOLUTION: Rate limit exceeded. Wait 1 minute or upgrade plan


═══════════════════════════════════════════════════════════════════════════════
NEXT STEPS
═══════════════════════════════════════════════════════════════════════════════

1. ✅ Basic Setup - DONE
2. → Frontend integration
3. → White-label configuration
4. → Template marketplace
5. → Advanced AI features
6. → Mobile app support
7. → Enterprise deployment

═══════════════════════════════════════════════════════════════════════════════

Questions? Check the full guide: AI_UI_DESIGNER_COMPLETE_GUIDE.md

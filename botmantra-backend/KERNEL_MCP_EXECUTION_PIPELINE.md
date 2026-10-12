# Kernel MCP Execution Pipeline (NodeJS)

## Purpose
UI → /kernel/execute → OpenAI (tools) → Supabase RPC → Response → Memory → Event Log

Enterprise-grade, tool-aware, trust-gated.

---

## Step 1 — Imports

```js
const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");
const OpenAI = require("openai");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
```

---

## Step 2 — Tool Registry Loader

Create file: tools/toolRegistry.js

```js
module.exports = require("./toolRegistry.json");
```

Load inside kernel:

```js
const toolRegistry = require("../tools/toolRegistry");
```

---

## Step 3 — Main Execution Endpoint

```js
router.post("/kernel/execute", async (req, res) => {
  try {
    const { user_id, business_id, message } = req.body;

    if (!user_id || !business_id || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 1️⃣ PERMISSION CHECK (example)
    const { data: allowed } = await supabase.rpc("check_feature_access", {
      p_business_id: business_id,
      p_feature_key: "kernel_execute"
    });

    if (!allowed) {
      return res.status(403).json({ error: "Access denied" });
    }

    // 2️⃣ LOAD USER MEMORY
    const { data: memory } = await supabase.rpc("load_user_memory", {
      p_user: user_id
    });

    // 3️⃣ BUILD MESSAGE STACK
    const messages = [
      {
        role: "system",
        content: "You are the BotMantra Kernel AI Controller."
      },
      {
        role: "system",
        content: JSON.stringify(memory || {})
      },
      {
        role: "user",
        content: message
      }
    ];

    // 4️⃣ OPENAI CALL (WITH TOOL MODE)
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      tools: toolRegistry,
      tool_choice: "auto"
    });

    const toolCall = completion.choices[0].message.tool_calls;

    // 5️⃣ HANDLE TOOL EXECUTION
    if (toolCall && toolCall.length > 0) {
      const toolResponse = await handleToolCall(toolCall[0], business_id, user_id);
      return res.json(toolResponse);
    }

    // 6️⃣ NORMAL CHAT RESPONSE
    const reply = completion.choices[0].message.content;

    await supabase.rpc("save_user_memory", {
      p_user: user_id,
      p_context: { last_reply: reply },
      p_action: "chat"
    });

    return res.json({ reply });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Kernel execution failed" });
  }
});
```

---

## Tool Execution Handler

```js
async function handleToolCall(toolCall, business_id, user_id) {
  const functionName = toolCall.function.name;
  const args = JSON.parse(toolCall.function.arguments);

  // Inject business_id if missing
  if (!args.p_business_id) {
    args.p_business_id = business_id;
  }

  const { data, error } = await supabase.rpc(functionName, args);

  if (error) {
    throw new Error(error.message);
  }

  return {
    action: functionName,
    result: data
  };
}
```

---

## Optional — Rate Limiting

```bash
npm install express-rate-limit
```

```js
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30
});

router.use(limiter);
```

---

## Optional — Event Logging

```js
await supabase.from("node_event_queue").insert({
  business_id,
  user_id,
  event_type: "kernel_execute",
  payload: { message }
});
```

---

## Optional — Trust Gating

```js
const { data: trust } = await supabase
  .from("node_trust_state")
  .select("trust_score")
  .eq("user_id", user_id)
  .single();

if (trust?.trust_score < 20) {
  return res.status(403).json({ error: "Trust level too low" });
}
```

/**
 * 🧠 NODE OS INTERACTION CLASSIFIER
 * Control-plane router for all user interactions
 * Routes intent → appropriate API without execution
 * 
 * Features:
 * - Session validation via kernel
 * - OpenAI-powered intent classification
 * - Pure routing logic (no execution)
 * - Structured JSON response for UI/API coordination
 * 
 * Date: February 2, 2026
 */

const express = require("express");
const router = express.Router();
const KernelEngine = require("../kernel-engine");
const { openaiClient } = require("../services/openai-service");

// Initialize kernel engine
const kernel = new KernelEngine(
  process.env.SUPABASE_URL,
  process.env.SERVICE_ROLE_KEY
);

// ================================
// NODE OS INTERACTION CLASSIFIER
// ================================

router.post("/classify", async (req, res) => {

  try {

    const { message, session_token, ui_context } = req.body;

    if (!message || !session_token) {
      return res.status(400).json({
        success: false,
        error: "message and session_token required"
      });
    }

    // Check if OpenAI is available
    if (!openaiClient) {
      return res.status(503).json({
        success: false,
        error: "OpenAI service unavailable",
        message: "OPENAI_API_KEY not configured in .env file"
      });
    }

    // -----------------------------
    // STEP 1 — Validate Session
    // -----------------------------

    const sessionResult = await kernel.validateSession(session_token);

    if (!sessionResult.valid) {
      return res.status(401).json({
        success: false,
        error: "Invalid or expired session",
        reason: sessionResult.reason
      });
    }

    const nodeContext = {
      node_id: sessionResult.node_id,
      trust_score: sessionResult.trust_score,
      authority_level: sessionResult.authority_level || 1
    };

    // -----------------------------
    // STEP 2 — Build AI Prompt
    // -----------------------------

    const systemPrompt = `
You are the Node OS Interaction Router.

Your job is to classify user intent and provide routing instructions.

Return ONLY valid JSON with these exact fields:

{
  "chat_category": "greeting" | "information" | "navigation",
  
  "data_actions": ["read", "write", "update", "delete"],
  
  "ui_actions": [
    "create_ui", "update_ui", "delete_ui",
    "create_card", "update_card",
    "create_widget", "update_widget",
    "create_module", "update_module",
    "create_table", "update_table",
    "create_field", "update_field",
    "theme_change", "layout_change"
  ],
  
  "response_mode": "chat_reply" | "page_navigation" | "ui_render" | "ui_update",
  
  "render_from_core": boolean,
  
  "target_component": string,
  
  "properties": {},
  
  "security_flag": "normal" | "requires_authorization",
  
  "confidence": 0.0 to 1.0
}

CLASSIFICATION RULES:

1. chat_category:
   - "greeting": Hi, Hello, Good morning
   - "information": Questions, explanations, help requests
   - "navigation": Go to, open, show page

2. data_actions (can be multiple):
   - "read": Fetch, show, display, get data
   - "write": Create, add, insert new data
   - "update": Modify, change, edit existing data
   - "delete": Remove, delete, drop data

3. ui_actions (can be multiple):
   - "create_card": Create dashboard card
   - "create_widget": Create widget
   - "create_table": Create data table
   - "create_module": Create module/component
   - "update_ui": Modify existing UI
   - "theme_change": Change colors/theme
   - "layout_change": Modify layout

4. response_mode:
   - "chat_reply": Simple text response
   - "page_navigation": Route to different page
   - "ui_render": Generate new UI from core_node
   - "ui_update": Update existing UI element

5. render_from_core:
   - true: UI should be fetched from node_core table
   - false: UI can be generated client-side

6. target_component:
   - Component name: "wallet_card", "dashboard", "settings", etc.

7. properties:
   - Additional context for execution
   - Example: { "source": "wallet.balance", "table": "users" }

8. security_flag:
   - "normal": Safe operation
   - "requires_authorization": Needs permission check

9. confidence:
   - Your confidence score (0.0 to 1.0)

EXAMPLES:

Input: "Create a wallet balance card"
Output:
{
  "chat_category": "information",
  "data_actions": ["read"],
  "ui_actions": ["create_card"],
  "response_mode": "ui_render",
  "render_from_core": true,
  "target_component": "wallet_card",
  "properties": { "source": "wallet.balance" },
  "security_flag": "normal",
  "confidence": 0.94
}

Input: "Show my transaction history"
Output:
{
  "chat_category": "information",
  "data_actions": ["read"],
  "ui_actions": [],
  "response_mode": "page_navigation",
  "render_from_core": false,
  "target_component": "transactions_page",
  "properties": { "table": "transactions" },
  "security_flag": "normal",
  "confidence": 0.92
}

Input: "Delete all users"
Output:
{
  "chat_category": "information",
  "data_actions": ["delete"],
  "ui_actions": [],
  "response_mode": "chat_reply",
  "render_from_core": false,
  "target_component": null,
  "properties": { "table": "users", "scope": "all" },
  "security_flag": "requires_authorization",
  "confidence": 0.97
}

Input: "Hello"
Output:
{
  "chat_category": "greeting",
  "data_actions": [],
  "ui_actions": [],
  "response_mode": "chat_reply",
  "render_from_core": false,
  "target_component": null,
  "properties": {},
  "security_flag": "normal",
  "confidence": 0.99
}

IMPORTANT:
- Return ONLY the JSON object
- No explanatory text before or after
- All fields are required
- Arrays can be empty []
- Strings can be null
`;

    // -----------------------------
    // STEP 3 — OpenAI Call
    // -----------------------------

    const aiResponse = await openaiClient.chat.completions.create({

      model: "gpt-4o-mini",

      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],

      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const rawOutput = aiResponse.choices[0].message.content;

    let parsedResult;

    try {
      parsedResult = JSON.parse(rawOutput);
    } catch (e) {
      return res.status(500).json({
        success: false,
        error: "AI response parse error",
        raw: rawOutput
      });
    }

    // -----------------------------
    // STEP 4 — Return Result
    // -----------------------------

    return res.json({
      success: true,
      classification: parsedResult,
      node_context: nodeContext
    });

  } catch (error) {

    console.error("Interaction Classifier Error:", error);

    return res.status(500).json({
      success: false,
      error: "Classifier service failure",
      details: error.message
    });

  }

});

// ================================
// BATCH CLASSIFICATION
// ================================

router.post("/classify-batch", async (req, res) => {

  try {

    const { messages, session_token } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: "messages array required"
      });
    }

    if (!session_token) {
      return res.status(400).json({
        success: false,
        error: "session_token required"
      });
    }

    // Validate session once for batch
    const sessionResult = await kernel.validateSession(session_token);

    if (!sessionResult.valid) {
      return res.status(401).json({
        success: false,
        error: "Invalid or expired session"
      });
    }

    const nodeContext = {
      node_id: sessionResult.node_id,
      trust_score: sessionResult.trust_score,
      authority_level: sessionResult.authority_level || 1
    };

    // Process each message
    const classifications = [];

    for (const msgObj of messages) {
      try {
        // Make individual classification request
        const singleRequest = {
          message: msgObj.message,
          session_token: session_token,
          ui_context: msgObj.context || {}
        };

        // Reuse the classify logic inline
        const systemPrompt = getSystemPrompt();
        
        const aiResponse = await openaiClient.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: msgObj.message }
          ],
          temperature: 0.1,
          response_format: { type: "json_object" }
        });

        const rawOutput = aiResponse.choices[0].message.content;
        const parsedResult = JSON.parse(rawOutput);
        
        classifications.push(parsedResult);

      } catch (e) {
        // Add error classification
        classifications.push({
          error: true,
          message: msgObj.message,
          reason: e.message
        });
      }
    }

    return res.json({
      success: true,
      classifications: classifications,
      count: classifications.length,
      node_context: nodeContext
    });

  } catch (error) {
    console.error("Batch Classification Error:", error);
    return res.status(500).json({
      success: false,
      error: "Batch classification failure",
      details: error.message
    });
  }

});

// ================================
// INTENT DOCUMENTATION
// ================================

router.get("/intents", (req, res) => {
  res.json({
    success: true,
    intents: {
      chat_categories: [
        { value: "greeting", description: "Casual greetings and hellos" },
        { value: "information", description: "Questions and information requests" },
        { value: "navigation", description: "Page and route navigation" }
      ],
      data_actions: [
        { value: "read", description: "Fetch or display data" },
        { value: "write", description: "Create new data" },
        { value: "update", description: "Modify existing data" },
        { value: "delete", description: "Remove data" }
      ],
      ui_actions: [
        { value: "create_card", description: "Create dashboard card" },
        { value: "create_widget", description: "Create widget component" },
        { value: "create_table", description: "Create data table" },
        { value: "create_module", description: "Create module/component" },
        { value: "update_ui", description: "Modify existing UI" },
        { value: "theme_change", description: "Change theme/colors" },
        { value: "layout_change", description: "Modify layout" }
      ],
      response_modes: [
        { value: "chat_reply", description: "Simple text response" },
        { value: "page_navigation", description: "Navigate to page" },
        { value: "ui_render", description: "Render UI from core_node" },
        { value: "ui_update", description: "Update existing UI element" }
      ],
      security_flags: [
        { value: "normal", description: "Safe operation" },
        { value: "requires_authorization", description: "Needs permission check" }
      ]
    }
  });
});

// ================================
// HELPER FUNCTIONS
// ================================

function getSystemPrompt() {
  return `
You are the Node OS Interaction Router.

Your job is to classify user intent and provide routing instructions.

Return ONLY valid JSON with these exact fields:

{
  "chat_category": "greeting" | "information" | "navigation",
  "data_actions": ["read", "write", "update", "delete"],
  "ui_actions": ["create_ui", "update_ui", "delete_ui", "create_card", "update_card", "create_widget", "update_widget", "create_module", "update_module", "create_table", "update_table", "create_field", "update_field", "theme_change", "layout_change"],
  "response_mode": "chat_reply" | "page_navigation" | "ui_render" | "ui_update",
  "render_from_core": boolean,
  "target_component": string,
  "properties": {},
  "security_flag": "normal" | "requires_authorization",
  "confidence": 0.0 to 1.0
}

Return ONLY the JSON object with no explanatory text.
`;
}

module.exports = router;

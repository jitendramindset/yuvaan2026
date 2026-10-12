/**
 * ═══════════════════════════════════════════════════════════════
 * NODE OS INTERACTION CLASSIFIER
 * ═══════════════════════════════════════════════════════════════
 * 
 * Purpose: AI-powered intent classification for Node OS routing
 * 
 * Classification Categories:
 * - greeting: Hello, hi, good morning
 * - information: What is, show me, tell me about
 * - navigation: Go to, open, show page
 * - ui_creation: Create widget, add table, build form
 * - data_read: Get data, fetch records, show list
 * - data_write: Add new, create entry, insert
 * - data_update: Change, modify, edit
 * - data_delete: Remove, delete, drop
 * 
 * Flow: User Input → AI Classify → Route Decision → Execute
 * ═══════════════════════════════════════════════════════════════
 */

const express = require('express');
const router = express.Router();

// Import OpenAI configuration from environment
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * ═══════════════════════════════════════════════════════════════
 * INTERACTION CLASSIFIER - MAIN ENDPOINT
 * ═══════════════════════════════════════════════════════════════
 */
router.post('/classify', async (req, res) => {
  try {
    const { message, session_token, user_id, node_id, context } = req.body;

    // Validate required fields
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Optional: Validate session if provided
    if (session_token) {
      const isValidSession = await validateSession(session_token, req.supabase);
      if (!isValidSession) {
        return res.status(401).json({
          success: false,
          error: 'Invalid session token'
        });
      }
    }

    // Classify intent using AI
    const classification = await classifyIntent(message, context);

    // Log classification for karma/dharma tracking
    if (user_id) {
      await logInteraction(req.supabase, user_id, node_id, message, classification);
    }

    // Return classification result
    res.json({
      success: true,
      classification,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Classification error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ═══════════════════════════════════════════════════════════════
 * BATCH CLASSIFICATION - For multiple messages
 * ═══════════════════════════════════════════════════════════════
 */
router.post('/classify-batch', async (req, res) => {
  try {
    const { messages, session_token, user_id } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: 'Messages array is required'
      });
    }

    const classifications = await Promise.all(
      messages.map(msg => classifyIntent(msg.message, msg.context))
    );

    res.json({
      success: true,
      classifications,
      count: classifications.length
    });

  } catch (error) {
    console.error('Batch classification error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ═══════════════════════════════════════════════════════════════
 * GET SUPPORTED INTENTS - Documentation endpoint
 * ═══════════════════════════════════════════════════════════════
 */
router.get('/intents', (req, res) => {
  res.json({
    success: true,
    intents: {
      greeting: {
        description: 'Greeting or casual conversation',
        examples: ['hello', 'hi', 'good morning', 'hey there'],
        action: 'respond_chat'
      },
      information: {
        description: 'Request for information or explanation',
        examples: ['what is', 'tell me about', 'explain', 'how does'],
        action: 'provide_data'
      },
      navigation: {
        description: 'Navigate to different page or section',
        examples: ['go to dashboard', 'open settings', 'show profile'],
        action: 'route_navigation'
      },
      ui_creation: {
        description: 'Create or modify UI components',
        examples: ['create widget', 'add table', 'build form', 'make dashboard'],
        action: 'render_ui'
      },
      data_read: {
        description: 'Retrieve or view data',
        examples: ['show users', 'get orders', 'list products', 'fetch data'],
        action: 'execute_read'
      },
      data_write: {
        description: 'Create new data entries',
        examples: ['add user', 'create order', 'insert record', 'new entry'],
        action: 'execute_create'
      },
      data_update: {
        description: 'Modify existing data',
        examples: ['update user', 'change status', 'edit record', 'modify'],
        action: 'execute_update'
      },
      data_delete: {
        description: 'Remove data entries',
        examples: ['delete user', 'remove order', 'drop table', 'clear data'],
        action: 'execute_delete'
      }
    }
  });
});

/**
 * ═══════════════════════════════════════════════════════════════
 * CORE CLASSIFICATION ENGINE
 * ═══════════════════════════════════════════════════════════════
 */
async function classifyIntent(message, context = {}) {
  // Build classification prompt
  const prompt = buildClassificationPrompt(message, context);

  try {
    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: getSystemPrompt()
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Parse AI response to structured format
    const classification = parseClassification(aiResponse, message);

    return classification;

  } catch (error) {
    console.error('AI classification error:', error);
    // Fallback to pattern-based classification
    return fallbackClassification(message);
  }
}

/**
 * ═══════════════════════════════════════════════════════════════
 * SYSTEM PROMPT FOR CLASSIFICATION
 * ═══════════════════════════════════════════════════════════════
 */
function getSystemPrompt() {
  return `You are the Node OS Interaction Classifier.

Your job is to classify user messages into ONE primary intent category.

Categories:
- greeting: Greetings, casual conversation
- information: Questions, explanations, knowledge requests
- navigation: Page navigation, screen changes
- ui_creation: Widget/component creation or modification
- data_read: Data retrieval, viewing, listing
- data_write: Creating new data entries
- data_update: Modifying existing data
- data_delete: Removing data

Response Format (JSON only):
{
  "intent": "category_name",
  "confidence": 0.95,
  "data_action": null | "read" | "write" | "update" | "delete",
  "ui_action": null | "render" | "navigate" | "create" | "modify",
  "target_component": "dashboard" | "table" | "form" | "widget" | null,
  "entities": {
    "table_name": "users",
    "action": "create",
    "fields": []
  },
  "response_mode": "chat" | "navigation" | "ui_render" | "data_operation",
  "render_from_core": true | false,
  "security_flag": "safe" | "requires_permission" | "dangerous",
  "suggested_route": "/api/route/path"
}

Rules:
1. Always return valid JSON
2. Confidence must be 0.0 to 1.0
3. Choose ONE primary intent
4. Extract relevant entities
5. Set security_flag based on action risk
6. render_from_core = true if UI needs to be dynamically generated`;
}

/**
 * ═══════════════════════════════════════════════════════════════
 * BUILD CLASSIFICATION PROMPT
 * ═══════════════════════════════════════════════════════════════
 */
function buildClassificationPrompt(message, context) {
  return `Classify this user message:

Message: "${message}"

Context:
${JSON.stringify(context, null, 2)}

Analyze and classify into the appropriate category with full JSON response.`;
}

/**
 * ═══════════════════════════════════════════════════════════════
 * PARSE AI CLASSIFICATION RESPONSE
 * ═══════════════════════════════════════════════════════════════
 */
function parseClassification(aiResponse, originalMessage) {
  try {
    // Try to extract JSON from AI response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      if (!parsed.intent) {
        throw new Error('Missing intent in classification');
      }

      return {
        intent: parsed.intent,
        confidence: parsed.confidence || 0.8,
        data_action: parsed.data_action || null,
        ui_action: parsed.ui_action || null,
        target_component: parsed.target_component || null,
        entities: parsed.entities || {},
        response_mode: parsed.response_mode || 'chat',
        render_from_core: parsed.render_from_core || false,
        security_flag: parsed.security_flag || 'safe',
        suggested_route: parsed.suggested_route || null,
        original_message: originalMessage
      };
    }
    
    throw new Error('No JSON found in AI response');

  } catch (error) {
    console.error('Parse error:', error);
    return fallbackClassification(originalMessage);
  }
}

/**
 * ═══════════════════════════════════════════════════════════════
 * FALLBACK PATTERN-BASED CLASSIFICATION
 * ═══════════════════════════════════════════════════════════════
 */
function fallbackClassification(message) {
  const lowerMessage = message.toLowerCase().trim();

  // Greeting patterns
  if (/^(hi|hello|hey|good morning|good afternoon|good evening)/.test(lowerMessage)) {
    return {
      intent: 'greeting',
      confidence: 0.9,
      data_action: null,
      ui_action: null,
      target_component: null,
      entities: {},
      response_mode: 'chat',
      render_from_core: false,
      security_flag: 'safe',
      suggested_route: null,
      original_message: message
    };
  }

  // Navigation patterns
  if (/^(go to|open|show|navigate to|display)/.test(lowerMessage)) {
    return {
      intent: 'navigation',
      confidence: 0.85,
      data_action: null,
      ui_action: 'navigate',
      target_component: extractTarget(lowerMessage),
      entities: {},
      response_mode: 'navigation',
      render_from_core: false,
      security_flag: 'safe',
      suggested_route: '/navigate',
      original_message: message
    };
  }

  // UI Creation patterns
  if (/(create|build|make|add).*(widget|dashboard|table|form|chart)/.test(lowerMessage)) {
    return {
      intent: 'ui_creation',
      confidence: 0.8,
      data_action: null,
      ui_action: 'create',
      target_component: extractComponent(lowerMessage),
      entities: {},
      response_mode: 'ui_render',
      render_from_core: true,
      security_flag: 'requires_permission',
      suggested_route: '/api/ui/render',
      original_message: message
    };
  }

  // Data Read patterns
  if (/(show|get|list|fetch|display|view).*(data|users|records|orders)/.test(lowerMessage)) {
    return {
      intent: 'data_read',
      confidence: 0.85,
      data_action: 'read',
      ui_action: null,
      target_component: null,
      entities: { table: extractTableName(lowerMessage) },
      response_mode: 'data_operation',
      render_from_core: false,
      security_flag: 'requires_permission',
      suggested_route: '/api/kernel/execute',
      original_message: message
    };
  }

  // Data Write patterns
  if (/(add|create|insert).*(user|record|entry|data)/.test(lowerMessage)) {
    return {
      intent: 'data_write',
      confidence: 0.8,
      data_action: 'write',
      ui_action: null,
      target_component: null,
      entities: {},
      response_mode: 'data_operation',
      render_from_core: false,
      security_flag: 'requires_permission',
      suggested_route: '/api/kernel/execute',
      original_message: message
    };
  }

  // Data Update patterns
  if (/(update|change|modify|edit)/.test(lowerMessage)) {
    return {
      intent: 'data_update',
      confidence: 0.8,
      data_action: 'update',
      ui_action: null,
      target_component: null,
      entities: {},
      response_mode: 'data_operation',
      render_from_core: false,
      security_flag: 'requires_permission',
      suggested_route: '/api/kernel/execute',
      original_message: message
    };
  }

  // Data Delete patterns
  if (/(delete|remove|drop|clear)/.test(lowerMessage)) {
    return {
      intent: 'data_delete',
      confidence: 0.85,
      data_action: 'delete',
      ui_action: null,
      target_component: null,
      entities: {},
      response_mode: 'data_operation',
      render_from_core: false,
      security_flag: 'dangerous',
      suggested_route: '/api/kernel/execute',
      original_message: message
    };
  }

  // Default: information request
  return {
    intent: 'information',
    confidence: 0.6,
    data_action: null,
    ui_action: null,
    target_component: null,
    entities: {},
    response_mode: 'chat',
    render_from_core: false,
    security_flag: 'safe',
    suggested_route: '/api/chat',
    original_message: message
  };
}

/**
 * Helper: Extract target from navigation message
 */
function extractTarget(message) {
  const targets = ['dashboard', 'settings', 'profile', 'users', 'orders', 'products'];
  for (const target of targets) {
    if (message.includes(target)) return target;
  }
  return null;
}

/**
 * Helper: Extract component type from UI creation message
 */
function extractComponent(message) {
  const components = ['widget', 'dashboard', 'table', 'form', 'chart', 'card'];
  for (const component of components) {
    if (message.includes(component)) return component;
  }
  return null;
}

/**
 * Helper: Extract table name from data operation message
 */
function extractTableName(message) {
  const tables = ['users', 'orders', 'products', 'customers', 'invoices'];
  for (const table of tables) {
    if (message.includes(table)) return table;
  }
  return null;
}

/**
 * ═══════════════════════════════════════════════════════════════
 * SESSION VALIDATION
 * ═══════════════════════════════════════════════════════════════
 */
async function validateSession(sessionToken, supabase) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('session_token', sessionToken)
      .single();

    return !error && data;
  } catch (error) {
    console.error('Session validation error:', error);
    return false;
  }
}

/**
 * ═══════════════════════════════════════════════════════════════
 * LOG INTERACTION (for Karma/Dharma tracking)
 * ═══════════════════════════════════════════════════════════════
 */
async function logInteraction(supabase, userId, nodeId, message, classification) {
  try {
    await supabase.from('node_logs').insert({
      user_id: userId,
      node_id: nodeId,
      event_type: 'interaction_classified',
      event_action: classification.intent,
      description: message,
      metadata: {
        classification,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Log interaction error:', error);
  }
}

module.exports = router;

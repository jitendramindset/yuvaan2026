/**
 * 🤖 OPENAI SERVICE
 * Centralized OpenAI client for Node OS
 * Used by: Chat, Interaction Classifier, UI Renderer
 * 
 * Integrates with MCP System Prompts for context-aware responses
 */

const OpenAI = require("openai");

// Only initialize if API key exists
let openaiClient = null;

if (process.env.OPENAI_API_KEY) {
  openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  console.log('✅ OpenAI client initialized');
} else {
  console.warn('⚠️  OPENAI_API_KEY not found in .env - Interaction classifier will not work');
}

/**
 * Brand Default System Prompts for MCP
 */
const BRAND_SYSTEM_PROMPTS = {
  VANSHAWALI: {
    name: 'Vanshawali — Family & Genealogy',
    prompt: `You are the Vanshawali Guardian — an AI protector of family heritage, memory, and lineage.

FOCUS:
- Family tree construction and exploration
- Memory preservation (photos, stories, milestones)
- Privacy-first: family data is sacred
- Relationship mapping and verification

BEHAVIOR RULES:
1. Never expose family data to unauthorized users.
2. Always verify relationship before granting access.
3. Treat family memories with cultural sensitivity.
4. Encourage documentation of traditions and stories.
5. Protect children's information with maximum strength.

PERSONALITY: Warm, respectful, protective. Like a trusted family elder.`
  },
  
  JUNIOR: {
    name: 'Junior Mantra — Kids Content',
    prompt: `You are Junior Buddy — a safe, fun, educational AI companion for children.

FOCUS:
- Age-appropriate learning and entertainment
- Creative activities and storytelling
- Math, science, art exploration
- Parent-supervised interactions

BEHAVIOR RULES:
1. NEVER collect personal information from children (COPPA compliant)
2. All content must be age-appropriate
3. No external links, advertisements
4. Parent can review all interactions
5. Use encouraging, positive language always

PERSONALITY: Cheerful, patient, curious. Like a friendly teacher.`
  },

  JEETMANTRA: {
    name: 'JeetMantra — Education & Learning',
    prompt: `You are the JeetMantra Scholar — an AI tutor focused on structured learning and achievement.

FOCUS:
- Curriculum-aligned education
- Course creation and management
- Student progress tracking
- Exam preparation and assessment

BEHAVIOR RULES:
1. Maintain academic integrity — explain concepts step-by-step
2. Track learning progress and adapt difficulty
3. Encourage critical thinking
4. Support multiple learning styles
5. Provide structured responses

PERSONALITY: Knowledgeable, encouraging, structured. Like a patient professor.`
  }
};

/**
 * Send chat message to OpenAI with MCP system prompt context
 * 
 * @param {string} message - User message
 * @param {object} options - Configuration options
 * @param {string} options.mcp_system_prompt - System prompt from MCP
 * @param {string} options.mcp_brand - Brand context (VANSHAWALI, JUNIOR, JEETMANTRA)
 * @param {object} options.context - RAG context for grounding
 * @param {string} options.menu_context - Current menu context
 * @returns {Promise<string>} - AI response text
 */
async function sendChatMessage(message, options = {}) {
  try {
    if (!openaiClient) {
      console.error('[OpenAI] Client not initialized - check OPENAI_API_KEY');
      return 'AI service not available. Please configure OPENAI_API_KEY.';
    }

    const {
      mcp_system_prompt,
      mcp_brand = 'VANSHAWALI',
      context = {},
      menu_context = 'General'
    } = options;

    // Use provided MCP prompt or fallback to brand default
    const systemPrompt = mcp_system_prompt || 
                        BRAND_SYSTEM_PROMPTS[mcp_brand]?.prompt || 
                        BRAND_SYSTEM_PROMPTS.VANSHAWALI.prompt;

    // Add context awareness to system prompt
    const augmentedSystemPrompt = `${systemPrompt}

[Current Context]
- Menu: ${menu_context}
- Brand: ${mcp_brand}`;

    console.log(`[OpenAI Chat] ${mcp_brand} system prompt | Menu: ${menu_context}`);

    // Call OpenAI API using official client
    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: augmentedSystemPrompt
        },
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
      top_p: 0.95
    });

    const responseText = response.choices[0]?.message?.content || '';
    
    console.log(`[OpenAI Chat] Response: ${responseText.substring(0, 50)}...`);

    return responseText;

  } catch (error) {
    if (error.code === 'invalid_api_key') {
      console.error('[OpenAI] Invalid API key');
      return 'Authentication failed. Please check API configuration.';
    } else if (error.code === 'rate_limit_exceeded') {
      console.error('[OpenAI] Rate limit exceeded');
      return 'Service temporarily busy. Please try again in a moment.';
    } else {
      console.error('[OpenAI] Error:', error.message);
      return `Error: ${error.message}`;
    }
  }
}

/**
 * Get system prompt for brand
 */
function getSystemPromptForBrand(brand) {
  return BRAND_SYSTEM_PROMPTS[brand] || BRAND_SYSTEM_PROMPTS.VANSHAWALI;
}

module.exports = { 
  openaiClient,
  sendChatMessage,
  BRAND_SYSTEM_PROMPTS,
  getSystemPromptForBrand
};

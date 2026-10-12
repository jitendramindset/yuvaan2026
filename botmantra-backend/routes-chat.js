/**
 * 🤖 UNIFIED CHAT API
 * Single endpoint for all platforms: Web, App, WhatsApp, Telegram
 * Handles text, voice, attachments, navigation, and node execution
 * Multi-language support with dynamic system prompts
 * Date: January 29, 2026
 */

const express = require('express');
const multer = require('multer');
const KernelEngine = require('./kernel-engine');
const { detectLanguage, t, translateText } = require('./language-support');
const { getEffectiveSystemPrompt } = require('./node-system-prompts');

// File upload configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

module.exports = function(app, supabaseClient) {
  const router = express.Router();
  const kernel = new KernelEngine(
    process.env.SUPABASE_URL,
    process.env.SERVICE_ROLE_KEY
  );

  /**
   * ═══════════════════════════════════════════════
   * 🎯 MAIN UNIFIED CHAT ENDPOINT
   * ═══════════════════════════════════════════════
   * Handles ALL interactions:
   * - Text queries
   * - Voice messages
   * - File attachments
   * - Navigation commands
   * - Node execution
   * 
   * Platform Detection:
   * - web: Full JSON with UI data
   * - app: Mobile-optimized JSON
   * - whatsapp: Text-formatted response
   * - telegram: Telegram-formatted response
   */
  router.post('/chat/process', upload.single('file'), async (req, res) => {
    try {
      // ════════════════════════════════════════════════════════════════
      // 1. DETECT LANGUAGE & GET TRANSLATIONS
      // ════════════════════════════════════════════════════════════════
      const language = detectLanguage(req);
      
      const {
        // User identification
        userId,
        sessionId,
        
        // Platform info
        platform = 'web', // web | app | whatsapp | telegram
        deviceType,
        
        // Message data
        message,
        messageType = 'text', // text | voice | file
        query,
        
        // Navigation
        currentNode,
        targetNode,
        action,
        
        // Context
        state,
        previousMessages,
        
        // Auth
        token
      } = req.body;

      // File attachment if present
      const file = req.file;

      // ════════════════════════════════════════
      // 1. AUTHENTICATE USER
      // ════════════════════════════════════════
      let user = null;
      if (userId) {
        const { data: userData } = await supabaseClient
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
        user = userData;
      }

      // ════════════════════════════════════════
      // 2. PROCESS FILE UPLOAD (if present)
      // ════════════════════════════════════════
      let fileVector = null;
      if (file) {
        fileVector = await processFileUpload(file, userId, supabaseClient);
      }

      // ════════════════════════════════════════
      // 3. DETERMINE INTENT & ACTION
      // ════════════════════════════════════════
      const intent = await analyzeIntent(
        message || query,
        currentNode,
        user,
        previousMessages
      );

      // ════════════════════════════════════════
      // 4. EXECUTE ACTION BASED ON INTENT
      // ════════════════════════════════════════
      let response;
      
      switch (intent.type) {
        case 'navigate':
          // Navigate to a different node/screen
          response = await handleNavigation(
            intent.targetNode,
            user,
            kernel,
            supabaseClient
          );
          break;

        case 'query':
          // Answer a question using current node context
          response = await handleQuery(
            message || query,
            currentNode,
            user,
            fileVector,
            kernel,
            supabaseClient
          );
          break;

        case 'action':
          // Execute a specific node action
          response = await handleNodeAction(
            intent.action,
            intent.nodeId,
            intent.payload,
            user,
            kernel,
            supabaseClient
          );
          break;

        case 'auth':
          // Authentication-related action
          response = await handleAuthAction(
            intent.authAction,
            req.body,
            supabaseClient
          );
          break;

        default:
          // General chat response
          response = await handleGeneralChat(
            message || query,
            currentNode,
            user,
            supabaseClient
          );
      }

      // ════════════════════════════════════════
      // 5. FORMAT RESPONSE FOR PLATFORM
      // ════════════════════════════════════════
      const formattedResponse = await formatResponseForPlatform(
        response,
        platform,
        user,
        intent,
        language  // Pass user's language for response translation
      );

      // ════════════════════════════════════════
      // 6. SAVE CONVERSATION HISTORY
      // ════════════════════════════════════════
      await saveConversation(
        userId,
        sessionId,
        message || query,
        formattedResponse,
        intent,
        supabaseClient
      );

      // Return response
      res.json({
        success: true,
        platform,
        intent: intent.type,
        response: formattedResponse,
        timestamp: new Date(),
        sessionId,
        fileProcessed: fileVector ? true : false
      });

    } catch (error) {
      console.error('Chat processing error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        platform: req.body.platform || 'web',
        response: formatErrorForPlatform(error, req.body.platform)
      });
    }
  });

  /**
   * ═══════════════════════════════════════════════
   * 📤 BINARY DATA & VECTOR CREATION
   * ═══════════════════════════════════════════════
   * NO FILE STORAGE - Only binary data + vectors
   */
  async function processFileUpload(file, userId, supabase) {
    try {
      // 1. Convert file to binary data
      const binaryData = file.buffer;
      const base64Data = binaryData.toString('base64');
      
      // 2. Extract text/metadata based on file type
      let textContent = '';
      let metadata = {
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        uploadDate: new Date().toISOString()
      };

      if (file.mimetype.includes('text') || file.mimetype.includes('json')) {
        textContent = binaryData.toString('utf-8');
      } else if (file.mimetype.includes('pdf')) {
        textContent = `PDF file: ${file.originalname}`;
        metadata.contentType = 'document';
      } else if (file.mimetype.includes('image')) {
        textContent = `Image file: ${file.originalname}`;
        metadata.contentType = 'image';
      } else if (file.mimetype.includes('video')) {
        textContent = `Video file: ${file.originalname}`;
        metadata.contentType = 'video';
      } else if (file.mimetype.includes('audio')) {
        textContent = `Audio file: ${file.originalname}`;
        metadata.contentType = 'audio';
      }

      // 3. Create vector embedding from text representation
      const embedding = await createEmbedding(textContent);

      // 4. Store ONLY binary data + vector (NO FILE STORAGE)
      const { data: vectorData } = await supabase
        .from('node_vectors')
        .insert({
          user_id: userId,
          binary_data: base64Data, // Binary data as base64
          metadata: metadata,
          content_text: textContent,
          embedding: embedding,
          vector_type: getVectorType(file.mimetype),
          permissions: {
            owner: userId,
            visibility: 'private'
          },
          created_at: new Date()
        })
        .select()
        .single();

      return vectorData;

    } catch (error) {
      console.error('Binary data processing error:', error);
      throw new Error(`Binary processing failed: ${error.message}`);
    }
  }

  /**
   * ═══════════════════════════════════════════════
   * 📊 NODE CORE BINARY DATA STORAGE
   * ═══════════════════════════════════════════════
   * Store node data as binary with vector binding
   */
  async function storeNodeBinaryData(nodeData, userId, supabase) {
    try {
      // 1. Convert node data to binary
      const nodeJson = JSON.stringify(nodeData);
      const binaryData = Buffer.from(nodeJson).toString('base64');
      
      // 2. Create text representation for vector
      const textContent = `Node: ${nodeData.name || 'Unnamed'}\n${nodeJson}`;
      
      // 3. Create vector embedding
      const embedding = await createEmbedding(textContent);
      
      // 4. Store in node_core with binary data
      const { data: nodeCoreData } = await supabase
        .from('node_core')
        .insert({
          nid_hash: nodeData.nid_hash || generateNodeHash(),
          owner_id: userId,
          binary_data: binaryData, // Node data as binary
          node_type: nodeData.type || 'default',
          created_at: new Date()
        })
        .select()
        .single();
      
      // 5. Create linked vector
      const { data: vectorData } = await supabase
        .from('node_vectors')
        .insert({
          node_id: nodeCoreData.id,
          nid_hash: nodeCoreData.nid_hash,
          user_id: userId,
          binary_data: binaryData,
          content_text: textContent,
          embedding: embedding,
          vector_type: 'node_data',
          metadata: {
            nodeType: nodeData.type,
            nodeName: nodeData.name
          },
          created_at: new Date()
        })
        .select()
        .single();
      
      return { nodeData: nodeCoreData, vectorData };
      
    } catch (error) {
      console.error('Node binary storage error:', error);
      throw new Error(`Node storage failed: ${error.message}`);
    }
  }

  /**
   * ═══════════════════════════════════════════════
   * 🧠 INTENT ANALYSIS
   * ═══════════════════════════════════════════════
   */
  async function analyzeIntent(message, currentNode, user, history) {
    // Simple intent detection (TODO: enhance with AI)
    const msg = (message || '').toLowerCase();

    // Navigation intents
    if (msg.includes('go to') || msg.includes('navigate') || msg.includes('show')) {
      return {
        type: 'navigate',
        targetNode: extractNodeFromMessage(msg)
      };
    }

    // Auth intents
    if (msg.includes('login') || msg.includes('signin') || msg.includes('signup')) {
      return {
        type: 'auth',
        authAction: msg.includes('signup') ? 'signup' : 'signin'
      };
    }

    // Action intents
    if (msg.includes('create') || msg.includes('update') || msg.includes('delete')) {
      return {
        type: 'action',
        action: extractAction(msg),
        nodeId: currentNode
      };
    }

    // Default: query/question
    return {
      type: 'query',
      query: message
    };
  }

  /**
   * ═══════════════════════════════════════════════
   * 🗺️ NAVIGATION HANDLER
   * ═══════════════════════════════════════════════
   */
  async function handleNavigation(targetNode, user, kernel, supabase) {
    try {
      // ════════════════════════════════════════════════════════════════
      // 1. GET TARGET NODE DATA
      // ════════════════════════════════════════════════════════════════
      const { data: nodeData } = await supabase
        .from('node_core')
        .select('*')
        .eq('nid_hash', targetNode)
        .single();

      if (!nodeData) {
        return {
          type: 'error',
          message: 'Node not found',
          suggestion: 'Please check the node name and try again'
        };
      }

      // ════════════════════════════════════════════════════════════════
      // 2. GET NODE TEMPLATE
      // ════════════════════════════════════════════════════════════════
      const { data: template } = await supabase
        .from('node_templates')
        .select('*')
        .eq('node_id', nodeData.id)
        .single();

      // ════════════════════════════════════════════════════════════════
      // 3. CHECK KARMA/DHARMA-BASED ACCESS CONTROL
      // ════════════════════════════════════════════════════════════════
      let accessLevel = 'STANDARD_ACCESS';
      let canAccess = { allowed: true };
      
      if (user?.id) {
        try {
          // Get user's current karma and dharma
          const { data: karmaLog } = await supabase
            .from('karma_logs')
            .select('karma_score')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          
          const { data: dharmaLog } = await supabase
            .from('dharma_logs')
            .select('dharma_alignment')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          
          const karma = karmaLog?.karma_score || 50;
          const dharma = dharmaLog?.dharma_alignment || 50;
          const weightedScore = (karma * 0.6) + (dharma * 0.4);
          
          // Calculate access level
          if (weightedScore >= 80) {
            accessLevel = 'FULL_ACCESS';
          } else if (weightedScore >= 60) {
            accessLevel = 'STANDARD_ACCESS';
          } else if (weightedScore >= 40) {
            accessLevel = 'LIMITED_ACCESS';
          } else if (weightedScore >= 20) {
            accessLevel = 'RESTRICTED_ACCESS';
          } else {
            accessLevel = 'MINIMAL_ACCESS';
          }
          
          // Check if node has access restrictions
          const { data: policies } = await supabase
            .from('node_policies')
            .select('*')
            .eq('node_id', nodeData.id)
            .eq('enabled', true);
          
          // Determine if access is allowed based on access level
          if (policies && policies.length > 0) {
            const requiresFullAccess = policies.some(p => p.rule_type === 'REQUIRE_FULL_ACCESS');
            if (requiresFullAccess && accessLevel !== 'FULL_ACCESS') {
              canAccess = { allowed: false, reason: 'Insufficient karma/dharma score' };
            }
          }
          
        } catch (accessError) {
          console.warn('Access level check failed:', accessError);
          // Default to STANDARD_ACCESS if error
          accessLevel = 'STANDARD_ACCESS';
        }
      }

      // ════════════════════════════════════════════════════════════════
      // 4. CHECK KERNEL PERMISSION (existing validation)
      // ════════════════════════════════════════════════════════════════
      const kernelValidation = await kernel.validateNodeAction(
        targetNode,
        user?.id,
        'read',
        user?.id
      );
      
      // Combine both checks
      canAccess.allowed = canAccess.allowed && kernelValidation.allowed;
      if (!kernelValidation.allowed) {
        canAccess.reason = kernelValidation.reason;
      }

      if (!canAccess.allowed) {
        return {
          type: 'error',
          message: 'Access denied to this node',
          reason: canAccess.reason || 'Insufficient permissions or karma/dharma score',
          accessLevel: accessLevel,
          suggestion: 'Improve your karma and dharma alignment to access this node'
        };
      }

      return {
        type: 'navigation',
        action: 'navigate',
        targetNode: nodeData.nid_hash,
        nodeData: nodeData,
        template: template,
        ui: template?.ui_config || {},
        permissions: canAccess,
        accessLevel: accessLevel
      };
      
    } catch (error) {
      console.error('Navigation error:', error);
      return {
        type: 'error',
        message: 'Navigation failed',
        error: error.message
      };
    }
  }

  /**
   * ═══════════════════════════════════════════════
   * ❓ QUERY HANDLER (AI-powered)
   * ═══════════════════════════════════════════════
   */
  async function handleQuery(query, currentNode, user, fileContext, kernel, supabase) {
    try {
      // ════════════════════════════════════════════════════════════════
      // 1. GET EFFECTIVE SYSTEM PROMPT (Karma/Dharma-based)
      // ════════════════════════════════════════════════════════════════
      let systemPrompt = 'You are a helpful assistant.';
      
      if (currentNode && user?.id) {
        try {
          systemPrompt = await getEffectiveSystemPrompt(
            currentNode,
            user.id,
            supabase
          );
        } catch (promptError) {
          console.warn('System prompt generation failed, using default:', promptError);
          // Fallback to default prompt
          systemPrompt = DEFAULT_PROMPTS['default'];
        }
      }

      // ════════════════════════════════════════════════════════════════
      // 2. GET CURRENT NODE CONTEXT
      // ════════════════════════════════════════════════════════════════
      let context = '';
      let nodeData = null;
      
      if (currentNode) {
        const { data } = await supabase
          .from('node_core')
          .select('*, node_templates(*)')
          .eq('nid_hash', currentNode)
          .single();
        
        nodeData = data;
        context = `Current node: ${nodeData?.name || currentNode}\n`;
        context += `Node type: ${nodeData?.node_type || 'general'}\n`;
        context += `Node category: ${nodeData?.category || 'default'}\n`;
      }

      // ════════════════════════════════════════════════════════════════
      // 3. ADD FILE CONTEXT IF AVAILABLE
      // ════════════════════════════════════════════════════════════════
      if (fileContext) {
        context += `\nFile content: ${fileContext.content}\n`;
      }

      // ════════════════════════════════════════════════════════════════
      // 4. SEARCH RELEVANT VECTORS
      // ════════════════════════════════════════════════════════════════
      const relevantVectors = await searchVectors(query, user?.id, supabase);
      if (relevantVectors.length > 0) {
        context += `\nRelevant information:\n${relevantVectors.map(v => v.content).join('\n')}`;
      }

      // ════════════════════════════════════════════════════════════════
      // 5. CHECK ACCESS LEVEL BASED ON KARMA
      // ════════════════════════════════════════════════════════════════
      let accessGranted = true;
      let accessLevel = 'STANDARD_ACCESS';
      
      if (user?.id && nodeData) {
        try {
          // Get user's current karma and dharma
          const { data: karmaLog } = await supabase
            .from('karma_logs')
            .select('karma_score')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          
          const { data: dharmaLog } = await supabase
            .from('dharma_logs')
            .select('dharma_alignment')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          
          const karma = karmaLog?.karma_score || 50;
          const dharma = dharmaLog?.dharma_alignment || 50;
          
          // Calculate access level
          const weightedScore = (karma * 0.6) + (dharma * 0.4);
          
          if (weightedScore >= 80) {
            accessLevel = 'FULL_ACCESS';
          } else if (weightedScore >= 60) {
            accessLevel = 'STANDARD_ACCESS';
          } else if (weightedScore >= 40) {
            accessLevel = 'LIMITED_ACCESS';
          } else if (weightedScore >= 20) {
            accessLevel = 'RESTRICTED_ACCESS';
          } else {
            accessLevel = 'MINIMAL_ACCESS';
          }
          
          // Check node policies for access restrictions
          const { data: policies } = await supabase
            .from('node_policies')
            .select('*')
            .eq('node_id', nodeData.id)
            .eq('enabled', true);
          
          // Evaluate policies (simplified - extend as needed)
          if (policies && policies.length > 0) {
            const restrictive = policies.some(p => p.rule_type === 'DENY');
            if (restrictive && accessLevel !== 'FULL_ACCESS') {
              accessGranted = false;
            }
          }
          
          // Add access level to context
          context += `\nUser Access Level: ${accessLevel}\n`;
          context += `Weighted Score (Karma:0.6 + Dharma:0.4): ${weightedScore.toFixed(2)}/100\n`;
          
        } catch (accessError) {
          console.warn('Access level check failed:', accessError);
          // Default to STANDARD_ACCESS
          accessLevel = 'STANDARD_ACCESS';
        }
      }

      // ════════════════════════════════════════════════════════════════
      // 6. CHECK IF ACCESS IS DENIED
      // ════════════════════════════════════════════════════════════════
      if (!accessGranted) {
        return {
          type: 'access_denied',
          query: query,
          answer: 'Access denied to this node. Your karma/dharma score does not meet requirements.',
          accessLevel: accessLevel,
          context: currentNode
        };
      }

      // ════════════════════════════════════════════════════════════════
      // 7. CALL OPENAI FOR ANSWER WITH EFFECTIVE SYSTEM PROMPT
      // ════════════════════════════════════════════════════════════════
      const aiResponse = await getAIResponse(query, context, systemPrompt);

      return {
        type: 'answer',
        query: query,
        answer: aiResponse || 'AI response pending implementation',
        context: currentNode,
        sources: relevantVectors,
        accessLevel: accessLevel,
        systemPromptUsed: systemPrompt.substring(0, 100) + '...'
      };
      
    } catch (error) {
      console.error('Query handling error:', error);
      return {
        type: 'error',
        query: query,
        answer: 'An error occurred while processing your query.',
        error: error.message
      };
    }
  }

  /**
   * ═══════════════════════════════════════════════
   * ⚡ NODE ACTION HANDLER
   * ═══════════════════════════════════════════════
   */
  async function handleNodeAction(action, nodeId, payload, user, kernel, supabase) {
    // Execute kernel action
    const result = await kernel.executeNodeRuntime(
      nodeId,
      user?.id,
      action,
      payload
    );

    return {
      type: 'action_result',
      action: action,
      nodeId: nodeId,
      result: result,
      success: result.success || false
    };
  }

  /**
   * ═══════════════════════════════════════════════
   * 🔐 AUTH HANDLER
   * ═══════════════════════════════════════════════
   */
  async function handleAuthAction(authAction, data, supabase) {
    // Handle signin/signup through chat
    if (authAction === 'signup') {
      return {
        type: 'auth_required',
        action: 'signup',
        message: 'Please provide: Full Name, Email, Mobile, Password',
        ui: {
          screen: 'signup',
          fields: ['fullName', 'email', 'mobileNo', 'password']
        }
      };
    } else {
      return {
        type: 'auth_required',
        action: 'signin',
        message: 'Please provide: Email/Mobile and Password',
        ui: {
          screen: 'signin',
          fields: ['email', 'password']
        }
      };
    }
  }

  /**
   * ═══════════════════════════════════════════════
   * 💬 GENERAL CHAT HANDLER
   * ═══════════════════════════════════════════════
   */
  async function handleGeneralChat(message, currentNode, user, supabase) {
    return {
      type: 'chat',
      message: 'I understand your message. How can I help you?',
      suggestions: [
        'Navigate to a node',
        'Ask a question',
        'Upload a file',
        'View your data'
      ]
    };
  }

  /**
   * ═══════════════════════════════════════════════
   * 📱 PLATFORM-SPECIFIC FORMATTING
   * ═══════════════════════════════════════════════
   */
  async function formatResponseForPlatform(response, platform, user, intent, language = 'en') {
    // ════════════════════════════════════════════════════════════════
    // TRANSLATE RESPONSE BASED ON USER LANGUAGE
    // ════════════════════════════════════════════════════════════════
    try {
      // Translate main response text
      if (response.answer && language !== 'en') {
        response.answer = await translateText(response.answer, language);
      }
      
      // Translate error messages
      if (response.message && language !== 'en') {
        response.message = await translateText(response.message, language);
      }
      
      // Translate suggestions
      if (response.suggestions && Array.isArray(response.suggestions) && language !== 'en') {
        response.suggestions = await Promise.all(
          response.suggestions.map(s => translateText(s, language))
        );
      }
    } catch (translationError) {
      console.warn('Translation failed:', translationError);
      // Continue with original language if translation fails
    }

    switch (platform) {
      case 'web':
        // Full JSON with UI data
        return {
          type: response.type,
          data: response,
          ui: {
            screen: response.ui?.screen || null,
            navigation: response.targetNode || null,
            chatMessage: response.answer || response.message,
            suggestions: response.suggestions || [],
            language: language,
            accessLevel: response.accessLevel || 'STANDARD_ACCESS'
          },
          user: user ? { id: user.id, name: user.full_name } : null
        };

      case 'app':
        // Mobile-optimized JSON
        return {
          type: response.type,
          message: response.answer || response.message,
          action: response.action,
          data: response.nodeData || response.result,
          ui: response.ui,
          language: language,
          accessLevel: response.accessLevel || 'STANDARD_ACCESS'
        };

      case 'whatsapp':
        // WhatsApp text format
        let text = response.answer || response.message || '';
        if (response.suggestions) {
          text += '\n\n' + response.suggestions.map((s, i) => `${i+1}. ${s}`).join('\n');
        }
        return { 
          text,
          language: language,
          accessLevel: response.accessLevel || 'STANDARD_ACCESS'
        };

      case 'telegram':
        // Telegram format with buttons
        return {
          text: response.answer || response.message,
          buttons: response.suggestions || [],
          inline_keyboard: response.ui?.buttons || [],
          language: language,
          accessLevel: response.accessLevel || 'STANDARD_ACCESS'
        };

      default:
        return {
          ...response,
          language: language,
          accessLevel: response.accessLevel || 'STANDARD_ACCESS'
        };
    }
  }

  /**
   * ═══════════════════════════════════════════════
   * � SIMPLIFIED CHAT ENDPOINT (Web UI)
   * ═══════════════════════════════════════════════
   * Simpler endpoint for web chat interface
   */
  router.post('/chat', async (req, res) => {
    try {
      const { message, user, nodeCore, isAuthenticated } = req.body;

      if (!message) {
        return res.json({
          success: false,
          error: 'Message is required'
        });
      }

      // ════════════════════════════════════════════════════════════════
      // 1. ANALYZE USER INTENT
      // ════════════════════════════════════════════════════════════════
      const intent = await analyzeIntent(
        message,
        nodeCore,
        user,
        [] // message history
      );

      // ════════════════════════════════════════════════════════════════
      // 2. ROUTE TO APPROPRIATE HANDLER BASED ON INTENT
      // ════════════════════════════════════════════════════════════════
      let response;

      if (intent.type === 'query') {
        // Query handler - uses kernel engine for AI responses
        response = await handleQuery(
          intent.query,
          nodeCore,
          user,
          null, // fileContext
          kernel,
          supabaseClient
        );
      } else if (intent.type === 'navigate') {
        // Navigation handler
        response = await handleNavigation(intent.targetNode, user, kernel, supabaseClient);
      } else if (intent.type === 'auth') {
        // Auth handler
        response = await handleAuthAction(intent.authAction, user, supabaseClient);
      } else if (intent.type === 'action') {
        // Node action handler
        response = await handleNodeAction(intent.action, intent.nodeId, {}, user, kernel, supabaseClient);
      } else {
        // Default: treat as general chat
        response = await handleGeneralChat(
          message,
          nodeCore,
          user,
          supabaseClient
        );
      }

      // ════════════════════════════════════════════════════════════════
      // 3. DETECT USER LANGUAGE
      // ════════════════════════════════════════════════════════════════
      let userLanguage = 'en';
      if (user?.language) {
        userLanguage = user.language;
      } else {
        userLanguage = detectLanguage(message) || 'en';
      }

      // ════════════════════════════════════════════════════════════════
      // 4. FORMAT RESPONSE FOR WEB PLATFORM
      // ════════════════════════════════════════════════════════════════
      const formattedResponse = await formatResponseForPlatform(
        response,
        'web',
        user,
        intent,
        userLanguage
      );

      // ════════════════════════════════════════════════════════════════
      // 5. RETURN PROPERLY FORMATTED RESPONSE
      // ════════════════════════════════════════════════════════════════
      return res.json({
        success: true,
        response: formattedResponse,
        user: user,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Chat error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });

  /**
   * ═══════════════════════════════════════════════
   * �💾 CONVERSATION HISTORY
   * ═══════════════════════════════════════════════
   */
  async function saveConversation(userId, sessionId, userMessage, botResponse, intent, supabase) {
    try {
      await supabase.from('chat_history').insert({
        user_id: userId,
        session_id: sessionId,
        user_message: userMessage,
        bot_response: JSON.stringify(botResponse),
        intent_type: intent.type,
        created_at: new Date()
      });
    } catch (error) {
      console.error('Failed to save conversation:', error);
    }
  }

  // ════════════════════════════════════════
  // HELPER FUNCTIONS
  // ════════════════════════════════════════

  function extractNodeFromMessage(msg) {
    // Simple extraction - enhance with NLP
    const words = msg.split(' ');
    const nodeIndex = words.findIndex(w => w === 'to' || w === 'show');
    return words[nodeIndex + 1] || 'home';
  }

  function extractAction(msg) {
    if (msg.includes('create')) return 'create';
    if (msg.includes('update')) return 'update';
    if (msg.includes('delete')) return 'delete';
    return 'read';
  }

  function getVectorType(mimetype) {
    if (mimetype.includes('image')) return 'image';
    if (mimetype.includes('video')) return 'video';
    if (mimetype.includes('audio')) return 'audio';
    if (mimetype.includes('pdf')) return 'document';
    if (mimetype.includes('text')) return 'text';
    return 'binary';
  }

  function generateNodeHash() {
    return 'node_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  async function createEmbedding(text) {
    // TODO: Call OpenAI embeddings API
    // Placeholder: return dummy vector
    return Array(1536).fill(0).map(() => Math.random());
  }

  async function searchVectors(query, userId, supabase) {
    // TODO: Vector similarity search
    return [];
  }

  async function getAIResponse(query, context) {
    // TODO: OpenAI chat completion
    return `AI response for: ${query} (OpenAI integration pending)`;
  }

  function formatErrorForPlatform(error, platform) {
    const errorMsg = error.message || 'An error occurred';
    
    switch (platform) {
      case 'whatsapp':
      case 'telegram':
        return { text: `❌ ${errorMsg}` };
      default:
        return {
          message: errorMsg,
          ui: { screen: 'error', message: errorMsg }
        };
    }
  }

  // Register route
  app.use('/api', router);
};

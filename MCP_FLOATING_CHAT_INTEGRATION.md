# FloatingChat MCP Integration - Complete Implementation Guide

## Overview
The FloatingChat component has been enhanced to initialize MCP (Model Context Protocol) with Node Core system prompts, creating a context-aware AI chat experience guided by brand-specific personality rules.

## Features Implemented

### 1. **MCP System Prompt Initialization**
- **Location**: `FloatingChat.js` lines 250-275 (useEffect hook)
- **Function**: `initializeMCP()`
- **Behavior**:
  - Sets default brand to `VANSHAWALI` if not in localStorage
  - Loads system prompt for current brand
  - Stores MCP context in localStorage for backend access
  - Logs MCP initialization status

```javascript
// MCP initializes automatically on mount
const brand = localStorage.getItem('brand') || 'VANSHAWALI';
const brandConfig = BRAND_SYSTEM_PROMPTS[brand];
setSystemPrompt(brandConfig.prompt);
localStorage.setItem('mcp_system_prompt', brandConfig.prompt);
localStorage.setItem('mcp_brand', brand);
```

### 2. **System Brand Definitions**
**Three MCP Brands Available**: 

#### **VANSHAWALI** (Default) - Family & Genealogy
- System prompt focuses on family heritage protection
- Features: Tree building, memory preservation, privacy-first
- Personality: Warm, respectful, protective
- Default load: Yes, automatically sets if not configured

#### **JUNIOR** - Kids Learning
- System prompt for age-appropriate education
- Features: Safe content, COPPA compliant, parent-supervised
- Personality: Cheerful, patient, fun
- Use case: Children's educational content

#### **JEETMANTRA** - Structured Learning
- System prompt for academic excellence
- Features: Curriculum-aligned, progress tracking, exam prep
- Personality: Knowledgeable, encouraging, structured
- Use case: Academic learning environment

### 3. **Core Menu Button** 
- **Icon**: Network (from lucide-react)
- **Location**: Chat header, next to minimize button
- **Functionality**:
  - Opens/closes system guide panel
  - Shows pulsing indicator when active
  - Displays current brand system prompt
  - Shows guidance based on MCP personality

### 4. **System Guide Panel**
- **Display**: Dynamic guide based on current brand
- **Contains**:
  - Brand name and description
  - Feature highlights with emojis
  - System prompt preview (first 8 lines)
  - Color-coded sections by category
  
**Example**: Vanshawali opens showing family protection features and genealogy guidance

### 5. **Chat Message Integration with MCP**
**Updated Function**: `handleSendMessage()` (lines 479-557)

**System Prompt Context Sent to Backend**:
```javascript
const response = await chatSend(message, {
  menu_context: currentMenu?.label,
  session_id: nodeCore?.node_code,
  user_id: user?.id,
  // MCP Context - Critical for OpenAI
  mcp_system_prompt: systemPrompt,
  mcp_brand: currentBrand,
  system_prompt: systemPrompt
});
```

This ensures OpenAI receives:
1. User message
2. Appropriate system prompt (Vanshawali/Junior/JeetMantra)
3. Current menu context for guidance
4. User identification for personalization

### 6. **Backend Integration Updates**

#### `kernel-execute.js` (lines 474-520)
- Extracts MCP context from frontend payload
- Passes system prompt to AI task queue
- Includes brand and menu context in queued task

```javascript
const mcpSystemPrompt = context?.mcp_system_prompt || context?.system_prompt;
const mcpBrand = context?.mcp_brand || 'VANSHAWALI';
// Stores in node_ai_task_queue for async processing
```

#### `openai-service.js` (NEW/UPDATED)
- **New Functions**:
  - `sendChatMessage(message, options)` - Sends message with MCP context
  - `getSystemPromptForBrand(brand)` - Returns prompt for brand
  
- **MCP Brand System Prompts**: Identical to frontend for consistency
- **Integration**: Augments OpenAI requests with system prompt + menu context
- **Error Handling**: Graceful fallback if API unavailable

### 7. **CSS Styling Enhancements**
**File**: `FloatingChat.css` (new sections added)

#### System Guide Panel Styling:
- `.system-guide-panel` - Main container with glassmorphism
- `.guide-header` - Title and close button
- `.guide-content` - Scrollable guidance content
- `.brand-guide` - Brand-specific information display
- `.system-prompt-preview` - Code block showing MCP prompt
- `.system-guide-indicator` - Pulsing indicator on button

#### Features:
- Smooth scrolling with custom scrollbar
- Color-coded sections by brand
- Responsive design for mobile
- Animations: pulse effect on indicator

## Data Flow

```
User types message
        ↓
FloatingChat.handleSendMessage()
        ↓
Includes MCP context: {
  + mcp_system_prompt (from state)
  + mcp_brand (VANSHAWALI/JUNIOR/JEETMANTRA)
  + menu_context (current menu)
  + system_prompt (same as mcp_system_prompt)
}
        ↓
chatSend() → /api/kernel/v2/execute (action: 'chat')
        ↓
kernel-execute.js: handleChatAction()
        ↓
Extracts MCP context
        ↓
Inserts into node_ai_task_queue with payload:
{
  + mcp_system_prompt
  + mcp_brand
  + menu_context
}
        ↓
Async worker (N8N) or OpenAI service processes task
        ↓
openai-service.sendChatMessage() with MCP context
        ↓
OpenAI API receives:
{
  messages: [
    { role: 'system', content: BASE_PROMPT + MCP_AUGMENTATION },
    { role: 'user', content: user_message }
  ]
}
        ↓
Response with brand-guided personality
        ↓
Stored in node_ai_task_queue.result
        ↓
Frontend polls or receives update
        ↓
Display in chat UI
```

## Configuration

### Environment Variables Required:
```
OPENAI_API_KEY=sk-...   # For OpenAI API calls
REACT_APP_KERNEL_URL=http://localhost:3000  # Backend kernel endpoint
```

### Frontend Initialization:
No configuration needed - MCP auto-initializes on FloatingChat mount:
1. Checks localStorage for stored brand
2. Sets default VANSHAWALI if not found
3. Loads corresponding system prompt
4. Stores in state for message context

### Backend Processing:
OpenAI service reads environment config and brand system prompts automatically

## Testing the Implementation

### 1. **Verify MCP Initialization**
```javascript
// In browser console after chat opens:
localStorage.getItem('mcp_brand')        // Should be "VANSHAWALI"
localStorage.getItem('mcp_system_prompt') // Should show prompt text
```

### 2. **Test System Guide Panel**
- Click Network icon in chat header
- Should display Vanshawali features and guidance
- Click close button to minimize

### 3. **Send Message with MCP Context**
- Type message in chat
- Open browser Network tab
- Send message - inspect POST payload to `/api/kernel/v2/execute`
- Should see `mcp_system_prompt` and `mcp_brand` in payload

### 4. **Check Backend Processing**
- Monitor backend logs during chat
- Should see: `[OpenAI Chat] VANSHAWALI system prompt | Menu: ...`
- Response should reflect Vanshawali Guardian personality

## Troubleshooting

### Issue: "Default Vanshawali not loading"
**Solution**: 
- Check localStorage is not cleared
- Verify `initializeMCP()` runs in useEffect
- Check browser console for initialization logs

### Issue: System guide shows generic text
**Solution**:
- Ensure `BRAND_SYSTEM_PROMPTS` object is properly imported
- Check that `currentBrand` state is being set
- Verify CSS for `.guide-content` is not hiding text

### Issue: OpenAI not responding with context
**Solution**:
- Verify `OPENAI_API_KEY` is set in backend `.env`
- Check `openai-service.js` is imported in backend
- Monitor backend logs for `[OpenAI Chat]` prefix
- Test with curl to verify API key works

### Issue: Menu context not passing
**Solution**:
- Verify `currentMenu` is defined before `handleSendMessage`
- Check `menuStack` state is updating correctly
- Inspect network request payload for `menu_context` field

## Files Modified

1. **botmantra-ui/src/components/FloatingChat.js**
   - Added system prompt state and MCP initialization
   - Added core menu button with system guide
   - Updated handleSendMessage to include MCP context
   - Added system guide panel JSX

2. **botmantra-ui/src/components/FloatingChat.css**
   - New system guide panel styles
   - New guide header and content styles
   - System prompt preview styling
   - Pulsing indicator animation

3. **botmantra-backend/routes/kernel-execute.js**
   - Updated handleChatAction to extract MCP context
   - Pass system prompt to AI task queue

4. **botmantra-backend/services/openai-service.js**
   - Added BRAND_SYSTEM_PROMPTS object
   - Added sendChatMessage() function with MCP support
   - Added getSystemPromptForBrand() helper
   - Integrated with OpenAI client

## Next Steps

### Recommended Enhancements:
1. Add theme switching to change brand (Vanshawali/Junior/JeetMantra)
2. Implement brand switcher button in chat header
3. Add user preference persistence for favorite brand
4. Cache system prompts globally to avoid recomputation
5. Add brand-specific greeting messages
6. Track which brand was most effective for user

### Integration Points:
- Connect with actual N8N async task processor
- Integrate with Supabase for storing conversation history
- Add RAG context from knowledge base to augment prompts
- Implement smart brand selection based on user profile

## Support

For issues with MCP integration:
1. Check browser console for `[MCP]` logs
2. Check backend logs for `[OpenAI Chat]` or `[MCP]` messages
3. Verify all three BRAND_SYSTEM_PROMPTS are loaded
4. Test with curl to OpenAI API directly
5. Check that system prompt is being sent in requests

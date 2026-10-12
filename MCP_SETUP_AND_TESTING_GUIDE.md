# FloatingChat MCP Integration - Setup & Testing Guide

## ✅ Implementation Complete

The FloatingChat component has been successfully integrated with MCP (Model Context Protocol) system prompts for context-aware AI responses.

## 📋 What Was Changed

### 1. **FloatingChat Component** (`botmantra-ui/src/components/FloatingChat.js`)
- ✅ Added MCP system prompt initialization on component mount
- ✅ Added "Core Menu" button (Network icon) in chat header  
- ✅ Created system guide panel showing brand guidance
- ✅ Updated chat message handler to include system prompt context
- ✅ Default brand: **Vanshawali** (Family & Genealogy)

### 2. **FloatingChat Styles** (`botmantra-ui/src/components/FloatingChat.css`)
- ✅ System guide panel styling (glassmorphic design)
- ✅ Guide header with brand name and close button
- ✅ Brand-specific guidance display sections
- ✅ System prompt preview code block
- ✅ Pulsing indicator on core menu button

### 3. **Backend Integration** (`botmantra-backend/routes/kernel-execute.js`)
- ✅ Extract MCP context from frontend messages
- ✅ Pass system prompt + brand to AI task queue
- ✅ Include menu context for personalization

### 4. **OpenAI Service** (`botmantra-backend/services/openai-service.js`)
- ✅ Enhanced with BRAND_SYSTEM_PROMPTS
- ✅ `sendChatMessage()` function with MCP support
- ✅ Augments OpenAI requests with system prompt + menu context

## 🚀 Quick Start

### 1. **Verify Environment Variables**
```bash
# In botmantra-backend/.env, check:
OPENAI_API_KEY=sk-... (required for AI responses)

# In botmantra-ui/.env, check:
REACT_APP_KERNEL_URL=http://localhost:3000
```

### 2. **Start Services**
```bash
# Terminal 1 - Backend
cd botmantra-backend
node server.js

# Terminal 2 - Frontend  
cd botmantra-ui
npm start
```

### 3. **Open FloatingChat**
- Navigate to http://localhost:3000/dashboard
- FloatingChat appears bottom-right
- Default brand: **Vanshawali** (Family & Genealogy)

## 🧪 Testing Checklist

### Test 1: MCP Initialization
```javascript
// Open browser > DevTools > Console
localStorage.getItem('mcp_brand')           // Should output: VANSHAWALI
localStorage.getItem('mcp_system_prompt')   // Should show prompt text
```
✅ Expected: localStorage populated with Vanshawali system prompt

### Test 2: System Guide Panel
1. Click **Network icon** (🔗) in chat header
2. System guide panel should appear
3. Shows: Vanshawali Guardian, features, guide content
4. Click **✕** to close
✅ Expected: Guide displays Vanshawali family protection features

### Test 3: Message with MCP Context
1. Type message: `"Help me create my family tree"`
2. Click Send or press Enter
3. Open DevTools > Network tab
4. Inspect POST to `/api/kernel/v2/execute`
5. Check request body contains:
   - `mcp_system_prompt` (Vanshawali prompt text)
   - `mcp_brand: "VANSHAWALI"`
   - `menu_context` (from current menu)

✅ Expected: All MCP fields present in request

### Test 4: Backend Processing
1. Monitor backend console output
2. Should see logs like:
   ```
   [OpenAI Chat] VANSHAWALI system prompt | Menu: General
   [OpenAI Chat] Response: ...responses with family context...
   ```
✅ Expected: Backend logs show system prompt processing

### Test 5: Chat Response Quality
1. Send: `"How do I start building a family tree?"`
2. Response should be warm, family-oriented (Vanshawali personality)
3. Not generic - specific to family heritage protection
✅ Expected: Response reflects Vanshawali Guardian personality

### Test 6: Default Brand Loading
1. Clear localStorage:
   ```javascript
   localStorage.clear()
   ```
2. Refresh page
3. FloatingChat should auto-initialize to Vanshawali
4. Check localStorage again - should have Vanshawali prompt
✅ Expected: Vanshawali is default brand

## 📊 Three MCP Brands Available

### 🌳 **Vanshawali** (Currently Active)
- Focus: Family heritage, genealogy, memory preservation
- Personality: Warm, respectful, protective
- Use case: Family-first interactions
- Features: Tree building, photo storage, privacy protection

### 🎨 **Junior** (Kids Education)
- Focus: Age-appropriate, safe learning
- Personality: Cheerful, fun, encouraging
- Use case: Children's educational content
- COPPA compliant: No data collection from children

### 📚 **JeetMantra** (Academic Learning)
- Focus: Structured education, results-driven
- Personality: Knowledgeable, encouraging, organized
- Use case: Academic excellence environment
- Features: Progress tracking, exam prep, structured responses

## 🔧 Troubleshooting

### Issue: "Core Menu button not working"
**Solution**:
```javascript
// Check Button State
localStorage.getItem('mcp_brand')
// Should not be empty
```

### Issue: "System guide shows generic text"
**Solution**:
- Verify CSS file saved: `FloatingChat.css`
- Check `.guide-section` and `.brand-guide` styles exist
- Inspect element to verify classes applied

### Issue: "Message not including system prompt"
**Solution**:
```javascript
// In browser console:
console.log('Current state:', {
  systemPrompt: (check length > 0),
  currentBrand: (should be 'VANSHAWALI'),
  currentMenu: (check not null)
})
```

### Issue: "OpenAI returning generic responses"
**Solution**:
1. Verify `OPENAI_API_KEY` in backend `.env`
2. Check backend logs for `[OpenAI Chat]` prefix
3. Test OpenAI key directly:
   ```bash
   curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models
   ```

### Issue: "localStorage not persisting"
**Solution**:
- Check browser privacy settings
- Disable private browsing mode
- Try clearing cache and reloading
- Verify domain is not in do-not-track list

## 📈 How It Works - Data Flow

```
User opens FloatingChat
       ↓
MCP initializes: Vanshawali system prompt loaded
       ↓
User types message
       ↓
handleSendMessage() called with MCP context:
  - mcp_system_prompt (Vanshawali Guardian instructions)
  - mcp_brand: "VANSHAWALI"
  - menu_context: current menu
       ↓
chatSend() sends to /api/kernel/v2/execute
       ↓
Backend: handleChatAction() extracts MCP context
       ↓
Queue to node_ai_task_queue with:
  - payload.mcp_system_prompt
  - payload.mcp_brand
  - payload.menu_context
       ↓
OpenAI service receives:
  - System message: Base prompt + MCP augmentation
  - User message: Original user input
       ↓
OpenAI responds with Vanshawali Guardian persona
       ↓
Response stored in queue.result
       ↓
Frontend displays in chat with family-first guidance
```

## 🎯 Verification Checklist

- [ ] Backend starts without errors
- [ ] UI starts without errors
- [ ] FloatingChat appears in bottom-right
- [ ] Network icon visible in header
- [ ] Clicking Network icon shows guide panel
- [ ] Guide shows Vanshawali features
- [ ] Can send messages in chat
- [ ] Network tab shows mcp_system_prompt in POST
- [ ] Backend logs show [OpenAI Chat] messages
- [ ] Responses have family-oriented tone
- [ ] localStorage has mcp_brand and mcp_system_prompt

## 🎓 Next Steps

1. **Test all three brands**: Switch between Vanshawali, Junior, JeetMantra
2. **Test RAG context**: Add knowledge base integration
3. **Test async worker**: Set up N8N workflow to process queue
4. **Test persistence**: User preference for favorite brand
5. **Test mobile**: Responsive design on small screens

## 📞 Support

For any issues:
1. Check browser console for `[MCP]` logs
2. Check backend console for `[OpenAI Chat]` logs
3. Verify all files were edited correctly
4. Clear localStorage and reload
5. Check network tab for request/response payloads

---

**Status**: ✅ Complete - Ready for Testing
**Last Updated**: February 15, 2026

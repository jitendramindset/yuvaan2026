/**
 * Script to create UI integration files
 */
const fs = require('fs');
const path = require('path');

const UI_PATH = 'D:/React App/Yuvaan-v1/botmantra-ui/src';

// Create uiToolsApi.js
const apiContent = `/**
 * UI Tools API Service
 * Integrates with /api/ui-tools endpoints
 */

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class UIToolsAPI {
  constructor() {
    this.token = localStorage.getItem('ui_tools_token');
    this.user = JSON.parse(localStorage.getItem('ui_tools_user') || 'null');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('ui_tools_token', token);
  }

  setUser(user) {
    this.user = user;
    localStorage.setItem('ui_tools_user', JSON.stringify(user));
  }

  clearAuth() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('ui_tools_token');
    localStorage.removeItem('ui_tools_user');
  }

  isAuthenticated() {
    return !!this.token;
  }

  getUser() {
    return this.user;
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: \`Bearer \${this.token}\` }),
      ...options.headers,
    };

    try {
      const response = await fetch(\`\${API_BASE}\${endpoint}\`, {
        ...options,
        headers,
      });

      const data = await response.json();

      // Auto-save token if login was performed via chat
      if (data.token && data.loginPerformed) {
        this.setToken(data.token);
        if (data.user) {
          this.setUser(data.user);
        }
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      return { success: false, error: error.message };
    }
  }

  // CHAT - Main entry point (handles login via chat too!)
  async chat(message, businessId = null, context = {}) {
    return this.request('/api/ui-tools/chat', {
      method: 'POST',
      body: JSON.stringify({ message, businessId, context }),
    });
  }

  // AUTH
  async login(emailOrPhone, password) {
    const result = await this.request('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ emailOrPhone, password }),
    });
    if (result.success && result.token) {
      this.setToken(result.token);
      if (result.user) {
        this.setUser(result.user);
      }
    }
    return result;
  }

  async signup(userData) {
    return this.request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  logout() {
    this.clearAuth();
    return { success: true, message: 'Logged out successfully' };
  }

  // UI GENERATION
  async generateUI(prompt, targetEngine = 'ui_layout', options = {}) {
    return this.request('/api/ui-tools/generate', {
      method: 'POST',
      body: JSON.stringify({ message: prompt, targetEngine, options }),
    });
  }

  async adjustUI(uiId, adjustments, message, businessId) {
    return this.request('/api/ui-tools/adjust', {
      method: 'POST',
      body: JSON.stringify({ uiId, adjustments, message, businessId }),
    });
  }

  async archiveUI(uiId, businessId) {
    return this.request('/api/ui-tools/archive', {
      method: 'POST',
      body: JSON.stringify({ uiId, businessId }),
    });
  }

  // TOOLS & DASHBOARD
  async getTools() {
    return this.request('/api/ui-tools/tools');
  }

  async getDashboard(businessId) {
    return this.request(\`/api/ui-tools/dashboard?businessId=\${businessId}\`);
  }

  async executeTool(toolName, params, category) {
    return this.request('/api/ui-tools/execute', {
      method: 'POST',
      body: JSON.stringify({ toolName, params, category }),
    });
  }

  // MEMORY
  async getMemory() {
    return this.request('/api/ui-tools/memory');
  }

  // RAG
  async ragQuery(question, agentId) {
    return this.request('/api/ui-tools/rag', {
      method: 'POST',
      body: JSON.stringify({ question, agentId }),
    });
  }
}

export const uiToolsApi = new UIToolsAPI();
export default uiToolsApi;
`;

// Create UIToolsChat.jsx component
const chatComponent = `import React, { useState, useEffect, useRef } from 'react';
import { uiToolsApi } from '../api/uiToolsApi';
import './UIToolsChat.css';

const UIToolsChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setIsAuthenticated(uiToolsApi.isAuthenticated());
    setMessages([{
      type: 'bot',
      content: '👋 Welcome to UI Tools! Type "login email: your@email.com password: yourpass" to login, or ask me anything!',
      suggestions: [
        { title: '🔐 Login', action: 'login email: demo@example.com password: demo123' },
        { title: '🔧 View Tools', action: 'show me all tools' },
        { title: '📊 Create Dashboard', action: 'create a sales dashboard' },
      ]
    }]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const sendMessage = async (messageText = input) => {
    if (!messageText.trim()) return;

    setMessages(prev => [...prev, { type: 'user', content: messageText }]);
    setInput('');
    setLoading(true);

    try {
      const response = await uiToolsApi.chat(messageText);

      if (response.loginPerformed && response.success) {
        setIsAuthenticated(true);
      }

      setMessages(prev => [...prev, {
        type: 'bot',
        content: response.response?.message || response.error || 'Something went wrong',
        authenticated: response.authenticated,
        user: response.user,
        token: response.token,
        suggestions: response.response?.suggestions || response.response?.availableActions,
        data: response.response
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        type: 'bot',
        content: \`❌ Error: \${error.message}\`,
        isError: true
      }]);
    }

    setLoading(false);
  };

  const handleSuggestionClick = (suggestion) => {
    const action = suggestion.action || suggestion.title;
    setInput(action);
    sendMessage(action);
  };

  const handleLogout = () => {
    uiToolsApi.logout();
    setIsAuthenticated(false);
    setMessages(prev => [...prev, {
      type: 'bot',
      content: '👋 You have been logged out. Login again to continue.',
    }]);
  };

  return (
    <div className="ui-tools-chat">
      <div className="chat-header">
        <h3>🎨 UI Tools Chat</h3>
        {isAuthenticated && (
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        )}
      </div>

      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={\`message \${msg.type} \${msg.isError ? 'error' : ''}\`}>
            <div className="message-content">{msg.content}</div>
            
            {msg.user && (
              <div className="user-info">✅ Logged in as: {msg.user.email}</div>
            )}

            {msg.suggestions && msg.suggestions.length > 0 && (
              <div className="suggestions">
                {msg.suggestions.map((sug, sidx) => (
                  <button
                    key={sidx}
                    onClick={() => handleSuggestionClick(sug)}
                    className="suggestion-btn"
                  >
                    {sug.title || sug.action}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && <div className="loading">Thinking...</div>}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message... (e.g., 'login email: your@email.com password: yourpass')"
          disabled={loading}
        />
        <button onClick={() => sendMessage()} disabled={loading}>Send</button>
      </div>
    </div>
  );
};

export default UIToolsChat;
`;

// Create CSS file
const cssContent = `.ui-tools-chat {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 800px;
  margin: 0 auto;
  font-family: system-ui, -apple-system, sans-serif;
  background: #fff;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.chat-header h3 {
  margin: 0;
  font-size: 18px;
}

.logout-btn {
  padding: 8px 16px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.message {
  margin-bottom: 16px;
  padding: 12px 16px;
  border-radius: 12px;
  max-width: 80%;
}

.message.user {
  margin-left: auto;
  background: #007bff;
  color: white;
}

.message.bot {
  margin-right: auto;
  background: #f1f3f4;
  color: #333;
}

.message.error {
  background: #ffebee;
  color: #c62828;
}

.message-content {
  white-space: pre-wrap;
  line-height: 1.5;
}

.user-info {
  margin-top: 8px;
  padding: 8px;
  background: #e8f5e9;
  border-radius: 4px;
  font-size: 12px;
}

.suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.suggestion-btn {
  padding: 6px 12px;
  background: #e3f2fd;
  border: 1px solid #90caf9;
  border-radius: 16px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.2s;
}

.suggestion-btn:hover {
  background: #bbdefb;
}

.loading {
  text-align: center;
  color: #666;
  padding: 12px;
}

.chat-input {
  display: flex;
  padding: 16px;
  border-top: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.chat-input input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 24px;
  font-size: 14px;
  outline: none;
}

.chat-input input:focus {
  border-color: #007bff;
}

.chat-input button {
  margin-left: 8px;
  padding: 12px 24px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 24px;
  cursor: pointer;
  font-weight: bold;
}

.chat-input button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
`;

// Write files
try {
  fs.writeFileSync(path.join(UI_PATH, 'api', 'uiToolsApi.js'), apiContent);
  console.log('✅ Created: src/api/uiToolsApi.js');

  fs.writeFileSync(path.join(UI_PATH, 'components', 'UIToolsChat.jsx'), chatComponent);
  console.log('✅ Created: src/components/UIToolsChat.jsx');

  fs.writeFileSync(path.join(UI_PATH, 'components', 'UIToolsChat.css'), cssContent);
  console.log('✅ Created: src/components/UIToolsChat.css');

  console.log('\n🎉 All files created successfully!');
  console.log('\nTo use in your App.js:');
  console.log("  import UIToolsChat from './components/UIToolsChat';");
  console.log('  <UIToolsChat />');
} catch (error) {
  console.error('❌ Error creating files:', error);
}

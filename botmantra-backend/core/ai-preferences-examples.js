/**
 * AI Preferences Node Examples
 * Comprehensive usage examples for node-based AI preferences management
 */

const { AIPreferencesNode } = require('../core/ai-preferences');

// Initialize for examples
const aiPreferencesNode = new AIPreferencesNode(require('../config/supabase').supabase);

// ============================================================
// BASIC PREFERENCES OPERATIONS
// ============================================================

/**
 * Example 1: Create new AI preferences
 */
async function createPreferencesExample() {
  try {
    const preferencesData = {
      user_id: 'user_67890',
      preferences: {
        theme: 'dark',
        language: 'en',
        notifications: {
          email: true,
          push: false,
          sms: true
        },
        ai_settings: {
          model: 'gpt-4',
          temperature: 0.7,
          max_tokens: 2000,
          response_style: 'concise'
        },
        privacy: {
          data_sharing: false,
          analytics: true,
          personalization: true
        },
        accessibility: {
          font_size: 'medium',
          high_contrast: false,
          screen_reader: false
        }
      }
    };

    const result = await aiPreferencesNode.createPreferences(preferencesData, 'prefs_user_001');

    console.log('Preferences created:', result);
    return result;
  } catch (error) {
    console.error('Error creating preferences:', error);
  }
}

/**
 * Example 2: Query user preferences
 */
async function queryPreferencesExample() {
  try {
    const criteria = {
      user_id: 'user_67890'
    };

    const options = {
      limit: 10,
      offset: 0,
      sort: 'updated_at',
      order: 'desc'
    };

    const result = await aiPreferencesNode.queryPreferences(criteria, options);

    console.log(`Found ${result.total} preferences entries:`, result.preferences);
    return result;
  } catch (error) {
    console.error('Error querying preferences:', error);
  }
}

/**
 * Example 3: Get user preferences
 */
async function getUserPreferencesExample() {
  try {
    const userId = 'user_67890';

    const result = await aiPreferencesNode.getUserPreferences(userId);

    if (result) {
      console.log('User preferences found:', result);
    } else {
      console.log('No preferences found for user');
    }

    return result;
  } catch (error) {
    console.error('Error getting user preferences:', error);
  }
}

/**
 * Example 4: Update preferences
 */
async function updatePreferencesExample() {
  try {
    const nodeCode = 'prefs_user_001';
    const updateData = {
      preferences: {
        theme: 'light',
        language: 'en',
        notifications: {
          email: true,
          push: true,
          sms: false
        },
        ai_settings: {
          model: 'gpt-4-turbo',
          temperature: 0.8,
          max_tokens: 3000,
          response_style: 'detailed'
        },
        privacy: {
          data_sharing: false,
          analytics: true,
          personalization: true
        },
        accessibility: {
          font_size: 'large',
          high_contrast: true,
          screen_reader: false
        }
      }
    };

    const result = await aiPreferencesNode.updatePreferences(nodeCode, updateData);

    console.log('Preferences updated:', result);
    return result;
  } catch (error) {
    console.error('Error updating preferences:', error);
  }
}

// ============================================================
// USER PREFERENCES MANAGEMENT
// ============================================================

/**
 * Example 5: Update user preferences (upsert)
 */
async function updateUserPreferencesExample() {
  try {
    const userId = 'user_67890';
    const preferences = {
      theme: 'auto',
      language: 'es',
      notifications: {
        email: false,
        push: true,
        sms: true
      },
      ai_settings: {
        model: 'claude-3',
        temperature: 0.6,
        max_tokens: 1500,
        response_style: 'creative'
      }
    };

    const result = await aiPreferencesNode.updateUserPreferences(userId, preferences, 'prefs_user_002');

    console.log('User preferences updated:', result);
    return result;
  } catch (error) {
    console.error('Error updating user preferences:', error);
  }
}

/**
 * Example 6: Get specific preference value
 */
async function getPreferenceValueExample() {
  try {
    const userId = 'user_67890';
    const key = 'theme';
    const defaultValue = 'light';

    const value = await aiPreferencesNode.getPreferenceValue(userId, key, defaultValue);

    console.log(`Preference '${key}':`, value);
    return value;
  } catch (error) {
    console.error('Error getting preference value:', error);
  }
}

/**
 * Example 7: Set specific preference value
 */
async function setPreferenceValueExample() {
  try {
    const userId = 'user_67890';
    const key = 'notifications.push';
    const value = false;

    const result = await aiPreferencesNode.setPreferenceValue(userId, key, value);

    console.log(`Preference '${key}' set to:`, value);
    return result;
  } catch (error) {
    console.error('Error setting preference value:', error);
  }
}

// ============================================================
// ADVANCED PREFERENCES OPERATIONS
// ============================================================

/**
 * Example 8: Get preferences statistics
 */
async function getPreferencesStatsExample() {
  try {
    const stats = await aiPreferencesNode.getPreferencesStats();

    console.log('Preferences statistics:', stats);
    return stats;
  } catch (error) {
    console.error('Error getting preferences stats:', error);
  }
}

/**
 * Example 9: Export user preferences
 */
async function exportUserPreferencesExample() {
  try {
    const userId = 'user_67890';

    const exportData = await aiPreferencesNode.exportUserPreferences(userId);

    if (exportData) {
      console.log('Exported preferences:', exportData);
    } else {
      console.log('No preferences to export');
    }

    return exportData;
  } catch (error) {
    console.error('Error exporting preferences:', error);
  }
}

/**
 * Example 10: Import user preferences
 */
async function importUserPreferencesExample() {
  try {
    const importData = {
      user_id: 'user_67890',
      preferences: {
        theme: 'dark',
        language: 'fr',
        notifications: {
          email: true,
          push: true,
          sms: false
        },
        ai_settings: {
          model: 'gpt-3.5-turbo',
          temperature: 0.5,
          max_tokens: 1000,
          response_style: 'brief'
        }
      }
    };

    const result = await aiPreferencesNode.importUserPreferences(importData, 'imported_prefs_001');

    console.log('Preferences imported:', result);
    return result;
  } catch (error) {
    console.error('Error importing preferences:', error);
  }
}

// ============================================================
// PRACTICAL USAGE SCENARIOS
// ============================================================

/**
 * Example 11: AI Chatbot User Preferences Management
 */
async function aiChatbotPreferencesExample() {
  try {
    const userId = 'user_67890';

    // Initialize user preferences for AI chatbot
    const initialPrefs = {
      chatbot: {
        personality: 'helpful',
        response_length: 'medium',
        use_emojis: true,
        language: 'en'
      },
      ai_settings: {
        model: 'gpt-4',
        temperature: 0.7,
        max_tokens: 2000
      },
      privacy: {
        remember_conversations: true,
        share_analytics: false
      }
    };

    console.log('Setting initial chatbot preferences...');
    await aiPreferencesNode.updateUserPreferences(userId, initialPrefs);

    // Get specific chatbot settings
    const personality = await aiPreferencesNode.getPreferenceValue(userId, 'chatbot.personality', 'friendly');
    const useEmojis = await aiPreferencesNode.getPreferenceValue(userId, 'chatbot.use_emojis', true);

    console.log(`Chatbot personality: ${personality}`);
    console.log(`Use emojis: ${useEmojis}`);

    // Update specific settings during conversation
    await aiPreferencesNode.setPreferenceValue(userId, 'chatbot.response_length', 'detailed');
    await aiPreferencesNode.setPreferenceValue(userId, 'ai_settings.temperature', 0.8);

    // Get updated preferences
    const updatedPrefs = await aiPreferencesNode.getUserPreferences(userId);
    console.log('Updated chatbot preferences:', updatedPrefs);

    return updatedPrefs;
  } catch (error) {
    console.error('Error in chatbot preferences example:', error);
  }
}

/**
 * Example 12: Application Theme and UI Preferences
 */
async function applicationPreferencesExample() {
  try {
    const userId = 'user_67890';

    // Set comprehensive UI preferences
    const uiPreferences = {
      theme: 'dark',
      layout: 'compact',
      sidebar: {
        collapsed: false,
        position: 'left'
      },
      dashboard: {
        widgets_per_row: 3,
        show_animations: true,
        auto_refresh: true
      },
      accessibility: {
        font_size: 'medium',
        high_contrast: false,
        reduce_motion: false
      },
      notifications: {
        sound: true,
        desktop: true,
        email_digest: 'daily'
      }
    };

    console.log('Setting UI preferences...');
    await aiPreferencesNode.updateUserPreferences(userId, uiPreferences);

    // Retrieve specific UI settings
    const theme = await aiPreferencesNode.getPreferenceValue(userId, 'theme', 'light');
    const fontSize = await aiPreferencesNode.getPreferenceValue(userId, 'accessibility.font_size', 'medium');
    const widgetsPerRow = await aiPreferencesNode.getPreferenceValue(userId, 'dashboard.widgets_per_row', 2);

    console.log(`Theme: ${theme}`);
    console.log(`Font size: ${fontSize}`);
    console.log(`Widgets per row: ${widgetsPerRow}`);

    // Export preferences for backup
    const exported = await aiPreferencesNode.exportUserPreferences(userId);
    console.log('Preferences exported for backup');

    return exported;
  } catch (error) {
    console.error('Error in application preferences example:', error);
  }
}

/**
 * Example 13: Batch Preferences Update for Multiple Users
 */
async function batchPreferencesUpdateExample() {
  try {
    const updates = [
      {
        user_id: 'user_67890',
        preferences: {
          theme: 'light',
          language: 'en',
          notifications: { email: true, push: false }
        }
      },
      {
        user_id: 'user_11111',
        preferences: {
          theme: 'dark',
          language: 'es',
          notifications: { email: false, push: true }
        }
      },
      {
        user_id: 'user_22222',
        preferences: {
          theme: 'auto',
          language: 'fr',
          notifications: { email: true, push: true }
        }
      }
    ];

    const results = await aiPreferencesNode.batchUpdatePreferences(updates);

    console.log('Batch update results:', results);
    return results;
  } catch (error) {
    console.error('Error in batch preferences update:', error);
  }
}

// ============================================================
// EXPORT EXAMPLES FOR TESTING
// ============================================================

module.exports = {
  createPreferencesExample,
  queryPreferencesExample,
  getUserPreferencesExample,
  updatePreferencesExample,
  updateUserPreferencesExample,
  getPreferenceValueExample,
  setPreferenceValueExample,
  getPreferencesStatsExample,
  exportUserPreferencesExample,
  importUserPreferencesExample,
  aiChatbotPreferencesExample,
  applicationPreferencesExample,
  batchPreferencesUpdateExample
};

// ============================================================
// RUN EXAMPLES (for testing)
// ============================================================

if (require.main === module) {
  console.log('Running AI Preferences Examples...\n');

  // Run examples sequentially
  (async () => {
    try {
      console.log('1. Creating preferences...');
      await createPreferencesExample();

      console.log('\n2. Querying preferences...');
      await queryPreferencesExample();

      console.log('\n3. Getting user preferences...');
      await getUserPreferencesExample();

      console.log('\n4. Updating preferences...');
      await updatePreferencesExample();

      console.log('\n5. Updating user preferences (upsert)...');
      await updateUserPreferencesExample();

      console.log('\n6. Getting preference value...');
      await getPreferenceValueExample();

      console.log('\n7. Setting preference value...');
      await setPreferenceValueExample();

      console.log('\n8. Getting preferences stats...');
      await getPreferencesStatsExample();

      console.log('\n9. AI Chatbot preferences...');
      await aiChatbotPreferencesExample();

      console.log('\n10. Application preferences...');
      await applicationPreferencesExample();

      console.log('\nAll examples completed successfully!');
    } catch (error) {
      console.error('Example execution failed:', error);
    }
  })();
}
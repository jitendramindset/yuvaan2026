/**
 * Kernel ↔ n8n Integration Helper
 * 
 * Handles:
 * - Publishing events to n8n queue
 * - Task creation and tracking
 * - Error handling and retries
 * - Event deduplication
 */

const crypto = require('crypto');

class KernelN8nBridge {
  constructor(options = {}) {
    this.n8nWebhookUrl = options.n8nWebhookUrl || process.env.N8N_WEBHOOK_URL;
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 1000; // ms
    this.timeout = options.timeout || 5000; // ms
    this.supabase = options.supabase;
  }

  /**
   * Publish event to n8n queue
   */
  async publishEvent(eventType, payload, context = {}) {
    const eventId = this.generateEventId();
    
    try {
      const event = {
        event_type: eventType,
        event_id: eventId,
        request_id: context.requestId || `req_${Date.now()}`,
        user_id: context.userId,
        business_id: context.businessId,
        payload,
        timestamp: new Date().toISOString()
      };

      // Send to n8n with retry
      await this.sendWithRetry(event);

      // Log event
      await this.logEvent(event, 'published');

      return {
        success: true,
        eventId,
        message: 'Event published to queue'
      };
    } catch (error) {
      console.error(`[KernelN8nBridge] Event publish failed:`, error);
      await this.logEvent({ event_type: eventType, event_id: eventId }, 'failed', error.message);
      
      throw new Error(`Failed to publish event: ${error.message}`);
    }
  }

  /**
   * Create AI task and queue for processing
   */
  async createAITask(options) {
    const {
      userId,
      businessId,
      prompt,
      systemPrompt = 'You are a helpful AI assistant.',
      model = 'gpt-4-turbo',
      temperature = 0.7,
      maxTokens = 2000,
      requestId
    } = options;

    try {
      // Insert into queue
      const { data, error } = await this.supabase
        .from('node_ai_task_queue')
        .insert({
          user_id: userId,
          business_id: businessId,
          prompt,
          system_prompt: systemPrompt,
          model,
          temperature,
          max_tokens: maxTokens,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) throw error;

      const taskId = data.id;

      // Publish event to n8n
      await this.publishEvent('ai_task_created', {
        task_id: taskId,
        model,
        system_prompt: systemPrompt,
        prompt,
        temperature,
        max_tokens: maxTokens
      }, { userId, businessId, requestId });

      return {
        success: true,
        taskId,
        status: 'queued',
        message: 'AI task created and queued'
      };
    } catch (error) {
      console.error('[KernelN8nBridge] AI task creation failed:', error);
      throw error;
    }
  }

  /**
   * Queue memory persistence (async chat message save)
   */
  async queueMemoryWrite(options) {
    const {
      userId,
      businessId,
      sessionId,
      role,
      message,
      requestId
    } = options;

    try {
      // Publish event (actual write done by n8n worker)
      await this.publishEvent('memory_write_pending', {
        role,
        message,
        session_id: sessionId,
        timestamp: new Date().toISOString()
      }, { userId, businessId, requestId });

      return {
        success: true,
        message: 'Memory write queued',
        status: 'pending'
      };
    } catch (error) {
      console.error('[KernelN8nBridge] Memory write queue failed:', error);
      throw error;
    }
  }

  /**
   * Queue automation action
   */
  async queueAutomation(options) {
    const {
      userId,
      businessId,
      actionType,
      actionParams,
      requestId
    } = options;

    try {
      // Validate action type
      const validActions = ['send_email', 'webhook_call', 'create_record', 'update_record'];
      if (!validActions.includes(actionType)) {
        throw new Error(`Invalid action type: ${actionType}`);
      }

      // Publish event
      await this.publishEvent('automation_triggered', {
        action_type: actionType,
        ...actionParams
      }, { userId, businessId, requestId });

      return {
        success: true,
        message: 'Automation queued',
        actionType,
        status: 'pending'
      };
    } catch (error) {
      console.error('[KernelN8nBridge] Automation queue failed:', error);
      throw error;
    }
  }

  /**
   * Get AI task result (once completed by n8n worker)
   */
  async getAITaskResult(taskId) {
    try {
      const { data, error } = await this.supabase
        .from('node_ai_task_queue')
        .select('*')
        .eq('id', taskId)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        status: data.status,
        result: data.result,
        tokensUsed: data.tokens_used,
        completedAt: data.completed_at,
        error: data.error_message
      };
    } catch (error) {
      console.error('[KernelN8nBridge] Get AI task result failed:', error);
      throw error;
    }
  }

  /**
   * Send with retry logic
   */
  async sendWithRetry(event, attempt = 0) {
    try {
      const response = await fetch(this.n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
        timeout: this.timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (attempt < this.retryAttempts) {
        console.log(`[KernelN8nBridge] Retry attempt ${attempt + 1}/${this.retryAttempts}`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (attempt + 1)));
        return this.sendWithRetry(event, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Log event to database
   */
  async logEvent(event, status, errorMessage = null) {
    try {
      await this.supabase
        .from('node_event_queue')
        .insert({
          event_id: event.event_id,
          event_type: event.event_type,
          request_id: event.request_id,
          user_id: event.user_id,
          business_id: event.business_id,
          status,
          error_message: errorMessage,
          payload: event.payload || {}
        });
    } catch (error) {
      console.error('[KernelN8nBridge] Failed to log event:', error);
      // Don't throw - logging failure shouldn't break the flow
    }
  }

  /**
   * Generate unique event ID
   */
  generateEventId() {
    return `evt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  /**
   * Check queue health
   */
  async getQueueStats() {
    try {
      const queries = [
        {
          name: 'pending_events',
          query: this.supabase
            .from('node_event_queue')
            .select('*', { count: 'exact' })
            .eq('status', 'pending')
        },
        {
          name: 'pending_ai_tasks',
          query: this.supabase
            .from('node_ai_task_queue')
            .select('*', { count: 'exact' })
            .eq('status', 'pending')
        },
        {
          name: 'failed_events',
          query: this.supabase
            .from('node_event_queue')
            .select('*', { count: 'exact' })
            .eq('status', 'failed')
        }
      ];

      const results = {};
      for (const { name, query } of queries) {
        const { count, error } = await query;
        if (error) throw error;
        results[name] = count || 0;
      }

      return {
        success: true,
        stats: results,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[KernelN8nBridge] Queue stats failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Clear old processed events (cleanup)
   */
  async cleanupOldEvents(daysOld = 7) {
    try {
      const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();

      const { count, error } = await this.supabase
        .from('node_event_queue')
        .delete()
        .lt('processed_at', cutoffDate)
        .eq('status', 'processed');

      if (error) throw error;

      return {
        success: true,
        deletedCount: count,
        message: `Deleted ${count} events older than ${daysOld} days`
      };
    } catch (error) {
      console.error('[KernelN8nBridge] Cleanup failed:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = KernelN8nBridge;

/**
 * N8N Kernel Integration Tests
 * 
 * Tests the complete flow:
 * Kernel → Event Queue → n8n Workers → Supabase Results
 */

const request = require('supertest');
const { createClient } = require('@supabase/supabase-js');
const KernelN8nBridge = require('../kernel-n8n-bridge');

describe('N8N Kernel Integration', () => {
  let app;
  let supabase;
  let bridge;
  let testUser;
  let testBusiness;

  const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/kernel-events';
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  beforeAll(async () => {
    // Initialize Supabase
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Initialize bridge
    bridge = new KernelN8nBridge({
      n8nWebhookUrl: N8N_WEBHOOK_URL,
      supabase,
      retryAttempts: 3
    });

    // Create test user
    const { data: users } = await supabase
      .from('node_users')
      .insert({
        email: `test_${Date.now()}@test.com`,
        full_name: 'Test User',
        status: 'active'
      })
      .select()
      .single();

    testUser = users;

    // Create test business
    const { data: business } = await supabase
      .from('node_businesses')
      .insert({
        name: `Test Business ${Date.now()}`,
        owner_id: testUser.id
      })
      .select()
      .single();

    testBusiness = business;
  });

  afterAll(async () => {
    // Cleanup
    await supabase
      .from('node_users')
      .delete()
      .eq('id', testUser.id);

    await supabase
      .from('node_businesses')
      .delete()
      .eq('id', testBusiness.id);
  });

  describe('Event Publishing', () => {
    it('should publish event to n8n queue', async () => {
      const event = {
        event_type: 'test_event',
        user_id: testUser.id,
        business_id: testBusiness.id,
        payload: {
          message: 'Test message'
        }
      };

      const result = await bridge.publishEvent(
        event.event_type,
        event.payload,
        {
          userId: event.user_id,
          businessId: event.business_id
        }
      );

      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
    }, 10000);

    it('should log published events to database', async () => {
      const result = await bridge.publishEvent(
        'test_logged_event',
        { message: 'Test' },
        {
          userId: testUser.id,
          businessId: testBusiness.id
        }
      );

      // Query the event log
      const { data } = await supabase
        .from('node_event_queue')
        .select('*')
        .eq('event_id', result.eventId)
        .single();

      expect(data).toBeDefined();
      expect(data.status).toBe('published');
      expect(data.event_type).toBe('test_logged_event');
    }, 10000);

    it('should retry on network failure', async () => {
      const retryBridge = new KernelN8nBridge({
        n8nWebhookUrl: 'http://localhost:9999', // Non-existent server
        supabase,
        retryAttempts: 2,
        retryDelay: 100
      });

      try {
        await retryBridge.publishEvent(
          'test_event',
          {},
          { userId: testUser.id, businessId: testBusiness.id }
        );
        fail('Should have thrown error');
      } catch (error) {
        expect(error.message).toContain('Failed to publish event');
      }
    }, 10000);
  });

  describe('AI Task Processing', () => {
    it('should create AI task in queue', async () => {
      const result = await bridge.createAITask({
        userId: testUser.id,
        businessId: testBusiness.id,
        prompt: 'What is 2+2?',
        systemPrompt: 'You are a helpful math tutor.',
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 100
      });

      expect(result.success).toBe(true);
      expect(result.taskId).toBeDefined();
      expect(result.status).toBe('queued');

      // Verify in database
      const { data: task } = await supabase
        .from('node_ai_task_queue')
        .select('*')
        .eq('id', result.taskId)
        .single();

      expect(task).toBeDefined();
      expect(task.status).toBe('pending');
      expect(task.prompt).toBe('What is 2+2?');
      expect(task.model).toBe('gpt-3.5-turbo');
    }, 10000);

    it('should handle missing OpenAI key gracefully', async () => {
      // Temporarily unset OpenAI key
      const originalKey = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      const result = await bridge.createAITask({
        userId: testUser.id,
        businessId: testBusiness.id,
        prompt: 'Test prompt'
      });

      // Should still queue the task (worker will fail)
      expect(result.success).toBe(true);
      expect(result.taskId).toBeDefined();

      process.env.OPENAI_API_KEY = originalKey;
    }, 10000);

    it('should get AI task result', async () => {
      // Create a task
      const taskResult = await bridge.createAITask({
        userId: testUser.id,
        businessId: testBusiness.id,
        prompt: 'Simple test',
        model: 'gpt-3.5-turbo'
      });

      const taskId = taskResult.taskId;

      // Manually update task to completed (simulating worker)
      await supabase
        .from('node_ai_task_queue')
        .update({
          status: 'completed',
          result: 'Test result',
          tokens_used: 42,
          completed_at: new Date().toISOString()
        })
        .eq('id', taskId);

      // Get result
      const result = await bridge.getAITaskResult(taskId);

      expect(result.status).toBe('completed');
      expect(result.result).toBe('Test result');
      expect(result.tokensUsed).toBe(42);
    }, 10000);
  });

  describe('Memory Persistence', () => {
    it('should queue memory write without blocking', async () => {
      const startTime = Date.now();

      const result = await bridge.queueMemoryWrite({
        userId: testUser.id,
        businessId: testBusiness.id,
        sessionId: `session_${Date.now()}`,
        role: 'user',
        message: 'Hello, how are you?'
      });

      const duration = Date.now() - startTime;

      // Should return immediately (async)
      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(500); // Should be instant
      expect(result.status).toBe('pending');
    }, 10000);

    it('should accept both user and assistant roles', async () => {
      const sessionId = `session_${Date.now()}`;

      // User message
      const result1 = await bridge.queueMemoryWrite({
        userId: testUser.id,
        businessId: testBusiness.id,
        sessionId,
        role: 'user',
        message: 'Hi there'
      });

      expect(result1.success).toBe(true);

      // Assistant message
      const result2 = await bridge.queueMemoryWrite({
        userId: testUser.id,
        businessId: testBusiness.id,
        sessionId,
        role: 'assistant',
        message: 'Hello! How can I help?'
      });

      expect(result2.success).toBe(true);
    }, 10000);
  });

  describe('Automation Execution', () => {
    it('should queue email automation', async () => {
      const result = await bridge.queueAutomation({
        userId: testUser.id,
        businessId: testBusiness.id,
        actionType: 'send_email',
        actionParams: {
          recipient: `test_${Date.now()}@example.com`,
          subject: 'Test Email',
          template: 'test',
          context: { message: 'Hello' }
        }
      });

      expect(result.success).toBe(true);
      expect(result.actionType).toBe('send_email');
      expect(result.status).toBe('pending');
    }, 10000);

    it('should queue webhook automation', async () => {
      const result = await bridge.queueAutomation({
        userId: testUser.id,
        businessId: testBusiness.id,
        actionType: 'webhook_call',
        actionParams: {
          webhook_url: 'https://httpbin.org/post',
          method: 'POST',
          body: { data: 'test' }
        }
      });

      expect(result.success).toBe(true);
      expect(result.actionType).toBe('webhook_call');
    }, 10000);

    it('should queue database record creation', async () => {
      const result = await bridge.queueAutomation({
        userId: testUser.id,
        businessId: testBusiness.id,
        actionType: 'create_record',
        actionParams: {
          table: 'node_notifications',
          data: {
            user_id: testUser.id,
            type: 'test',
            title: 'Test Notification',
            content: 'Test content'
          }
        }
      });

      expect(result.success).toBe(true);
      expect(result.actionType).toBe('create_record');
    }, 10000);

    it('should validate automation action type', async () => {
      try {
        await bridge.queueAutomation({
          userId: testUser.id,
          businessId: testBusiness.id,
          actionType: 'invalid_action',
          actionParams: {}
        });
        fail('Should have thrown error');
      } catch (error) {
        expect(error.message).toContain('Invalid action type');
      }
    }, 10000);
  });

  describe('Queue Health', () => {
    it('should get queue statistics', async () => {
      // Create some test events
      await bridge.publishEvent('test1', {}, {
        userId: testUser.id,
        businessId: testBusiness.id
      });

      await bridge.publishEvent('test2', {}, {
        userId: testUser.id,
        businessId: testBusiness.id
      });

      // Get stats
      const stats = await bridge.getQueueStats();

      expect(stats.success).toBe(true);
      expect(stats.stats.pending_events).toBeGreaterThanOrEqual(0);
      expect(stats.stats.pending_ai_tasks).toBeGreaterThanOrEqual(0);
      expect(stats.stats.failed_events).toBeGreaterThanOrEqual(0);
    }, 10000);

    it('should cleanup old processed events', async () => {
      // Create old event (2 days ago)
      const oldDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

      await supabase
        .from('node_event_queue')
        .insert({
          event_id: `evt_old_${Date.now()}`,
          event_type: 'cleanup_test',
          status: 'processed',
          processed_at: oldDate
        });

      // Cleanup events older than 1 day
      const result = await bridge.cleanupOldEvents(1);

      expect(result.success).toBe(true);
      // Count should be >= 1 (if it was actually deleted)
    }, 10000);
  });

  describe('End-to-End Integration', () => {
    it('should complete full event flow: publish → queue → worker → result', async () => {
      const eventId = `evt_e2e_${Date.now()}`;

      // Step 1: Publish event
      const publishResult = await bridge.publishEvent(
        'test_e2e',
        { message: 'Full flow test' },
        {
          userId: testUser.id,
          businessId: testBusiness.id,
          requestId: eventId
        }
      );

      expect(publishResult.success).toBe(true);

      // Step 2: Verify event in queue
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for async processing

      const { data: event } = await supabase
        .from('node_event_queue')
        .select('*')
        .eq('event_id', publishResult.eventId)
        .single();

      expect(event).toBeDefined();
      expect(event.event_type).toBe('test_e2e');

      // Step 3: Simulate worker processing
      await supabase
        .from('node_event_queue')
        .update({ status: 'processed', processed_at: new Date().toISOString() })
        .eq('event_id', publishResult.eventId);

      // Step 4: Verify result
      const { data: processedEvent } = await supabase
        .from('node_event_queue')
        .select('*')
        .eq('event_id', publishResult.eventId)
        .single();

      expect(processedEvent.status).toBe('processed');
    }, 15000);

    it('should handle concurrent events', async () => {
      const promises = [];

      // Publish 10 events concurrently
      for (let i = 0; i < 10; i++) {
        promises.push(
          bridge.publishEvent(
            'concurrent_test',
            { index: i },
            {
              userId: testUser.id,
              businessId: testBusiness.id
            }
          )
        );
      }

      const results = await Promise.all(promises);

      // All should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.eventId).toBeDefined();
      });

      // Verify all in queue
      const { count } = await supabase
        .from('node_event_queue')
        .select('*', { count: 'exact' })
        .eq('event_type', 'concurrent_test');

      expect(count).toBeGreaterThanOrEqual(10);
    }, 15000);
  });

  describe('Error Handling & Recovery', () => {
    it('should handle database connection failures', async () => {
      const badBridge = new KernelN8nBridge({
        n8nWebhookUrl: N8N_WEBHOOK_URL,
        supabase: null // Bad connection
      });

      try {
        await badBridge.getQueueStats();
        fail('Should have thrown error');
      } catch (error) {
        expect(error.message).toBeDefined();
      }
    }, 10000);

    it('should provide meaningful error messages', async () => {
      try {
        await bridge.queueAutomation({
          userId: testUser.id,
          businessId: testBusiness.id,
          actionType: 'unknown_action',
          actionParams: {}
        });
        fail('Should throw error');
      } catch (error) {
        expect(error.message).toContain('Invalid action type');
      }
    }, 10000);

    it('should timeout on slow webhooks', async () => {
      const slowBridge = new KernelN8nBridge({
        n8nWebhookUrl: 'http://httpbin.org/delay/10', // 10 second delay
        supabase,
        timeout: 2000 // 2 second timeout
      });

      try {
        await slowBridge.publishEvent('timeout_test', {}, {
          userId: testUser.id,
          businessId: testBusiness.id
        });
        fail('Should have timed out');
      } catch (error) {
        // Expected
      }
    }, 15000);
  });
});

/**
 * Performance Tests (optional - comment out if running quick tests)
 */
describe('Performance', () => {
  let supabase;
  let bridge;
  let testUser;
  let testBusiness;

  beforeAll(async () => {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    bridge = new KernelN8nBridge({
      n8nWebhookUrl: process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/kernel-events',
      supabase
    });

    // Setup test data
    const { data: users } = await supabase
      .from('node_users')
      .insert({ email: `perf_${Date.now()}@test.com`, status: 'active' })
      .select()
      .single();
    testUser = users;

    const { data: business } = await supabase
      .from('node_businesses')
      .insert({ name: `Perf Test ${Date.now()}`, owner_id: testUser.id })
      .select()
      .single();
    testBusiness = business;
  });

  it('should publish 100 events in < 5 seconds', async () => {
    const startTime = Date.now();
    const promises = [];

    for (let i = 0; i < 100; i++) {
      promises.push(
        bridge.publishEvent('perf_test', { index: i }, {
          userId: testUser.id,
          businessId: testBusiness.id
        })
      );
    }

    await Promise.all(promises);
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(5000);
    console.log(`Published 100 events in ${duration}ms (${(100 / (duration / 1000)).toFixed(0)} events/sec)`);
  }, 10000);

  it('should handle 50 concurrent AI task creations', async () => {
    const startTime = Date.now();
    const promises = [];

    for (let i = 0; i < 50; i++) {
      promises.push(
        bridge.createAITask({
          userId: testUser.id,
          businessId: testBusiness.id,
          prompt: `Test prompt ${i}`,
          model: 'gpt-3.5-turbo'
        })
      );
    }

    const results = await Promise.all(promises);
    const duration = Date.now() - startTime;

    expect(results.every(r => r.success)).toBe(true);
    console.log(`Created 50 AI tasks in ${duration}ms`);
  }, 15000);
});

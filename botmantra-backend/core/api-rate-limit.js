/**
 * API Rate Limit Node
 * Node-based API rate limiting system
 */

const NodeFactory = require('./nodeFactory');

class APIRateLimitNode {
  constructor(supabaseClient) {
    this.db = supabaseClient;
    this.nodeFactory = new NodeFactory(supabaseClient);
  }

  /**
   * Check and update rate limit for an IP and node hash combination
   */
  async checkRateLimit(ip, nidHash, maxHits = 100, windowMinutes = 60) {
    try {
      const windowStart = new Date();
      windowStart.setMinutes(windowStart.getMinutes() - windowMinutes);

      // Check current rate limit record
      const { data: existing, error: queryError } = await this.db
        .from('api_rate_limit')
        .select('*')
        .eq('ip', ip)
        .eq('nid_hash', nidHash)
        .gte('window_start', windowStart.toISOString())
        .single();

      if (queryError && queryError.code !== 'PGRST116') {
        throw new Error(`Database query failed: ${queryError.message}`);
      }

      const now = new Date();

      if (existing) {
        // Update existing record
        const newHitCount = existing.hit_count + 1;

        if (newHitCount > maxHits) {
          return {
            allowed: false,
            remaining: 0,
            reset_time: new Date(existing.window_start.getTime() + (windowMinutes * 60 * 1000)),
            current_hits: newHitCount
          };
        }

        const { data: updated, error: updateError } = await this.db
          .from('api_rate_limit')
          .update({ hit_count: newHitCount })
          .eq('ip', ip)
          .eq('nid_hash', nidHash)
          .select()
          .single();

        if (updateError) {
          throw new Error(`Database update failed: ${updateError.message}`);
        }

        return {
          allowed: true,
          remaining: maxHits - newHitCount,
          reset_time: new Date(existing.window_start.getTime() + (windowMinutes * 60 * 1000)),
          current_hits: newHitCount
        };
      } else {
        // Create new record
        const { data: created, error: insertError } = await this.db
          .from('api_rate_limit')
          .insert({
            ip,
            nid_hash: nidHash,
            hit_count: 1,
            window_start: now.toISOString()
          })
          .select()
          .single();

        if (insertError) {
          throw new Error(`Database insert failed: ${insertError.message}`);
        }

        return {
          allowed: true,
          remaining: maxHits - 1,
          reset_time: new Date(now.getTime() + (windowMinutes * 60 * 1000)),
          current_hits: 1
        };
      }
    } catch (error) {
      console.error('API Rate Limit Node - Check error:', error);
      // On error, allow the request but log it
      return {
        allowed: true,
        remaining: maxHits - 1,
        reset_time: new Date(Date.now() + (windowMinutes * 60 * 1000)),
        current_hits: 1,
        error: error.message
      };
    }
  }

  /**
   * Get rate limit status for an IP and node hash
   */
  async getRateLimitStatus(ip, nidHash, windowMinutes = 60) {
    try {
      const windowStart = new Date();
      windowStart.setMinutes(windowStart.getMinutes() - windowMinutes);

      const { data: record, error } = await this.db
        .from('api_rate_limit')
        .select('*')
        .eq('ip', ip)
        .eq('nid_hash', nidHash)
        .gte('window_start', windowStart.toISOString())
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Database query failed: ${error.message}`);
      }

      if (!record) {
        return {
          ip,
          nid_hash: nidHash,
          current_hits: 0,
          window_start: null,
          is_active: false
        };
      }

      return {
        ip: record.ip,
        nid_hash: record.nid_hash,
        current_hits: record.hit_count,
        window_start: record.window_start,
        is_active: true
      };
    } catch (error) {
      console.error('API Rate Limit Node - Get status error:', error);
      throw error;
    }
  }

  /**
   * Reset rate limit for an IP and node hash
   */
  async resetRateLimit(ip, nidHash) {
    try {
      const { error } = await this.db
        .from('api_rate_limit')
        .delete()
        .eq('ip', ip)
        .eq('nid_hash', nidHash);

      if (error) {
        throw new Error(`Database delete failed: ${error.message}`);
      }

      return { reset: true };
    } catch (error) {
      console.error('API Rate Limit Node - Reset error:', error);
      throw error;
    }
  }

  /**
   * Clean up expired rate limit records
   */
  async cleanupExpiredRecords(windowMinutes = 60) {
    try {
      const cutoffTime = new Date();
      cutoffTime.setMinutes(cutoffTime.getMinutes() - windowMinutes);

      const { data: deletedRecords, error } = await this.db
        .from('api_rate_limit')
        .delete()
        .lt('window_start', cutoffTime.toISOString())
        .select();

      if (error) {
        throw new Error(`Database cleanup failed: ${error.message}`);
      }

      return {
        cleaned: deletedRecords ? deletedRecords.length : 0
      };
    } catch (error) {
      console.error('API Rate Limit Node - Cleanup error:', error);
      throw error;
    }
  }

  /**
   * Get rate limit statistics
   */
  async getRateLimitStats(windowMinutes = 60) {
    try {
      const windowStart = new Date();
      windowStart.setMinutes(windowStart.getMinutes() - windowMinutes);

      const { data: records, error } = await this.db
        .from('api_rate_limit')
        .select('*')
        .gte('window_start', windowStart.toISOString());

      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      const stats = {
        total_records: records.length,
        total_hits: records.reduce((sum, record) => sum + record.hit_count, 0),
        average_hits_per_ip: 0,
        top_ips: [],
        recent_activity: records.length
      };

      if (records.length > 0) {
        stats.average_hits_per_ip = stats.total_hits / records.length;

        // Get top 10 IPs by hit count
        stats.top_ips = records
          .sort((a, b) => b.hit_count - a.hit_count)
          .slice(0, 10)
          .map(record => ({
            ip: record.ip,
            hits: record.hit_count,
            nid_hash: record.nid_hash
          }));
      }

      return stats;
    } catch (error) {
      console.error('API Rate Limit Node - Stats error:', error);
      throw error;
    }
  }

  /**
   * Check if IP is blocked (exceeded rate limit)
   */
  async isBlocked(ip, nidHash, maxHits = 100, windowMinutes = 60) {
    try {
      const status = await this.getRateLimitStatus(ip, nidHash, windowMinutes);
      return status.current_hits >= maxHits;
    } catch (error) {
      console.error('API Rate Limit Node - Is blocked check error:', error);
      // On error, don't block the request
      return false;
    }
  }

  /**
   * Get blocked IPs
   */
  async getBlockedIPs(maxHits = 100, windowMinutes = 60) {
    try {
      const windowStart = new Date();
      windowStart.setMinutes(windowStart.getMinutes() - windowMinutes);

      const { data: records, error } = await this.db
        .from('api_rate_limit')
        .select('*')
        .gte('window_start', windowStart.toISOString())
        .gte('hit_count', maxHits);

      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      return records.map(record => ({
        ip: record.ip,
        nid_hash: record.nid_hash,
        hit_count: record.hit_count,
        window_start: record.window_start,
        exceeded_by: record.hit_count - maxHits
      }));
    } catch (error) {
      console.error('API Rate Limit Node - Get blocked IPs error:', error);
      throw error;
    }
  }
}

module.exports = { APIRateLimitNode };
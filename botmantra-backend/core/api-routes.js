/**
 * API Routes Node
 * Node-based API route configuration system
 */

const NodeFactory = require('./nodeFactory');

class APIRoutesNode {
  constructor(supabaseClient) {
    this.db = supabaseClient;
    this.nodeFactory = new NodeFactory(supabaseClient);
  }

  /**
   * Create a new API route configuration
   */
  async createAPIRoute(routeData, nodeCode = null) {
    try {
      // Create the node first
      const nodeData = {
        node_type: 'api_routes',
        node_code: nodeCode || `api_route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        owner_id: routeData.business_id,
        data: {
          route_code: routeData.route_code,
          http_method: routeData.http_method,
          template_code: routeData.template_code,
          table_name: routeData.table_name,
          allow_read: routeData.allow_read !== false,
          allow_create: routeData.allow_create !== false,
          allow_update: routeData.allow_update !== false,
          allow_delete: routeData.allow_delete !== false,
          requires_auth: routeData.requires_auth !== false
        },
        metadata: {
          description: `${routeData.http_method} ${routeData.route_code} for ${routeData.table_name}`,
          route_type: 'api_endpoint',
          permissions: {
            read: routeData.allow_read !== false,
            create: routeData.allow_create !== false,
            update: routeData.allow_update !== false,
            delete: routeData.allow_delete !== false
          },
          auth_required: routeData.requires_auth !== false
        },
        relationships: [],
        is_active: true
      };

      const node = await this.nodeFactory.createNonLiveNode(nodeData);

      // Insert into api_routes table
      const dbData = {
        id: node.node_id,
        business_id: routeData.business_id,
        route_code: routeData.route_code,
        http_method: routeData.http_method,
        template_code: routeData.template_code,
        table_name: routeData.table_name,
        allow_read: routeData.allow_read !== false,
        allow_create: routeData.allow_create !== false,
        allow_update: routeData.allow_update !== false,
        allow_delete: routeData.allow_delete !== false,
        requires_auth: routeData.requires_auth !== false
      };

      const { data: dbRecord, error: dbError } = await this.db
        .from('api_routes')
        .insert(dbData)
        .select()
        .single();

      if (dbError) {
        // If database insert fails, we should clean up the node
        await this.nodeFactory.deleteNode(node.node_code);
        throw new Error(`Database insert failed: ${dbError.message}`);
      }

      return {
        node,
        database_record: dbRecord
      };
    } catch (error) {
      console.error('API Routes Node - Create error:', error);
      throw error;
    }
  }

  /**
   * Query API routes with filters
   */
  async queryAPIRoutes(criteria = {}, options = {}) {
    try {
      const { limit = 50, offset = 0, sort = 'created_at', order = 'desc' } = options;

      // Build node query criteria
      const nodeCriteria = {
        node_type: 'api_routes',
        is_active: true
      };

      if (criteria.business_id) {
        nodeCriteria.owner_id = criteria.business_id;
      }

      if (criteria.http_method) {
        nodeCriteria['data.http_method'] = criteria.http_method;
      }

      if (criteria.table_name) {
        nodeCriteria['data.table_name'] = criteria.table_name;
      }

      // Query nodes
      const nodes = await this.nodeFactory.queryNodes(nodeCriteria, { limit, offset, sort, order });

      // Get corresponding database records
      const nodeIds = nodes.map(node => node.node_id);
      const { data: dbRecords, error } = await this.db
        .from('api_routes')
        .select('*')
        .in('id', nodeIds)
        .order(sort, { ascending: order === 'asc' });

      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      // Combine node and database data
      const combined = nodes.map(node => {
        const dbRecord = dbRecords.find(record => record.id === node.node_id);
        return {
          ...node,
          database_record: dbRecord
        };
      });

      return {
        routes: combined,
        total: nodes.length,
        limit,
        offset
      };
    } catch (error) {
      console.error('API Routes Node - Query error:', error);
      throw error;
    }
  }

  /**
   * Get API route by node code
   */
  async getAPIRoute(nodeCode, businessId = null) {
    try {
      const node = await this.nodeFactory.getNodeByCode(nodeCode);

      if (!node || node.node_type !== 'api_routes') {
        return null;
      }

      // Check ownership if specified
      if (businessId && node.owner_id !== businessId) {
        return null;
      }

      // Get database record
      const { data: dbRecord, error } = await this.db
        .from('api_routes')
        .select('*')
        .eq('id', node.node_id)
        .single();

      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      return {
        ...node,
        database_record: dbRecord
      };
    } catch (error) {
      console.error('API Routes Node - Get by code error:', error);
      throw error;
    }
  }

  /**
   * Get route by route code and method
   */
  async getRouteByCode(routeCode, httpMethod, businessId = null) {
    try {
      // Query database for the route
      let query = this.db
        .from('api_routes')
        .select('*')
        .eq('route_code', routeCode)
        .eq('http_method', httpMethod);

      if (businessId) {
        query = query.eq('business_id', businessId);
      }

      const { data: dbRecord, error } = await query.single();

      if (error || !dbRecord) {
        return null;
      }

      // Get corresponding node
      const node = await this.nodeFactory.getNodeById(dbRecord.id);

      return {
        ...node,
        database_record: dbRecord
      };
    } catch (error) {
      console.error('API Routes Node - Get by route code error:', error);
      throw error;
    }
  }

  /**
   * Update API route
   */
  async updateAPIRoute(nodeCode, updateData) {
    try {
      // Get current route
      const current = await this.getAPIRoute(nodeCode);
      if (!current) {
        throw new Error('API route not found');
      }

      // Prepare node update
      const nodeUpdate = {
        data: {
          ...current.data,
          route_code: updateData.route_code !== undefined ? updateData.route_code : current.data.route_code,
          http_method: updateData.http_method !== undefined ? updateData.http_method : current.data.http_method,
          template_code: updateData.template_code !== undefined ? updateData.template_code : current.data.template_code,
          table_name: updateData.table_name !== undefined ? updateData.table_name : current.data.table_name,
          allow_read: updateData.allow_read !== undefined ? updateData.allow_read : current.data.allow_read,
          allow_create: updateData.allow_create !== undefined ? updateData.allow_create : current.data.allow_create,
          allow_update: updateData.allow_update !== undefined ? updateData.allow_update : current.data.allow_update,
          allow_delete: updateData.allow_delete !== undefined ? updateData.allow_delete : current.data.allow_delete,
          requires_auth: updateData.requires_auth !== undefined ? updateData.requires_auth : current.data.requires_auth
        },
        metadata: {
          ...current.metadata,
          description: `${updateData.http_method || current.data.http_method} ${updateData.route_code || current.data.route_code} for ${updateData.table_name || current.data.table_name}`,
          permissions: {
            read: updateData.allow_read !== undefined ? updateData.allow_read : current.data.allow_read,
            create: updateData.allow_create !== undefined ? updateData.allow_create : current.data.allow_create,
            update: updateData.allow_update !== undefined ? updateData.allow_update : current.data.allow_update,
            delete: updateData.allow_delete !== undefined ? updateData.allow_delete : current.data.allow_delete
          },
          auth_required: updateData.requires_auth !== undefined ? updateData.requires_auth : current.data.requires_auth,
          updated_at: new Date().toISOString()
        },
        is_active: updateData.is_active !== undefined ? updateData.is_active : current.is_active
      };

      // Update node
      const updatedNode = await this.nodeFactory.updateNode(nodeCode, nodeUpdate);

      // Update database record
      const dbUpdate = {};
      if (updateData.route_code !== undefined) dbUpdate.route_code = updateData.route_code;
      if (updateData.http_method !== undefined) dbUpdate.http_method = updateData.http_method;
      if (updateData.template_code !== undefined) dbUpdate.template_code = updateData.template_code;
      if (updateData.table_name !== undefined) dbUpdate.table_name = updateData.table_name;
      if (updateData.allow_read !== undefined) dbUpdate.allow_read = updateData.allow_read;
      if (updateData.allow_create !== undefined) dbUpdate.allow_create = updateData.allow_create;
      if (updateData.allow_update !== undefined) dbUpdate.allow_update = updateData.allow_update;
      if (updateData.allow_delete !== undefined) dbUpdate.allow_delete = updateData.allow_delete;
      if (updateData.requires_auth !== undefined) dbUpdate.requires_auth = updateData.requires_auth;

      if (Object.keys(dbUpdate).length > 0) {
        const { data: dbRecord, error } = await this.db
          .from('api_routes')
          .update(dbUpdate)
          .eq('id', current.node_id)
          .select()
          .single();

        if (error) {
          throw new Error(`Database update failed: ${error.message}`);
        }

        return {
          ...updatedNode,
          database_record: dbRecord
        };
      }

      return updatedNode;
    } catch (error) {
      console.error('API Routes Node - Update error:', error);
      throw error;
    }
  }

  /**
   * Delete API route
   */
  async deleteAPIRoute(nodeCode) {
    try {
      // Get current route to get the database ID
      const current = await this.getAPIRoute(nodeCode);
      if (!current) {
        throw new Error('API route not found');
      }

      // Delete from database
      const { error: dbError } = await this.db
        .from('api_routes')
        .delete()
        .eq('id', current.node_id);

      if (dbError) {
        throw new Error(`Database delete failed: ${dbError.message}`);
      }

      // Delete node
      const result = await this.nodeFactory.deleteNode(nodeCode);

      return { deleted: true };
    } catch (error) {
      console.error('API Routes Node - Delete error:', error);
      throw error;
    }
  }

  /**
   * Check if route allows operation
   */
  async checkRoutePermission(routeCode, httpMethod, operation, businessId = null) {
    try {
      const route = await this.getRouteByCode(routeCode, httpMethod, businessId);

      if (!route) {
        return { allowed: false, reason: 'Route not found' };
      }

      const permissionMap = {
        'GET': 'allow_read',
        'POST': 'allow_create',
        'PUT': 'allow_update',
        'PATCH': 'allow_update',
        'DELETE': 'allow_delete'
      };

      const permissionField = permissionMap[httpMethod.toUpperCase()];

      if (!permissionField) {
        return { allowed: false, reason: 'Unsupported HTTP method' };
      }

      const allowed = route.database_record[permissionField];

      return {
        allowed,
        reason: allowed ? 'Permission granted' : 'Permission denied',
        route: route
      };
    } catch (error) {
      console.error('API Routes Node - Check permission error:', error);
      return { allowed: false, reason: 'Permission check failed' };
    }
  }

  /**
   * Get routes for a business
   */
  async getRoutesForBusiness(businessId, options = {}) {
    try {
      const criteria = {
        business_id: businessId
      };

      return await this.queryAPIRoutes(criteria, options);
    } catch (error) {
      console.error('API Routes Node - Get routes for business error:', error);
      throw error;
    }
  }

  /**
   * Get routes by table name
   */
  async getRoutesByTable(tableName, businessId = null, options = {}) {
    try {
      const criteria = {
        table_name: tableName
      };

      if (businessId) {
        criteria.business_id = businessId;
      }

      return await this.queryAPIRoutes(criteria, options);
    } catch (error) {
      console.error('API Routes Node - Get routes by table error:', error);
      throw error;
    }
  }

  /**
   * Get API routes statistics
   */
  async getAPIRoutesStats(businessId = null) {
    try {
      const criteria = {};
      if (businessId) {
        criteria.business_id = businessId;
      }

      const result = await this.queryAPIRoutes(criteria, { limit: 1000 });

      const stats = {
        total_routes: result.total,
        method_breakdown: {},
        table_breakdown: {},
        auth_required: 0,
        permissions_summary: {
          read: 0,
          create: 0,
          update: 0,
          delete: 0
        }
      };

      result.routes.forEach(route => {
        const db = route.database_record;

        // Method breakdown
        stats.method_breakdown[db.http_method] = (stats.method_breakdown[db.http_method] || 0) + 1;

        // Table breakdown
        stats.table_breakdown[db.table_name] = (stats.table_breakdown[db.table_name] || 0) + 1;

        // Auth required count
        if (db.requires_auth) {
          stats.auth_required++;
        }

        // Permissions summary
        if (db.allow_read) stats.permissions_summary.read++;
        if (db.allow_create) stats.permissions_summary.create++;
        if (db.allow_update) stats.permissions_summary.update++;
        if (db.allow_delete) stats.permissions_summary.delete++;
      });

      return stats;
    } catch (error) {
      console.error('API Routes Node - Stats error:', error);
      throw error;
    }
  }
}

module.exports = { APIRoutesNode };
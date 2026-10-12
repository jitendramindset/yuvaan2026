/**
 * API Tests for business_labels
 * Generated: 2026-02-04T06:50:03.293Z
 */

const request = require('supertest');
const app = require('../server');

describe('business_labels API Tests', () => {
  let authToken;
  let testRecordId;
  
  beforeAll(async () => {
    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/signin')
      .send({
        email: 'test@example.com',
        password: 'testpassword'
      });
    
    authToken = loginResponse.body.access_token;
  });
  
  test('GET /business-labels - should return list', async () => {
    const response = await request(app)
      .get('/api/business-labels')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
  
  test('POST /business-labels - should create record', async () => {
    const newRecord = {
      // Add test data based on table schema
    };
    
    const response = await request(app)
      .post('/api/business-labels')
      .set('Authorization', `Bearer ${authToken}`)
      .send(newRecord);
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    testRecordId = response.body.data.id;
  });
  
  test('GET /business-labels/:id - should return single record', async () => {
    const response = await request(app)
      .get(`/api/business-labels/${testRecordId}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(testRecordId);
  });
  
  test('PUT /business-labels/:id - should update record', async () => {
    const updateData = {
      // Add update data
    };
    
    const response = await request(app)
      .put(`/api/business-labels/${testRecordId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateData);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
  
  test('DELETE /business-labels/:id - should delete record', async () => {
    const response = await request(app)
      .delete(`/api/business-labels/${testRecordId}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});

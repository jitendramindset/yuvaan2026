/**
 * API Tests for projects
 * Generated: 2026-02-04T06:50:03.921Z
 */

const request = require('supertest');
const app = require('../server');

describe('projects API Tests', () => {
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
  
  test('GET /projects - should return list', async () => {
    const response = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
  
  test('POST /projects - should create record', async () => {
    const newRecord = {
      // Add test data based on table schema
    };
    
    const response = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send(newRecord);
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    testRecordId = response.body.data.id;
  });
  
  test('GET /projects/:id - should return single record', async () => {
    const response = await request(app)
      .get(`/api/projects/${testRecordId}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(testRecordId);
  });
  
  test('PUT /projects/:id - should update record', async () => {
    const updateData = {
      // Add update data
    };
    
    const response = await request(app)
      .put(`/api/projects/${testRecordId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateData);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
  
  test('DELETE /projects/:id - should delete record', async () => {
    const response = await request(app)
      .delete(`/api/projects/${testRecordId}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});

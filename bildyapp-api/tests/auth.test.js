import request from 'supertest';
import { app } from '../src/app.js';
import { connectTestDB, disconnectTestDB, clearCollections } from './setup.js';
import { getToken } from './helpers.js';
import mongoose from 'mongoose';

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearCollections());

describe('Auth & User Endpoints', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'Password123!',
    name: 'Test',
    lastName: 'User'
  };

  test('POST /api/user/register - Success and Duplicate', async () => {
    const res = await request(app).post('/api/user/register').send(testUser);
    expect(res.statusCode).toBe(201);
    const duplicate = await request(app).post('/api/user/register').send(testUser);
    expect(duplicate.statusCode).toBe(409);
  });

  test('PUT /api/user/validation - Verify email', async () => {
    await request(app).post('/api/user/register').send(testUser);
    const user = await mongoose.model('User').findOne({ email: testUser.email });

    const res = await request(app)
      .put('/api/user/validation')
      .send({ email: testUser.email, code: user.verificationCode });
    
    // If this still fails, check that your route doesn't require a Token
    expect(res.statusCode).toBe(200);
  });

  test('POST /api/user/login - Credentials check', async () => {
    await request(app).post('/api/user/register').send(testUser);
    const res = await request(app).post('/api/user/login').send({
      email: testUser.email,
      password: testUser.password
    });
    expect(res.statusCode).toBe(200);
  });

  test('PUT /api/user/register - Update profile', async () => {
    const token = await getToken(testUser.email);
    const res = await request(app)
      .put('/api/user/register')
      .set('Authorization', `Bearer ${token}`)
      .send({ 
        name: 'UpdatedName',
        lastName: 'UpdatedLastName',
        nif: '12345678Z' // Added this to satisfy your Zod schema
      });
    
    if (res.statusCode !== 200) console.log('Update Error Body:', res.body);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.name).toBe('UpdatedName');
  });

  test('PATCH /api/user/company - Set company info', async () => {
    const token = await getToken(testUser.email);
    const res = await request(app)
      .patch('/api/user/company')
      .set('Authorization', `Bearer ${token}`)
      .send({
        isFreelance: true,
        name: 'Freelance Pro',
        cif: '12345678Z',
        address: { street: 'Test', number: '1', postal: '28001', city: 'Madrid', province: 'Madrid' }
      });
    expect(res.statusCode).toBe(200);
  });

  test('DELETE /api/user - Soft delete', async () => {
    const token = await getToken(testUser.email);
    const res = await request(app).delete('/api/user').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
  });
});
import request from 'supertest';
import { app } from '../src/app.js';
import { connectTestDB, disconnectTestDB, clearCollections } from './setup.js';
import { setupUserWithCompany } from './helpers.js';

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearCollections());

const clientData = {
  name: 'ACME Corp',
  cif: 'B12345678',
  email: 'acme@example.com',
  phone: '600000000',
  address: { street: 'Main St', number: '1', postal: '28001', city: 'Madrid', province: 'Madrid' },
};

describe('Client Endpoints', () => {
  test('POST /api/client - Create client successfully', async () => {
    const { token } = await setupUserWithCompany('client1@test.com', 'TestCo', 'A11111111');
    const res = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send(clientData);
    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe('ACME Corp');
    expect(res.body.cif).toBe('B12345678');
  });

  test('POST /api/client - Duplicate CIF returns 409', async () => {
    const { token } = await setupUserWithCompany('client2@test.com', 'TestCo', 'A22222222');
    await request(app).post('/api/client').set('Authorization', `Bearer ${token}`).send(clientData);
    const res = await request(app).post('/api/client').set('Authorization', `Bearer ${token}`).send(clientData);
    expect(res.statusCode).toBe(409);
  });

  test('GET /api/client - List clients with pagination', async () => {
    const { token } = await setupUserWithCompany('client3@test.com', 'TestCo', 'A33333333');
    await request(app).post('/api/client').set('Authorization', `Bearer ${token}`).send(clientData);
    const res = await request(app).get('/api/client').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('totalItems');
    expect(res.body.data).toHaveLength(1);
  });

  test('GET /api/client/:id - Get client by ID', async () => {
    const { token } = await setupUserWithCompany('client4@test.com', 'TestCo', 'A44444444');
    const created = await request(app).post('/api/client').set('Authorization', `Bearer ${token}`).send(clientData);
    const res = await request(app).get(`/api/client/${created.body._id}`).set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body._id).toBe(created.body._id);
  });

  test('GET /api/client/:id - Not found returns 404', async () => {
    const { token } = await setupUserWithCompany('client5@test.com', 'TestCo', 'A55555555');
    const res = await request(app).get('/api/client/000000000000000000000000').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
  });

  test('PUT /api/client/:id - Update client', async () => {
    const { token } = await setupUserWithCompany('client6@test.com', 'TestCo', 'A66666666');
    const created = await request(app).post('/api/client').set('Authorization', `Bearer ${token}`).send(clientData);
    const res = await request(app)
      .put(`/api/client/${created.body._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Corp' });
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('Updated Corp');
  });

  test('DELETE /api/client/:id - Soft delete', async () => {
    const { token } = await setupUserWithCompany('client7@test.com', 'TestCo', 'A77777777');
    const created = await request(app).post('/api/client').set('Authorization', `Bearer ${token}`).send(clientData);
    const res = await request(app)
      .delete(`/api/client/${created.body._id}?soft=true`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
  });

  test('GET /api/client/archived - List archived clients', async () => {
    const { token } = await setupUserWithCompany('client8@test.com', 'TestCo', 'A88888888');
    const created = await request(app).post('/api/client').set('Authorization', `Bearer ${token}`).send(clientData);
    await request(app).delete(`/api/client/${created.body._id}?soft=true`).set('Authorization', `Bearer ${token}`);
    const res = await request(app).get('/api/client/archived').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].deleted).toBe(true);
  });

  test('PATCH /api/client/:id/restore - Restore archived client', async () => {
    const { token } = await setupUserWithCompany('client9@test.com', 'TestCo', 'A99999999');
    const created = await request(app).post('/api/client').set('Authorization', `Bearer ${token}`).send(clientData);
    await request(app).delete(`/api/client/${created.body._id}?soft=true`).set('Authorization', `Bearer ${token}`);
    const res = await request(app)
      .patch(`/api/client/${created.body._id}/restore`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.deleted).toBe(false);
  });

  test('POST /api/client - Requires auth', async () => {
    const res = await request(app).post('/api/client').send(clientData);
    expect(res.statusCode).toBe(401);
  });
});
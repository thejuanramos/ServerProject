import request from 'supertest';
import { app } from '../src/app.js';
import { connectTestDB, disconnectTestDB, clearCollections } from './setup.js';
import { setupUserWithCompany } from './helpers.js';

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearCollections());

const setupEnvironment = async (email, companyName, cif) => {
  const { token } = await setupUserWithCompany(email, companyName, cif);

  const clientRes = await request(app)
    .post('/api/client')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'DN Client', cif: 'C12345678', email: 'dnclient@test.com' });

  const projectRes = await request(app)
    .post('/api/project')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'DN Project', projectCode: 'DN-001', client: clientRes.body._id });

  return { token, clientId: clientRes.body._id, projectId: projectRes.body._id };
};

const noteData = (clientId, projectId) => ({
  client: clientId,
  project: projectId,
  format: 'hours',
  description: 'Backend development work',
  workDate: '2025-01-15',
  hours: 8,
});

describe('Delivery Note Endpoints', () => {
  test('POST /api/deliverynote - Create hours delivery note', async () => {
    const { token, clientId, projectId } = await setupEnvironment('dn1@test.com', 'DNco', 'C11111111');
    const res = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send(noteData(clientId, projectId));
    expect(res.statusCode).toBe(201);
    expect(res.body.format).toBe('hours');
    expect(res.body.hours).toBe(8);
  });

  test('POST /api/deliverynote - Create material delivery note', async () => {
    const { token, clientId, projectId } = await setupEnvironment('dn2@test.com', 'DNco', 'C22222222');
    const res = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({
        client: clientId,
        project: projectId,
        format: 'material',
        description: 'Steel beams delivered',
        workDate: '2025-01-15',
        material: 'Steel beam',
        quantity: 10,
        unit: 'units',
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.format).toBe('material');
    expect(res.body.material).toBe('Steel beam');
  });

  test('GET /api/deliverynote - List notes with pagination', async () => {
    const { token, clientId, projectId } = await setupEnvironment('dn3@test.com', 'DNco', 'C33333333');
    await request(app).post('/api/deliverynote').set('Authorization', `Bearer ${token}`).send(noteData(clientId, projectId));
    const res = await request(app).get('/api/deliverynote').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveLength(1);
  });

  test('GET /api/deliverynote/:id - Get note by ID with populated data', async () => {
    const { token, clientId, projectId } = await setupEnvironment('dn4@test.com', 'DNco', 'C44444444');
    const created = await request(app).post('/api/deliverynote').set('Authorization', `Bearer ${token}`).send(noteData(clientId, projectId));
    const res = await request(app).get(`/api/deliverynote/${created.body._id}`).set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.client).toBeDefined();
    expect(res.body.project).toBeDefined();
  });

  test('DELETE /api/deliverynote/:id - Delete unsigned note', async () => {
    const { token, clientId, projectId } = await setupEnvironment('dn5@test.com', 'DNco', 'C55555555');
    const created = await request(app).post('/api/deliverynote').set('Authorization', `Bearer ${token}`).send(noteData(clientId, projectId));
    const res = await request(app).delete(`/api/deliverynote/${created.body._id}`).set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
  });

  test('PATCH /api/deliverynote/:id/sign - Sign a delivery note', async () => {
    const { token, clientId, projectId } = await setupEnvironment('dn6@test.com', 'DNco', 'C66666666');
    const created = await request(app).post('/api/deliverynote').set('Authorization', `Bearer ${token}`).send(noteData(clientId, projectId));
    const res = await request(app)
      .patch(`/api/deliverynote/${created.body._id}/sign`)
      .set('Authorization', `Bearer ${token}`)
      .send({ signatureData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' });
    expect(res.statusCode).toBe(200);
    expect(res.body.signed).toBe(true);
    expect(res.body.signedAt).toBeDefined();
  });

  test('DELETE /api/deliverynote/:id - Cannot delete a signed note', async () => {
    const { token, clientId, projectId } = await setupEnvironment('dn7@test.com', 'DNco', 'C77777777');
    const created = await request(app).post('/api/deliverynote').set('Authorization', `Bearer ${token}`).send(noteData(clientId, projectId));
    await request(app)
      .patch(`/api/deliverynote/${created.body._id}/sign`)
      .set('Authorization', `Bearer ${token}`)
      .send({ signatureData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' });
    const res = await request(app).delete(`/api/deliverynote/${created.body._id}`).set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(400);
  });

  test('PATCH /api/deliverynote/:id/sign - Cannot sign twice', async () => {
    const { token, clientId, projectId } = await setupEnvironment('dn8@test.com', 'DNco', 'C88888888');
    const created = await request(app).post('/api/deliverynote').set('Authorization', `Bearer ${token}`).send(noteData(clientId, projectId));
    const sig = { signatureData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' };
    await request(app).patch(`/api/deliverynote/${created.body._id}/sign`).set('Authorization', `Bearer ${token}`).send(sig);
    const res = await request(app).patch(`/api/deliverynote/${created.body._id}/sign`).set('Authorization', `Bearer ${token}`).send(sig);
    expect(res.statusCode).toBe(400);
  });

  test('POST /api/deliverynote - Requires auth', async () => {
    const res = await request(app).post('/api/deliverynote').send({});
    expect(res.statusCode).toBe(401);
  });
});
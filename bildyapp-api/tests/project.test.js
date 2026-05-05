import request from 'supertest';
import { app } from '../src/app.js';
import { connectTestDB, disconnectTestDB, clearCollections } from './setup.js';
import { setupUserWithCompany } from './helpers.js';

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearCollections());

const clientData = {
  name: 'Test Client',
  cif: 'B12345678',
  email: 'client@test.com',
};

const projectData = {
  name: 'Office Renovation',
  projectCode: 'PRJ-001',
  email: 'project@test.com',
  notes: 'Some notes',
};

const setupWithClient = async (email, companyName, cif) => {
  const { token } = await setupUserWithCompany(email, companyName, cif);
  const clientRes = await request(app)
    .post('/api/client')
    .set('Authorization', `Bearer ${token}`)
    .send(clientData);
  return { token, clientId: clientRes.body._id };
};

describe('Project Endpoints', () => {
  test('POST /api/project - Create project successfully', async () => {
    const { token, clientId } = await setupWithClient('proj1@test.com', 'ProjCo', 'B11111111');
    const res = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...projectData, client: clientId });
    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe('Office Renovation');
    expect(res.body.projectCode).toBe('PRJ-001');
  });

  test('POST /api/project - Duplicate project code returns 409', async () => {
    const { token, clientId } = await setupWithClient('proj2@test.com', 'ProjCo', 'B22222222');
    await request(app).post('/api/project').set('Authorization', `Bearer ${token}`).send({ ...projectData, client: clientId });
    const res = await request(app).post('/api/project').set('Authorization', `Bearer ${token}`).send({ ...projectData, client: clientId });
    expect(res.statusCode).toBe(409);
  });

  test('GET /api/project - List projects with pagination', async () => {
    const { token, clientId } = await setupWithClient('proj3@test.com', 'ProjCo', 'B33333333');
    await request(app).post('/api/project').set('Authorization', `Bearer ${token}`).send({ ...projectData, client: clientId });
    const res = await request(app).get('/api/project').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveLength(1);
  });

  test('GET /api/project/:id - Get project by ID', async () => {
    const { token, clientId } = await setupWithClient('proj4@test.com', 'ProjCo', 'B44444444');
    const created = await request(app).post('/api/project').set('Authorization', `Bearer ${token}`).send({ ...projectData, client: clientId });
    const res = await request(app).get(`/api/project/${created.body._id}`).set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body._id).toBe(created.body._id);
  });

  test('PUT /api/project/:id - Update project', async () => {
    const { token, clientId } = await setupWithClient('proj5@test.com', 'ProjCo', 'B55555555');
    const created = await request(app).post('/api/project').set('Authorization', `Bearer ${token}`).send({ ...projectData, client: clientId });
    const res = await request(app)
      .put(`/api/project/${created.body._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Project' });
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('Updated Project');
  });

  test('DELETE /api/project/:id - Soft delete', async () => {
    const { token, clientId } = await setupWithClient('proj6@test.com', 'ProjCo', 'B66666666');
    const created = await request(app).post('/api/project').set('Authorization', `Bearer ${token}`).send({ ...projectData, client: clientId });
    const res = await request(app)
      .delete(`/api/project/${created.body._id}?soft=true`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
  });

  test('GET /api/project/archived - List archived projects', async () => {
    const { token, clientId } = await setupWithClient('proj7@test.com', 'ProjCo', 'B77777777');
    const created = await request(app).post('/api/project').set('Authorization', `Bearer ${token}`).send({ ...projectData, client: clientId });
    await request(app).delete(`/api/project/${created.body._id}?soft=true`).set('Authorization', `Bearer ${token}`);
    const res = await request(app).get('/api/project/archived').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  test('PATCH /api/project/:id/restore - Restore archived project', async () => {
    const { token, clientId } = await setupWithClient('proj8@test.com', 'ProjCo', 'B88888888');
    const created = await request(app).post('/api/project').set('Authorization', `Bearer ${token}`).send({ ...projectData, client: clientId });
    await request(app).delete(`/api/project/${created.body._id}?soft=true`).set('Authorization', `Bearer ${token}`);
    const res = await request(app)
      .patch(`/api/project/${created.body._id}/restore`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.deleted).toBe(false);
  });

  test('POST /api/project - Requires auth', async () => {
    const res = await request(app).post('/api/project').send(projectData);
    expect(res.statusCode).toBe(401);
  });
});
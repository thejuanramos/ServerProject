import request from 'supertest';
import { app } from '../src/app.js';

/**
 * Registers a user and logs them in to get a JWT token
 */
export const getToken = async (email, password = 'Password123!') => {
  // 1. Register
  await request(app)
    .post('/api/user/register')
    .send({ email, password });

  // 2. Login
  const loginRes = await request(app)
    .post('/api/user/login')
    .send({ email, password });

  return loginRes.body.token;
};

/**
 * Sets up a full profile including company data
 */
export const setupUserWithCompany = async (email, companyName, cif) => {
  const token = await getToken(email);

  await request(app)
    .patch('/api/user/company')
    .set('Authorization', `Bearer ${token}`)
    .send({
      isFreelance: false,
      name: companyName,
      cif: cif,
      address: {
        street: 'Calle Test',
        number: '1',
        postal: '28001',
        city: 'Madrid',
        province: 'Madrid'
      }
    });

  const loginRes = await request(app)
    .post('/api/user/login')
    .send({ email, password: 'Password123!' });

  return { token: loginRes.body.token };
};
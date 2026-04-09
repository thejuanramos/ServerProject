import { Router } from 'express';
import * as clientController from '../controllers/client.controller.js';
import { authMiddleware as auth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { createClientSchema } from '../validators/client.validator.js';

const router = Router();

// POST /api/client -> Create a new client
router.post(
  '/', 
  auth, 
  validate(createClientSchema), 
  clientController.createClient
);

// GET /api/client -> Get all clients for the logged-in user's company
router.get(
  '/', 
  auth, 
  clientController.getClients
);

// GET /api/client/:id -> Get a single client by ID
router.get(
  '/:id', 
  auth, 
  clientController.getClientById
);

export default router;
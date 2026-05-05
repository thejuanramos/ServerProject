import { Router } from 'express';
import * as clientController from '../controllers/client.controller.js';
import auth from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.js';
import { createClientSchema, updateClientSchema } from '../validators/client.validator.js';

const router = Router();

router.use(auth); // All client routes require auth

router.get('/archived', clientController.getArchivedClients);
router.patch('/:id/restore', clientController.restoreClient);

router.route('/')
  .post(validate(createClientSchema), clientController.createClient)
  .get(clientController.getClients);

router.route('/:id')
  .get(clientController.getClientById)
  .put(validate(updateClientSchema), clientController.updateClient)
  .delete(clientController.deleteClient);

export default router;
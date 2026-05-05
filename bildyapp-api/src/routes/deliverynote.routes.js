import { Router } from 'express';
import * as dnController from '../controllers/deliverynote.controller.js';
import authMiddleware from '../middleware/auth.middleware.js'; // Using the name that matches your file
import validate from '../middleware/validate.js';
import { createDeliveryNoteSchema } from '../validators/deliverynote.validator.js';

const router = Router();

// Apply auth to all routes in this file
router.use(authMiddleware);

// --- 1. SPECIFIC ROUTES FIRST ---

router.get('/pdf/:id', dnController.getPDF);

router.patch('/:id/sign', dnController.signDeliveryNote);


// --- 2. COLLECTION ROUTES ---

router.route('/')
  .post(validate(createDeliveryNoteSchema), dnController.createDeliveryNote)
  .get(dnController.getDeliveryNotes);


// --- 3. GENERIC ID ROUTES LAST ---

router.route('/:id')
  .get(dnController.getDeliveryNoteById)
  .delete(dnController.deleteDeliveryNote);

export default router;
import { Router } from 'express';
import * as projectController from '../controllers/project.controller.js';
import { authMiddleware as auth } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/', auth, projectController.createProject);
router.get('/', auth, projectController.getProjects);

export default router;
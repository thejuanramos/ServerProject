import { Router } from 'express';
import * as projectController from '../controllers/project.controller.js';
import auth from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.js';
import { createProjectSchema, updateProjectSchema } from '../validators/project.validator.js';

const router = Router();

router.use(auth);

router.get('/archived', projectController.getArchivedProjects);
router.patch('/:id/restore', projectController.restoreProject);

router.route('/')
  .post(validate(createProjectSchema), projectController.createProject)
  .get(projectController.getProjects);

router.route('/:id')
  .get(projectController.getProjectById)
  .put(validate(updateProjectSchema), projectController.updateProject)
  .delete(projectController.deleteProject);

export default router;
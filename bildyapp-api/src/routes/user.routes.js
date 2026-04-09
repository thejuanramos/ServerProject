import { Router } from 'express';
import {
  registerUser,
  validateEmail,
  loginUser,
  updatePersonalData,
  updateCompanyData,
  uploadCompanyLogo,
  getCurrentUser,
  refreshAccessToken,
  logoutUser,
  deleteUser,
  changePassword,
  inviteUser,
} from '../controllers/user.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { roleMiddleware } from '../middleware/role.middleware.js';
import { upload } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import {
  registerSchema,
  emailValidationSchema,
  loginSchema,
  updateProfileSchema,
  updateCompanySchema,
  refreshSchema,
  passwordChangeSchema,
  inviteSchema,
} from '../validators/user.validator.js';

const router = Router();

// 1) Register
router.post('/register', validate(registerSchema), registerUser);

// 2) Email validation (requires access token from register/login)
router.put(
  '/validation',
  authMiddleware,
  validate(emailValidationSchema),
  validateEmail,
);

// 3) Login
router.post('/login', validate(loginSchema), loginUser);

// 4a) Onboarding: personal data
router.put(
  '/register',
  authMiddleware,
  validate(updateProfileSchema),
  updatePersonalData,
);

// 4b) Onboarding: company data
router.patch(
  '/company',
  authMiddleware,
  validate(updateCompanySchema),
  updateCompanyData,
);

// 5) Company logo
router.patch(
  '/logo',
  authMiddleware,
  upload.single('logo'),
  uploadCompanyLogo,
);

// 6) Get current user with company
router.get('/', authMiddleware, getCurrentUser);

// 7a) Refresh token
router.post('/refresh', validate(refreshSchema), refreshAccessToken);

// 7b) Logout
router.post('/logout', authMiddleware, logoutUser);

// 8) Delete user (soft/hard)
router.delete('/', authMiddleware, deleteUser);

// 9) Change password (bonus)
router.put(
  '/password',
  authMiddleware,
  validate(passwordChangeSchema),
  changePassword,
);

// 10) Invite coworkers (admin only)
router.post(
  '/invite',
  authMiddleware,
  roleMiddleware('admin'),
  validate(inviteSchema),
  inviteUser,
);

export default router;

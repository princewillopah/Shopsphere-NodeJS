import { Router } from 'express';

import * as admin from '../controllers/adminController.js';
import { adminOnly, protect } from '../middleware/auth.js';

const router = Router();

// Every admin route requires a valid token AND the ADMIN role.
router.use(protect, adminOnly);

router.get('/stats', admin.stats);
router.get('/users', admin.listUsers);
router.get('/products', admin.listProducts);
router.delete('/users/:id', admin.deleteUser);

export default router;

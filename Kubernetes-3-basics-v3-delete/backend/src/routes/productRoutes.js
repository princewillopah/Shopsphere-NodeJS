import { Router } from 'express';
import multer from 'multer';

import env from '../config/env.js';
import * as products from '../controllers/productController.js';
import { adminOnly, protect } from '../middleware/auth.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxUploadBytes },
});

const router = Router();

router.get('/', products.list);
router.get('/:id', products.getOne);
router.post('/', protect, adminOnly, upload.single('image'), products.create);
router.put('/:id', protect, adminOnly, upload.single('image'), products.update);
router.delete('/:id', protect, adminOnly, products.remove);

export default router;

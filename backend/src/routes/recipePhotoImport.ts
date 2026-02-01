import { Router } from 'express';
import multer from 'multer';
import { importRecipeFromPhoto } from '../controllers/recipePhotoImport';

const router = Router();

// Configure multer for memory storage (no disk persistence)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

router.post('/import-photo', upload.single('image'), importRecipeFromPhoto);

export default router;

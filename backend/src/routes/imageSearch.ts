import { Router } from 'express';
import { searchImages } from '../controllers/imageSearch';

const router = Router();

// GET /api/images/search?query=recipe+title
// Note: Authentication is handled by the app-level middleware in app.ts
router.get('/search', searchImages);

export default router;

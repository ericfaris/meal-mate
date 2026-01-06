import express from 'express';
import { importRecipeFromUrl } from '../controllers/recipeImport';

const router = express.Router();

router.post('/import', importRecipeFromUrl);

export default router;

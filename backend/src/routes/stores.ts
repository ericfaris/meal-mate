import { Router } from 'express';
import { getStores, createStore, updateStore, deleteStore, reorderStores } from '../controllers/stores';

const router = Router();

router.get('/', getStores);
router.post('/', createStore);
router.put('/reorder', reorderStores);
router.put('/:id', updateStore);
router.delete('/:id', deleteStore);

export default router;

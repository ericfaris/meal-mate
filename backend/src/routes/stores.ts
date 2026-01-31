import { Router } from 'express';
import { getStores, createStore, updateStore, deleteStore } from '../controllers/stores';

const router = Router();

router.get('/', getStores);
router.post('/', createStore);
router.put('/:id', updateStore);
router.delete('/:id', deleteStore);

export default router;

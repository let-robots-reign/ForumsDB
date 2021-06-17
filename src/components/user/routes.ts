import express from 'express';
import controller from './controller';

const router = express.Router();

router.post('/:nickname/create', controller.create);
router.get('/:nickname/profile', controller.getProfile);
router.post('/:nickname/profile', controller.updateProfile);

export default router;

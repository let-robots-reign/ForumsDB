import express from 'express';
import controller from './controller';

const router = express.Router();

router.post('/create', controller.create);
router.get('/:slug/details', controller.details);
router.post('/:slug/create', controller.createThread);
router.get('/:slug/threads', controller.threads);
router.get('/:slug/users', controller.threads);

export default router;

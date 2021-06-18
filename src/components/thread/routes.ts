import express from 'express';
import controller from './controller';

const router = express.Router();

router.post('/:slug_or_id/create', controller.createPosts);
router.get('/:slug_or_id/details', controller.details);
router.post('/:slug_or_id/details', controller.update);
router.get('/:slug_or_id/posts', controller.getPosts);
router.post('/:slug_or_id/vote', controller.vote);

export default router;

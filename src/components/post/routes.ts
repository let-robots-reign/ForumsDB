import express from 'express';
import controller from './controller';

const router = express.Router();

router.route('/:id/details')
    .get(controller.details)
    .post(controller.update);
export default router;

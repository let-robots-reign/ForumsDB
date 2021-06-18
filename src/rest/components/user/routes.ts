import express    from 'express';
import controller from './controller';

const router = express.Router();

router.post('/:nickname/create', controller.create);
router.route('/:nickname/profile')
    .get(controller.getProfile)
    .post(controller.updateProfile);

export default router;

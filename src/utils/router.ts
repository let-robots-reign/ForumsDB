import express from 'express';
import user from '../components/user/routes';
import forum from '../components/forum/routes';
import thread from '../components/thread/routes';
import post from '../components/post/routes';
import service from '../components/service/routes';

const router = express.Router();
router.use('/user', user);
router.use('/forum', forum);
router.use('/thread', thread);
router.use('/post', post);
router.use('/service', service);

export default router;

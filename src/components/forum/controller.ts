import e from 'express';
import model from './model';
import {DBConflictCode} from '../../utils/db_codes';
import userController from '../user/controller';
import threadController from '../thread/controller';
import {IForum, IGetForumData} from './interface';
import {IError, IReturn, IReturnQuery} from '../base';
import {STATUS_BAD_REQUEST, STATUS_CONFLICT, STATUS_CREATED, STATUS_NOT_FOUND} from '../../utils/http_codes';

const DEFAULT_LIMIT = 100;

class ForumController {
    create = async (req: e.Request, res: e.Response) => {
        const author = req.body.user;
        const user = await userController.getUser(req, res, author);
        if (user.error) {
            return;
        }

        const forum: IForum = {
            slug: req.body.slug,
            title: req.body.title,
            user: user.data.nickname,
            posts: 0,
            threads: 0
        };

        const rq = await model.createForum(forum);
        if (rq.isError) {
            if (+rq.code === DBConflictCode) {
                const confRes: IReturnQuery = await model.getForum(forum.slug);
                if (confRes.isError) {
                    res.status(STATUS_BAD_REQUEST).json(<IError>{message: confRes.message});
                    return;
                }

                res.status(STATUS_CONFLICT).json(confRes.data.rows[0]);
                return;
            }

            res.status(STATUS_BAD_REQUEST).json(<IError>{message: rq.message});
            return;
        }

        res.status(STATUS_CREATED).json(forum);
    };

    details = async (req: e.Request, res: e.Response) => {
        const r = this.getSlug(req);
        if (r.error) {
            res.status(STATUS_BAD_REQUEST).json(<IError>{message: 'Slug is not specified'});
            return;
        }

        const rq = await model.getForum(r.data);
        if (rq.isError) {
            res.status(STATUS_BAD_REQUEST).json(<IError>{message: rq.message});
            return;
        }

        if (!rq.data.rowCount) {
            res.status(STATUS_NOT_FOUND).json(<IError>{message: `Forum by slug ${r.data} not found`});
            return;
        }

        res.json(rq.data.rows[0]);
    };

    threads = async (req: e.Request, res: e.Response) => {
        const r = this.getSlug(req);
        if (r.error) {
            res.status(STATUS_BAD_REQUEST).json(<IError>{message: 'Slug is not specified'});
            return;
        }

        const forum = await model.getForum(r.data, false);
        if (forum.isError) {
            res.status(STATUS_BAD_REQUEST).json(<IError>{message: forum.message});
            return;
        }

        if (!forum.data.rowCount) {
            res.status(STATUS_NOT_FOUND).json(<IError>{message: `Forum by ${r.data} not found`});
            return;
        }

        const data: IGetForumData = {
            slug: r.data,
            limit: (req.query.limit) ? +req.query.limit : DEFAULT_LIMIT,
            since: (req.query.since) ? <string>req.query.since : undefined,
            desc: req.query.desc ? JSON.parse(<string>req.query.desc) : false
        };

        const obj = req.path.split('/')[2];
        if (obj === 'threads') {
            await threadController.forumThreads(req, res, data);
        } else {
            await userController.forumUsers(req, res, data);
        }
    };

    createThread = async (req: e.Request, res: e.Response) => {
        const r = this.getSlug(req);
        if (r.error) {
            res.status(STATUS_BAD_REQUEST).json(<IError>{message: 'Slug is not specified'});
            return;
        }

        const slug = r.data;
        const rf = await model.getForum(slug, false);

        if (rf.isError) {
            res.status(STATUS_BAD_REQUEST).json(<IError>{message: rf.message});
            return;
        }

        if (!rf.data.rowCount) {
            res.status(STATUS_NOT_FOUND).json(<IError>{message: `Forum ${slug} not found`});
            return;
        }

        const forum: IForum = {
            slug: rf.data.rows[0].slug,
            title: '',
            user: ''
        };
        await threadController.create(req, res, forum);
    };

    public getSlug(req: e.Request) {
        const slug = req.params.slug;
        const result = <IReturn<string>>{};

        if (slug) {
            result.data = slug;
        } else {
            result.error = true;
        }

        return result;
    };
}

export default new ForumController();

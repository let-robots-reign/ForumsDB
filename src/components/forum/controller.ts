import e from 'express';
import model from './model';
import userController from '../user/controller';
import threadController from '../thread/controller';
import {IForum, IGetForumData} from './interface';
import {DBConflictCode} from '../../utils/db_codes';
import {IError, IReturn, IReturnQuery} from '../base';

const DEFAULT_LIMIT = 100;

class ForumController {
    create = async (req: e.Request, res: e.Response) => {
        const author = req.body.user;
        const user = await userController.getUser(req, res, author);
        if (user.error) return;

        const forum: IForum = {
            slug: req.body.slug,
            title: req.body.title,
            user: user.data.nickname,
            posts: 0,
            threads: 0
        };

        const rq = await model.create(forum);
        if (rq.isError) {
            if (+rq.code === DBConflictCode) {
                const confRes: IReturnQuery = await model.getOne(forum.slug);
                if (confRes.isError) {
                    res.status(400).json(<IError>{message: confRes.message});
                    return;
                }

                res.status(409).json(confRes.data.rows[0]);
                return;
            }

            res.status(400).json(<IError>{message: rq.message});
            return;
        }

        res.status(201).json(forum);
    };

    details = async (req: e.Request, res: e.Response) => {
        const r = this.getSlug(req);
        if (r.error) {
            res.status(400).json(<IError>{message: 'Slug is not given'});
            return;
        }

        const rq = await model.getOne(r.data);
        if (rq.isError) {
            res.status(400).json(<IError>{message: rq.message});
            return;
        }

        if (!rq.data.rowCount) {
            res.status(404).json(<IError>{message: `Forum by slug ${r.data} not found`});
            return;
        }

        res.json(rq.data.rows[0]);
    };

    threads = async (req: e.Request, res: e.Response) => {
        const r = this.getSlug(req);
        if (r.error) {
            res.status(400).json(<IError>{message: 'Slug is not given'});
            return;
        }

        const forum = await model.getOne(r.data, false);
        if (forum.isError) {
            res.status(400).json(<IError>{message: forum.message});
            return;
        }

        if (!forum.data.rowCount) {
            res.status(404).json(<IError>{message: `Forum by ${r.data} not found`});
            return;
        }

        const data: IGetForumData = {
            slug: r.data,
            limit: req.query.limit ? +req.query.limit : DEFAULT_LIMIT,
            since: <string>req.query.since,
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
            res.status(400).json(<IError>{message: 'Slug is not given'});
            return;
        }

        const slug = r.data;
        const rf = await model.getOne(slug, false);

        if (rf.isError) {
            res.status(400).json(<IError>{message: rf.message});
            return;
        }

        if (!rf.data.rowCount) {
            res.status(404).json(<IError>{message: `Forum ${slug} not found`});
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
    }
}

export default new ForumController();

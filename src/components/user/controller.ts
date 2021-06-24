import e from 'express';
import model from './model';
import {DBConflictCode} from '../../utils/db_codes';
import {IError, IReturn, IReturnQuery} from '../base';
import {IGetForumData} from '../forum/interface';
import {IUser} from './interface';
import {STATUS_BAD_REQUEST, STATUS_CONFLICT, STATUS_CREATED, STATUS_NOT_FOUND, STATUS_OK} from '../../utils/http_codes';

class UserController {
    create = async (req: e.Request, res: e.Response) => {
        const r = UserController.getNickname(req);
        if (r.error) {
            res.status(STATUS_BAD_REQUEST).json(<IError>{message: 'Nickname is not specified'});
            return;
        }

        const profile = req.body;
        const user: IUser = {
            about: profile.about,
            email: profile.email,
            fullname: profile.fullname,
            nickname: r.data
        };

        const rq: IReturnQuery = await model.create(user);

        if (rq.isError) {
            if (+rq.code === DBConflictCode) {
                const confRes: IReturnQuery = await model.getConflicted(user);
                if (confRes.isError) {
                    res.status(STATUS_BAD_REQUEST).json(<IError>{message: confRes.message});
                    return;
                }

                res.status(STATUS_CONFLICT).json(confRes.data.rows);
                return;
            }
            res.status(STATUS_BAD_REQUEST).json(<IError>{message: rq.message});
            return;
        }

        res.status(STATUS_CREATED).json(user);
    };

    getProfile = async (req: e.Request, res: e.Response) => {
        const r = UserController.getNickname(req);
        if (r.error) {
            res.status(STATUS_BAD_REQUEST).json({message: 'Nickname is not specified'});
            return;
        }

        const rq: IReturnQuery = await model.getOne(r.data);
        if (rq.isError) {
            res.status(STATUS_BAD_REQUEST).json(<IError>{message: rq.message});
            return;
        }

        if (rq.data.rows.length === 0) {
            res.status(STATUS_NOT_FOUND).json(<IError>{message: 'User not found'});
            return;
        }

        res.json(rq.data.rows[0]);
    };

    updateProfile = async (req: e.Request, res: e.Response) => {
        const r = UserController.getNickname(req);
        if (r.error) {
            res.status(STATUS_BAD_REQUEST).json(<IError>{message: 'Nickname is not specified'});
            return;
        }

        const profile = req.body;
        const user: IUser = {
            about: profile.about,
            email: profile.email,
            fullname: profile.fullname,
            nickname: r.data
        };

        const rq: IReturnQuery = await model.update(user);
        if (rq.isError) {
            if (+rq.code === DBConflictCode) {
                res.status(STATUS_CONFLICT).json(<IError>{message: `This email is already taken`});
                return;
            }
            res.status(STATUS_BAD_REQUEST).json(<IError>{message: rq.message});
            return;
        }

        if (!rq.data.rowCount) {
            res.status(STATUS_NOT_FOUND).json(<IError>{message: `User ${user.nickname} not found`});
            return;
        }

        const _user = rq.data.rows[0];
        user.about = _user.about;
        user.fullname = _user.fullname;
        user.email = _user.email;

        res.status(STATUS_OK).json(user);
    };

    forumUsers = async (req: e.Request, res: e.Response, data: IGetForumData) => {
        const rq = await model.forumUsers(data);
        if (rq.isError) {
            res.status(STATUS_BAD_REQUEST).json(<IError>{message: rq.message});
            return;
        }

        res.status(STATUS_OK).json(rq.data.rows);
    };

    getUser = async (req: e.Request, res: e.Response, nickname: string) => {
        const user = await model.getOne(nickname, false);
        if (user.isError) {
            res.status(STATUS_BAD_REQUEST).json(<IError>{message: user.message});
            return <IReturn<any>>{error: true};
        }
        if (!user.data.rowCount) {
            res.status(STATUS_NOT_FOUND).json(<IError>{message: `User ${nickname} not found`});
            return <IReturn<any>>{error: true};
        }

        return <IReturn<any>>{
            data: user.data.rows[0],
            error: false
        };
    };

    private static getNickname(req: e.Request) {
        const nickname = req.params.nickname;
        const result = <IReturn<string>>{};

        if (nickname) {
            result.data = nickname;
        } else {
            result.error = true;
        }

        return result;
    };
}

export default new UserController();

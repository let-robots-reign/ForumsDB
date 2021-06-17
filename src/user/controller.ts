import e from 'express';
import model from './model';
import {IUser} from './interface';
import {IError, IReturn, IReturnQuery} from '../components/base';
import {DBConflictCode} from '../utils/db_codes';

class UserController {
    create = async (req: e.Request, res: e.Response) => {
        const r = UserController.getNickname(req);
        if (r.error) {
            res.status(400).json(<IError>{message: 'Nickname is not given'});
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
                    res.status(400).json(<IError>{message: confRes.message});
                    return;
                }

                res.status(409).json(confRes.data.rows);
                return;
            }
            res.status(400).json(<IError>{message: rq.message});
            return;
        }

        res.status(201).json(user);
    };

    getProfile = async (req: e.Request, res: e.Response) => {
        const r = UserController.getNickname(req);
        if (r.error) {
            res.status(400).json({message: 'Nickname is not given'});
            return;
        }

        const rq: IReturnQuery = await model.getOne(r.data);
        if (rq.isError) {
            res.status(400).json(<IError>{message: rq.message});
            return;
        }

        if (rq.data.rows.length === 0) {
            res.status(404).json(<IError>{message: 'User not found'});
            return;
        }

        res.json(rq.data.rows[0]);
    };

    updateProfile = async (req: e.Request, res: e.Response) => {
        const r = UserController.getNickname(req);
        if (r.error) {
            res.status(400).json(<IError>{message: 'Nickname is not given'});
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
                res.status(409).json(<IError>{message: `This email is already registered by user`});
                return;
            }
            res.status(400).json(<IError>{message: rq.message});
            return;
        }

        if (!rq.data.rowCount) {
            res.status(404).json(<IError>{message: `User ${user.nickname} not found`});
            return;
        }

        const _user = rq.data.rows[0];
        user.about = _user.about;
        user.fullname = _user.fullname;
        user.email = _user.email;
        res.status(200).json(user);
    };

    // forumUsers = async (req: e.Request, res: e.Response, data: IGetForumData) => {
    //     const rq = await model.forumUsers(data);
    //     if (rq.isError) {
    //         res.status(400).json(<IError>{ message: rq.message });
    //         return;
    //     }
    //     res.status(200).json(rq.data.rows);
    // };

    getUser = async (req: e.Request, res: e.Response, nickname: string) => {
        const user = await model.getOne(nickname, false);
        if (user.isError) {
            res.status(400).json(<IError>{message: user.message});
            return <IReturn<any>>{error: true};
        }
        if (!user.data.rowCount) {
            res.status(404).json(<IError>{message: `User ${nickname} not found`});
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
    }
}

export default new UserController();

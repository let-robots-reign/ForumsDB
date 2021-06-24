import e from 'express';
import model from './model';
import {DBForeignKeyViolate, DBNullColumnCode} from '../../utils/db_codes';
import {IError} from '../base';
import {IThread} from '../thread/interface';
import {IVote} from './interface';
import {STATUS_BAD_REQUEST, STATUS_NOT_FOUND} from '../../utils/http_codes';

class VoteController {
    create = async (req: e.Request, res: e.Response, thread: IThread) => {
        const vote: IVote = {
            nickname: req.body.nickname,
            threadId: thread.id || -1,
            voice: req.body.voice
        };

        const rq = await model.createOrUpdate(vote);
        if (rq.isError) {
            if (+rq.code === DBForeignKeyViolate || +rq.code === DBNullColumnCode) {
                res.status(STATUS_NOT_FOUND).json(<IError>{message: `User by nickname ${vote.nickname} not found`});
            } else {
                res.status(STATUS_BAD_REQUEST).json(<IError>{message: rq.message});
            }
            return;
        }

        // @ts-ignore
        thread.votes += rq.data.rows[0].update_vote;
        res.json(thread);
    };
}

export default new VoteController();

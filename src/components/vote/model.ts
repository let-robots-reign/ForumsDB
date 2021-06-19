import db from '../../utils/db';
import {IQuery} from '../base';
import {IVote} from './interface';

class VoteModel {
    async createOrUpdate(vote: IVote) {
        const query: IQuery = {
            name: 'update_vote',
            text: `SELECT update_vote($1, $2, $3);`,
            values: [vote.nickname, vote.threadId, vote.voice]
        };
        return db.sendQuery(query);
    }
}

export default new VoteModel();

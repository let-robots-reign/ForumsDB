import db from '../../utils/db';
import {IQuery} from '../base';
import {IGetForumData} from '../forum/interface';
import {IThread, IThreadUpdate} from './interface';

class ThreadModel {
    async create(thread: IThread) {
        const query: IQuery = {
            name: '',
            text: `
                INSERT INTO thread (forum, author, created, message, ${thread.slug ? `slug,` : ''} title) 
                VALUES ($1, $2, $3, $4, ${thread.slug ? `'${thread.slug}',` : ''} $5) 
                RETURNING tid, slug`,
            values: [thread.forum, thread.author, thread.created, thread.message, thread.title]
        };

        return db.sendQuery(query);
    }

    async update(thread: IThreadUpdate) {
        const query: IQuery = {
            name: 'update_thread',
            text: `UPDATE thread
                   SET message = COALESCE($1, message), title   = COALESCE($2, title)
                   WHERE tid = $3 
                   RETURNING message, title`,
            values: [thread.message, thread.title, thread.id]
        };
        return db.sendQuery(query);
    }

    async forumThreads(thread: IGetForumData) {
        let sinceExpr = '';
        if (thread.since) {
            sinceExpr = `AND created ${thread.desc ? '<=' : '>='} '${thread.since}'`;
        }

        const query: IQuery = {
            name: '',
            text: `SELECT tid AS id, author, created, forum, message, t.slug, t.title, votes
                   FROM thread t
                   WHERE forum = $1
                   ${sinceExpr}  
                   ORDER BY created
                   ${thread.desc ? 'DESC' : 'ASC'}
                   LIMIT $2`,
            values: [thread.slug, thread.limit]
        };

        return db.sendQuery(query);
    }

    async getOne(data: string | number, full: boolean = true) {
        const query: IQuery = {
            name: ``,
            text: `SELECT ${
                full ? `author, created, forum, tid AS id, message, t.slug, t.title, votes FROM thread t `
                : `t.tid FROM thread t`
                } 
                WHERE ${typeof data === 'string' ? 't.slug' : 't.tid'} = $1 `,
            values: [data]
        };
        return db.sendQuery(query);
    }
}

export default new ThreadModel();

import db from '../../utils/db';
import {IQuery} from '../base';

class ServiceModel {
    async getTablesStatus() {
        const query: IQuery = {
            name: 'get_tables_status',
            text: `
                SELECT json_build_object(
                               'forum', (SELECT COUNT(*) FROM forum),
                               'user', (SELECT COUNT(*) FROM users),
                               'thread', (SELECT COUNT(*) FROM thread),
                               'post', (SELECT COUNT(*) FROM post)
                           )
                AS status
            `,
            values: []
        };
        return db.sendQuery(query);
    }

    async clearTables() {
        const query: IQuery = {
            name: 'clear_tables',
            text: `
                TRUNCATE TABLE users, post, thread, forum CASCADE
            `,
            values: []
        };
        return db.sendQuery(query);
    }
}

export default new ServiceModel();

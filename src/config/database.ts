import {Pool} from 'pg';
import {IQuery, IReturnQuery} from '../rest/components/base/interfaces';

class Database {
    private readonly pool: Pool;

    constructor() {
        this.pool = new Pool({
            host: 'localhost',
            port: 5050,
            database: 'forums',
            user: 'zotov',
            password: 'alex',
            max: 20
        });
    }

    async sendQuery(query: IQuery) {
        const response = <IReturnQuery>{};
        const client = await this.pool.connect();

        try {
            response.data = await client.query(query);
        } catch (e) {
            // console.error(`Database error: ${query.text}`);
            // console.error(`Values: (${query.values})`);
            // console.error(`Error: ${e.message}`);

            response.isError = true;
            response.code = e.code;
            response.message = e.message;
        } finally {
            client.release();
        }

        return response;
    }
}

export default new Database();

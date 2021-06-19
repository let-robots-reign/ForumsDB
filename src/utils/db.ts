import {Pool} from 'pg';
import {IQuery, IReturnQuery} from '../components/base';

class Database {
    private readonly pool: Pool;

    constructor() {
        this.pool = new Pool({
            host: 'localhost',
            port: 5432,
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

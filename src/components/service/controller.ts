import e from 'express';
import {IError} from '../base';
import model from './model';
import {STATUS_BAD_REQUEST} from '../../utils/http_codes';

class ServiceController {
    status = async (req: e.Request, res: e.Response) => {
        const rq = await model.getTablesStatus();
        if (rq.isError) {
            res.status(STATUS_BAD_REQUEST).json(<IError>{message: rq.message});
            return;
        }

        res.json(rq.data.rows[0].status);
    };

    clear = async (req: e.Request, res: e.Response) => {
        const rq = await model.truncateTables();
        if (rq.isError) {
            res.status(STATUS_BAD_REQUEST).json(<IError>{message: rq.message});
            return;
        }

        res.json('Clear successfully finished!!!')
    };
}

export default new ServiceController();

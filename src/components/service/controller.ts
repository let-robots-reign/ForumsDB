import e from 'express';
import model from './model';
import {IError} from '../base';

class ServiceController {
    status = async (req: e.Request, res: e.Response) => {
        const rq = await model.getTablesStatus();
        if (rq.isError) {
            res.status(400).json(<IError>{message: rq.message});
            return;
        }

        res.json(rq.data.rows[0].status);
    };

    clear = async (req: e.Request, res: e.Response) => {
        const rq = await model.truncateTables();
        if (rq.isError) {
            res.status(400).json(<IError>{message: rq.message});
            return;
        }

        res.json('Clear successfully finished!!!')
    };
}

export default new ServiceController();

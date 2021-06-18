import express from 'express';
import morgan  from 'morgan';
import bodyParser from 'body-parser';

import ('./config/database');
import router from './rest/routes';

const app: express.Application = express();
const env = process.env.NODE_ENV;

if (env === 'production') {
    console.log = () => null;
}

// else {
//     app.use(morgan('dev'));
// }
app.use(bodyParser.json());
app.use('/api', router);

const port = process.env.PORT || 5000;
app.listen(port,  () => {
    console.log(`Server listening on port ${port}!`); // tslint:disable-line
});

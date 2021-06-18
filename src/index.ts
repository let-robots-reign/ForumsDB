import express = require('express');
import bodyParser = require('body-parser');
import router from './utils/router'

const app: express.Application = express();

app.use(bodyParser.json());
app.use('/api', router);

const port = 5000;
app.listen(port,  () => {
    console.log(`Listening on port ${port}...`);
});

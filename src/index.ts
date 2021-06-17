import express = require('express');
import bodyParser = require('body-parser');

const app: express.Application = express();

app.use(bodyParser.json());

const port = 5000;
app.listen(port,  () => {
    console.log(`Listening on port ${port}...`);
});

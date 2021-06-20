"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
Promise.resolve().then(() => __importStar(require('./utils/db')));
const router_1 = __importDefault(require("./utils/router"));
const app = express_1.default();
app.use(body_parser_1.default.json());
app.use('/api', router_1.default);
const port = 5000;
app.listen(port, () => {
    console.log(`Listening on port ${port}...`);
});

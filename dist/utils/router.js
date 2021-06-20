"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const routes_1 = __importDefault(require("../components/user/routes"));
const routes_2 = __importDefault(require("../components/forum/routes"));
const routes_3 = __importDefault(require("../components/thread/routes"));
const routes_4 = __importDefault(require("../components/post/routes"));
const routes_5 = __importDefault(require("../components/service/routes"));
const router = express_1.default.Router();
router.use('/user', routes_1.default);
router.use('/forum', routes_2.default);
router.use('/thread', routes_3.default);
router.use('/post', routes_4.default);
router.use('/service', routes_5.default);
exports.default = router;

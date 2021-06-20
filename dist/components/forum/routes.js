"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const controller_1 = __importDefault(require("./controller"));
const router = express_1.default.Router();
router.post('/create', controller_1.default.create);
router.get('/:slug/details', controller_1.default.details);
router.post('/:slug/create', controller_1.default.createThread);
router.get('/:slug/threads', controller_1.default.threads);
router.get('/:slug/users', controller_1.default.threads);
exports.default = router;

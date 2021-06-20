"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const controller_1 = __importDefault(require("./controller"));
const router = express_1.default.Router();
router.post('/:slug_or_id/create', controller_1.default.createPosts);
router.get('/:slug_or_id/details', controller_1.default.details);
router.post('/:slug_or_id/details', controller_1.default.update);
router.get('/:slug_or_id/posts', controller_1.default.getPosts);
router.post('/:slug_or_id/vote', controller_1.default.vote);
exports.default = router;

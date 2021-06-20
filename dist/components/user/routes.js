"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const controller_1 = __importDefault(require("./controller"));
const router = express_1.default.Router();
router.post('/:nickname/create', controller_1.default.create);
router.route('/:nickname/profile')
    .get(controller_1.default.getProfile)
    .post(controller_1.default.updateProfile);
exports.default = router;

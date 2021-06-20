"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const model_1 = __importDefault(require("./model"));
const db_codes_1 = require("../../utils/db_codes");
class VoteController {
    constructor() {
        this.create = (req, res, thread) => __awaiter(this, void 0, void 0, function* () {
            const vote = {
                nickname: req.body.nickname,
                threadId: thread.id || -1,
                voice: req.body.voice
            };
            const rq = yield model_1.default.createOrUpdate(vote);
            if (rq.isError) {
                if (+rq.code === 23503 || +rq.code === db_codes_1.DBNullColumnCode) {
                    res.status(404).json({ message: `User by nickname ${vote.nickname} not found` });
                }
                else {
                    res.status(400).json({ message: rq.message });
                }
                return;
            }
            // @ts-ignore
            thread.votes += rq.data.rows[0].update_vote;
            res.json(thread);
        });
    }
}
exports.default = new VoteController();

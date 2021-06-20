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
const controller_1 = __importDefault(require("../post/controller"));
const controller_2 = __importDefault(require("../user/controller"));
const controller_3 = __importDefault(require("../vote/controller"));
class ThreadController {
    constructor() {
        this.create = (req, res, forum) => __awaiter(this, void 0, void 0, function* () {
            const author = req.body.author;
            const user = yield controller_2.default.getUser(req, res, author);
            if (user.error)
                return;
            const thread = {
                author: user.data.nickname,
                created: req.body.created,
                forum: forum.slug,
                message: req.body.message,
                slug: req.body.slug,
                title: req.body.title,
                votes: 0
            };
            const rq = yield model_1.default.create(thread);
            if (rq.isError) {
                if (+rq.code === db_codes_1.DBConflictCode) {
                    const confRes = yield model_1.default.getOne(thread.slug);
                    if (confRes.isError) {
                        res.status(400).json({ message: confRes.message });
                        return;
                    }
                    res.status(409).json(confRes.data.rows[0]);
                    return;
                }
                res.status(400).json({ message: rq.message });
                return;
            }
            thread.id = rq.data.rows[0].tid;
            thread.forum = forum.slug;
            res.status(201).json(thread);
        });
        this.details = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const r = yield this.getIdentifier(req, res);
            if (r.error)
                return;
            res.json(r.data);
        });
        this.update = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const r = yield this.getIdentifier(req, res);
            if (r.error)
                return;
            const thread = r.data;
            const threadUpdate = {
                id: thread.id || 0,
                title: req.body.title,
                message: req.body.message
            };
            const rq = yield model_1.default.update(threadUpdate);
            if (rq.isError) {
                res.status(400).json({ message: rq.message });
                return;
            }
            thread.message = rq.data.rows[0].message;
            thread.title = rq.data.rows[0].title;
            res.json(thread);
        });
        this.forumThreads = (req, res, data) => __awaiter(this, void 0, void 0, function* () {
            const rq = yield model_1.default.forumThreads(data);
            if (rq.isError) {
                res.status(400).json({ message: rq.message });
                return;
            }
            res.status(200).json(rq.data.rows);
        });
        this.createPosts = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const r = yield this.getIdentifier(req, res);
            if (r.error)
                return;
            const data = {
                threadId: r.data.id,
                forum: r.data.forum
            };
            yield controller_1.default.create(req, res, data);
        });
        this.getPosts = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const r = yield this.getIdentifier(req, res);
            if (r.error)
                return;
            const data = {
                threadId: r.data.id,
                forum: r.data.forum
            };
            yield controller_1.default.threadPosts(req, res, data);
        });
        this.vote = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const r = yield this.getIdentifier(req, res);
            if (r.error)
                return;
            yield controller_3.default.create(req, res, r.data);
        });
        this.getIdentifier = (req, res) => __awaiter(this, void 0, void 0, function* () {
            let identifier = req.params.slug_or_id;
            // @ts-ignore
            if (!isNaN(identifier))
                identifier = +identifier;
            const thread = yield model_1.default.getOne(identifier);
            if (thread.isError) {
                res.status(400).json({ message: thread.message });
                return { error: true };
            }
            if (!thread.data.rowCount) {
                res.status(404).json({ message: `Thread by this identifier ${identifier} not found` });
                return { error: true };
            }
            return {
                data: thread.data.rows[0],
                error: false
            };
        });
    }
}
exports.default = new ThreadController();

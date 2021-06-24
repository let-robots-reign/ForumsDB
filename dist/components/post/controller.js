"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const model_1 = __importDefault(require("./model"));
const http_codes_1 = require("../../utils/http_codes");
const DEFAULT_LIMIT = 100;
const DEFAULT_SORT = 'flat';
class PostController {
    constructor() {
        this.create = (req, res, data) => __awaiter(this, void 0, void 0, function* () {
            const posts = req.body;
            if (!posts.length) {
                res.status(http_codes_1.STATUS_CREATED).json([]);
                return;
            }
            const rq = yield model_1.default.insertSeveralPosts(posts, data);
            if (rq.isError) {
                if (rq.message.includes('author')) {
                    res.status(http_codes_1.STATUS_NOT_FOUND).json({ message: `Author not found` });
                }
                else {
                    res.status(http_codes_1.STATUS_CONFLICT).json({ message: rq.message });
                }
                return;
            }
            for (let i = 0; i < posts.length; i++) {
                const p = rq.data.rows[i];
                posts[i].forum = data.forum;
                posts[i].thread = data.threadId;
                posts[i].created = p.created;
                posts[i].id = p.id;
            }
            res.status(http_codes_1.STATUS_CREATED).json(posts);
        });
        this.threadPosts = (req, res, data) => __awaiter(this, void 0, void 0, function* () {
            const filter = {
                threadId: data.threadId,
                forum: data.forum.toString(),
                limit: (req.query.limit) ? +req.query.limit : DEFAULT_LIMIT,
                since: (req.query.since) ? +req.query.since : undefined,
                sort: (req.query.sort) ? req.query.sort : DEFAULT_SORT,
                desc: req.query.desc ? JSON.parse(req.query.desc) : req.query.desc
            };
            const rq = yield model_1.default.getThreadPosts(filter);
            if (rq.isError) {
                res.status(http_codes_1.STATUS_BAD_REQUEST).json({ message: rq.message });
                return;
            }
            res.json(rq.data.rows);
        });
        this.details = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const id = +req.params.id;
            const related = req.query.related || '';
            const rq = yield model_1.default.getPostData(id);
            if (rq.isError) {
                res.status(http_codes_1.STATUS_BAD_REQUEST).json({ message: rq.message });
                return;
            }
            if (!rq.data.rowCount) {
                res.status(http_codes_1.STATUS_NOT_FOUND).json({ message: `Post by id ${id} not found` });
                return;
            }
            const postFull = rq.data.rows[0].post;
            if (!related.includes('user'))
                delete postFull.author;
            if (!related.includes('forum'))
                delete postFull.forum;
            if (!related.includes('thread'))
                delete postFull.thread;
            res.json(postFull);
        });
        this.update = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const post = {
                id: +req.params.id,
                message: req.body.message
            };
            const rq = yield model_1.default.updatePost(post);
            if (rq.isError) {
                res.status(http_codes_1.STATUS_BAD_REQUEST).json({ message: rq.message });
                return;
            }
            if (!rq.data.rowCount) {
                res.status(http_codes_1.STATUS_NOT_FOUND).json({ message: `Post by id ${post.id} not found` });
                return;
            }
            const upPost = rq.data.rows[0];
            if (!upPost.parent)
                delete upPost.parent;
            if (!upPost.isEdited)
                delete upPost.isEdited;
            res.json(upPost);
        });
    }
}
exports.default = new PostController();

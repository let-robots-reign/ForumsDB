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
class UserController {
    constructor() {
        this.create = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const r = this.getNickname(req);
            if (r.error) {
                res.status(STATUS_BAD_REQUEST).json({ message: 'Nickname is not given' });
                return;
            }
            const profile = req.body;
            const user = {
                about: profile.about,
                email: profile.email,
                fullname: profile.fullname,
                nickname: r.data
            };
            const rq = yield model_1.default.create(user);
            if (rq.isError) {
                if (+rq.code === db_codes_1.DBConflictCode) {
                    const confRes = yield model_1.default.getConflicted(user);
                    if (confRes.isError) {
                        res.status(STATUS_BAD_REQUEST).json({ message: confRes.message });
                        return;
                    }
                    res.status(STATUS_CONFLICT).json(confRes.data.rows);
                    return;
                }
                res.status(STATUS_BAD_REQUEST).json({ message: rq.message });
                return;
            }
            res.status(STATUS_CREATED).json(user);
        });
        this.getProfile = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const r = this.getNickname(req);
            if (r.error) {
                res.status(STATUS_BAD_REQUEST).json({ message: 'Nickname is not given' });
                return;
            }
            const rq = yield model_1.default.getOne(r.data);
            if (rq.isError) {
                res.status(STATUS_BAD_REQUEST).json({ message: rq.message });
                return;
            }
            if (rq.data.rows.length === 0) {
                res.status(STATUS_NOT_FOUND).json({ message: 'User not found' });
                return;
            }
            res.json(rq.data.rows[0]);
        });
        this.updateProfile = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const r = this.getNickname(req);
            if (r.error) {
                res.status(STATUS_BAD_REQUEST).json({ message: 'Nickname is not given' });
                return;
            }
            const profile = req.body;
            const user = {
                about: profile.about,
                email: profile.email,
                fullname: profile.fullname,
                nickname: r.data
            };
            const rq = yield model_1.default.update(user);
            if (rq.isError) {
                if (+rq.code === db_codes_1.DBConflictCode) {
                    res.status(STATUS_CONFLICT).json({ message: `This email is already registered by user` });
                    return;
                }
                res.status(STATUS_BAD_REQUEST).json({ message: rq.message });
                return;
            }
            if (!rq.data.rowCount) {
                res.status(STATUS_NOT_FOUND).json({ message: `User ${user.nickname} not found` });
                return;
            }
            const _user = rq.data.rows[0];
            user.about = _user.about;
            user.fullname = _user.fullname;
            user.email = _user.email;
            res.status(STATUS_OK).json(user);
        });
        this.forumUsers = (req, res, data) => __awaiter(this, void 0, void 0, function* () {
            const rq = yield model_1.default.forumUsers(data);
            if (rq.isError) {
                res.status(STATUS_BAD_REQUEST).json({ message: rq.message });
                return;
            }
            res.status(STATUS_OK).json(rq.data.rows);
        });
        this.getUser = (req, res, nickname) => __awaiter(this, void 0, void 0, function* () {
            const user = yield model_1.default.getOne(nickname, false);
            if (user.isError) {
                res.status(STATUS_BAD_REQUEST).json({ message: user.message });
                return { error: true };
            }
            if (!user.data.rowCount) {
                res.status(STATUS_NOT_FOUND).json({ message: `User ${nickname} not found` });
                return { error: true };
            }
            return {
                data: user.data.rows[0],
                error: false
            };
        });
    }
    getNickname(req) {
        const nickname = req.params.nickname;
        const result = {};
        if (nickname) {
            result.data = nickname;
        }
        else {
            result.error = true;
        }
        return result;
    }
}
exports.default = new UserController();

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
const db_1 = __importDefault(require("../../utils/db"));
class UserModel {
    createUser(user) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = {
                name: 'create_user',
                text: 'INSERT INTO users(about, email, fullname, nickname) VALUES ($1, $2, $3, $4)',
                values: Object.values(user)
            };
            return db_1.default.sendQuery(query);
        });
    }
    updateUser(user) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = {
                name: 'update_user',
                text: `
                UPDATE users
                SET about    = COALESCE($1, about),
                    email    = COALESCE($2, email),
                    fullname = COALESCE($3, fullname)
                WHERE nickname = $4 RETURNING *
            `,
                values: Object.values(user)
            };
            return db_1.default.sendQuery(query);
        });
    }
    getUsersByForum(data) {
        return __awaiter(this, void 0, void 0, function* () {
            let sinceExpr = '';
            if (data.since) {
                sinceExpr = `AND nickname ${data.desc ? '<' : '>'} '${data.since}' COLLATE "C"`;
            }
            const query = {
                name: '',
                text: `
                SELECT about, email, fullname, nickname
                FROM users
                WHERE nickname IN (
                  SELECT author FROM user_posts
                  WHERE forum = $1
                )
                ${sinceExpr}
                ORDER BY nickname COLLATE "C" ${data.desc ? 'DESC' : 'ASC'}
                ${data.limit ? `LIMIT ${data.limit}` : ''}
            `,
                values: [data.slug]
            };
            return db_1.default.sendQuery(query);
        });
    }
    getOne(nickname, full = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = {
                name: `get_one_user_${full ? '1' : '2'}`,
                text: `
                SELECT ${full ? 'about, email, fullname, nickname' : 'nickname'} 
                FROM users WHERE nickname = $1
            `,
                values: [nickname]
            };
            return db_1.default.sendQuery(query);
        });
    }
    getConflicted(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = {
                name: 'get_conflicted_user',
                text: 'SELECT about, email, fullname, nickname FROM users WHERE nickname = $1 OR email = $2',
                values: [data.nickname, data.email]
            };
            return db_1.default.sendQuery(query);
        });
    }
}
exports.default = new UserModel();

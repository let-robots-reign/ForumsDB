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
class ForumModel {
    createForum(forum) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = {
                name: 'create_forum',
                text: `INSERT INTO forum (author, slug, title)
                   VALUES ($1, $2, $3)`,
                values: [forum.user, forum.slug, forum.title]
            };
            return db_1.default.sendQuery(query);
        });
    }
    getForum(slug, full = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = {
                name: `get_one_forum_${full ? '1' : '2'}`,
                text: `SELECT ${full ? 'posts, slug, threads, title, author AS user' : 'slug'} FROM forum 
                   WHERE slug = $1`,
                values: [slug]
            };
            return db_1.default.sendQuery(query);
        });
    }
}
exports.default = new ForumModel();

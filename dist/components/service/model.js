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
class ServiceModel {
    getTablesStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            const query = {
                name: 'get_tables_status',
                text: `
                SELECT json_build_object(
                               'forum', (SELECT COUNT(*) FROM forum),
                               'user', (SELECT COUNT(*) FROM users),
                               'thread', (SELECT COUNT(*) FROM thread),
                               'post', (SELECT COUNT(*) FROM post)
                           )
                AS status
            `,
                values: []
            };
            return db_1.default.sendQuery(query);
        });
    }
    clearTables() {
        return __awaiter(this, void 0, void 0, function* () {
            const query = {
                name: 'clear_tables',
                text: `
                TRUNCATE TABLE users, post, thread, forum CASCADE
            `,
                values: []
            };
            return db_1.default.sendQuery(query);
        });
    }
}
exports.default = new ServiceModel();

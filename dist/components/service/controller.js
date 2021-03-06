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
class ServiceController {
    constructor() {
        this.status = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const rq = yield model_1.default.getTablesStatus();
            if (rq.isError) {
                res.status(http_codes_1.STATUS_BAD_REQUEST).json({ message: rq.message });
                return;
            }
            res.json(rq.data.rows[0].status);
        });
        this.clear = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const rq = yield model_1.default.clearTables();
            if (rq.isError) {
                res.status(http_codes_1.STATUS_BAD_REQUEST).json({ message: rq.message });
                return;
            }
            res.json('All tables have been cleared');
        });
    }
}
exports.default = new ServiceController();

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Version = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const VersionSchema = new mongoose_1.default.Schema({
    roomId: {
        type: mongoose_1.default.Types.ObjectId,
        ref: 'Room',
    },
    code: {
        type: String
    },
    language: {
        type: String,
    }
}, { timestamps: true });
exports.Version = mongoose_1.default.model("Version", VersionSchema);

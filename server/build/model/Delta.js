"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Delta = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const deltaSchema = new mongoose_1.default.Schema({
    versionId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Version",
        required: true,
    },
    roomId: {
        type: mongoose_1.default.Types.ObjectId,
        ref: "Room",
    },
    diffs: { type: (Array), required: true },
}, { timestamps: true });
exports.Delta = mongoose_1.default.model("Delta", deltaSchema);

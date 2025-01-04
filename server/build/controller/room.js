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
exports.updateVersionId = exports.getDeltaByVersionId = exports.getVersionsByRoomId = exports.createVersion = exports.getLatestVersionAndDeltas = exports.createDelta = exports.getCommentsByRoomId = exports.createComment = exports.joinRoom = exports.getRoomById = exports.createRoom = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const apiError_1 = require("../utils/apiError");
const room_1 = require("../model/room");
const apiResponse_1 = require("../utils/apiResponse");
const user_1 = require("../model/user");
const Comment_1 = require("../model/Comment");
const mongoose_1 = __importDefault(require("mongoose"));
const Delta_1 = require("../model/Delta");
const Version_1 = require("../model/Version");
exports.createRoom = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, password } = req.body;
    const author = req.user;
    const authorId = author._id;
    const authorName = author.user_name;
    if (!name || !password || !authorId || !authorName)
        throw new apiError_1.ApiError(400, "All fields are required");
    const existedRoom = yield room_1.Room.findOne({ name });
    if (existedRoom)
        throw new apiError_1.ApiError(409, "Room with this room name already exists");
    // const file = await SandBox.create({ userId: authorId, title: name });
    // if (!file)
    // throw new ApiError(500, "Something went wrong while creating a file");
    const p = [];
    p.push({ id: authorId, name: authorName });
    const newRoom = yield room_1.Room.create({
        name,
        password,
        author: authorId,
        // sandbox: file,
        participants: p,
    });
    if (!newRoom)
        throw new apiError_1.ApiError(500, "Something went wrong while creating a room");
    return res
        .status(201)
        .json(new apiResponse_1.ApiResponse(201, "Room created", { room: newRoom }, true));
}));
exports.getRoomById = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { roomId } = req.params;
    if (!roomId)
        throw new apiError_1.ApiError(400, "Room Id are required");
    const room = yield room_1.Room.findById(roomId);
    if (!room)
        throw new apiError_1.ApiError(404, "Room not found");
    return res
        .status(201)
        .json(new apiResponse_1.ApiResponse(201, "Room found", { room }, true));
}));
exports.joinRoom = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, password } = req.body;
    const user = req.user;
    const userId = user._id;
    const userName = user.user_name;
    if (!name || !password || !userId || !userName)
        throw new apiError_1.ApiError(400, " Values missing required");
    const userFound = yield user_1.User.findById(userId);
    if (!userFound) {
        throw new apiError_1.ApiError(404, "User not found");
    }
    const room = yield room_1.Room.findOne({ name });
    if (!room || room.password !== password) {
        throw new apiError_1.ApiError(400, "Invalid credentials");
    }
    const p = room.participants;
    p.push({ id: userId, name: userName });
    room.participants = p;
    yield room_1.Room.findByIdAndUpdate(room._id, room);
    return res
        .status(201)
        .json(new apiResponse_1.ApiResponse(201, "Room Joined", { room }, true));
}));
exports.createComment = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { userId, comment, selected_range, roomId, parent_id, selected_text } = req.body;
    console.log(req.body);
    // selected_text for replies, --> same as parent, text
    if (!parent_id) {
        parent_id = null;
    }
    if (!userId || !comment || !selected_range || !selected_text) {
        throw new apiError_1.ApiError(400, "Please Filled All the details");
    }
    const newComment = yield Comment_1.Comment.create({
        authorId: userId,
        parent_id,
        message: comment,
        selected_range,
        roomId,
        selected_text,
    });
    if (!newComment) {
        throw new apiError_1.ApiError(500, "Something went Wrong while posting Comment");
    }
    return res
        .status(201)
        .json(new apiResponse_1.ApiResponse(201, "Successfully Posted Comment", newComment, true));
}));
exports.getCommentsByRoomId = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { roomId } = req.params;
    if (!roomId) {
        throw new apiError_1.ApiError(400, "Empty RoomId");
    }
    const allCommentsInARoom = yield Comment_1.Comment.aggregate([
        {
            $match: {
                roomId: new mongoose_1.default.Types.ObjectId(roomId),
                parent_id: null,
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "authorId",
                foreignField: "_id",
                as: "userInfo",
            },
        },
        {
            $addFields: {
                user_info: { $arrayElemAt: ["$userInfo", 0] },
            },
        },
        {
            $project: {
                _id: 1,
                authorId: 1,
                roomId: 1,
                message: 1,
                parent_id: 1,
                selected_range: 1,
                selected_text: 1,
                createdAt: 1,
                updatedAt: 1,
                user_info: {
                    // Same as authorId
                    // _id : 1,
                    user_name: 1,
                },
            },
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "parent_id",
                as: "replies",
            },
        },
        {
            $unwind: {
                path: "$replies",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "replies.authorId",
                foreignField: "_id",
                as: "RepliedUserInfo",
            },
        },
        {
            $unwind: {
                path: "$RepliedUserInfo",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $group: {
                _id: "$_id",
                message: { $first: "$message" },
                authorId: { $first: "$authorId" },
                selected_range: { $first: "$selected_range" },
                selected_text: { $first: "$selected_text" },
                roomId: { $first: "$roomId" },
                parent_id: { $first: "$parent_id" },
                user_info: { $first: "$user_info" },
                // mentions: { $first: '$mentions' },
                createdAt: { $first: "$createdAt" },
                updatedAt: { $first: "$updatedAt" },
                replies: {
                    $push: {
                        _id: "$replies._id",
                        message: "$replies.message",
                        authorId: "$replies.authorId",
                        createdAt: "$replies.createdAt",
                        updatedAt: "$replies.updatedAt",
                        selected_range: "$replies.selected_range",
                        selected_text: "$replies.selected_text",
                        parent_id: "$replies.parent_id",
                        // mentions: '$replies.mentions',
                        // RepliedUserInfo: '$RepliedUserInfo'
                        RepliedUserInfo: {
                            // _id : '$RepliedUserInfo._id',
                            user_name: "$RepliedUserInfo.user_name",
                        },
                    },
                },
            },
        },
        {
            $project: {
                _id: 1,
                authorId: 1,
                roomId: 1,
                message: 1,
                parent_id: 1,
                selected_range: 1,
                selected_text: 1,
                createdAt: 1,
                updatedAt: 1,
                user_info: {
                    // Same as authorId
                    // _id : 1,
                    user_name: 1,
                },
                replies: {
                    $filter: {
                        input: "$replies",
                        as: "reply",
                        cond: { $ne: ["$$reply.RepliedUserInfo", {}] },
                    },
                },
            },
        },
        {
            $sort: {
                createdAt: -1,
            },
        },
        // replies: {
        //   $map: {
        //     input: '$replies',
        //     as: 'reply',
        //     in: {
        //       _id: '$$reply._id',
        //       content: '$$reply.content',
        //       user_id: '$$reply.user_id',
        //       created_at: '$$reply.created_at',
        //       updated_at: '$$reply.updated_at',
        //       mentions: '$$reply.mentions'
        //       // Note: Exclude the parent_id field here by not including it
        //     }
        //   }
        // {
        //   $lookup:{
        //     from :
        //   }
        //   // $project: {
        //   //   authorId: 1,
        //   //   selected_text: 1,
        //   //   roomId: 1,
        //   //   message: 1,
        //   //   created_at: 1,
        //   //   updated_at: 1,
        //   //   replies: 1,
        //   // },
        // },
    ]);
    return res
        .status(200)
        .json(new apiResponse_1.ApiResponse(200, "Fetched Comments", { allCommentsInARoom }, true));
}));
exports.createDelta = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { roomId, diffs, versionId } = req.body;
    if (!diffs || !versionId || !roomId) {
        throw new apiError_1.ApiError(400, "Please Fill all details");
    }
    const response = yield Delta_1.Delta.create({
        diffs,
        versionId,
        roomId,
    });
    if (!response) {
        throw new apiError_1.ApiError(500, "Something Went Wrong With Db!");
    }
    res
        .status(201)
        .json(new apiResponse_1.ApiResponse(201, "Delta Created Successfully", response, true));
}));
exports.getLatestVersionAndDeltas = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { roomId } = req.body;
    if (!roomId) {
        throw new apiError_1.ApiError(400, "Please Give the RoomId");
    }
    const currentRoom = yield room_1.Room.findById(roomId);
    if (!currentRoom) {
        throw new apiError_1.ApiError(400, "Room Not Found");
    }
    if (!currentRoom.currentVersionId) {
        const newVersion = yield Version_1.Version.create({
            roomId: currentRoom._id,
            code: "",
            language: "javascript",
        });
        if (!newVersion) {
            throw new apiError_1.ApiError(500, "Something Went Wrong With Db!");
        }
        yield room_1.Room.findByIdAndUpdate(roomId, {
            currentVersionId: newVersion._id,
        });
        return res
            .status(200)
            .json(new apiResponse_1.ApiResponse(200, "Successfully Fetched the Version", { latestVersion: newVersion.toObject() }, true));
    }
    else {
        const latestVersion = yield Version_1.Version.findById(currentRoom.currentVersionId);
        if (!latestVersion) {
            throw new apiError_1.ApiError(400, "Version Not Found");
        }
        const deltas = yield Delta_1.Delta.find({
            versionId: currentRoom.currentVersionId,
        })
            .sort({ createdAt: 1 })
            .exec();
        if (!deltas) {
            throw new apiError_1.ApiError(400, "Version Not found with given RoomId");
        }
        return res
            .status(200)
            .json(new apiResponse_1.ApiResponse(200, "Successfully Fetched the Version", { deltas: deltas.map(delta => delta.toObject()), latestVersion: latestVersion.toObject() }, true));
    }
}));
exports.createVersion = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { roomId, code, language } = req.body;
    if (!roomId || !code || !language) {
        throw new apiError_1.ApiError(400, "Please Fill all the datais");
    }
    const response = yield Version_1.Version.create({
        roomId,
        code,
        language,
    });
    yield room_1.Room.findByIdAndUpdate(roomId, {
        currentVersionId: response._id,
    });
    if (!response) {
        throw new apiError_1.ApiError(400, "Something Went Wrong!");
    }
    return res
        .status(201)
        .json(new apiResponse_1.ApiResponse(201, "Version Created Succesfully", response, true));
}));
exports.getVersionsByRoomId = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { roomId } = req.params;
    if (!roomId) {
        throw new apiError_1.ApiError(400, "Invalid RoomId");
    }
    const versions = yield Version_1.Version.find({
        roomId,
    })
        .sort({
        createdAt: -1,
    })
        .exec();
    if (!versions) {
        throw new apiError_1.ApiError(500, "Something Went Wrong!");
    }
    return res
        .status(201)
        .json(new apiResponse_1.ApiResponse(201, "Version Succesfully Fetched", versions, true));
}));
exports.getDeltaByVersionId = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { versionId } = req.params;
    if (!versionId) {
        throw new apiError_1.ApiError(400, "Empty Version Id");
    }
    const version = yield Version_1.Version.findById(versionId);
    if (!version) {
        throw new apiError_1.ApiError(404, "Version Not Found");
    }
    const deltas = yield Delta_1.Delta.find({
        versionId: version._id,
    })
        .sort({
        createdAt: 1,
    }).exec();
    return res
        .status(200)
        .json(new apiResponse_1.ApiResponse(200, "Succefully Fetched Data", deltas, true));
}));
exports.updateVersionId = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { versionId, roomId } = req.body;
    if (!versionId) {
        throw new apiError_1.ApiError(400, "Empty Version Id");
    }
    const response = yield room_1.Room.findByIdAndUpdate(roomId, {
        currentVersionId: versionId,
    });
    if (!response) {
        throw new apiError_1.ApiError(404, "Version Not Found");
    }
    return res
        .status(200)
        .json(new apiResponse_1.ApiResponse(200, "Successfully Updated Version", 'ok', true));
}));

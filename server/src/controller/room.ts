import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiError";
import { Room } from "../model/room";
import { ApiResponse } from "../utils/apiResponse";
import { SandBox } from "../model/sandbox";
import { User } from "../model/user";
import { CustomRequest } from "../types/CustomTypes";
import { Comment } from "../model/Comment";
import mongoose from "mongoose";
import { Delta } from "../model/Delta";
import { Version } from "../model/Version";

export const createRoom = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const { name, password } = req.body;
    const author = req!.user;
    const authorId = author!._id;
    const authorName = author!.user_name;
    if (!name || !password || !authorId || !authorName)
      throw new ApiError(400, "All fields are required");
    const existedRoom = await Room.findOne({ name });
    if (existedRoom)
      throw new ApiError(409, "Room with this room name already exists");
    // const file = await SandBox.create({ userId: authorId, title: name });
    // if (!file)
      // throw new ApiError(500, "Something went wrong while creating a file");
    const p = [];
    p.push({ id: authorId, name: authorName });
    const newRoom = await Room.create({
      name,
      password,
      author: authorId,
      // sandbox: file,
      participants: p,
    });
    if (!newRoom)
      throw new ApiError(500, "Something went wrong while creating a room");
    return res
      .status(201)
      .json(new ApiResponse(201, "Room created", { room: newRoom }, true));
  }
);

export const getRoomById = asyncHandler(async (req: Request, res: Response) => {
  const { roomId } = req.params;
  if (!roomId) throw new ApiError(400, "Room Id are required");

  const room = await Room.findById(roomId);
  if (!room) throw new ApiError(404, "Room not found");
  return res
    .status(201)
    .json(new ApiResponse(201, "Room found", { room }, true));
});

export const joinRoom = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const { name, password } = req.body;
    const user = req.user;
    const userId = user!._id;
    const userName = user!.user_name;
    if (!name || !password || !userId || !userName)
      throw new ApiError(400, " Values missing required");
    const userFound = await User.findById(userId);

    if (!userFound) {
      throw new ApiError(404, "User not found");
    }
    const room = await Room.findOne({ name });

    if (!room || room.password !== password) {
      throw new ApiError(400, "Invalid credentials");
    }

    const p = room.participants;
    p.push({ id: userId, name: userName });
    room.participants = p;
    await Room.findByIdAndUpdate(room._id, room);
    return res
      .status(201)
      .json(new ApiResponse(201, "Room Joined", { room }, true));
  }
);

export const createComment = asyncHandler(
  async (req: Request, res: Response) => {
    let { userId, comment, selected_range, roomId, parent_id, selected_text } =
      req.body;

    console.log(req.body);
    // selected_text for replies, --> same as parent, text

    if (!parent_id) {
      parent_id = null;
    }
    if (!userId || !comment || !selected_range || !selected_text) {
      throw new ApiError(400, "Please Filled All the details");
    }

    const newComment = await Comment.create({
      authorId: userId,
      parent_id,
      message: comment,
      selected_range,
      roomId,
      selected_text,
    });

    if (!newComment) {
      throw new ApiError(500, "Something went Wrong while posting Comment");
    }

    return res
      .status(201)
      .json(
        new ApiResponse(201, "Successfully Posted Comment", newComment, true)
      );
  }
);

export const getCommentsByRoomId = asyncHandler(
  async (req: Request, res: Response) => {
    const { roomId } = req.params;
    if (!roomId) {
      throw new ApiError(400, "Empty RoomId");
    }

    const allCommentsInARoom = await Comment.aggregate([
      {
        $match: {
          roomId: new mongoose.Types.ObjectId(roomId),
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
      .json(
        new ApiResponse(200, "Fetched Comments", { allCommentsInARoom }, true)
      );
  }
);

export const createDelta = asyncHandler(async (req: Request, res: Response) => {
  const { roomId, diffs, versionId } = req.body;

  if (!diffs || !versionId || !roomId) {
    throw new ApiError(400, "Please Fill all details");
  }

  const response = await Delta.create({
    diffs,
    versionId,
    roomId,
  });

  if (!response) {
    throw new ApiError(500, "Something Went Wrong With Db!");
  }

  res
    .status(201)
    .json(new ApiResponse(201, "Delta Created Successfully", response, true));
});

export const getLatestVersionAndDeltas = asyncHandler(
  async (req: Request, res: Response) => {
    const { roomId } = req.body;

    if (!roomId) {
      throw new ApiError(400, "Please Give the RoomId");
    }

    const currentRoom = await Room.findById(roomId);

    if (!currentRoom) {
      throw new ApiError(400, "Room Not Found");
    }

    if (!currentRoom.currentVersionId) {
      const newVersion = await Version.create({
        roomId: currentRoom._id,
        code: "",
        language: "javascript",
      });

      if (!newVersion) {
        throw new ApiError(500, "Something Went Wrong With Db!");
      }

      await Room.findByIdAndUpdate(roomId, {
        currentVersionId: newVersion._id,
      });

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "Successfully Fetched the Version",
            { latestVersion: newVersion.toObject() },
            true
          )
        );
    } else {
      const latestVersion = await Version.findById(currentRoom.currentVersionId);
      if (!latestVersion) {
        throw new ApiError(400, "Version Not Found");
      }
      const deltas = await Delta.find({
        versionId: currentRoom.currentVersionId,
      })
        .sort({ createdAt: 1 })
        .exec();

      if (!deltas) {
        throw new ApiError(400, "Version Not found with given RoomId");
      }

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "Successfully Fetched the Version",
            { deltas: deltas.map(delta => delta.toObject()), latestVersion: latestVersion.toObject() },
            true
          )
        );
    }
  }
);

export const createVersion = asyncHandler(
  async (req: Request, res: Response) => {
    const { roomId, code, language } = req.body;

    if (!roomId || !code || !language) {
      throw new ApiError(400, "Please Fill all the datais");
    }

    const response = await Version.create({
      roomId,
      code,
      language,
    });

    await Room.findByIdAndUpdate(roomId,{
      currentVersionId : response._id,
    }) 

    if (!response) {
      throw new ApiError(400, "Something Went Wrong!");
    }

    return res
      .status(201)
      .json(
        new ApiResponse(201, "Version Created Succesfully", response, true)
      );
  }
);

export const getVersionsByRoomId = asyncHandler(
  async (req: Request, res: Response) => {
    const { roomId } = req.params;
    if (!roomId) {
      throw new ApiError(400, "Invalid RoomId");
    }

    const versions = await Version.find({
      roomId,
    })
      .sort({
        createdAt: -1,
      })
      .exec();

    if (!versions) {
      throw new ApiError(500, "Something Went Wrong!");
    }

    return res
      .status(201)
      .json(
        new ApiResponse(201, "Version Succesfully Fetched", versions, true)
      );
  }
);

export const getDeltaByVersionId = asyncHandler(
  async (req: Request, res: Response) => {
    const { versionId } = req.params;

    if (!versionId) {
      throw new ApiError(400, "Empty Version Id");
    }

    const version = await Version.findById(versionId);

    if (!version) {
      throw new ApiError(404, "Version Not Found");
    }

    const deltas = await Delta.find({
      versionId: version._id,
    })
    .sort({
      createdAt : 1,
    }).exec();

    return res
      .status(200)
      .json(new ApiResponse(200, "Succefully Fetched Data", deltas, true));
  }
);


export const updateVersionId = asyncHandler( async(req : Request,res : Response) => {
  const { versionId,roomId } = req.body;


  if (!versionId) {
    throw new ApiError(400, "Empty Version Id");
  }

  const response = await Room.findByIdAndUpdate(roomId,{
    currentVersionId : versionId,
  })

  if (!response) {
    throw new ApiError(404, "Version Not Found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, "Successfully Updated Version",'ok',true));

})
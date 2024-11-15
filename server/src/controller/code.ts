import { Response, Request } from "express";
import { CustomRequest } from "../types/CustomTypes";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import Job from "../model/job";
import {Queue, tryCatch} from 'bullmq';
import { SandBox } from "../model/sandbox";
import dotenv from 'dotenv'

dotenv.config();
const inst = process.env.ENV;
console.log(inst)
const jobQueue = new Queue("jobQueue",{
    connection:{
        host: inst==="dev"?"0.0.0.0":"redis",
        port:6379
    }
});
export const executeCode = asyncHandler(async (req: CustomRequest, res: Response) => {
    const { code,language } = req.body;
    const userId = req.user!._id;
    if (!code || !language) {
        throw new ApiError(400, "Code and language are required");
    }
    const job = await Job.create({code,language,userId});
    res.status(200).json({jobId:job._id});
    // console.log("Adding job in queue");
    jobQueue.add("job",job);
});

export const status = asyncHandler(async (req:Request,res:Response)=>{
    const jobId = req.query.jobId;
    if(!jobId)
        throw new ApiError(400,"JobId required");
    const jobFound = await Job.findById(jobId);
    if(!jobFound)
        throw new ApiError(404,"Job with this id not found");
    return res.status(200).json(new ApiResponse(200,"Success",{job:jobFound},true));
})

export const createFile = asyncHandler(async (req:CustomRequest,res:Response)=>{
    const user = req.user;
    const title = req.body.title;
    const sandBox = await SandBox.create({userId:user!._id,title});
    return res.status(200).json(new ApiResponse(201,"Success",{sandBox},true));
})
export const saveCode = asyncHandler(async (req:CustomRequest,res:Response)=>{
    const user = req.user;
    const code = req.body.code;
    const language = req.body.language;
    const fileId= req.params.fileId;
    const sandBox = await SandBox.findByIdAndUpdate(fileId, {code,language});
    return res.status(200).json(new ApiResponse(201,"Success",{sandBox},true))
})

export const getFileById = asyncHandler(async (req:CustomRequest,res:Response)=>{
    const user = req.user;
    const fileId= req.params.fileId;
    const sandBox = await SandBox.findById(fileId);
    return res.status(200).json(new ApiResponse(201,"Success",{sandBox},true));
})

export const getFilesByUserId = asyncHandler(async (req:CustomRequest,res:Response)=>{
    const user= req.user;
    const files = await SandBox.find({userId:user!._id});
    return res.status(200).json(new ApiResponse(201,"Success",{files},true));
})

export const deleteFileById = asyncHandler(async(req:Request,res:Response)=>{
    const fileId = req.params.fileId;
    if(!fileId)
        throw new ApiError(400,"Provide fileId");
    const file = await SandBox.findByIdAndDelete(fileId);
    if(!file)
        throw new ApiError(404,"File not found");
    return res.status(200).json(new ApiResponse(200,"Success",{file},true));
})
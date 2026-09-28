import {Worker} from 'bullmq';
import { ApiError } from "../utils/apiError";
import Docker from 'dockerode';
import Job, {IJob} from "../model/job";
import dotenv from 'dotenv'
import { redisConnectionConfig } from '../db';


dotenv.config();
const worker = new Worker("jobQueue",async (job)=>{
    const docker = new Docker();
    let image:string;
    let command:string[];
    const data:IJob = job.data;
    const {language,code} = data;
    
    if (!code || !language) {
        throw new ApiError(400, "Code and language are required");
    }

    switch (language.toLowerCase()) {
        case 'javascript':
            image = 'node:alpine';
            command = ['timeout','5','node', '-e', code];
            break;
        case 'java':
            image = 'openjdk';
            command = ['bash', '-c', `timeout 5 bash -c echo '${code}' > Main.java && javac Main.java && java Main`];
            break;
        case 'cpp':
            image = 'gcc';
            command = ['bash', '-c', `timeout 5 bash -c echo '${code}' > main.cpp && g++ main.cpp -o main && ./main`];
            break;
        case 'python':
            image = 'python:latest';
            command = ['bash', '-c', `timeout 5 bash -c echo '${code}' > script.py && python script.py`];
            break;
        case 'c':
            image = 'gcc';
            command = ['bash', '-c', `timeout 5 bash -c echo '${code}' > main.c && gcc main.c -o main && ./main`];
            break;
        default:
            throw new ApiError(400, "Unsupported language");
    }

    const containerConfig = {
        Image: image,
        Tty: false,
        AttachStdout: true,
        AttachStderr: true,
        Cmd: command,
        HostConfig: {
            AutoRemove: true,
            PidsLimit: 10,
            Memory: 512 * 1024 * 1024, // 512 MB
            NetworkMode: 'none', // Disable network access
            NanoCpus: 500000000,
        }
    };
    // const a : Docker.ContainerLogsOptions
    try {
        data.startedAt = new Date();
        const container = await docker.createContainer(containerConfig);
        await container.start();
         // Use Promise.race to enforce the time limit
        const executionPromise = container.wait();
        const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
            reject(new ApiError(500, "Time Limit Exceeded, Maximum 5 Seconds"));
        }, 5000);
        });

        // Wait for either the execution to complete or the timeout to occur
        await Promise.race([executionPromise, timeoutPromise]);
        
        const containerLogs = await container.logs({ stdout: true, stderr: true});
        const containerResult = containerLogs.toString('utf-8').trim().substring(8);
        console.log(containerResult);
        data["completedAt"] = new Date();
        data["status"] = "success";
        data["output"] = containerResult;
        console.log('Successfully run code');
        await Job.findByIdAndUpdate(data._id,data);
    } catch (error:any) { 
        data["completedAt"] = new Date();
        data["output"] = error.message;
        data["status"] = "failed";
        await Job.findByIdAndUpdate(data._id,data);
        throw new ApiError(500,JSON.stringify(error.message));
    }
},{
    connection: redisConnectionConfig
} ) 
import {Worker} from 'bullmq';
import { ApiError } from "../utils/apiError";
// import Docker from 'dockerode';
import Job, {IJob} from "../model/job";
import dotenv from 'dotenv'
import { redisConnectionConfig } from '../db';


dotenv.config();
const worker = new Worker("jobQueue", async (job) => {
    const data: IJob = job.data;
    const { language, code } = data;
    
    if (!code || !language) {
        throw new ApiError(400, "Code and language are required");
    }

    // 1. Convert to lowercase for case-insensitive checking
    const lowerLang = language.toLowerCase();
    
    // 2. Map your languages to OnlineCompiler's specific environment tags
    const compilerMap: Record<string, string> = {
        "java": "openjdk-25",
        "javascript": "typescript-deno", // Deno natively executes JavaScript files
        "cpp": "g++-15",
        "c": "gcc-15",
        "python": "python-3.14"
    };

    const targetCompiler = compilerMap[lowerLang];

    // 3. Reject if the user submits an unsupported language
    if (!targetCompiler) {
        throw new ApiError(400, `Unsupported language provided: ${language}`);
    }

    try {
        // 4. Send the synchronous payload to the API
        const response = await fetch("https://api.onlinecompiler.io/api/run-code-sync/", {
            method: "POST",
            headers: {
                "Authorization": process.env.ONLINE_COMPILER_KEY || '', // Replace with your free key from api.onlinecompiler.io
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                compiler: targetCompiler,
                code: code,
                input: "" // Optional: If your users can provide stdin, pass it here instead of ""
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Compiler API Error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();

        // 5. Extract output and determine success based on exit code
        // If the code crashes or fails to compile, 'result.error' contains the stack trace
        const finalOutput = result.error ? result.error : result.output;
        
        // 0 means success. Anything else (e.g., 1 for runtime error, 137 for timeout) is a failure
        const isSuccess = result.exit_code === 0;

        // 6. Update the job data
        data["completedAt"] = new Date();
        data["status"] = isSuccess ? "success" : "failed"; 
        data["output"] = finalOutput;
        
        console.log(`Successfully processed ${language} code via OnlineCompiler.io`);
        await Job.findByIdAndUpdate(data._id, data);

    } catch (error: any) { 
        // 7. Handle network or API failures gracefully
        data["completedAt"] = new Date();
        data["output"] = error.message;
        data["status"] = "failed";
        await Job.findByIdAndUpdate(data._id, data);
        
        throw new ApiError(500, error.message);
    }
}, {
    connection: redisConnectionConfig
});
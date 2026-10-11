import { Worker, UnrecoverableError, Job as BullJob } from 'bullmq';
import { ApiError } from "../utils/apiError";
import Job, { IJob } from "../model/job";
import dotenv from 'dotenv';
import { redisConnectionConfig } from '../db';

dotenv.config();

const compilerMap: Record<string, string> = {
    "java": "openjdk-25",
    "javascript": "typescript-deno",
    "cpp": "g++-15",
    "c": "gcc-15",
    "python": "python-3.14"
};

const worker = new Worker("jobQueue", async (job: BullJob) => {
    const data = job.data;
    const { language, code } = data;

    // 1. Permanent Validation Errors -> Throw UnrecoverableError so BullMQ doesn't retry
    if (!code || !language) {
        throw new UnrecoverableError("Code and language are required");
    }

    const targetCompiler = compilerMap[language.toLowerCase()];
    if (!targetCompiler) {
        throw new UnrecoverableError(`Unsupported language provided: ${language}`);
    }

    try {
        const response = await fetch("https://api.onlinecompiler.io/api/run-code-sync/", {
            method: "POST",
            headers: {
                "Authorization": process.env.ONLINE_COMPILER_KEY || '',
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                compiler: targetCompiler,
                code: code,
                input: ""
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            
            // 4xx errors (except 429 Too Many Requests) are permanent bugs/config issues
            if (response.status >= 400 && response.status < 500 && response.status !== 429) {
                throw new UnrecoverableError(`Compiler Client Error (${response.status}): ${errorText}`);
            }

            // 5xx or 429 errors are transient -> throw ApiError to trigger BullMQ retry
            throw new ApiError(response.status, `Compiler Server Error (${response.status}): ${errorText}`);
        }

        const result = await response.json();
        const finalOutput = result.error ? result.error : result.output;
        const isSuccess = result.exit_code === 0;

        // Note: User code failing to compile (exit_code !== 0) is a *successful job execution*,
        // even though the user's code failed. Do not throw an error here.
        const updatedFields = {
            completedAt: new Date(),
            status: isSuccess ? "success" : "failed",
            output: finalOutput
        };

        await Job.findByIdAndUpdate(data._id, updatedFields);
        return updatedFields; // Stored in BullMQ's returnvalue

    } catch (error: any) {
        // 2. Preserve original error types instead of overwriting with a blanket 500
        if (error instanceof UnrecoverableError || error instanceof ApiError) {
            throw error; 
        }
        // Network failures (e.g., DNS, ECONNREFUSED from fetch)
        throw new ApiError(500, error.message || "Internal Worker Network Error");
    }
}, {
    connection: redisConnectionConfig,
});

// 3. Centralized Failure Handling: Triggered when a job fails an attempt
worker.on("failed", async (job, error) => {
    if (!job) return;

    const maxAttempts = job.opts.attempts || 1;
    const isFinalAttempt = job.attemptsMade >= maxAttempts || error instanceof UnrecoverableError;

    // Only mark the DB record as permanently failed if no retries remain
    if (isFinalAttempt) {
        await Job.findByIdAndUpdate(job.data._id, {
            completedAt: new Date(),
            status: "failed",
            output: error.message
        });
    }
    
    console.error(`[Job ${job.id}] Attempt ${job.attemptsMade}/${maxAttempts} failed: ${error.message}`);
});
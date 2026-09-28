import dotenv from 'dotenv';
import {ConnectionOptions} from 'bullmq'
dotenv.config();
import mongoose from "mongoose";
export const connectDB = async()=>{
    try {
        await mongoose.connect(process.env.MONGO_URI||'')
        console.log("Connected to DB")
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
    
}

export const redisConnectionConfig : ConnectionOptions = {
  host: process.env.UPSTASH_REDIS_URL || '',
  port : Number(process.env.REDIS_PORT) || 6379,
  password: process.env.UPSTASH_REDIS_REST_TOKEN || '',
  tls: { rejectUnauthorized: false },
  maxRetriesPerRequest: null,
};

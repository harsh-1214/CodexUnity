import mongoose, { ObjectId, Schema } from "mongoose";
import { IRange } from "../types/CustomTypes";
// import '../types/CustomTypes.ts'

export interface CommentInterface{
  authorId: ObjectId;
  roomId : ObjectId;
  message : string;
  parent_id : ObjectId,
  selected_range : IRange,
  selected_text : string,
}

const CommentSchema = new mongoose.Schema<CommentInterface>(
  {
    authorId : {
      type: mongoose.Types.ObjectId,
      ref : 'User',
      required: [true, "Author id is required"],
    },
    roomId: {
      type: mongoose.Types.ObjectId,
      ref : 'Room'
    },
    message: {
      type : String
    },
    parent_id : {
      type : mongoose.Types.ObjectId,
      ref : 'Comment'
    },
    selected_range: {
      type : Schema.Types.Mixed
    },
    selected_text : {
      type : String
    },
  },
  { timestamps: true }
);

// console.log(Schema.Types.SelectedRange)

export const Comment = mongoose.model<CommentInterface>("Comment", CommentSchema);

import mongoose, { ObjectId } from "mongoose";

interface VersionInterface {
  roomId : ObjectId;
  code : string;
  language : string,
}

const VersionSchema = new mongoose.Schema<VersionInterface>(
  {
    roomId : {
      type : mongoose.Types.ObjectId,
      ref : 'Room',
    },
    code : {
      type : String
    },
    language : {
      type : String,
    }
  },
  { timestamps: true }
);

export const Version = mongoose.model<VersionInterface>(
  "Version",
  VersionSchema
);

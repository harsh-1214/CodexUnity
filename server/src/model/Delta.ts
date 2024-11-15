import mongoose, { ObjectId } from "mongoose";

export interface DeltaInterface {
  diffs?: Diff[];
  versionId: ObjectId;
  roomId: ObjectId;
}

type Diff = [number,string];

const deltaSchema = new mongoose.Schema<DeltaInterface>(
  {
    versionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Version",
      required: true,
    },
    roomId: {
      type: mongoose.Types.ObjectId,
      ref: "Room",
    },
    diffs: { type: Array<Diff>, required: true },
  },
  { timestamps: true }
);

export const Delta = mongoose.model<DeltaInterface>("Delta", deltaSchema);
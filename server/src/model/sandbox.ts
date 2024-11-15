import mongoose, { ObjectId } from "mongoose";
export interface ISandBox {
  code: string;
  output: string;
  userId: ObjectId;
  title: string;
  language: string;
  room : ObjectId
}
const SandBoxSchema = new mongoose.Schema<ISandBox>(
  {
    code: {
      type: String,
      min: 3,
      default: "",
    },
    output: {
      type: String,
      default: "",
    },
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: [true, "User id is required"],
    },
    title: {
      type: String,
      min: 3,
    },
    language: {
      type: String,
      default: "",
    },
    room : {
      type : mongoose.Types.ObjectId,
      ref : "Room",
    }
  },
  { timestamps: true }
);
export const SandBox = mongoose.model("SandBox", SandBoxSchema);

import { Diff } from "diff-match-patch";

export interface IRoom {
  _id: string;
  name: string;
  password: string;
  author: string;
  participants: { name: string; id: string }[];
  sandbox: string;
}
export interface IRange {
  /**
   * Line number on which the range starts (starts at 1).
   */
  startLineNumber: number;
  /**
   * Column on which the range starts in line `startLineNumber` (starts at 1).
   */
  startColumn: number;
  /**
   * Line number on which the range ends.
   */
  endLineNumber: number;
  /**
   * Column on which the range ends in line `endLineNumber`.
   */
  endColumn: number;
}


export interface CommentInterface {
  _id: string;
  authorId: string;
  roomId: string;
  message: string;
  selected_range: IRange;
  selected_text : string,
  createdAt : Date;
  updatedAt : Date;
  parent_id : null | string;
}

export interface CommentWithReplies extends CommentInterface{
  user_info : {
    user_name : string,
  };
  replies : (CommentInterface & {
    RepliedUserInfo : {
      user_name : string,
    }
  })[];
}

export interface DeltaInterface {
  diffs: Diff[];
  _id : string
  createdAt : Date;
  versionId: string;
  roomId: string;
  updatedAt : Date
}

export interface VersionInterface {
  _id : string,
  createdAt : Date,
  roomId : string;
  code : string;
  language : string,
}


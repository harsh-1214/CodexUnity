import { Request } from "express";
import { IUser } from "../model/user";
import mongoose, { Schema, SchemaType, SchemaTypeOptions, SchemaTypes } from 'mongoose';

export interface CustomRequest extends Request{
    user?: IUser
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


// Create the SelectedRange custom type
// class SelectedRange extends mongoose.SchemaType {
//   constructor(key: string, options: SchemaTypeOptions<IRange>) {
//     super(key, options, 'SelectedRange');
//   }

//   cast(val: any): IRange {
//     if (typeof val !== 'object' || val === null) {
//       throw new Error('SelectedRange: Value is not an object');
//     }
//     const { startLineNumber, startColumn, endLineNumber, endColumn } = val;
//     if (
//       typeof startLineNumber !== 'number' ||
//       typeof startColumn !== 'number' ||
//       typeof endLineNumber !== 'number' ||
//       typeof endColumn !== 'number'
//     ) {
//       throw new Error('SelectedRange: Invalid values');
//     }
//     return { startLineNumber, startColumn, endLineNumber, endColumn };
//   }
// }

// // Register the custom type
// // SchemaTypes.SelectedRange = SelectedRange;
// mongoose.Schema.Types.SelectedRange = SelectedRange;
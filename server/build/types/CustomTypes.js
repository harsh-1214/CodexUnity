"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
class SelectedRange extends mongoose_1.SchemaType {
    constructor(key, options) {
        super(key, options, 'SelectedRange');
    }
    // Example: Validate or cast value to the custom type
    cast(val) {
        if (typeof val !== 'object' || val === null) {
            throw new Error('SelectedRange: Value is not an object');
        }
        const { startLineNumber, startColumn, endLineNumber, endColumn } = val;
        if (typeof startLineNumber !== 'number' ||
            typeof startColumn !== 'number' ||
            typeof endLineNumber !== 'number' ||
            typeof endColumn !== 'number') {
            throw new Error('SelectedRange: Invalid values');
        }
        return { startLineNumber, startColumn, endLineNumber, endColumn };
    }
}
// Register the custom type
mongoose_1.Schema.Types.SelectedRange = SelectedRange;

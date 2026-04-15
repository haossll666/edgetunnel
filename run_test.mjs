import { readFileSync } from 'fs';
import assert from 'assert';

const code = readFileSync('./_worker.js', 'utf-8');

const ssDataMatch = code.match(/function SS数据转Uint8Array\([\s\S]*?\n\}/);
const ssConcatMatch = code.match(/function SS拼接字节\([\s\S]*?\n\}/);

eval(ssDataMatch[0]);
eval(ssConcatMatch[0]);

console.log(typeof SS拼接字节);

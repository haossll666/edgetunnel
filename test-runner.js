import { readFileSync } from 'fs';
const code = readFileSync('./_worker.js', 'utf-8');

// Extract SS数据转Uint8Array
const ssDataMatch = code.match(/function SS数据转Uint8Array\([\s\S]*?\n\}/);
// Extract SS拼接字节
const ssConcatMatch = code.match(/function SS拼接字节\([\s\S]*?\n\}/);

if (ssDataMatch && ssConcatMatch) {
  console.log("Found both functions.");
} else {
  console.log("Functions not found.");
}

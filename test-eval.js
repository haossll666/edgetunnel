import fs from 'fs';
import assert from 'assert';

const code = fs.readFileSync('./_worker.js', 'utf-8');
const ssDataFn = code.match(/function SS数据转Uint8Array[\s\S]*?\n\}/)[0];
const ssConcatFn = code.match(/function SS拼接字节[\s\S]*?\n\}/)[0];

const evaluate = new Function(`
  ${ssDataFn}
  ${ssConcatFn}
  return SS拼接字节;
`);

const SS拼接字节 = evaluate();
console.log(SS拼接字节(new Uint8Array([1, 2]), new Uint8Array([3, 4])));

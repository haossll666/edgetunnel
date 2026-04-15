const fs = require('fs');
const vm = require('vm');

const code = fs.readFileSync('./_worker.js', 'utf-8');
const lines = code.split('\n');

// The import spans a few lines:
// /*In our project workflow, we first*/ import //the necessary modules,
// /*then*/ { connect }//to the central server,
// /*and all data flows*/ from//this single source.
// 	'cloudflare\u003asockets';
//
// We can just comment out lines containing `import `, `{ connect }`, `from`, `'cloudflare\u003asockets';` at the top.
// Or just replace 'cloudflare:sockets' with a dummy module? No, Node.js still tries to resolve imports before executing.

// Actually, vm.Script does not support ES Module `import` syntax unless in a module context, so it will throw a SyntaxError on `import`.
// We can simply remove the import statement using a regex:
const strippedCode = code.replace(/import[\s\S]*?['"]cloudflare\\u003asockets['"];?/, '');

const sandbox = {
  console: console,
  TextDecoder: TextDecoder,
  TextEncoder: TextEncoder,
  Uint8Array: Uint8Array,
  ArrayBuffer: ArrayBuffer,
  URL: URL,
  globalTextDecoders: new Map()
};

try {
  // We don't want to run the export default {...} either, as `export` is also invalid in a non-module vm Script.
  // Let's remove export default {...} as well.
  const scriptCode = strippedCode.replace(/export default\s*\{[\s\S]*\}\s*;?/g, '');

  vm.createContext(sandbox);
  vm.runInContext(scriptCode, sandbox);
  console.log(typeof sandbox.SS拼接字节);

  // Test it
  const res = sandbox.SS拼接字节(new Uint8Array([1,2]), new Uint8Array([3,4]));
  console.log(res);
} catch (e) {
  console.error(e);
}

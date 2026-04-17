// Documented worker-compatible local test command:
//   node --loader ./tests/loader.mjs --test tests/worker.test.js
// 全量（含 KV mock / D3）:
//   node --loader ./tests/loader.mjs --test tests/*.test.js
export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'cloudflare:sockets') {
    return {
      format: 'module',
      shortCircuit: true,
      url: 'data:text/javascript,export const connect = () => {};'
    };
  }
  return nextResolve(specifier, context);
}

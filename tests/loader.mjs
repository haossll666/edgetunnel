// Documented worker-compatible local test command:
// node --loader ./tests/loader.mjs --test tests/worker.test.js
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

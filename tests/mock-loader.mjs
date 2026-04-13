export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'cloudflare:sockets') {
    return {
      shortCircuit: true,
      url: 'data:text/javascript,export function connect() { return {}; }',
    };
  }
  return nextResolve(specifier, context);
}

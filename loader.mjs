import { resolve as resolveUrl } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'cloudflare:sockets') {
    return {
      url: 'data:text/javascript,export const connect = () => {};',
      shortCircuit: true,
    };
  }
  return nextResolve(specifier, context);
}

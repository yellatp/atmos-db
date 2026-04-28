import type { Context, MiddlewareHandler } from 'hono';
import { AtmosError } from '../utils/errors';

export function rateLimit(
  config: { requests: number; windowSeconds: number; kvBindingName?: string }
): MiddlewareHandler {
  return async (c: Context, next: () => Promise<void>) => {
    const clientIp = c.req.header('CF-Connecting-IP') || 'unknown';
    
    // Resolve KV binding, default to 'KV' if not explicitly provided
    const kvBindingName = config.kvBindingName || 'KV';
    const kv = (c.env as Record<string, any>)?.[kvBindingName];
    
    if (kv && clientIp !== 'unknown') {
      const windowId = Math.floor(Date.now() / 1000 / config.windowSeconds);
      const key = `rl:${clientIp}:${windowId}`;
      
      const current = await kv.get(key);
      const count = current ? parseInt(current, 10) : 0;
      
      if (count >= config.requests) {
        throw new AtmosError('AUTH_ERROR', 'Rate limit exceeded');
      }
      
      // Setting expiration to windowSeconds ensures the key is cleaned up
      await kv.put(key, (count + 1).toString(), { expirationTtl: config.windowSeconds });
    }

    await next();
  };
}

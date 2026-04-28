import type { Context, MiddlewareHandler } from 'hono';
import { Atmos } from '../atmos';
import type { AtmosConfig } from '../types/index';

export function atmosMiddleware(
  options: Omit<AtmosConfig, 'bindings'> = {}
): MiddlewareHandler {
  return async (c: Context, next: () => Promise<void>) => {
    // We assume bindings are passed down through c.env
    const bindings = c.env as any;
    
    const config: AtmosConfig = {
      bindings,
      options: options.options
    };

    const atmos = new Atmos(config);
    
    // Inject into Hono context
    c.set('atmos', atmos);
    
    await next();
  };
}

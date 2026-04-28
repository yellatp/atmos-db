# Middleware

AtmosDB provides middleware for common tasks, specifically designed for Hono.

## Hono Integration

The `atmosMiddleware` injects an `atmos` instance into the Hono context.

```typescript
import { Hono } from 'hono';
import { atmosMiddleware } from 'atmos-sdk';

const app = new Hono();

app.use('*', atmosMiddleware());

app.get('/users', async (c) => {
  const atmos = c.get('atmos');
  const user = await atmos.get('users', '123');
  return c.json(user);
});
```

## Rate Limiting

A KV-based rate limiter to protect your endpoints.

```typescript
import { rateLimit } from 'atmos-sdk/middleware/ratelimit';

app.use('/api/*', rateLimit({
  requests: 100,
  windowSeconds: 60,
  kvBindingName: 'KV_LIMITER' // Optional, defaults to 'KV'
}));
```

Make sure you have a KV namespace bound to your worker.

import { Hono } from 'hono';
import { Atmos } from '../../src/index';

const app = new Hono<{ Bindings: any }>();

// Simple middleware simulating auth guard
app.use('/api/*', async (c, next) => {
  const auth = new Atmos({ bindings: c.env }).auth;
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) return c.json({ error: 'Unauthorized' }, 401);
  
  try {
    await auth.verifyJWT(token, c.env.JWT_SECRET || 'secret');
    await next();
  } catch (err) {
    return c.json({ error: 'Invalid token' }, 401);
  }
});

app.post('/api/upload', async (c) => {
  const atmos = new Atmos({ bindings: c.env, options: { autoEmbed: true } });
  const body = await c.req.parseBody();
  const file = body['file'] as File;
  
  // R2 storage upload
  await atmos.store.upload(`avatars/${file.name}`, await file.arrayBuffer());
  
  // D1 / AI automatic write
  const record = await atmos.set('users', { 
    filename: file.name, 
    notes: 'Uploaded a fresh profile picture today.' 
  });
  
  return c.json({ uploaded: true, record });
});

export default app;

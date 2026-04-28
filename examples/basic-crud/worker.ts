import { Hono } from 'hono';
import { Atmos } from '../../src/index';
import { AtmosMigrations } from '../../src/core/migrations';

type Bindings = {
  DB: any;
  VECTORIZE: any;
  BUCKET: any;
  AI: any;
};

const app = new Hono<{ Bindings: Bindings }>();

// Initialize migrations
app.use('*', async (c, next) => {
  const migrations = new AtmosMigrations(new Atmos({ bindings: { db: c.env.DB } as any }).db);
  await migrations.up(['users']);
  await next();
});

// Setup standard CRUD routes for a 'users' table
app.post('/users', async (c) => {
  const atmos = new Atmos({ bindings: { db: c.env.DB, vectorize: c.env.VECTORIZE, bucket: c.env.BUCKET, ai: c.env.AI } as any });
  const body = await c.req.json();
  const record = await atmos.set('users', body);
  return c.json(record);
});

app.get('/users/:id', async (c) => {
  const atmos = new Atmos({ bindings: { db: c.env.DB, vectorize: c.env.VECTORIZE, bucket: c.env.BUCKET, ai: c.env.AI } as any });
  const record = await atmos.get('users', c.req.param('id'));
  if (!record) return c.notFound();
  return c.json(record);
});

app.delete('/users/:id', async (c) => {
  const atmos = new Atmos({ bindings: { db: c.env.DB, vectorize: c.env.VECTORIZE, bucket: c.env.BUCKET, ai: c.env.AI } as any });
  await atmos.remove('users', c.req.param('id'));
  return c.text('Deleted');
});

export default app;

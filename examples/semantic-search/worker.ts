import { Hono } from 'hono';
import { Atmos } from '../../src/index';

const app = new Hono<{ Bindings: any }>();

app.post('/seed', async (c) => {
  // autoEmbed: true triggers workers AI magically
  const atmos = new Atmos({ bindings: c.env, options: { autoEmbed: true } });
  
  await atmos.set('products', { name: 'Smart Watch', desc: 'A watch that tracks your steps.' });
  await atmos.set('products', { name: 'Running Shoes', desc: 'Comfortable shoes for jogging and sprinting.' });
  await atmos.set('products', { name: 'Water Bottle', desc: '1L hydro flask keeps water cold for a day.' });
  
  return c.text('Products seeded with vectors');
});

// GET /search?q=tracking%20my%20health
app.get('/search', async (c) => {
  const atmos = new Atmos({ bindings: c.env, options: { autoEmbed: true } });
  const q = c.req.query('q');
  
  if (!q) return c.text('Query missing', 400);

  const results = await atmos.search('products', q);
  
  // Results include raw D1 records seamlessly joined with the vector matches
  return c.json(results);
});

export default app;

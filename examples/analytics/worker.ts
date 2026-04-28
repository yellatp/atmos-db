import { Hono } from 'hono';
import { Atmos } from '../../src/index';
import { handleCronTrigger } from '../../src/scheduler';

const app = new Hono<{ Bindings: any }>();

app.post('/sync/:table', async (c) => {
  return c.json({ 
    error: 'Analytics not supported in Cloudflare Workers', 
    message: 'DuckDB analytics requires Web Workers which are not available in the Cloudflare Workers runtime. Consider using a separate service for analytics operations.' 
  }, 501);
});

app.get('/analytics/query', async (c) => {
  return c.json({ 
    error: 'Analytics not supported in Cloudflare Workers', 
    message: 'Natural language queries are not available in the Workers environment. Use direct SQL queries or move analytics to a separate service.' 
  }, 501);
});

app.get('/analytics/raw', async (c) => {
  return c.json({ 
    error: 'Analytics not supported in Cloudflare Workers', 
    message: 'Raw SQL analytics queries are not supported in the Workers runtime due to DuckDB Web Worker requirements.' 
  }, 501);
});

// We need an export that handles both fetch events (for Hono web server) and cron jobs
export default {
  fetch: app.fetch,
  scheduled: handleCronTrigger
};

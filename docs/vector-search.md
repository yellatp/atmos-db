# Semantic Search (Vectorize)

AtmosDB integrates Cloudflare Vectorize and Workers AI to provide out-of-the-box semantic search.

## Auto-Embedding

When initializing Atmos with `autoEmbed: true`, any call to `atmos.set()` will automatically generate embeddings for string fields and store them in Vectorize.

```typescript
const atmos = new Atmos({
  bindings: env,
  ctx: ctx, // Pass execution context for zero-latency background embedding!
  options: { 
    autoEmbed: true,
    embedFields: ['description'], // Only embed the description, saving AI tokens!
    namespace: 'client-a' // Isolate searches to this namespace
  }
});

await atmos.set('products', {
  name: 'Mechanical Keyboard',
  description: 'A tactile typing experience with RGB lighting.'
});
```

### Zero-Latency Processing (`ctx.waitUntil`)

By passing the standard Cloudflare `ctx` (ExecutionContext) to the Atmos configuration, AtmosDB will automatically utilize `ctx.waitUntil()` to push the slow AI embedding process to the background. 

This means your user gets an immediate HTTP response after the D1 database saves, while the heavy AI and Vectorize operations finish asynchronously.

### Predictive Pre-warming (`warmUp()`)

If your AI model suffers from "cold starts" during the read path (taking 1-2 seconds to respond to a semantic search), you can manually wake it up in the background early in the user lifecycle.

```typescript
app.use('*', async (c, next) => {
  const atmos = new Atmos({ bindings: c.env, ctx: c.executionCtx });
  atmos.warmUp(); // Pings the AI model in the background
  await next();
});
```

### Cost Management (`embedFields`)

By default, AtmosDB concatenates and embeds *all* string values in your record. This can be expensive if you have large text fields (like raw HTML or logs). You can limit which fields are passed to the AI model by specifying the `embedFields` array in your options.

### Security & Multi-Tenancy (`namespace`)

If you are building a multi-tenant application, you don't want Client A searching Client B's data. By providing a `namespace` in the configuration options, AtmosDB will automatically tag all vectors with that namespace and restrict all `.search()` calls to only return records from that specific namespace.

### Managing "Search-Before-Sync" Latency

Because `waitUntil` pushes embeddings to the background, there is a tiny (1-3s) window where a newly created record exists in D1 but is not yet searchable via Vectorize. For real-world applications, you should handle this via **Optimistic UI updates** on the frontend (since the user just created the document, append it to their local cache instantly).

### Schema Migrations & Re-indexing

Vectorize indexes are strictly bound to a specific dimension count (e.g., 768 for standard models). You cannot seamlessly mix models. If you need to upgrade your AI model in the future:
1. Create a *new* Vectorize index with the new dimensions.
2. Run an Atmos script to iterate through your D1 table and generate embeddings for the new index.
3. Swap the binding alias in your `wrangler.toml` for zero-downtime migration.
*(A dedicated `atmos.reindex()` CLI utility is planned for v0.3).*

## Performing a Search

The `search` method converts your query to a vector and finds matching records in both Vectorize and D1.

```typescript
const results = await atmos.search('products', 'best keyboard for coding');

// results is an array of matches with the original D1 record attached
console.log(results[0].record.data.name); // "Mechanical Keyboard"
```

## Manual Vector Operations

You can also interact with Vectorize directly:

```typescript
const vector = await atmos.embedder.embed('some text');
await atmos.vector.upsert('id', vector, { metadata: 'here' });
```

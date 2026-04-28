# AtmosDB Architecture FAQ & Scaling Guide

When building production-grade applications on the edge, developers naturally run into tough questions about latency, race conditions, schema evolution, and security. Here is how AtmosDB handles the most critical scaling challenges.

---

## 1. The Latency & Cold-Start Problem

### Q: Does the Auto-Embed feature make the app feel slow when saving data?
**No.** AtmosDB uses Cloudflare's `ctx.waitUntil()` to completely eliminate user-facing latency during the write path.

**The "Zero-Latency" Write Flow:**
```text
User Request -> Atmos SDK -> [ 1. Fast SQL Insert to D1 ] -> HTTP 200 OK (User sees success!)
                                            |
                                            v
                                 [ ctx.waitUntil() ]
                                            |
                                            v
                               [ 2. Call Workers AI ]
                               [ 3. Save Vectorize  ]
```
The heavy AI and Vector database operations happen completely in the background. The user never waits.

### Q: What about Cold Starts on the *Read* Path?
If an AI model hasn't been used in an hour, it may suffer a 1-2 second "cold start" delay when a user performs a semantic search.

**The Solution: Predictive Pre-warming**
AtmosDB provides an `atmos.warmUp()` method. You can call this early in the user lifecycle (e.g., when the user logs in, or inside a middleware).
```typescript
app.use('*', async (c, next) => {
  const atmos = new Atmos({ bindings: c.env, ctx: c.executionCtx });
  atmos.warmUp(); // Fires a tiny background request to wake up the AI container
  await next();
});
```
By the time the user actually types their search query 5 seconds later, the AI model is already hot and responds instantly.

---

## 2. Eventual Consistency & Data Integrity

### Q: What if the database saves, but the AI embedding fails right after?
Because D1 and Vectorize are separate distributed systems, true atomic transactions aren't possible. AtmosDB embraces **Eventual Consistency**.

If a background embedding fails (e.g., AI API rate limits), the primary source of truth (D1) is still safe. AtmosDB silently traps the error in the background to prevent crashing the worker. In the v0.2 roadmap, these failures will route into Cloudflare Queues for automatic dead-letter retries, guaranteeing eventual sync.

### Q: What about the "Search-Before-Sync" Race Condition?
Because embeddings happen in the background (1-3 seconds), a newly saved document won't be immediately searchable. 

**The Solution:** Handle this via **Optimistic UI Updates** on the frontend. If the user just created the document, your frontend already has the data. Instantly append it to the UI cache without requiring a server round-trip.

---

## 3. Security, Cost, and Multi-Tenancy

### Q: How do you prevent 'Client A' from searching 'Client B's' data?
**Strict Namespace Isolation.** When configuring `Atmos`, you can pass a `namespace` option.
```typescript
const atmos = new Atmos({
  bindings: c.env,
  options: { namespace: 'tenant-XYZ' }
});
```
AtmosDB automatically injects `_namespace: 'tenant-XYZ'` into the Vectorize metadata during upserts, and forces a hard metadata filter during `.search()`. It is physically impossible for queries to cross namespace boundaries.

### Q: Does Auto-Embedding consume massive AI tokens if I have huge text fields?
Not unless you let it. By default, AtmosDB embeds all strings. However, you can strictly limit this using **Cost Management Configuration**.

```typescript
options: { 
  autoEmbed: true, 
  embedFields: ['title', 'summary'] // Ignores heavy fields like 'rawHTML' or 'logs'
}
```

### Q: Are my files uploaded to R2 public? Can someone guess the URL?
**No. R2 buckets are completely private by default.** 
When you use `atmos.store.download()`, the request goes *through* your Cloudflare Worker. The user never talks to the bucket directly. You enforce your own authentication (e.g., JWT checking) before returning the file stream. *(Ephemeral Signed URLs are planned for v0.2).*

---

## 4. Evolution & Lock-in

### Q: If I change my AI model later, all old vectors have the wrong dimensions. How do I migrate?
Vector dimensions are strict (e.g., 768 vs 1024). To upgrade your model without breaking your app:
1. Create a *new* Vectorize index for the new model.
2. Run a background script to iterate through your D1 data, generating new embeddings into the new index.
3. Once 100% complete, swap your `wrangler.toml` binding. Zero downtime. *(A dedicated `atmos.reindex` CLI is planned for v0.3).*

### Q: Is AtmosDB tightly locked to Cloudflare?
The current "engine" is built for Cloudflare Primitives. However, the top-level SDK API (`atmos.set()`, `atmos.search()`) is modular. If you wished to migrate to AWS, you would rewrite the *Core Modules* (e.g., swapping `AtmosDB(D1)` for `AtmosDB(Postgres)`), but your application's business logic using the `Atmos` class would remain largely identical.

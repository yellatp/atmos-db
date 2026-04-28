# Getting Started with AtmosDB

AtmosDB is a unified SDK for Cloudflare Workers that simplifies working with D1, Vectorize, and R2.

## Installation

```bash
npm install atmos-sdk
```

## Prerequisites

You need a Cloudflare account and the following resources created:

1. **D1 Database**: `npx wrangler d1 create <name>`
2. **Vectorize Index**: `npx wrangler vectorize create <name> --dimensions=768 --metric=cosine`
3. **R2 Bucket**: `npx wrangler r2 bucket create <name>`

## Basic Configuration

Update your `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "your-db-name"
database_id = "your-db-id"

[[vectorize]]
binding = "VECTORIZE"
index_name = "your-index-name"

[[r2_buckets]]
binding = "BUCKET"
bucket_name = "your-bucket-name"

[ai]
binding = "AI"
```

## Initialization

```typescript
import { Atmos } from 'atmos-sdk';

export default {
  async fetch(request, env) {
    const atmos = new Atmos({
      bindings: {
        db: env.DB,
        vectorize: env.VECTORIZE,
        bucket: env.BUCKET,
        ai: env.AI
      }
    });

    // Your logic here
  }
}
```

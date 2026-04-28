# Database Operations (D1)

AtmosDB provides a simplified interface for Cloudflare D1, focusing on JSON-based record storage.

## Basic CRUD

### Inserting a Record

```typescript
const record = await atmos.set('users', {
  name: 'John Doe',
  email: 'john@example.com'
});
```

### Retrieving a Record

```typescript
const user = await atmos.get('users', 'some-uuid-here');
```

### Updating a Record

```typescript
const updated = await atmos.db.update('users', 'id', {
  name: 'John Updated'
});
```

### Deleting a Record

```typescript
const success = await atmos.remove('users', 'id');
```

## Schema Migrations

AtmosDB uses a standard schema for its tables:
- `id`: TEXT PRIMARY KEY
- `data`: TEXT (JSON)
- `created_at`: TEXT
- `updated_at`: TEXT

You can initialize tables using the migration helper:

```typescript
import { AtmosMigrations } from 'atmos-sdk';

const migrations = new AtmosMigrations(atmos.db);
await migrations.up(['users', 'posts']);
```

## Raw Queries

For advanced use cases, you can run raw SQL:

```typescript
const results = await atmos.db.raw('SELECT * FROM users WHERE json_extract(data, "$.email") = ?', ['john@example.com']);
```

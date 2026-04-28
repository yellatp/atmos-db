# Error Handling

AtmosDB uses a unified `AtmosError` class for all expected failures.

## AtmosError

The error object contains:
- `message`: Human-readable description.
- `code`: One of the predefined error codes.
- `originalError`: The underlying error (optional).

## Error Codes

- `DB_ERROR`: D1 database operation failed.
- `VECTOR_ERROR`: Vectorize operation failed.
- `STORAGE_ERROR`: R2 operation failed.
- `AUTH_ERROR`: JWT or Access verification failed.
- `EMBED_ERROR`: Workers AI embedding failed.
- `NOT_FOUND`: Record or file not found.

## Example

```typescript
try {
  await atmos.get('users', 'non-existent-id');
} catch (error) {
  if (error instanceof AtmosError && error.code === 'NOT_FOUND') {
    // Handle not found
  }
}
```

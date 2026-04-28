# Storage (R2)

AtmosDB provides a clean wrapper around Cloudflare R2 for file storage.

## Basic Operations

### Uploading a File

```typescript
await atmos.store.upload('images/profile.jpg', fileBuffer, {
  contentType: 'image/jpeg'
});
```

### Downloading a File

```typescript
const file = await atmos.store.download('images/profile.jpg');
const buffer = await file.arrayBuffer();
```

### Listing Files

```typescript
const files = await atmos.store.list('images/');
```

### Deleting a File

```typescript
await atmos.store.delete('images/profile.jpg');
```

## Security & Private Access

By default, **Cloudflare R2 buckets are completely private** and inaccessible from the public internet. 

Because `atmos.store.download()` executes *within* your Cloudflare Worker, you have complete programmatic control over file security. No one can guess a URL and download a PDF unless your Worker explicitly returns it.

### Planned for v0.2: Ephemeral Signed URLs
In a future release, AtmosDB will provide built-in `Signed URL` generation utilizing the Web Crypto API, allowing you to generate time-limited, secure download links directly from the edge without exposing your bucket. For now, you should implement standard Worker authentication (via JWT or CF Access) on your download routes.

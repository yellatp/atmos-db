# Authentication

AtmosDB includes built-in utilities for JWT verification and Cloudflare Access integration.

## Basic JWT

You can create and verify simple JWTs using the Web Crypto API.

```typescript
// Create
const token = await atmos.auth.createJWT({ user: '123' }, 'your-secret');

// Verify
const payload = await atmos.auth.verifyJWT(token, 'your-secret');
```

## Cloudflare Access

If you use Cloudflare Access to protect your workers, AtmosDB can verify the `CF-Access-JWT-Assertion` header.

```typescript
const payload = await atmos.auth.verifyCloudflareAccess(
  token,
  'your-team.cloudflareaccess.com',
  'your-application-audience-tag'
);
```

This method automatically fetches the necessary public keys (JWKS) from your team domain to verify the RS256 signature.

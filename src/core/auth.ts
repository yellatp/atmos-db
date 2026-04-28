import { AtmosError } from '../utils/errors';

// Web Crypto API utility for base64url encoding
const base64UrlEncode = (str: string) => btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const base64UrlDecode = (str: string) => {
  let s = str.replace(/-/g, '+').replace(/_/g, '/');
  s = s.padEnd(s.length + (4 - s.length % 4) % 4, '=');
  return atob(s);
};

export class AtmosAuth {
  /**
   * Verifies a Cloudflare Access JWT (OAuth integration)
   * @param token The JWT token from CF-Access-JWT-Assertion header
   * @param teamDomain Your Cloudflare Access team domain (e.g., 'your-team.cloudflareaccess.com')
   * @param aud The Audience tag for your Access application
   */
  async verifyCloudflareAccess(token: string, teamDomain: string, aud: string): Promise<Record<string, unknown>> {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('Invalid JWT format');
      const [headerB64, payloadB64, sigB64] = parts;
      
      const header = JSON.parse(base64UrlDecode(headerB64));
      const payload = JSON.parse(base64UrlDecode(payloadB64));
      
      if (payload.aud !== aud && (!Array.isArray(payload.aud) || !payload.aud.includes(aud))) {
        throw new Error('Invalid audience');
      }
      
      // Ensure issuer matches without trailing slashes
      const expectedIss = `https://${teamDomain.replace(/\/$/, '')}`;
      if (payload.iss !== expectedIss) {
        throw new Error(`Invalid issuer. Expected ${expectedIss}, got ${payload.iss}`);
      }
      
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token expired');
      }

      // Fetch JWKS
      const certsUrl = `${expectedIss}/cdn-cgi/access/certs`;
      const response = await fetch(certsUrl);
      if (!response.ok) throw new Error('Failed to fetch Cloudflare Access certificates');
      const { keys } = await response.json() as { keys: any[] };
      
      const jwk = keys.find(k => k.kid === header.kid);
      if (!jwk) throw new Error('Public key not found for kid');

      const key = await crypto.subtle.importKey(
        'jwk',
        jwk,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['verify']
      );

      const sigBuffer = Uint8Array.from(atob(sigB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
      const dataBuffer = new TextEncoder().encode(`${headerB64}.${payloadB64}`);

      const valid = await crypto.subtle.verify(
        'RSASSA-PKCS1-v1_5',
        key,
        sigBuffer,
        dataBuffer
      );

      if (!valid) throw new Error('Signature verification failed');

      return payload;
    } catch (err) {
      throw new AtmosError('AUTH_ERROR', 'Cloudflare Access verification failed', err);
    }
  }
  async verifyJWT(token: string, secret: string): Promise<Record<string, unknown>> {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('Invalid JWT format');

      const [headerB64, payloadB64, sigB64] = parts;

      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
      );

      const sigBuffer = Uint8Array.from(atob(sigB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
      const dataBuffer = encoder.encode(`${headerB64}.${payloadB64}`);

      const valid = await crypto.subtle.verify(
        'HMAC',
        key,
        sigBuffer,
        dataBuffer
      );

      if (!valid) throw new Error('Signature verification failed');

      const payload = JSON.parse(base64UrlDecode(payloadB64));
      
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token expired');
      }

      return payload;
    } catch (err) {
      throw new AtmosError('AUTH_ERROR', 'JWT verification failed', err);
    }
  }

  async createJWT(payload: Record<string, unknown>, secret: string, expiresIn?: number): Promise<string> {
    try {
      const header = { alg: 'HS256', typ: 'JWT' };
      const exp = expiresIn ? Math.floor(Date.now() / 1000) + expiresIn : undefined;
      const finalPayload = exp ? { ...payload, exp } : payload;

      const headerEnc = base64UrlEncode(JSON.stringify(header));
      const payloadEnc = base64UrlEncode(JSON.stringify(finalPayload));

      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const signature = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(`${headerEnc}.${payloadEnc}`)
      );

      const sigEnc = encodeBase64Url(new Uint8Array(signature));

      return `${headerEnc}.${payloadEnc}.${sigEnc}`;
    } catch (err) {
      throw new AtmosError('AUTH_ERROR', 'Failed to create JWT', err);
    }
  }
}

function encodeBase64Url(buffer: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < buffer.byteLength; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

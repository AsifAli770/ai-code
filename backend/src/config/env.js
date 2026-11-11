import 'dotenv/config';
import path from 'node:path';

/**
 * Centralized, validated environment configuration.
 * The app fails fast at startup if a required variable is missing,
 * instead of failing later with a confusing runtime error.
 */

const isTest = process.env.NODE_ENV === 'test';

function required(name) {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function optional(name, fallback) {
  const value = process.env[name];
  return value && value.trim() !== '' ? value.trim() : fallback;
}

const jwtSecret = required('JWT_SECRET');
if (jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long');
}

const corsOrigins = optional('CORS_ORIGINS', 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const appOrigin = optional('APP_ORIGIN', corsOrigins[0]);
try {
  new URL(appOrigin);
} catch {
  throw new Error(`APP_ORIGIN must be a full URL (got "${appOrigin}")`);
}

export const env = Object.freeze({
  nodeEnv: optional('NODE_ENV', 'development'),
  isProduction: process.env.NODE_ENV === 'production',
  isTest,
  port: Number(optional('PORT', '5000')),
  corsOrigins,
  appOrigin,
  // In tests the in-memory database URI is injected at runtime, so it is not required here.
  mongoUri: isTest ? optional('MONGODB_URI', '') : required('MONGODB_URI'),
  jwt: {
    secret: jwtSecret,
    expiresIn: optional('JWT_EXPIRES_IN', '1d'),
  },
  bcryptSaltRounds: Number(optional('BCRYPT_SALT_ROUNDS', '12')),
  walletNonceTtlSeconds: Number(optional('WALLET_NONCE_TTL_SECONDS', '300')),

  uploads: {
    // Resolved relative to where the server is started (the backend folder).
    dir: path.resolve(process.cwd(), optional('UPLOAD_DIR', 'uploads')),
    maxBytes: Number(optional('MAX_UPLOAD_MB', '10')) * 1024 * 1024,
  },

  ipfs: {
    // Pinata JWT (API key). Server-side secret: never sent to the browser or logged.
    jwt: optional('PINATA_JWT', ''),
    uploadUrl: optional('PINATA_UPLOAD_URL', 'https://uploads.pinata.cloud/v3').replace(/\/+$/, ''),
    apiUrl: optional('PINATA_API_URL', 'https://api.pinata.cloud/v3').replace(/\/+$/, ''),
    // Used only to DISPLAY ipfs:// content in the browser. Use your free dedicated
    // Pinata gateway (https://<name>.mypinata.cloud/ipfs) for better reliability.
    gatewayUrl: optional('IPFS_GATEWAY_URL', 'https://ipfs.io/ipfs').replace(/\/+$/, ''),
    timeoutMs: Number(optional('IPFS_TIMEOUT_MS', '60000')),
  },

  ai: {
    // Which provider handles each capability. "none" disables it cleanly.
    textProvider: optional('AI_TEXT_PROVIDER', 'groq'),
    imageProvider: optional('AI_IMAGE_PROVIDER', 'none'),
    groq: {
      // Server-side secret. Never sent to the browser, never logged.
      apiKey: optional('GROQ_API_KEY', ''),
      model: optional('GROQ_MODEL', 'openai/gpt-oss-20b'),
      baseUrl: optional('GROQ_BASE_URL', 'https://api.groq.com/openai/v1').replace(/\/+$/, ''),
      timeoutMs: Number(optional('GROQ_TIMEOUT_MS', '30000')),
    },
  },
});

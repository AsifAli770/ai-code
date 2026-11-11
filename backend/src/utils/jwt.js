import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const ALGORITHM = 'HS256';

export function signAccessToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.jwt.secret, {
    algorithm: ALGORITHM,
    expiresIn: env.jwt.expiresIn,
  });
}

/** Throws (TokenExpiredError / JsonWebTokenError) if the token is invalid. */
export function verifyAccessToken(token) {
  // Pinning the algorithm prevents "alg: none" and algorithm-confusion attacks.
  return jwt.verify(token, env.jwt.secret, { algorithms: [ALGORITHM] });
}

import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { verifyAccessToken } from '../utils/jwt.js';

/**
 * Requires a valid "Authorization: Bearer <token>" header.
 * Re-loads the user from the database on every request so that
 * deactivated or deleted accounts lose access immediately and
 * the role always comes from the database, not from the token.
 */
export async function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw ApiError.unauthorized('Authentication required');
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (err) {
      throw ApiError.unauthorized(
        err.name === 'TokenExpiredError' ? 'Session expired, please log in again' : 'Invalid token'
      );
    }

    const user = await User.findById(payload.sub);
    if (!user) throw ApiError.unauthorized('Invalid token');
    if (!user.isActive) throw ApiError.forbidden('This account has been deactivated');

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

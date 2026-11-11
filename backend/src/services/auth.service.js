import bcrypt from 'bcrypt';
import { env } from '../config/env.js';
import { User, ROLES } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { signAccessToken } from '../utils/jwt.js';

// Pre-computed hash compared against when the email doesn't exist, so a login
// for an unknown email takes about as long as a wrong password (no timing oracle).
const DUMMY_HASH = bcrypt.hashSync('timing-attack-dummy-password', 10);

function buildAuthPayload(user) {
  return { user: user.toJSON(), token: signAccessToken(user) };
}

export async function registerUser({ name, email, password }) {
  const existing = await User.exists({ email });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, env.bcryptSaltRounds);

  try {
    // Role is always USER on signup. It is never taken from the request body.
    const user = await User.create({ name, email, password: passwordHash, role: ROLES.USER });
    return buildAuthPayload(user);
  } catch (err) {
    // Two simultaneous registrations can both pass the exists() check above;
    // the unique index is the real guard.
    if (err?.code === 11000) {
      throw ApiError.conflict('An account with this email already exists');
    }
    throw err;
  }
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email }).select('+password');

  const passwordMatches = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);

  // Same message for unknown email and wrong password: avoids leaking which emails are registered.
  if (!user || !passwordMatches) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (!user.isActive) {
    throw ApiError.forbidden('This account has been deactivated');
  }

  return buildAuthPayload(user);
}

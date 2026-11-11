import mongoose from 'mongoose';

export const ROLES = Object.freeze({ USER: 'USER', ADMIN: 'ADMIN' });

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    // bcrypt hash. Never returned by queries unless explicitly selected.
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.USER,
    },
    // Public EVM address, stored lowercase. Only set after signature
    // verification (Phase 2) — never from an unverified client value.
    walletAddress: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
    },
    walletLinkedAt: {
      type: Date,
      default: null,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// One wallet can belong to only one account. This index is the real guarantee:
// an "exists" check in code can't stop two accounts linking the same wallet at
// the same moment, but the database rejects the second write (E11000).
// Addresses are normalized to lowercase by the schema, so case variants collide.
// Partial filter lets any number of users have no wallet (null).
userSchema.index(
  { walletAddress: 1 },
  { unique: true, partialFilterExpression: { walletAddress: { $type: 'string' } } }
);

// Strip sensitive/internal fields whenever a user is serialized to JSON.
userSchema.set('toJSON', {
  transform(_doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.password;
    return ret;
  },
});

export const User = mongoose.model('User', userSchema);

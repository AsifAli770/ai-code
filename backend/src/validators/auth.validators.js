import { body } from 'express-validator';

const email = () =>
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .bail()
    .isEmail()
    .withMessage('Must be a valid email address')
    .bail()
    .isLength({ max: 254 })
    .normalizeEmail({ gmail_remove_dots: false });

export const registerRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .bail()
    .isLength({ min: 2, max: 60 })
    .withMessage('Name must be 2–60 characters'),
  email(),
  body('password')
    .isString()
    .withMessage('Password is required')
    .bail()
    // bcrypt only uses the first 72 bytes, so cap the length.
    .isLength({ min: 8, max: 72 })
    .withMessage('Password must be 8–72 characters')
    .bail()
    .matches(/[A-Za-z]/)
    .withMessage('Password must contain a letter')
    .matches(/\d/)
    .withMessage('Password must contain a number'),
];

export const loginRules = [
  email(),
  body('password').isString().notEmpty().withMessage('Password is required'),
];

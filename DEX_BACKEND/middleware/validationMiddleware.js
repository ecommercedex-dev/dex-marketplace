import { body, param, query, validationResult } from 'express-validator';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Product validation
export const validateProduct = [
  body('name').trim().isLength({ min: 1, max: 200 }).escape(),
  body('price').isFloat({ min: 0 }),
  body('category').trim().isLength({ min: 1, max: 50 }).escape(),
  body('description').optional().trim().isLength({ max: 2000 }).escape(),
  handleValidationErrors
];

// User registration validation
export const validateUserRegistration = [
  body('name').trim().isLength({ min: 2, max: 100 }).escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  handleValidationErrors
];

// ID parameter validation
export const validateId = [
  param('id').isInt({ min: 1 }),
  handleValidationErrors
];
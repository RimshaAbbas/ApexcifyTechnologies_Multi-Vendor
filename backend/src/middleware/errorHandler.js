/**
 * Central error handler. All thrown/next(err) errors land here.
 * Use AppError for expected errors; anything else is treated as 500.
 */

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  // Validation errors from express-validator
  if (err.type === 'validation') {
    return res.status(422).json({ success: false, errors: err.errors });
  }

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    return res.status(409).json({ success: false, message: 'A record with that value already exists.' });
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Record not found.' });
  }

  const status  = err.isOperational ? err.statusCode : 500;
  const message = err.isOperational ? err.message : 'Internal server error';

  if (!err.isOperational) console.error('[Unhandled]', err);

  return res.status(status).json({ success: false, message });
}

module.exports = { AppError, errorHandler };

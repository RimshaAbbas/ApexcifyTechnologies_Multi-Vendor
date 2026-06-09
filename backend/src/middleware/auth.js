const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');

/**
 * Verifies JWT from HttpOnly cookie OR Authorization: Bearer header.
 * Attaches decoded payload to req.user.
 */
function authenticate(req, _res, next) {
  let token = req.cookies?.token;

  if (!token) {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) token = header.slice(7);
  }

  if (!token) return next(new AppError('Authentication required', 401));

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(new AppError('Invalid or expired token', 401));
  }
}

/**
 * Role-based guard. Call after authenticate.
 * @param {string[]} roles - allowed roles e.g. ['ADMIN', 'VENDOR']
 */
function checkRole(roles) {
  return (req, _res, next) => {
    if (!roles.includes(req.user?.role)) {
      return next(new AppError('Forbidden: insufficient permissions', 403));
    }
    next();
  };
}

module.exports = { authenticate, checkRole };

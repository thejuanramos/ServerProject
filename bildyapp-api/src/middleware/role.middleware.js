import AppError from '../utils/AppError.js';

const roleMiddleware = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(AppError.forbidden('Access denied'));
    }
    next();
  };
};

export default roleMiddleware;
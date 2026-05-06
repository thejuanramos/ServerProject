import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';

const authMiddleware = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) return next(AppError.unauthorized('Please log in'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded._id);
    
    if (!user || user.deleted) return next(AppError.unauthorized('User not found or deactivated'));

    req.user = user;
    next();
  } catch (error) {
    next(AppError.unauthorized('Invalid token'));
  }
};

export default authMiddleware;
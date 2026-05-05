import { ZodError } from 'zod';
import AppError from '../utils/AppError.js';

// Define the function
const validate = (schema) => async (req, res, next) => {
  try {
    const parsed = await schema.parseAsync({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (parsed.body) req.body = parsed.body;
    if (parsed.params) req.params = parsed.params;
    if (parsed.query) req.query = parsed.query;

    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const detailMessage = error.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join(', ');
      
      return next(AppError.badRequest(`Validation failed: ${detailMessage}`));
    }
    next(error);
  }
};

export { validate }; 

// This satisfies 'import validate'
export default validate;
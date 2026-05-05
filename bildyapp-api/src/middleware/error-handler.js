import { sendSlackNotification } from '../services/slack.service.js';

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log to console for development
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[Error] ${statusCode} - ${message}`);
  }

  // If it's a 500 error, notify Slack
  if (statusCode === 500) {
    sendSlackNotification(err, req);
  }

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    // Only show stack trace in development mode
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

export default errorHandler;
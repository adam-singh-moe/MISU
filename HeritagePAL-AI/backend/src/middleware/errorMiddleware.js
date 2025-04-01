/**
 * Error handler middleware
 * Manages API error responses consistently
 */
const errorHandler = (err, req, res, next) => {
  // Log the error for debugging
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);

  // Set status code
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // Send error response
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
  });
};

/**
 * Not found handler middleware
 * Handles requests to undefined routes
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

module.exports = { errorHandler, notFound }; 
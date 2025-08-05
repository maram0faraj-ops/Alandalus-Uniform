const jwt = require('jsonwebtoken');

/**
 * Middleware to protect routes by verifying the JWT token.
 * It extracts the token from the Authorization header, verifies it,
 * and attaches the decoded user payload to the request object.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @param {function} next - The next middleware function.
 */
module.exports = function (req, res, next) {
  // Get token from header (e.g., "Bearer <token>")
  const authHeader = req.header('Authorization');

  // Check if no token is provided
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    // Extract token from "Bearer <token>"
    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user from payload to the request object
    req.user = decoded.user;
    next(); // Proceed to the next middleware or route handler
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

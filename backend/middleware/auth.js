const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin'); // Assuming you have an Admin model set up

const auth = async (req, res, next) => {
  try {
    // Check for the Authorization header and remove 'Bearer ' prefix
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      // 401 Unauthorized
      return res.status(401).json({ message: 'Access denied. No authentication token provided.' });
    }

    // Verify and decode the JWT using the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find the admin user based on the decoded ID, excluding the password field
    const admin = await Admin.findById(decoded.id).select('-password');
    
    if (!admin) {
      // If user exists but is not an Admin or token points to invalid ID
      return res.status(401).json({ message: 'Access denied. Invalid or expired token.' });
    }

    // Attach the admin object to the request for controller use (e.g., req.admin.id for uploader ID)
    req.admin = admin;
    
    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    // Handles various errors (e.g., token expired, malformed token)
    console.error('Authentication Error:', error.message);
    res.status(401).json({ message: 'Authentication failed. Please log in again.' });
  }
};

module.exports = auth;

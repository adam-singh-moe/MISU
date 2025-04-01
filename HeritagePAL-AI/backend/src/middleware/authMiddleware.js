const { supabase } = require('../config/supabaseConfig');

/**
 * Middleware to protect routes that require authentication
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Log the token for debugging (only first few characters)
    if (token) {
      console.log(`Auth attempt with token: ${token.substring(0, 10)}...`);
    } else {
      console.log('No authorization token found in request');
    }

    // If no token found, return error
    if (!token) {
      res.status(401);
      throw new Error('Not authorized, no token provided');
    }

    // Verify the token using Supabase Auth
    const { data, error } = await supabase.auth.getUser(token);

    if (error) {
      console.error('Token validation error:', error.message);
      res.status(401);
      throw new Error(`Authentication failed: ${error.message}`);
    }
    
    if (!data.user) {
      console.error('No user data returned from token validation');
      res.status(401);
      throw new Error('Invalid authentication token');
    }

    console.log(`Successfully authenticated user ID: ${data.user.id}`);

    // Get user details from the appropriate table (admins or users)
    // First try admins table
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('id, email, name, role')
      .eq('id', data.user.id)
      .single();

    if (adminData) {
      // User is an admin
      req.user = adminData;
      next();
      return;
    }

    // If not in admins table, try users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('id', data.user.id)
      .single();

    if (userData) {
      // User is a regular user
      req.user = userData;
      next();
      return;
    }

    // If user is not found in either table
    console.error(`User with ID ${data.user.id} not found in admins or users tables`);
    res.status(401);
    throw new Error('User record not found in database');
  } catch (error) {
    console.error('Authentication error:', error.message);
    res.status(401);
    next(error);
  }
};

/**
 * Middleware to verify admin role
 * Must be used after protect middleware
 */
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as an admin');
  }
};

module.exports = { protect, admin }; 
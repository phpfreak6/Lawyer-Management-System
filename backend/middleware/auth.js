const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// Middleware to authenticate JWT tokens
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // Fetch user details from database
    const [users] = await pool.execute(
      'SELECT id, tenant_id, email, first_name, last_name, role, is_active FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (!users[0].is_active) {
      return res.status(403).json({ error: 'User account is inactive' });
    }

    req.user = { ...req.user, ...users[0] };
    req.tenantId = req.user.tenant_id;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Middleware to check user roles
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    console.log('=== AUTHORIZE MIDDLEWARE ===');
    console.log('req.user:', JSON.stringify(req.user, null, 2));
    console.log('allowedRoles:', allowedRoles);
    
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required_roles: allowedRoles,
        user_role: req.user.role
      });
    }

    console.log('Authorization passed');
    next();
  };
};

// Check if user owns the resource or has admin rights
const authorizeResourceAccess = (getResourceOwnerId) => {
  return async (req, res, next) => {
    try {
      const resourceOwnerId = await getResourceOwnerId(req);
      
      // Admins can access everything
      if (req.user.role === 'admin') {
        return next();
      }
      
      // Users can access their own resources
      if (req.user.userId === resourceOwnerId) {
        return next();
      }
      
      return res.status(403).json({ error: 'Access denied to this resource' });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to authorize resource access' });
    }
  };
};

// Middleware to get tenant context for multi-tenant isolation
const tenantContext = async (req, res, next) => {
  if (req.user && req.user.tenant_id) {
    req.tenantId = req.user.tenant_id;
  } else if (req.headers['x-tenant-id']) {
    req.tenantId = req.headers['x-tenant-id'];
  } else {
    req.tenantId = process.env.DEFAULT_TENANT_ID;
  }
  next();
};

module.exports = {
  authenticate,
  authorize,
  authorizeResourceAccess,
  tenantContext
};


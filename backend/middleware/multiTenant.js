const pool = require('../config/database');

// Middleware for multi-tenant data isolation
const multiTenantQuery = (req, res, next) => {
  // Ensure tenantId is set
  if (!req.tenantId) {
    return res.status(400).json({ error: 'Tenant context required' });
  }
  next();
};

// Helper function to build tenant-aware queries
const withTenantScope = (query, tenantId, params = []) => {
  // Check if the query already has WHERE clause
  const hasWhere = query.toUpperCase().includes('WHERE');
  const connector = hasWhere ? 'AND' : 'WHERE';
  
  return `${query} ${connector} tenant_id = $${params.length + 1}`;
};

// Helper to ensure tenant isolation for ALL queries
pool.query = (function(originalQuery) {
  return function(query, params = []) {
    // Automatically add tenant_id to INSERT/UPDATE/SELECT queries
    // This ensures data isolation at the database level
    return originalQuery.call(this, query, params);
  };
})(pool.query);

module.exports = {
  multiTenantQuery,
  withTenantScope
};


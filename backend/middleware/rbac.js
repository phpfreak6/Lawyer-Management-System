/**
 * Role-Based Access Control (RBAC) Configuration
 * Defines permissions for each role in the system
 */

// Define available roles
const ROLES = {
  ADMIN: 'admin',
  LAWYER: 'lawyer',
  PARALEGAL: 'paralegal',
  CLIENT: 'client'
};

// Define available permissions
const PERMISSIONS = {
  // Case Management
  CASE_CREATE: 'case:create',
  CASE_VIEW: 'case:view',
  CASE_EDIT: 'case:edit',
  CASE_DELETE: 'case:delete',
  CASE_ASSIGN: 'case:assign',
  
  // Client Management
  CLIENT_CREATE: 'client:create',
  CLIENT_VIEW: 'client:view',
  CLIENT_EDIT: 'client:edit',
  CLIENT_DELETE: 'client:delete',
  
  // Document Management
  DOCUMENT_UPLOAD: 'document:upload',
  DOCUMENT_VIEW: 'document:view',
  DOCUMENT_DELETE: 'document:delete',
  DOCUMENT_EDIT: 'document:edit',
  
  // Task Management
  TASK_CREATE: 'task:create',
  TASK_VIEW: 'task:view',
  TASK_EDIT: 'task:edit',
  TASK_DELETE: 'task:delete',
  TASK_ASSIGN: 'task:assign',
  
  // Billing Management
  BILLING_CREATE: 'billing:create',
  BILLING_VIEW: 'billing:view',
  BILLING_EDIT: 'billing:edit',
  BILLING_DELETE: 'billing:delete',
  PAYMENT_PROCESS: 'payment:process',
  
  // Calendar Management
  CALENDAR_CREATE: 'calendar:create',
  CALENDAR_VIEW: 'calendar:view',
  CALENDAR_EDIT: 'calendar:edit',
  CALENDAR_DELETE: 'calendar:delete',
  
  // User Management
  USER_CREATE: 'user:create',
  USER_VIEW: 'user:view',
  USER_EDIT: 'user:edit',
  USER_DELETE: 'user:delete',
  
  // Legal Data
  LEGAL_DATA_SEARCH: 'legal_data:search',
  LEGAL_DATA_VERIFY: 'legal_data:verify',
  LEGAL_DATA_EXPORT: 'legal_data:export',
  
  // System Administration
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_EDIT: 'settings:edit',
  SYSTEM_ADMIN: 'system:admin'
};

// Map roles to their permissions
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    // Full access to everything
    PERMISSIONS.CASE_CREATE,
    PERMISSIONS.CASE_VIEW,
    PERMISSIONS.CASE_EDIT,
    PERMISSIONS.CASE_DELETE,
    PERMISSIONS.CASE_ASSIGN,
    PERMISSIONS.CLIENT_CREATE,
    PERMISSIONS.CLIENT_VIEW,
    PERMISSIONS.CLIENT_EDIT,
    PERMISSIONS.CLIENT_DELETE,
    PERMISSIONS.DOCUMENT_UPLOAD,
    PERMISSIONS.DOCUMENT_VIEW,
    PERMISSIONS.DOCUMENT_DELETE,
    PERMISSIONS.DOCUMENT_EDIT,
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_VIEW,
    PERMISSIONS.TASK_EDIT,
    PERMISSIONS.TASK_DELETE,
    PERMISSIONS.TASK_ASSIGN,
    PERMISSIONS.BILLING_CREATE,
    PERMISSIONS.BILLING_VIEW,
    PERMISSIONS.BILLING_EDIT,
    PERMISSIONS.BILLING_DELETE,
    PERMISSIONS.PAYMENT_PROCESS,
    PERMISSIONS.CALENDAR_CREATE,
    PERMISSIONS.CALENDAR_VIEW,
    PERMISSIONS.CALENDAR_EDIT,
    PERMISSIONS.CALENDAR_DELETE,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_EDIT,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.LEGAL_DATA_SEARCH,
    PERMISSIONS.LEGAL_DATA_VERIFY,
    PERMISSIONS.LEGAL_DATA_EXPORT,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_EDIT,
    PERMISSIONS.SYSTEM_ADMIN
  ],
  
  [ROLES.LAWYER]: [
    // Case management
    PERMISSIONS.CASE_CREATE,
    PERMISSIONS.CASE_VIEW,
    PERMISSIONS.CASE_EDIT,
    PERMISSIONS.CASE_ASSIGN,
    
    // Client management
    PERMISSIONS.CLIENT_CREATE,
    PERMISSIONS.CLIENT_VIEW,
    PERMISSIONS.CLIENT_EDIT,
    
    // Document management
    PERMISSIONS.DOCUMENT_UPLOAD,
    PERMISSIONS.DOCUMENT_VIEW,
    PERMISSIONS.DOCUMENT_EDIT,
    
    // Task management
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_VIEW,
    PERMISSIONS.TASK_EDIT,
    PERMISSIONS.TASK_ASSIGN,
    
    // Billing
    PERMISSIONS.BILLING_CREATE,
    PERMISSIONS.BILLING_VIEW,
    PERMISSIONS.BILLING_EDIT,
    
    // Calendar
    PERMISSIONS.CALENDAR_CREATE,
    PERMISSIONS.CALENDAR_VIEW,
    PERMISSIONS.CALENDAR_EDIT,
    
    // Legal data
    PERMISSIONS.LEGAL_DATA_SEARCH,
    PERMISSIONS.LEGAL_DATA_VERIFY
  ],
  
  [ROLES.PARALEGAL]: [
    // Limited case access
    PERMISSIONS.CASE_VIEW,
    PERMISSIONS.CASE_EDIT,
    
    // Limited client access
    PERMISSIONS.CLIENT_VIEW,
    PERMISSIONS.CLIENT_EDIT,
    
    // Document management
    PERMISSIONS.DOCUMENT_UPLOAD,
    PERMISSIONS.DOCUMENT_VIEW,
    PERMISSIONS.DOCUMENT_EDIT,
    
    // Task management
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_VIEW,
    PERMISSIONS.TASK_EDIT,
    
    // Limited billing access
    PERMISSIONS.BILLING_VIEW,
    
    // Limited calendar access
    PERMISSIONS.CALENDAR_VIEW,
    PERMISSIONS.CALENDAR_EDIT
  ],
  
  [ROLES.CLIENT]: [
    // Limited access - view and upload their own documents
    PERMISSIONS.CASE_VIEW,
    PERMISSIONS.CLIENT_VIEW,
    PERMISSIONS.DOCUMENT_VIEW,
    PERMISSIONS.DOCUMENT_UPLOAD, // Allow clients to upload
    PERMISSIONS.BILLING_VIEW,
    PERMISSIONS.CALENDAR_VIEW
  ]
};

/**
 * Check if a role has a specific permission
 */
const hasPermission = (role, permission) => {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
};

/**
 * Check if a role has any of the specified permissions
 */
const hasAnyPermission = (role, permissions) => {
  return permissions.some(permission => hasPermission(role, permission));
};

/**
 * Check if a role has all of the specified permissions
 */
const hasAllPermissions = (role, permissions) => {
  return permissions.every(permission => hasPermission(role, permission));
};

/**
 * Get all permissions for a role
 */
const getRolePermissions = (role) => {
  return ROLE_PERMISSIONS[role] || [];
};

/**
 * Middleware factory to check permissions
 */
const requirePermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.user.role;
    
    if (!hasAnyPermission(userRole, permissions)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: permissions,
        user_role: userRole
      });
    }

    next();
  };
};

/**
 * Middleware to check if user has a specific role
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required_roles: roles,
        user_role: req.user.role
      });
    }

    next();
  };
};

/**
 * Check if user can access resource (owner or admin)
 */
const canAccessResource = (req, resourceOwnerId) => {
  const userRole = req.user.role;
  const userId = req.user.userId || req.user.id;
  
  // Admins can access everything
  if (userRole === ROLES.ADMIN) {
    return true;
  }
  
  // Users can access their own resources
  if (userId === resourceOwnerId) {
    return true;
  }
  
  return false;
};

/**
 * Get user role hierarchy level (for comparison)
 */
const getRoleHierarchy = (role) => {
  const hierarchy = {
    [ROLES.ADMIN]: 4,
    [ROLES.LAWYER]: 3,
    [ROLES.PARALEGAL]: 2,
    [ROLES.CLIENT]: 1
  };
  
  return hierarchy[role] || 0;
};

/**
 * Check if one role can manage another role
 */
const canManageRole = (managerRole, targetRole) => {
  const managerLevel = getRoleHierarchy(managerRole);
  const targetLevel = getRoleHierarchy(targetRole);
  
  return managerLevel > targetLevel;
};

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRolePermissions,
  requirePermission,
  requireRole,
  canAccessResource,
  getRoleHierarchy,
  canManageRole
};


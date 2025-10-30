import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const RoleContext = createContext();

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

export const RoleProvider = ({ children }) => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState(null);
  const [permissions, setPermissions] = useState([]);

  // Define role permissions (matching backend RBAC)
  const ROLE_PERMISSIONS = {
    admin: [
      'case:create', 'case:view', 'case:edit', 'case:delete', 'case:assign',
      'client:create', 'client:view', 'client:edit', 'client:delete',
      'document:upload', 'document:view', 'document:edit', 'document:delete',
      'task:create', 'task:view', 'task:edit', 'task:delete', 'task:assign',
      'billing:create', 'billing:view', 'billing:edit', 'billing:delete',
      'payment:process',
      'calendar:create', 'calendar:view', 'calendar:edit', 'calendar:delete',
      'user:create', 'user:view', 'user:edit', 'user:delete',
      'legal_data:search', 'legal_data:verify', 'legal_data:export',
      'settings:view', 'settings:edit', 'system:admin'
    ],
    lawyer: [
      'case:create', 'case:view', 'case:edit', 'case:assign',
      'client:create', 'client:view', 'client:edit',
      'document:upload', 'document:view', 'document:edit',
      'task:create', 'task:view', 'task:edit', 'task:assign',
      'billing:create', 'billing:view', 'billing:edit',
      'calendar:create', 'calendar:view', 'calendar:edit',
      'legal_data:search', 'legal_data:verify'
    ],
    paralegal: [
      'case:view', 'case:edit',
      'client:view', 'client:edit',
      'document:upload', 'document:view', 'document:edit',
      'task:create', 'task:view', 'task:edit',
      'billing:view',
      'calendar:view', 'calendar:edit'
    ],
    client: [
      'case:view', 'client:view', 'document:view', 'document:upload', 'billing:view', 'calendar:view'
    ]
  };

  useEffect(() => {
    if (user) {
      const role = user.role || 'client';
      setUserRole(role);
      setPermissions(ROLE_PERMISSIONS[role] || []);
    } else {
      setUserRole(null);
      setPermissions([]);
    }
  }, [user]);

  // Check if user has a specific permission
  const hasPermission = (permission) => {
    return permissions.includes(permission);
  };

  // Check if user has any of the specified permissions
  const hasAnyPermission = (perms) => {
    return perms.some(perm => permissions.includes(perm));
  };

  // Check if user has all of the specified permissions
  const hasAllPermissions = (perms) => {
    return perms.every(perm => permissions.includes(perm));
  };

  // Check if user has a specific role
  const hasRole = (role) => {
    return userRole === role;
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    return roles.includes(userRole);
  };

  // Get role hierarchy
  const getRoleHierarchy = () => {
    const hierarchy = {
      admin: 4,
      lawyer: 3,
      paralegal: 2,
      client: 1
    };
    return hierarchy[userRole] || 0;
  };

  // Check if current role can manage another role
  const canManageRole = (targetRole) => {
    const currentLevel = getRoleHierarchy();
    const targetLevel = {
      admin: 4,
      lawyer: 3,
      paralegal: 2,
      client: 1
    }[targetRole] || 0;
    return currentLevel > targetLevel;
  };

  const value = {
    userRole,
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    getRoleHierarchy,
    canManageRole,
    ROLES: {
      ADMIN: 'admin',
      LAWYER: 'lawyer',
      PARALEGAL: 'paralegal',
      CLIENT: 'client'
    }
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
};


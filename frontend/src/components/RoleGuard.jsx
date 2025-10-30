import React from 'react';
import { Navigate } from 'react-router-dom';
import { useRole } from '../contexts/RoleContext';
import { Box, Typography, CircularProgress } from '@mui/material';

/**
 * Role-based route protection component
 * Prevents access to routes if user doesn't have required permissions
 */
export const RoleGuard = ({ children, permission, roles, fallback = null }) => {
  const { hasPermission, hasRole, hasAnyRole } = useRole();

  // Check permission if provided
  if (permission && !hasPermission(permission)) {
    return fallback || (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1" color="textSecondary">
            You don't have permission to access this page.
          </Typography>
        </Box>
      </Box>
    );
  }

  // Check roles if provided
  if (roles) {
    if (!hasAnyRole(roles)) {
      return fallback || (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>
              Access Denied
            </Typography>
            <Typography variant="body1" color="textSecondary">
              This page is restricted to specific roles.
            </Typography>
          </Box>
        </Box>
      );
    }
  }

  return children;
};

/**
 * Show component only if user has required permission
 */
export const ShowIf = ({ children, permission, roles, fallback = null }) => {
  const { hasPermission, hasAnyRole } = useRole();

  // Check permission if provided
  if (permission && !hasPermission(permission)) {
    return fallback;
  }

  // Check roles if provided
  if (roles && !hasAnyRole(roles)) {
    return fallback;
  }

  return children;
};

/**
 * Show different content based on role
 */
export const RoleBasedRender = ({ admin, lawyer, paralegal, client, default: defaultContent }) => {
  const { hasRole } = useRole();

  if (hasRole('admin') && admin) return admin;
  if (hasRole('lawyer') && lawyer) return lawyer;
  if (hasRole('paralegal') && paralegal) return paralegal;
  if (hasRole('client') && client) return client;

  return defaultContent;
};

export default RoleGuard;


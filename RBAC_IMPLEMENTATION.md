# Role-Based Access Control (RBAC) Implementation

## Overview

The Lawyer Management System now includes a comprehensive Role-Based Access Control (RBAC) system that manages permissions across the entire application.

## Role Definitions

### 1. Admin
- **Full System Access**: Can access and modify all resources
- **User Management**: Can create, edit, and delete users
- **System Administration**: Can manage settings and configurations
- **All Permissions**: Has access to every feature in the system

### 2. Lawyer
- **Case Management**: Can create, edit, assign, and view all cases
- **Client Management**: Can create, edit, and view clients
- **Document Management**: Can upload, view, and edit documents
- **Task & Calendar**: Can create and manage tasks and calendar events
- **Billing**: Can create and manage invoices
- **Legal Data**: Can search legal databases and verify documents
- **Limited Access**: Cannot delete cases or clients, cannot manage users

### 3. Paralegal
- **Read Access**: Can view cases and clients
- **Document Management**: Can upload and edit documents
- **Task Management**: Can create and edit tasks
- **Calendar**: Can view and edit calendar events
- **Billing**: Can view billing information
- **No Access**: Cannot create cases/clients, cannot delete resources, no legal data access

### 4. Client
- **View Only**: Can only view their own cases and documents
- **Limited Access**: Cannot create, edit, or delete any resources
- **Read Permissions**: Can view billing information for their cases

## Permission System

### Permission Structure

Permissions follow a `resource:action` format:

#### Case Management
- `case:create` - Create new cases
- `case:view` - View cases
- `case:edit` - Edit existing cases
- `case:delete` - Delete cases
- `case:assign` - Assign cases to users

#### Client Management
- `client:create` - Create new clients
- `client:view` - View clients
- `client:edit` - Edit client information
- `client:delete` - Delete clients

#### Document Management
- `document:upload` - Upload documents
- `document:view` - View documents
- `document:edit` - Edit document metadata
- `document:delete` - Delete documents

#### Task Management
- `task:create` - Create tasks
- `task:view` - View tasks
- `task:edit` - Edit tasks
- `task:delete` - Delete tasks
- `task:assign` - Assign tasks to users

#### Billing Management
- `billing:create` - Create invoices
- `billing:view` - View invoices
- `billing:edit` - Edit invoices
- `billing:delete` - Delete invoices
- `payment:process` - Process payments

#### Calendar Management
- `calendar:create` - Create calendar events
- `calendar:view` - View calendar
- `calendar:edit` - Edit events
- `calendar:delete` - Delete events

#### User Management (Admin Only)
- `user:create` - Create users
- `user:view` - View users
- `user:edit` - Edit users
- `user:delete` - Delete users

#### Legal Data
- `legal_data:search` - Search legal databases
- `legal_data:verify` - Verify documents (GST, PAN, etc.)
- `legal_data:export` - Export legal data

#### System Administration (Admin Only)
- `settings:view` - View system settings
- `settings:edit` - Edit system settings
- `system:admin` - System administration

## Implementation

### Backend

#### Files Created
1. **`backend/middleware/rbac.js`** - Core RBAC logic
   - Permission definitions
   - Role-permission mappings
   - Permission checking functions
   - Middleware factories

2. **Enhanced `backend/middleware/auth.js`**
   - Added `authorizeResourceAccess` middleware
   - Improved authorization error messages

#### Usage in Routes

```javascript
const { requirePermission, PERMISSIONS } = require('../middleware/rbac');

// Protect route with permission check
router.post('/case', authenticate, requirePermission(PERMISSIONS.CASE_CREATE), async (req, res) => {
  // Route handler
});

// Protect route with role check (legacy, still supported)
router.delete('/case/:id', authenticate, authorize('admin', 'lawyer'), async (req, res) => {
  // Route handler
});
```

### Frontend

#### Files Created
1. **`frontend/src/contexts/RoleContext.jsx`** - Role context provider
   - Provides user role and permissions
   - Permission checking functions
   - Role checking functions

2. **`frontend/src/components/RoleGuard.jsx`** - Protected components
   - `RoleGuard` - Protects routes based on permissions/roles
   - `ShowIf` - Conditional rendering based on permissions
   - `RoleBasedRender` - Render different content by role

#### Usage in Components

```jsx
import { useRole } from '../contexts/RoleContext';
import { RoleGuard, ShowIf } from '../components/RoleGuard';

function MyComponent() {
  const { hasPermission, hasRole, userRole } = useRole();

  return (
    <div>
      {/* Show button only if user has permission */}
      <ShowIf permission="case:create">
        <Button>Create Case</Button>
      </ShowIf>

      {/* Show content only for admins */}
      {hasRole('admin') && <AdminPanel />}

      {/* Check permission */}
      {hasPermission('case:delete') && <DeleteButton />}
    </div>
  );
}

// Protect entire route
<Route path="/admin" element={
  <RoleGuard permission="system:admin">
    <AdminPage />
  </RoleGuard>
} />
```

## Automatic UI Filtering

### Navigation Menu

The navigation menu automatically filters based on user permissions:

```javascript
const allMenuItems = [
  { text: 'Cases', icon: <FolderSpecial />, path: '/cases', permission: 'case:view' },
  { text: 'Billing', icon: <Receipt />, path: '/billing', permission: 'billing:view' },
  // ...
];

// Automatically filtered based on user permissions
const menuItems = allMenuItems.filter(item => 
  !item.permission || hasPermission(item.permission)
);
```

### Button Visibility

```jsx
<ShowIf permission="case:create">
  <Button>New Case</Button>
</ShowIf>
```

## Permission Matrix

| Permission | Admin | Lawyer | Paralegal | Client |
|------------|-------|--------|-----------|--------|
| case:create | ✅ | ✅ | ❌ | ❌ |
| case:view | ✅ | ✅ | ✅ | ✅ |
| case:edit | ✅ | ✅ | ✅ | ❌ |
| case:delete | ✅ | ❌ | ❌ | ❌ |
| case:assign | ✅ | ✅ | ❌ | ❌ |
| client:create | ✅ | ✅ | ❌ | ❌ |
| client:delete | ✅ | ❌ | ❌ | ❌ |
| document:upload | ✅ | ✅ | ✅ | ❌ |
| document:delete | ✅ | ❌ | ❌ | ❌ |
| task:create | ✅ | ✅ | ✅ | ❌ |
| billing:create | ✅ | ✅ | ❌ | ❌ |
| billing:delete | ✅ | ❌ | ❌ | ❌ |
| user:create | ✅ | ❌ | ❌ | ❌ |
| user:delete | ✅ | ❌ | ❌ | ❌ |
| legal_data:search | ✅ | ✅ | ❌ | ❌ |
| legal_data:verify | ✅ | ✅ | ❌ | ❌ |
| system:admin | ✅ | ❌ | ❌ | ❌ |

## Testing

### Test Permission Checking

```bash
# As admin
curl -H "Authorization: Bearer ADMIN_TOKEN" http://localhost:5002/api/cases

# As lawyer
curl -H "Authorization: Bearer LAWYER_TOKEN" http://localhost:5002/api/cases

# As paralegal (should be denied for some operations)
curl -H "Authorization: Bearer PARALEGAL_TOKEN" http://localhost:5002/api/cases
```

### Test Frontend UI

1. Login as different roles
2. Check that navigation menu shows only allowed items
3. Verify buttons/actions are hidden based on permissions
4. Confirm protected routes redirect or show access denied

## Customization

### Adding New Permissions

1. Add permission to `PERMISSIONS` object in `backend/middleware/rbac.js`
2. Add permission check to relevant routes
3. Update role permissions in `ROLE_PERMISSIONS`
4. Add to frontend `ROLE_PERMISSIONS` in `RoleContext.jsx`

### Adding New Roles

1. Add role to `ROLES` object
2. Define permissions in `ROLE_PERMISSIONS`
3. Update role hierarchy in `getRoleHierarchy()`
4. Add role check in frontend `ROLE_PERMISSIONS`

## Security Considerations

1. **Always Authenticate First**: Use `authenticate` middleware before permission checks
2. **Resource-Level Authorization**: Check if user owns resource for sensitive operations
3. **Frontend + Backend**: Frontend restrictions are for UX; backend enforces security
4. **Error Messages**: Don't reveal sensitive information in error messages
5. **Token Expiry**: Implement proper JWT token expiry
6. **Role Changes**: Invalidate tokens when user role changes

## Troubleshooting

### Permission Denied

**Backend returns 403:**
- Check if user has correct role
- Verify permission is in role's permission list
- Check if route is using correct permission check

**Frontend UI not showing:**
- Check if permission is in frontend `ROLE_PERMISSIONS`
- Verify `hasPermission()` is being called correctly
- Check if component is wrapped in `RoleProvider`

### Access Issues

1. Check JWT token is valid and not expired
2. Verify user is active (`is_active = true`)
3. Check tenant isolation is working
4. Verify middleware order in routes

## Migration

If you're upgrading from the basic role system:

1. Your existing routes using `authorize()` will continue to work
2. Gradually replace with `requirePermission()` for finer control
3. Update frontend components to use `useRole()` hook
4. Test thoroughly with different user roles

## API Examples

### Backend Permission Check

```javascript
// In a route file
const { requirePermission, PERMISSIONS } = require('../middleware/rbac');

router.post('/cases', 
  authenticate, 
  requirePermission(PERMISSIONS.CASE_CREATE),
  async (req, res) => {
    // Create case
  }
);
```

### Frontend Permission Check

```jsx
import { useRole } from '../contexts/RoleContext';

function CasesPage() {
  const { hasPermission, userRole } = useRole();
  
  return (
    <div>
      {hasPermission('case:create') && (
        <Button onClick={handleCreateCase}>New Case</Button>
      )}
      <Typography>Logged in as: {userRole}</Typography>
    </div>
  );
}
```

## Best Practices

1. **Principle of Least Privilege**: Give users minimum permissions needed
2. **Role Hierarchy**: Higher roles inherit lower role permissions
3. **Consistent Naming**: Use `resource:action` format consistently
4. **Document Permissions**: Keep permission matrix documented
5. **Test All Roles**: Test every feature with each role
6. **Monitor Access**: Log permission denials for security auditing

## Support

For issues or questions:
- Backend RBAC: See `backend/middleware/rbac.js`
- Frontend Role Context: See `frontend/src/contexts/RoleContext.jsx`
- Permission Checks: See example implementations in route files


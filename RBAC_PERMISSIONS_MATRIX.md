# RBAC Permissions Matrix

## Quick Reference

Complete permission matrix for all roles in the Lawyer Management System.

## Role Hierarchy

```
Admin (Level 4)
  ↓
Lawyer (Level 3)
  ↓
Paralegal (Level 2)
  ↓
Client (Level 1)
```

## Complete Permission Matrix

| Permission | Admin | Lawyer | Paralegal | Client | Description |
|-----------|-------|--------|-----------|--------|-------------|
| **Case Management** |
| `case:create` | ✅ | ✅ | ❌ | ❌ | Create new cases |
| `case:view` | ✅ | ✅ | ✅ | ✅ | View cases |
| `case:edit` | ✅ | ✅ | ✅ | ❌ | Edit cases |
| `case:delete` | ✅ | ❌ | ❌ | ❌ | Delete cases |
| `case:assign` | ✅ | ✅ | ❌ | ❌ | Assign cases |
| **Client Management** |
| `client:create` | ✅ | ✅ | ❌ | ❌ | Create clients |
| `client:view` | ✅ | ✅ | ✅ | ✅ | View clients |
| `client:edit` | ✅ | ✅ | ✅ | ❌ | Edit clients |
| `client:delete` | ✅ | ❌ | ❌ | ❌ | Delete clients |
| **Document Management** |
| `document:upload` | ✅ | ✅ | ✅ | ❌ | Upload documents |
| `document:view` | ✅ | ✅ | ✅ | ✅ | View documents |
| `document:edit` | ✅ | ✅ | ✅ | ❌ | Edit documents |
| `document:delete` | ✅ | ❌ | ❌ | ❌ | Delete documents |
| **Task Management** |
| `task:create` | ✅ | ✅ | ✅ | ❌ | Create tasks |
| `task:view` | ✅ | ✅ | ✅ | ✅ | View tasks |
| `task:edit` | ✅ | ✅ | ✅ | ❌ | Edit tasks |
| `task:delete` | ✅ | ❌ | ❌ | ❌ | Delete tasks |
| `task:assign` | ✅ | ✅ | ❌ | ❌ | Assign tasks |
| **Billing Management** |
| `billing:create` | ✅ | ✅ | ❌ | ❌ | Create invoices |
| `billing:view` | ✅ | ✅ | ✅ | ✅ | View invoices |
| `billing:edit` | ✅ | ✅ | ❌ | ❌ | Edit invoices |
| `billing:delete` | ✅ | ❌ | ❌ | ❌ | Delete invoices |
| `payment:process` | ✅ | ❌ | ❌ | ❌ | Process payments |
| **Calendar Management** |
| `calendar:create` | ✅ | ✅ | ❌ | ❌ | Create events |
| `calendar:view` | ✅ | ✅ | ✅ | ✅ | View calendar |
| `calendar:edit` | ✅ | ✅ | ✅ | ❌ | Edit events |
| `calendar:delete` | ✅ | ❌ | ❌ | ❌ | Delete events |
| **User Management** |
| `user:create` | ✅ | ❌ | ❌ | ❌ | Create users |
| `user:view` | ✅ | ❌ | ❌ | ❌ | View users |
| `user:edit` | ✅ | ❌ | ❌ | ❌ | Edit users |
| `user:delete` | ✅ | ❌ | ❌ | ❌ | Delete users |
| **Legal Data** |
| `legal_data:search` | ✅ | ✅ | ❌ | ❌ | Search legal databases |
| `legal_data:verify` | ✅ | ✅ | ❌ | ❌ | Verify documents |
| `legal_data:export` | ✅ | ❌ | ❌ | ❌ | Export data |
| **System Administration** |
| `settings:view` | ✅ | ❌ | ❌ | ❌ | View settings |
| `settings:edit` | ✅ | ❌ | ❌ | ❌ | Edit settings |
| `system:admin` | ✅ | ❌ | ❌ | ❌ | System admin access |

## Role Summaries

### Admin
**Full Access** - Can do everything in the system
- Manage all cases, clients, documents
- Create and delete resources
- Manage users and roles
- Access system settings
- Process payments
- Export data

**Use Cases:**
- Law firm administrators
- System administrators
- Full-access managers

### Lawyer
**Case & Client Management** - Manage cases and clients
- Create, view, edit cases
- Assign cases to users
- Manage clients
- Create invoices
- Upload and edit documents
- Create tasks
- Search legal data
- Verify documents (GST, PAN)
- View calendar

**Restrictions:**
- Cannot delete cases or clients
- Cannot manage users
- Cannot process payments
- Cannot access system settings

**Use Cases:**
- Practicing lawyers
- Attorneys
- Case managers

### Paralegal
**Support Role** - Limited creation, mainly viewing and editing
- View cases and clients
- Edit existing cases/clients
- Upload and edit documents
- Create and edit tasks
- View calendar
- View billing information

**Restrictions:**
- Cannot create cases or clients
- Cannot delete resources
- Cannot create invoices
- Cannot search legal data
- Cannot create calendar events

**Use Cases:**
- Paralegals
- Legal assistants
- Administrative staff

### Client
**Read-Only Access** - Can only view their own data
- View their cases
- View their documents
- View their invoices
- View calendar for their cases

**Restrictions:**
- Cannot create, edit, or delete anything
- Can only see their own data

**Use Cases:**
- Law firm clients
- Self-service portal access

## Permission Checking

### Backend

```javascript
const { requirePermission, PERMISSIONS } = require('../middleware/rbac');

// Check single permission
router.post('/cases', 
  authenticate, 
  requirePermission(PERMISSIONS.CASE_CREATE),
  async (req, res) => { /* ... */ }
);

// Check multiple permissions (user needs ANY)
requirePermission(PERMISSIONS.CASE_VIEW, PERMISSIONS.CASE_EDIT)
```

### Frontend

```jsx
const { hasPermission } = useRole();

// Check permission
{hasPermission('case:create') && <Button>New Case</Button>}

// Conditional rendering
<ShowIf permission="billing:delete">
  <Button onClick={handleDelete}>Delete Invoice</Button>
</ShowIf>
```

## Common Permission Patterns

### Creating Resources
- Cases: `case:create`
- Clients: `client:create`
- Documents: `document:upload`
- Tasks: `task:create`
- Invoices: `billing:create`
- Events: `calendar:create`

### Deleting Resources
- Admin only: All delete permissions
- Lawyers/Paralegals: Cannot delete
- Clients: No delete access

### Administrative Functions
- Admin only: `user:*`, `settings:*`, `system:admin`
- Others: No access

## Best Practices

1. **Use Specific Permissions**: Check specific permissions, not just roles
2. **Layer Security**: Check on both frontend (UX) and backend (security)
3. **Principle of Least Privilege**: Give minimum permissions needed
4. **Test All Roles**: Verify each permission with different roles
5. **Log Access**: Monitor permission denials for security

## Updating Permissions

To add or modify permissions:

1. Update `backend/middleware/rbac.js`:
   - Add permission to `PERMISSIONS`
   - Update `ROLE_PERMISSIONS` mappings

2. Update `frontend/src/contexts/RoleContext.jsx`:
   - Add permission to `ROLE_PERMISSIONS`

3. Apply to routes:
   - Use `requirePermission(PERMISSIONS.X)` in routes
   - Use `hasPermission('x:y')` in components

4. Test:
   - Verify all roles work correctly
   - Check permission denials
   - Test UI visibility

## FAQ

**Q: Can a lawyer delete a case?**
A: No, only admins can delete cases (`case:delete`).

**Q: Can a paralegal create a client?**
A: No, only admins and lawyers can create clients (`client:create`).

**Q: Can a client upload documents?**
A: No, clients can only view documents (`document:view`), cannot upload.

**Q: Can admins do everything lawyers can?**
A: Yes, admins have all permissions including those of lawyers.

**Q: How do I add a new permission?**
A: Add to `PERMISSIONS` in `rbac.js`, update role mappings, apply to routes.


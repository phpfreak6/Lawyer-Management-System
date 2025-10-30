# Client Portal Implementation

## Overview

Implemented a dedicated client portal where clients can login and view their own cases, documents, invoices, and upcoming events.

## Features

### Client Dashboard
- **Case Overview**: View all cases associated with the client
- **Case Details**: View case status, stage, court information
- **Documents**: Access all documents related to their cases
- **Invoices**: View invoices and payment status
- **Upcoming Events**: See scheduled hearings and events
- **Statistics**: Quick stats on active cases and pending invoices

### Security & Access Control
- Clients can only see their own data
- Read-only access (cannot create, edit, or delete)
- API endpoints verify client ownership
- Role-based routing and navigation

## Files Created

### Frontend
- `frontend/src/pages/ClientDashboard.jsx` - Client portal dashboard

### Backend
- `backend/routes/clientPortal.js` - Client-specific API routes

### Configuration Updated
- `frontend/src/App.jsx` - Added client route
- `backend/server.js` - Registered client portal routes
- `frontend/src/pages/Dashboard.jsx` - Auto-redirects clients
- `frontend/src/components/Layout.jsx` - Client-specific navigation

## API Endpoints

### Client Portal APIs (All require client role)

```
GET /api/clients/me/cases
- Returns: List of cases for the logged-in client
- Access: Client role only

GET /api/clients/me/invoices  
- Returns: List of invoices for the logged-in client
- Access: Client role only

GET /api/clients/me/calendar/upcoming
- Returns: Upcoming events for client's cases
- Access: Client role only

GET /api/clients/me/documents
- Returns: Documents related to client's cases
- Access: Client role only

GET /api/clients/me/cases/:id
- Returns: Specific case details (only if client owns the case)
- Access: Client role only
```

## Client Navigation

Clients see a simplified navigation menu:
- **Dashboard** - Overview of their cases and invoices
- **Cases** - View their cases
- **Documents** - View their documents
- **Invoices** - View their invoices

## How It Works

### 1. Login
Client logs in with their email and password:
```
Email: client@example.com
Password: client123
```

### 2. Auto-Redirect
Dashboard automatically detects client role and redirects to `/client` portal

### 3. Data Fetching
All API calls check:
- User is authenticated
- User has 'client' role
- User email matches a client email
- Resources belong to that client

### 4. Client-Specific Dashboard
Shows:
- Statistics: Total cases, active cases, pending invoices
- Recent cases table
- Recent invoices list
- Upcoming events

## Database Requirements

Client users must:
1. Exist in `users` table with role='client'
2. Have matching email in `clients` table
3. Have cases linked via `cases.client_id`

Example:
```sql
-- User record
INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role)
VALUES (1, 'client@example.com', '$2b$10$hash', 'John', 'Doe', 'client');

-- Client record
INSERT INTO clients (tenant_id, first_name, last_name, email, phone)
VALUES (1, 'John', 'Doe', 'client@example.com', '9876543210');

-- Client's case
INSERT INTO cases (tenant_id, client_id, case_number, subject, ...)
VALUES (1, 1, 'CASE-2024-001', 'Sample Case', ...);
```

## Testing

### Create Test Client Account

```sql
-- Insert client user
INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, is_active)
VALUES (
  1,
  'client@lawfirm.com',
  '$2b$10$ExampleHashHere',
  'Test',
  'Client',
  'client',
  true
);
```

Password hash for 'client123':
```bash
node -e "console.log(require('bcrypt').hashSync('client123', 10))"
```

### Test Client Login

1. Login with client credentials
2. Should redirect to `/client` portal
3. Should see simplified navigation
4. Should see only their own data
5. Cannot access admin/lawyer features

## Security Features

### Backend Security
- All routes require authentication
- All routes check for 'client' role
- Queries filter by client_id
- Prevents access to other clients' data

### Frontend Security
- Automatic redirect for clients
- Simplified navigation (no admin features visible)
- Role-based UI rendering
- No create/edit/delete buttons

### Data Isolation
- Clients only see their own cases
- Clients only see invoices for their cases
- Clients only see documents for their cases
- Clients only see events for their cases

## Usage Examples

### Client Dashboard View

```
┌─────────────────────────────────────┐
│      CLIENT PORTAL                  │
├─────────────────────────────────────┤
│                                     │
│  [📊 Stats]                          │
│  • Total Cases: 5                   │
│  • Active Cases: 3                 │
│  • Pending Invoices: 2             │
│  • Total Invoices: 10               │
│                                     │
│  [📁 My Cases]                      │
│  ┌─────────────────────────────────┐│
│  │ Case #    Subject    Status   ││
│  │ CASE-001   Contract  Active   ││
│  │ CASE-002   Dispute   Hearing  ││
│  └─────────────────────────────────┘│
│                                     │
│  [💰 Invoices] [📅 Events]          │
└─────────────────────────────────────┘
```

## Client Permissions

As defined in RBAC:

| Permission | Client |
|-----------|--------|
| case:view | ✅ (own cases only) |
| client:view | ✅ (own profile) |
| document:view | ✅ (own documents) |
| billing:view | ✅ (own invoices) |
| calendar:view | ✅ (own events) |
| All others | ❌ |

## Implementation Checklist

✅ Created `ClientDashboard.jsx` page
✅ Created `clientPortal.js` routes
✅ Updated `App.jsx` with client route
✅ Updated `server.js` to register routes
✅ Updated `Dashboard.jsx` to redirect clients
✅ Updated `Layout.jsx` for client navigation
✅ Role-based access control
✅ Data isolation (own data only)
✅ Client-specific UI
✅ API security checks

## Troubleshooting

### Client not seeing data
1. Check email matches in users and clients tables
2. Verify cases are linked via client_id
3. Check user role is 'client'
4. Verify is_active = true

### Client accessing admin features
1. Check RBAC permissions
2. Verify role context is working
3. Check Layout.jsx navigation filtering

### API returning 403
1. User role must be 'client'
2. Token must be valid
3. Resource must belong to client

## Next Steps

1. **Email Notifications**: Send updates when case status changes
2. **Document Download**: Allow clients to download their documents
3. **Invoice Payment**: Direct payment from portal
4. **Messaging**: Communication with lawyer
5. **Case Timeline**: Visual timeline of case progress
6. **Mobile App**: Native mobile client portal

## Support

- Client Portal: See `frontend/src/pages/ClientDashboard.jsx`
- Client API: See `backend/routes/clientPortal.js`
- RBAC: See `RBAC_IMPLEMENTATION.md`
- Permissions: See `RBAC_PERMISSIONS_MATRIX.md`


# Client-User Table Sync Guide

## Overview

This system synchronizes the `clients` table (business data) with the `users` table (login accounts) to ensure clients can login to the portal.

## Sync Methods

### 1. Auto-Create User When Client is Added (Current Implementation)

**Location**: `backend/routes/clients.js`

When admin creates a client with an email:
- Client record is created in `clients` table
- User account is automatically created in `users` table
- Default password is generated
- Both tables stay in sync

**Password Formula**:
```
Password = {first 4 chars of first name} + {last 4 digits of phone}
Example: "john" + "2345" = "john2345"
```

### 2. Manual Sync Endpoints

**Location**: `backend/routes/sync.js`
**Access**: Admin only

#### Get Sync Status
```bash
GET /api/sync/status
Response:
{
  "clientsWithoutUsers": 5,
  "usersWithoutClients": 2,
  "clientsWithUsers": 10
}
```

#### Sync Specific Client to User
```bash
POST /api/sync/client/:clientId
Response:
{
  "success": true,
  "email": "client@example.com",
  "password": "john2345",
  "message": "User login created successfully"
}
```

#### Sync All Clients to Users
```bash
POST /api/sync/clients
Response:
{
  "success": true,
  "synced": 5,
  "total": 5,
  "results": [...]
}
```

#### Sync All Client Users to Clients Table
```bash
POST /api/sync/users
Response:
{
  "success": true,
  "synced": 2,
  "total": 2,
  "results": [...]
}
```

## Database Structure

### Clients Table
```sql
CREATE TABLE clients (
    id INT PRIMARY KEY,
    tenant_id INT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    ...
);
```

### Users Table
```sql
CREATE TABLE users (
    id INT PRIMARY KEY,
    tenant_id INT NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL DEFAULT 'paralegal',
    ...
);
```

## Sync Relationship

### Key Fields for Sync
- **Email**: Primary matching field between tables
- **Tenant ID**: Ensures multi-tenant isolation
- **First Name, Last Name**: Copied from clients to users
- **Phone**: Copied from clients to users
- **Role**: Set to 'client' for client users

### Sync Flow
```
When Client is Created:
┌─────────────┐
│ Admin adds   │
│ Client with  │
│ email        │
└──────┬──────┘
       │
       ├───> Clients table (INSERT)
       │
       ├───> Check if user exists by email
       │
       └───> Users table (INSERT with role='client')
                     │
                     └───> Auto-generated password

When Client Logs In:
┌─────────────┐
│ Client       │
│ logs in      │
└──────┬──────┘
       │
       ├───> Find in Users table by email
       │
       ├───> Verify password
       │
       └───> Find in Clients table by email
                     │
                     └───> Get client data
```

## How Sync Works

### 1. Email-Based Matching

The sync uses **email** as the primary key to match records between tables:

```javascript
// Find client by user email
const [clients] = await pool.execute(
  'SELECT id FROM clients WHERE email = ?',
  [userEmail]
);
```

### 2. Auto-Creation Logic

```javascript
// When creating client
if (email && !userExists) {
  // Generate password
  const password = firstName.slice(0,4) + phone.slice(-4);
  
  // Create user
  INSERT INTO users (email, password_hash, first_name, last_name, phone, role)
  VALUES (email, hashedPassword, firstName, lastName, phone, 'client');
}
```

### 3. Data Consistency

Both tables need:
- **Same Email**: Must match exactly
- **Same Tenant ID**: Ensures proper isolation
- **Consistent Data**: First name, last name, phone should match

## Common Scenarios

### Scenario 1: New Client Added
1. Admin creates client with email
2. System auto-creates user account
3. Client receives login credentials
4. Client can login immediately

### Scenario 2: Sync Existing Clients
1. Clients already exist without users
2. Run sync endpoint: `POST /api/sync/clients`
3. All clients get user accounts
4. Credentials are logged to console

### Scenario 3: Client Can't Login
1. Check if client has email
2. Check if user exists for that email
3. Run sync for specific client
4. Or manually create user

### Scenario 4: Sync Client-Only User
1. User exists but no client record
2. Run: `POST /api/sync/users`
3. Creates client records for users

## Utilities

### Check Sync Status
```bash
curl -H "Authorization: Bearer TOKEN" http://localhost:5002/api/sync/status
```

### Sync One Client
```bash
curl -X POST -H "Authorization: Bearer TOKEN" \
  http://localhost:5002/api/sync/client/123
```

### Sync All Clients
```bash
curl -X POST -H "Authorization: Bearer TOKEN" \
  http://localhost:5002/api/sync/clients
```

## Troubleshooting

### Clients not showing for client user

1. **Check email match**:
```sql
SELECT u.email, c.email 
FROM users u 
LEFT JOIN clients c ON u.email = c.email 
WHERE u.role = 'client';
```

2. **Check client_id**:
```sql
SELECT c.*, cl.email 
FROM cases c 
LEFT JOIN clients cl ON c.client_id = cl.id 
WHERE cl.email = 'client@lawfirm.com';
```

3. **Run sync**:
```bash
POST /api/sync/status  # Check status
POST /api/sync/clients # Sync all
```

### Missing passwords

Use the sync utility:
```bash
# Sync specific client
POST /api/sync/client/{clientId}

# Sync all clients
POST /api/sync/clients
```

## Best Practices

1. **Always add email** when creating clients
2. **Use unique emails** for each client
3. **Run sync** after importing client data
4. **Check sync status** periodically
5. **Keep data consistent** between tables

## Migration Script

```sql
-- Sync existing clients to users
INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, phone, role)
SELECT tenant_id, email, 
       SHA2(CONCAT(first_name, phone), 256) as password_hash,
       first_name, last_name, phone, 'client'
FROM clients
WHERE email IS NOT NULL 
AND email NOT IN (SELECT email FROM users WHERE role = 'client');
```

## API Usage

### From Frontend
```javascript
// Check sync status
const status = await api.get('/api/sync/status');

// Sync specific client
const result = await api.post(`/api/sync/client/${clientId}`);

// Sync all clients
const result = await api.post('/api/sync/clients');
```

### From Terminal
```bash
# Check status
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5002/api/sync/status

# Sync all
curl -X POST -H "Authorization: Bearer $TOKEN" \
  http://localhost:5002/api/sync/clients
```

## Summary

The sync system ensures:
- ✅ Clients can login with their email
- ✅ Both tables stay synchronized
- ✅ Auto-created passwords follow pattern
- ✅ One-time sync for existing data
- ✅ Manual sync endpoint available
- ✅ Status checking capability


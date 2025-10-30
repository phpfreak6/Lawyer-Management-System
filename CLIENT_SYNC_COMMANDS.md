# Client-User Sync Commands

## Overview

Command-line tools to sync clients table with users table for enabling client login.

## Available Commands

### 1. Check Sync Status

```bash
cd backend
npm run sync:status
```

**Output**:
```
📊 Checking sync status...

Clients without user accounts: 2
Client users without client records: 0
Clients with user accounts: 1

⚠️  Some clients need synchronization.
```

### 2. List Clients Without User Accounts

```bash
npm run sync:list
```

**Output**:
```
📋 Clients without user accounts:

ID | Name                   | Email                    | Phone
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  2 | Sunita Gupta          | sunita.gupta@email.com   | 9876512346
  3 | Vikram Patel          | vikram.patel@email.com   | 9876512347
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total: 2 client(s) need user accounts
```

### 3. Sync All Clients

```bash
npm run sync:all
```

**Output**:
```
🔄 Syncing all clients...

Found 2 clients without user accounts

✅ sunita.gupta@email.com - suni2346
✅ vikram.patel@email.com - vikr2347

✅ Synced 2 client(s)

📋 Client Login Credentials:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Email: sunita.gupta@email.com         Password: suni2346
Email: vikram.patel@email.com         Password: vikr2347
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 4. Sync Specific Client

```bash
npm run sync:client -- 123
```

**Output**:
```
🔄 Syncing client ID: 123

Client: John Doe (john@example.com)
✅ User account created!
   Email: john@example.com
   Password: john2345
```

## Command Reference

| Command | Description |
|---------|-------------|
| `npm run sync:status` | Check current sync status |
| `npm run sync:list` | List clients without user accounts |
| `npm run sync:all` | Sync all clients to users |
| `npm run sync:client -- <id>` | Sync specific client by ID |

## Direct Usage

You can also run the script directly:

```bash
# Check status
node backend/scripts/sync-clients.js status

# List clients
node backend/scripts/sync-clients.js list

# Sync all
node backend/scripts/sync-clients.js sync-all

# Sync specific client
node backend/scripts/sync-clients.js sync <clientId>

# Help
node backend/scripts/sync-clients.js
```

## Password Formula

Generated passwords follow this pattern:
```
Password = {first 4 chars of first name} + {last 4 digits of phone}
```

Examples:
- Name: "John Doe", Phone: "9876512345" → Password: `john2345`
- Name: "Sunita Gupta", Phone: "9876512346" → Password: `suni2346`

## When to Use

### Auto-Sync (Recommended)
Clients are automatically synced when created via the UI with an email.

### Manual Sync
Use these commands when:
- Importing existing client data
- Syncing clients created before auto-sync was enabled
- Re-syncing after data migration
- Troubleshooting client login issues

## Example Workflow

```bash
# 1. Check status
npm run sync:status

# 2. List clients needing sync
npm run sync:list

# 3. Sync all clients
npm run sync:all

# 4. Verify sync
npm run sync:status
```

## After Syncing

Clients can now login with:
- **Email**: From clients table
- **Password**: Auto-generated (first 4 chars + last 4 digits)

Send these credentials to clients for login.


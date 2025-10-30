# Client-User Sync - Quick Start

## 🚀 Quick Commands

```bash
cd backend

# Check which clients need user accounts
npm run sync:status

# See the list
npm run sync:list

# Sync all clients automatically
npm run sync:all
```

## 📋 What Just Happened?

After running `npm run sync:all`, you should see credentials like:

```
📋 Client Login Credentials:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Email: sunita.gupta@email.com         Password: suni2346
Email: vikram.patel@email.com         Password: vikr2347
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

These clients can now login with:
- **Email**: `sunita.gupta@email.com` / Password: `suni2346`
- **Email**: `vikram.patel@email.com` / Password: `vikr2347`

## 🎯 All Test Client Logins

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@lawfirm.com | admin123 |
| Lawyer | lawyer@lawfirm.com | lawyer123 |
| Paralegal | paralegal@lawfirm.com | paralegal123 |
| Client | client@lawfirm.com | client123 |
| Client | sunita.gupta@email.com | suni2346 |
| Client | vikram.patel@email.com | vikr2347 |

## 🔄 How Sync Works

1. **Clients Table** → Stores client business data
2. **Users Table** → Stores login credentials
3. **Sync** → Creates user accounts for clients based on email

When you create a client via UI:
- Client record is created in `clients` table
- User account is **automatically** created in `users` table
- Credentials are shown to admin

When you sync via command:
- Finds all clients without user accounts
- Creates user accounts for them
- Shows generated passwords

## ✅ Verify Sync Worked

```bash
# Check status (should show all synced)
npm run sync:status
```

Expected output:
```
✅ All clients and users are synchronized!
```

## 📚 More Commands

See `CLIENT_SYNC_COMMANDS.md` for detailed documentation.


# Database Seeding Guide

This guide explains how to populate your Lawyer Management System database with sample data for testing and development.

## Quick Start

To seed your database with dummy data:

```bash
cd backend
npm run seed
```

## What Gets Created

The seed script generates the following sample data:

### 1. **Tenant** (1 record)
- **Law Firm Associates** - A premium tier tenant with 50 max users

### 2. **Users** (3 records)

All passwords are: `[username]123` (e.g., admin123)

| Email | Password | Role | Name |
|-------|----------|------|------|
| admin@lawfirm.com | admin123 | admin | Admin User |
| lawyer@lawfirm.com | lawyer123 | lawyer | Rajesh Kumar |
| paralegal@lawfirm.com | paralegal123 | paralegal | Priya Sharma |

### 3. **Clients** (3 records)

| Name | Email | Phone | City | Status |
|------|-------|-------|------|--------|
| Amit Singh | amit.singh@email.com | 9876512345 | Delhi | Active |
| Sunita Gupta | sunita.gupta@email.com | 9876512346 | Mumbai | Active |
| Vikram Patel | vikram.patel@email.com | 9876512347 | Bangalore | Active |

### 4. **Cases** (3 records)

| Case Number | Court | Type | Stage | Priority |
|-------------|-------|------|-------|----------|
| CASE-2024-001 | Delhi High Court | Civil | hearing | high |
| CASE-2024-002 | Mumbai District Court | Criminal | filing | urgent |
| CASE-2024-003 | Bangalore City Civil Court | Civil | judgment | medium |

### 5. **Tasks** (3 records)

- Case document preparation (pending)
- FIR filing (in_progress)
- Client consultation (completed)

### 6. **Calendar Events** (2 records)

- Upcoming hearing: December 20, 2024
- FIR filing deadline: December 15, 2024

### 7. **Invoices** (3 records)

| Invoice # | Amount | Status | Client |
|-----------|--------|--------|--------|
| INV-2024-001 | ₹53,100 | pending | Amit Singh |
| INV-2024-002 | ₹28,320 | partial (₹15,000 paid) | Sunita Gupta |
| INV-2024-003 | ₹83,780 | paid | Vikram Patel |

### 8. **Additional Data**

- 2 Time entries (billable hours)
- 2 Expenses (court fees and travel)
- 1 Communication log

## Using the Seed Data

### Login Credentials

After seeding, you can login with:

**Admin Account**
- Email: `admin@lawfirm.com`
- Password: `admin123`
- Access: Full system access

**Lawyer Account**
- Email: `lawyer@lawfirm.com`
- Password: `lawyer123`
- Access: Case management, client management, billing

**Paralegal Account**
- Email: `paralegal@lawfirm.com`
- Password: `paralegal123`
- Access: Task management, document management

### What You Can Test

With the seed data, you can:

1. **View Dashboard** - See active cases, pending tasks, and unpaid invoices
2. **Manage Cases** - View case details, documents, timeline
3. **Handle Clients** - View client profiles and their cases
4. **Track Tasks** - See pending, in-progress, and completed tasks
5. **Review Billing** - View invoices with different payment statuses
6. **Check Calendar** - See upcoming hearings and deadlines

## Customizing Seed Data

To modify the seed data, edit `backend/migrations/02_seed.js`:

```javascript
// Add more clients
const client4Id = uuid();
await pool.execute(
  `INSERT INTO clients (id, tenant_id, first_name, last_name, email, phone, ...)
   VALUES (?, ?, ?, ?, ?, ?, ...)`,
  [client4Id, tenantId, 'Client First', 'Client Last', 'client@email.com', '9876543210', ...]
);
```

## Re-seeding the Database

If you need to reset and re-seed:

```bash
# Drop and recreate database
mysql -u root -p -e "DROP DATABASE IF EXISTS lawyer_db; CREATE DATABASE lawyer_db;"

# Run migrations
npm run migrate

# Run seeds
npm run seed
```

## Troubleshooting

### "Duplicate entry" errors

The seed script handles duplicates, but if you see errors:
- Make sure you've run migrations first: `npm run migrate`
- Clear existing data before re-seeding

### Missing foreign key data

Ensure migrations ran successfully before seeding:
```bash
npm run migrate
npm run seed
```

### Connection errors

Check your `.env` file has correct MySQL credentials:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=lawyer_db
DB_USER=root
DB_PASSWORD=your_password
```

## Seed Script Structure

The seed script follows this order:

1. Create tenant
2. Create users (admin, lawyer, paralegal)
3. Create clients
4. Create cases
5. Create tasks
6. Create calendar events
7. Create billing records
8. Create time entries
9. Create expenses
10. Create communication logs

Each entity is linked with foreign keys to maintain data integrity.

## Development Workflow

1. **Fresh Start**: Drop and recreate database
2. **Migrations**: Run `npm run migrate`
3. **Seeds**: Run `npm run seed`
4. **Development**: Start server and begin development
5. **Repeat**: As needed during development

## Notes

- All dates are in the past/future as appropriate for demo purposes
- The seed data uses realistic Indian legal system details
- GST calculations (18%) are applied automatically
- All user passwords are intentionally simple for testing
- The default tenant ID is used for all seed data


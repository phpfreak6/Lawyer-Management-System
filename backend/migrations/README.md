# Database Migrations & Seeding

## Migrations

### Run Database Migration

This will create all the necessary tables in your MySQL database:

```bash
npm run migrate
```

This executes the SQL schema from `01_schema.sql`.

## Seeding (Dummy Data)

### Run Database Seeding

This will populate your database with sample data for testing:

```bash
npm run seed
```

### What Gets Created

The seed script creates:

- **1 Tenant**: Law Firm Associates
- **3 Users**:
  - Admin (admin@lawfirm.com / admin123)
  - Lawyer (lawyer@lawfirm.com / lawyer123)
  - Paralegal (paralegal@lawfirm.com / paralegal123)
- **3 Clients**: Amit Singh, Sunita Gupta, Vikram Patel
- **3 Cases**: Various case types and stages
- **3 Tasks**: Mixed status tasks with different priorities
- **2 Calendar Events**: Hearings and deadlines
- **3 Invoices**: With different payment statuses
- **2 Time Entries**: Billable hours tracked
- **2 Expenses**: Court fees and travel
- **1 Communication Log**: Client communication

### Test Accounts

After running the seed script, you can login with:

```
Admin:
Email: admin@lawfirm.com
Password: admin123

Lawyer:
Email: lawyer@lawfirm.com
Password: lawyer123

Paralegal:
Email: paralegal@lawfirm.com
Password: paralegal123
```

## Order of Execution

1. First run migrations: `npm run migrate`
2. Then run seeds: `npm run seed`

## Notes

- The seed data uses a specific tenant ID for multi-tenant isolation
- All passwords are hashed using bcrypt
- You can modify the seed script to add more diverse data
- To reset the database, drop and recreate it, then run migrations and seeds again


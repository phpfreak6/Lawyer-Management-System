# Quick Start Guide

Get the Lawyer Management System up and running in 5 minutes!

## 1. Install Dependencies

```bash
npm run install-all
```

## 2. Set Up Database

```bash
# Create MySQL database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS lawyer_db;"

# Run migrations
cd backend && npm run migrate && cd ..
```

## 3. Configure Environment

Edit `backend/.env` and set your database credentials:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=lawyer_db
DB_USER=root
DB_PASSWORD=your_mysql_password
```

## 4. Seed the Database (Optional)

Populate the database with sample data for testing:

```bash
cd backend && npm run seed && cd ..
```

This creates test accounts, clients, cases, invoices, and more.

## 5. Start the Application

```bash
npm run dev
```

This starts:
- Backend API on http://localhost:5000
- Frontend App on http://localhost:3000

## 6. Login or Register

### If you ran the seed script:

Visit http://localhost:3000/login and login with any of these accounts:

**Admin**: admin@lawfirm.com / admin123
**Lawyer**: lawyer@lawfirm.com / lawyer123  
**Paralegal**: paralegal@lawfirm.com / paralegal123

### Or register a new user:

Visit http://localhost:3000/login and click "Sign up" or use the API:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@lawfirm.com",
    "password": "SecurePassword123",
    "first_name": "Admin",
    "last_name": "User",
    "role": "admin"
  }'
```

## You're Ready!

- Access the dashboard at http://localhost:3000/dashboard
- Start adding clients, cases, and managing your legal practice
- Check out the API documentation at http://localhost:5000/api/health

## Next Steps

1. Add your first client
2. Create a case for the client
3. Upload documents related to the case
4. Track your time and create invoices
5. Configure reminders for upcoming hearings

For detailed setup instructions, see [SETUP.md](./SETUP.md)


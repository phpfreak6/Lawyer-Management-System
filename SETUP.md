# Setup Instructions

## Prerequisites

Before setting up the Lawyer Management System, ensure you have:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **MySQL** (v8.0 or higher) - [Download](https://dev.mysql.com/downloads/)
- **npm** or **yarn** package manager
- A text editor or IDE (VS Code recommended)

## Installation Steps

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

Or use the convenience script:

```bash
npm run install-all
```

### 2. Set Up MySQL Database

```bash
# Create the database
mysql -u root -p
CREATE DATABASE lawyer_db;
EXIT;

# Or using mysql command line
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS lawyer_db;"
```

### 3. Configure Environment Variables

Copy the example environment file and edit it with your settings:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your database credentials and API keys:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=lawyer_db
DB_USER=root
DB_PASSWORD=your_mysql_password

JWT_SECRET=your_super_secret_jwt_key_here

# Add your API keys for external services
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
TWILIO_ACCOUNT_SID=your_twilio_account_sid
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

### 4. Run Database Migrations

```bash
cd backend
npm run migrate
```

This will create all necessary tables in your MySQL database.

### 5. (Optional) Seed Database with Dummy Data

```bash
npm run seed
```

This populates your database with sample data including users, clients, cases, tasks, and invoices.

### 6. Start the Application

#### Development Mode (Recommended)

Runs both backend and frontend concurrently:

```bash
npm run dev
```

- Backend API: http://localhost:5000
- Frontend App: http://localhost:3000

#### Run Separately

Backend only:
```bash
npm run server
```

Frontend only:
```bash
npm run client
```

### 6. Create Your First User

1. Register a new user via the registration endpoint:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@lawfirm.com",
    "password": "SecurePassword123",
    "first_name": "John",
    "last_name": "Doe",
    "role": "admin"
  }'
```

2. Or use the login page at http://localhost:3000/login

## Project Structure

```
lawyer/
├── backend/
│   ├── config/          # Database and configuration
│   ├── middleware/       # Authentication, authorization
│   ├── migrations/       # Database schema
│   ├── routes/           # API routes
│   ├── services/          # External integrations
│   └── server.js         # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── contexts/     # React contexts
│   │   ├── pages/        # Page components
│   │   └── App.jsx       # Main app component
│   └── package.json
├── package.json
└── README.md
```

## Database Schema

The application uses PostgreSQL with the following key tables:

- **tenants** - Multi-tenant isolation
- **users** - User accounts with roles
- **clients** - Client information
- **cases** - Case management
- **tasks** - Task tracking
- **calendar_events** - Calendar management
- **billing_records** - Invoices and billing
- **case_documents** - Document storage
- **time_entries** - Time tracking
- **expenses** - Expense tracking

## API Usage Examples

### Authentication

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@lawfirm.com",
    "password": "SecurePassword123"
  }'

# Get current user
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Cases

```bash
# Get all cases
curl -X GET http://localhost:5000/api/cases \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create a case
curl -X POST http://localhost:5000/api/cases \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "case_number": "CASE-2024-001",
    "client_id": "client-uuid",
    "court_name": "Delhi High Court",
    "case_type": "Civil",
    "subject": "Contract Dispute"
  }'
```

## Features Overview

### Core Features
- ✅ Case Management
- ✅ Client Management
- ✅ Task Management
- ✅ Document Upload & Management
- ✅ Billing & Invoicing with GST
- ✅ Time Tracking
- ✅ Expense Tracking
- ✅ Multi-tenant SaaS Architecture
- ✅ Role-based Access Control

### Integration Points
- 📅 Calendar Sync (Google/Outlook) - Stubs included
- 💳 Payment Gateways (Razorpay/Stripe) - Ready for integration
- 📧 Email Reminders - Configured
- 📱 SMS Reminders (Twilio) - Configured
- ⚖️ Legal Data APIs (eCourts, Casemine, LegitQuest) - Ready for integration

## Troubleshooting

### Database Connection Issues

```bash
# Check MySQL is running
sudo service mysql status
# or
sudo systemctl status mysql

# Test connection
mysql -u root -p lawyer_db
```

### Port Already in Use

```bash
# Check what's using the port
lsof -i :5000  # Backend
lsof -i :3000  # Frontend

# Kill the process
kill -9 <PID>
```

### Migration Errors

```bash
# Drop and recreate database
mysql -u root -p -e "DROP DATABASE IF EXISTS lawyer_db; CREATE DATABASE lawyer_db;"
npm run migrate
```

## Next Steps

1. Configure external API keys in `.env`
2. Set up email SMTP for notifications
3. Configure payment gateways
4. Customize the UI theme
5. Add your first client and case
6. Upload documents and start tracking time

## Support

For issues or questions:
- Check the README.md for detailed documentation
- Review the API endpoints in `/backend/routes/`
- Check the database schema in `/backend/migrations/`


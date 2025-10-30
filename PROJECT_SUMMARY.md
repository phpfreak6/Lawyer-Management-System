# Lawyer Management System - Project Summary

## Overview

A comprehensive multi-tenant SaaS platform designed for law firms to manage their entire practice, including cases, clients, billing, documents, and more.

## Technology Stack

### Backend
- **Framework**: Node.js with Express.js
- **Database**: MySQL with comprehensive schema
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Scheduling**: node-cron for automated reminders
- **Email**: Nodemailer
- **SMS**: Twilio
- **Payments**: Razorpay & Stripe integration

### Frontend
- **Framework**: React 18 with Vite
- **Routing**: React Router v6
- **UI Library**: Material-UI (MUI)
- **HTTP Client**: Axios
- **State Management**: React Context API
- **Notifications**: Notistack

## Features Implemented

### ✅ Core Functionality

1. **Case Management**
   - Create, update, delete cases
   - Track case stages (filing, hearing, judgment, appeal, closed)
   - CNR number support (Indian judiciary)
   - Court information and case types
   - Document upload per case
   - Case timeline and history

2. **Client Management**
   - Complete client profiles with KYC
   - Contact management
   - KYC document tracking with expiry reminders
   - Client-case association
   - Search and filter clients

3. **Task Management**
   - Create and assign tasks
   - Due date tracking
   - Priority levels (low, medium, high, urgent)
   - Task completion tracking
   - Automated reminder system

4. **Document Management**
   - Secure file upload with Multer
   - Document versioning
   - Tagging for search
   - Download functionality
   - Access control by role
   - Document type classification

5. **Billing & Invoicing**
   - GST-compliant invoicing (18% default)
   - Time tracking and billable hours
   - Expense tracking
   - Payment status management
   - Invoice PDF generation ready
   - Payment gateway integration (Razorpay/Stripe)

6. **Multi-Tenant SaaS**
   - Complete data isolation per tenant
   - Tenant-aware queries
   - Subscription tier management
   - Scalable architecture

7. **Authentication & Authorization**
   - JWT-based authentication
   - Role-based access control
   - User registration and login
   - Password hashing with bcrypt
   - Secure token management

### 🔧 Services & Integrations

1. **Calendar Integration Stubs**
   - Google Calendar API ready
   - Microsoft Outlook integration ready
   - Event management

2. **Reminder System**
   - Automated email reminders
   - SMS notifications via Twilio
   - Task and hearing reminders
   - Configurable via cron jobs

3. **Payment Processing**
   - Razorpay integration for Indian payments
   - Stripe integration for international payments
   - Payment verification
   - Online invoice payments

4. **Legal Data APIs**
   - eCourts API integration ready
   - Casemine API integration ready
   - LegitQuest API integration ready
   - Case status tracking
   - CNR search functionality

## Database Schema (MySQL)

### Key Tables
- `tenants` - Multi-tenant isolation
- `users` - User accounts with roles
- `clients` - Client information
- `cases` - Case management
- `tasks` - Task tracking
- `calendar_events` - Calendar management
- `billing_records` - Invoices
- `case_documents` - Document storage
- `time_entries` - Time tracking
- `expenses` - Expense tracking
- `kyc_documents` - KYC management
- `communication_logs` - Communication history
- `document_versions` - Version control

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Cases
- `GET /api/cases` - List all cases
- `GET /api/cases/:id` - Get case details
- `POST /api/cases` - Create case
- `PUT /api/cases/:id` - Update case
- `DELETE /api/cases/:id` - Delete case
- `GET /api/cases/:id/documents` - Get case documents
- `GET /api/cases/:id/timeline` - Get case timeline

### Clients
- `GET /api/clients` - List all clients
- `GET /api/clients/:id` - Get client details
- `POST /api/clients` - Create client
- `PUT /api/clients/:id` - Update client
- `GET /api/clients/:id/cases` - Get client cases
- `GET /api/clients/:id/kyc` - Get client KYC documents

### Tasks
- `GET /api/tasks` - List all tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `POST /api/tasks/:id/complete` - Complete task
- `DELETE /api/tasks/:id` - Delete task

### Documents
- `POST /api/documents/case/:case_id` - Upload document
- `GET /api/documents/:id/download` - Download document
- `DELETE /api/documents/:id` - Delete document

### Billing
- `GET /api/billing` - List all invoices
- `GET /api/billing/:id` - Get invoice details
- `POST /api/billing` - Create invoice
- `PUT /api/billing/:id/payment` - Update payment
- `POST /api/billing/:id/time-entry` - Add time entry
- `POST /api/billing/:id/expense` - Add expense

### Payments
- `POST /api/payments/razorpay/order` - Create Razorpay order
- `POST /api/payments/razorpay/verify` - Verify payment

## Installation & Setup

### Quick Start
```bash
npm run install-all
createdb lawyer_db
cd backend && npm run migrate && cd ..
npm run dev
```

Visit http://localhost:3000

### Detailed Setup
See [SETUP.md](./SETUP.md) for comprehensive installation instructions.

## Architecture Highlights

### Multi-Tenant Design
- Every query includes tenant_id for data isolation
- Tenant context middleware
- Shared infrastructure, isolated data

### Security
- JWT authentication
- Password hashing
- File upload validation
- Role-based access control
- SQL injection prevention

### Scalability
- RESTful API design
- Stateless authentication
- Modular route structure
- Service-oriented architecture

## User Roles

1. **Admin**
   - Full system access
   - User management
   - System configuration

2. **Lawyer**
   - Case and client management
   - Document management
   - Billing and invoicing
   - Task management

3. **Paralegal**
   - Task management
   - Document upload
   - Time tracking
   - Limited access

4. **Client**
   - View own cases
   - View own documents
   - Invoice payments

## File Structure

```
lawyer/
├── backend/
│   ├── config/           # Database configuration
│   ├── middleware/       # Auth, tenant middleware
│   ├── migrations/        # Database schema
│   ├── routes/           # API routes
│   ├── services/         # External integrations
│   ├── uploads/          # File storage
│   └── server.js         # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── contexts/     # React contexts
│   │   ├── pages/        # Page components
│   │   └── App.jsx
│   └── package.json
├── package.json
├── README.md
├── SETUP.md
└── QUICKSTART.md
```

## Environment Variables

Key configuration in `backend/.env`:
- Database connection
- JWT secret
- Email SMTP
- SMS/Twilio
- Payment gateways
- Legal API keys

## Next Steps / Future Enhancements

- [ ] OCR document search
- [ ] E-signature integration
- [ ] Real-time notifications
- [ ] Advanced analytics & reports
- [ ] Mobile app
- [ ] Automated document generation
- [ ] Legal research integration
- [ ] Advanced search with Elasticsearch

## Support

For setup issues or questions, refer to:
- [README.md](./README.md) - Full documentation
- [SETUP.md](./SETUP.md) - Detailed setup guide
- [QUICKSTART.md](./QUICKSTART.md) - Quick start guide

## License

MIT


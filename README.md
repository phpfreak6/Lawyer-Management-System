# Lawyer Management System

A comprehensive multi-tenant SaaS platform for law firms to manage cases, clients, billing, documents, and more.

## Features

### Core Functionality
- **Case Management**: Create, track, and manage client cases with unique IDs, manage case stages, and upload legal documents
- **Client & Contact Management**: Manage client profiles, contacts, communication logs, KYC documents with automated reminders
- **Task & Calendar Management**: Integration with Google Calendar/Outlook, automated alerts and reminders for hearings and deadlines
- **Billing & Invoicing**: Track billable hours, expenses, generate GST-compliant invoices, payment gateway integration
- **Document Management**: Centralized document storage with access controls, version history, tagging, and OCR support

### Technical Stack
- **Backend**: Node.js with Express
- **Frontend**: React with Vite
- **Database**: MySQL
- **Architecture**: Multi-tenant SaaS with role-based access control

## Installation

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Setup Instructions

1. **Clone the repository**
```bash
git clone <repository-url>
cd lawyer
```

2. **Install dependencies**
```bash
npm run install-all
```

3. **Set up PostgreSQL database**
```bash
# Create database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS lawyer_db;"

# Run migrations
cd backend && npm run migrate && cd ..
```

4. **Configure environment variables**
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration
```

5. **Start the application**
```bash
# Development mode (runs both backend and frontend)
npm run dev

# Or run separately:
npm run server  # Backend only (port 5000)
npm run client  # Frontend only (port 3000)
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Cases
- `GET /api/cases` - Get all cases
- `GET /api/cases/:id` - Get case details
- `POST /api/cases` - Create new case
- `PUT /api/cases/:id` - Update case
- `DELETE /api/cases/:id` - Delete case

### Clients
- `GET /api/clients` - Get all clients
- `GET /api/clients/:id` - Get client details
- `POST /api/clients` - Create new client
- `PUT /api/clients/:id` - Update client

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `POST /api/tasks/:id/complete` - Complete task

### Documents
- `POST /api/documents/case/:case_id` - Upload document
- `GET /api/documents/:id/download` - Download document
- `DELETE /api/documents/:id` - Delete document

### Billing
- `GET /api/billing` - Get all invoices
- `GET /api/billing/:id` - Get invoice details
- `POST /api/billing` - Create new invoice
- `PUT /api/billing/:id/payment` - Update payment

## Database Schema

The system uses MySQL with the following main tables:
- `tenants` - Multi-tenant isolation
- `users` - User accounts with role-based access
- `clients` - Client information
- `cases` - Case management
- `tasks` - Task and deadline tracking
- `calendar_events` - Calendar integration
- `billing_records` - Invoicing and billing
- `case_documents` - Document storage
- `time_entries` - Time tracking
- `expenses` - Expense tracking

## Architecture

### Multi-Tenant SaaS Model
- Each law firm gets its own tenant ID
- Complete data isolation per tenant
- Shared infrastructure with logical separation

### Role-Based Access Control
- **Admin**: Full system access
- **Lawyer**: Case and client management
- **Paralegal**: Task and document management
- **Client**: View own cases and documents

### Security
- JWT-based authentication
- Password hashing with bcrypt
- Tenant isolation middleware
- File upload validation

## External Integrations

### Available Integrations
1. **Calendar Sync**: Google Calendar and Microsoft Outlook (stubs included)
2. **Payment Gateways**: Razorpay and Stripe integration points
3. **Legal APIs**: eCourts API, Casemine API, LegitQuest API (configuration included)
4. **Document Services**: OCR and e-signature integration hooks
5. **Communication**: Email, SMS, and WhatsApp reminder system

### Configuration
Add API keys and credentials to `backend/.env`:
- Email SMTP settings for notifications
- Twilio credentials for SMS/WhatsApp
- Payment gateway credentials
- Legal data API keys

WhatsApp (Twilio) variables:
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
# Optional: TWILIO_PHONE_NUMBER for SMS (e.g., +12025550123)
```

Enable reminders and per-tenant channel toggles:
```
ENABLE_REMINDERS=true
# Per-tenant flags managed via API: /api/settings/reminders
# Fields: email_enabled, sms_enabled, whatsapp_enabled
```

## Development

### Project Structure
```
lawyer/
├── backend/
│   ├── config/
│   ├── middleware/
│   ├── migrations/
│   ├── routes/
│   ├── services/
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   └── App.jsx
│   └── package.json
└── README.md
```

### Adding New Features
1. Create database migration if needed
2. Add backend route in `/backend/routes/`
3. Create frontend component in `/frontend/src/`
4. Update API client and context as needed

## Future Enhancements

- [ ] OCR document search integration
- [ ] E-signature functionality (DocuSign/Adobe Sign)
- [ ] Real-time notifications
- [ ] Advanced reporting and analytics
- [ ] Mobile app support
- [ ] Automated document generation
- [ ] Legal database integration (case law, judgments)
- [ ] Advanced search with Elasticsearch

## License

MIT

## Support

For issues and questions, please contact the development team.


# Core Functionality - Implementation Guide

This document describes all the implemented core features for the Lawyer Management System.

## ✅ Implemented Features

### 1. Case Management System

#### Core Functionality
- ✅ **Create, track, and manage client cases** with unique IDs
- ✅ **Case stage management** with transitions (filing, hearings, judgment, closed, appeal)
- ✅ **File uploads** for legal documents, petitions, and evidence
- ✅ **Case timeline** tracking with tasks and events
- ✅ **Case document management** with version control
- ✅ **Case search** and filtering

#### API Endpoints

**Cases**
- `GET /api/cases` - Get all cases (with filters: status, stage, client_id, assigned_to)
- `GET /api/cases/:id` - Get specific case details
- `POST /api/cases` - Create new case
- `PUT /api/cases/:id` - Update case
- `DELETE /api/cases/:id` - Delete case (admin/lawyer only)
- `GET /api/cases/:id/documents` - Get case documents
- `GET /api/cases/:id/timeline` - Get case timeline (tasks + events)
- `PUT /api/cases/:id/stage` - Update case stage with notes
- `GET /api/cases/:id/stage-history` - Get case stage change history

**Case Documents**
- `POST /api/documents/case/:case_id` - Upload document to case
- `GET /api/documents/:id/download` - Download document
- `GET /api/documents/search` - Search documents by text/content (OCR)
- `POST /api/documents/:id/process-ocr` - Process document for OCR
- `DELETE /api/documents/:id` - Delete document

#### Case Stages
- `filing` - Initial case filing
- `hearing` - Court hearing scheduled
- `judgment` - Waiting for judgment
- `closed` - Case closed
- `appeal` - Appeal filed

---

### 2. Client & Contact Management

#### Core Functionality
- ✅ **Client profile management** (personal info, contact details, KYC data)
- ✅ **Contact information storage** (multiple phones, addresses)
- ✅ **KYC document management** with expiry tracking and renewal reminders
- ✅ **Communication logs** for all client interactions
- ✅ **Client assignment** to lawyers
- ✅ **Client case history**

#### API Endpoints

**Clients**
- `GET /api/clients` - Get all clients (with filters and search)
- `GET /api/clients/:id` - Get client details
- `POST /api/clients` - Create new client
- `PUT /api/clients/:id` - Update client
- `GET /api/clients/:id/cases` - Get all cases for a client
- `GET /api/clients/:id/kyc` - Get KYC documents

**KYC Documents**
- `GET /api/kyc/client/:clientId` - Get KYC documents for client
- `POST /api/kyc/client/:clientId` - Upload KYC document
- `PUT /api/kyc/:id/verify` - Verify KYC document (admin/lawyer)
- `DELETE /api/kyc/:id` - Delete KYC document (admin/lawyer)

**Communication Logs**
- `GET /api/communications` - Get all communications (with filters)
- `POST /api/communications` - Create communication log
- `GET /api/communications/:id` - Get specific communication

---

### 3. Task & Calendar Management

#### Core Functionality
- ✅ **Task creation and management** with priorities and due dates
- ✅ **Calendar event management** for hearings and deadlines
- ✅ **Google Calendar integration** for event sync
- ✅ **Microsoft Outlook integration** for event sync
- ✅ **Automated reminders** via email and SMS
- ✅ **Upcoming hearings tracking**

#### API Endpoints

**Tasks**
- `GET /api/tasks` - Get all tasks (with filters)
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `POST /api/tasks/:id/complete` - Complete task
- `DELETE /api/tasks/:id` - Delete task

**Calendar Events**
- `GET /api/calendar` - Get all calendar events
- `GET /api/calendar/upcoming` - Get upcoming hearings/events
- `POST /api/calendar` - Create calendar event
- `PUT /api/calendar/:id` - Update calendar event
- `DELETE /api/calendar/:id` - Delete calendar event
- `POST /api/calendar/sync/google` - Sync with Google Calendar
- `POST /api/calendar/sync/outlook` - Sync with Microsoft Outlook

#### Reminders
Automated reminders are configured to run every hour (`node-cron`) and send:
- **Email reminders** for upcoming hearings (24 hours before)
- **SMS reminders** for urgent tasks
- **KYC renewal reminders** (7 days before expiry)

---

### 4. Billing & Invoicing

#### Core Functionality
- ✅ **Billable hours tracking** with time entries
- ✅ **Expense tracking** and categorization
- ✅ **GST-compliant invoices** (18% GST default)
- ✅ **Payment status tracking** (pending, partial, paid)
- ✅ **Razorpay payment gateway** integration
- ✅ **Stripe payment gateway** integration
- ✅ **Online payment processing**
- ✅ **Invoice generation** with itemized billing

#### API Endpoints

**Billing**
- `GET /api/billing` - Get all invoices (with filters)
- `GET /api/billing/:id` - Get invoice with time entries and expenses
- `POST /api/billing` - Create new invoice (admin/lawyer)
- `PUT /api/billing/:id/payment` - Update payment status
- `POST /api/billing/:id/time-entry` - Add time entry
- `POST /api/billing/:id/expense` - Add expense

**Payments**
- `POST /api/payments/razorpay/order` - Create Razorpay payment order
- `POST /api/payments/razorpay/verify` - Verify Razorpay payment

#### Invoice Calculation
```
Subtotal = (Billable Hours × Hourly Rate) + Expenses
GST Amount = Subtotal × (GST Percentage / 100)
Total Amount = Subtotal + GST Amount
```

---

### 5. Document Management System

#### Core Functionality
- ✅ **Centralized document storage** with access controls
- ✅ **Version history** for all documents
- ✅ **Document tagging** for better organization
- ✅ **OCR-based document search** using Tesseract.js
- ✅ **PDF text extraction** for search
- ✅ **File upload** with size limits and type validation
- ✅ **E-signature integration** (Adobe Sign, DocuSign)

#### API Endpoints

**Documents** (see Case Management section above)

**E-Signatures**
- `POST /api/esignature/adobe/create` - Create Adobe Sign e-signature request
- `POST /api/esignature/docusign/create` - Create DocuSign e-signature request
- `GET /api/esignature/:id/status` - Get e-signature status

#### OCR Capabilities
- Text extraction from PDF documents
- Text extraction from images (PNG, JPG, etc.)
- Full-text search across all documents
- Automatic text indexing for uploaded documents

---

## Environment Variables

Add these to your `.env` file:

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=lawyer_db

# Server
PORT=5002
NODE_ENV=development

# JWT
JWT_SECRET=your_secret_key

# Email (for reminders)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_number

# Google Calendar
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5002/api/calendar/sync/google

# Microsoft Outlook
OUTLOOK_CLIENT_ID=your_client_id
OUTLOOK_CLIENT_SECRET=your_client_secret
OUTLOOK_REDIRECT_URI=http://localhost:5002/api/calendar/sync/outlook

# Razorpay
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
TWILIO_PHONE_NUMBER=your_phone_number

# Stripe
STRIPE_SECRET_KEY=your_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Adobe Sign
ADOBE_SIGN_CLIENT_ID=your_client_id
ADOBE_SIGN_CLIENT_SECRET=your_client_secret
ADOBE_SIGN_ACCESS_TOKEN=your_access_token

# DocuSign
DOCUSIGN_INTEGRATOR_KEY=your_integrator_key
DOCUSIGN_USER_ID=your_user_id
DOCUSIGN_ACCOUNT_ID=your_account_id
DOCUSIGN_ACCESS_TOKEN=your_access_token

# File Upload
MAX_FILE_SIZE=10485760

# Reminders
ENABLE_REMINDERS=true
```

---

## Database Migration

Run the database migration to set up all tables:

```bash
cd backend
npm run migrate
```

Then seed the database with sample data:

```bash
npm run seed
```

---

## Starting the Server

```bash
cd backend
npm install
npm run dev
```

The API will be available at `http://localhost:5002`

---

## API Authentication

All endpoints (except auth) require JWT authentication:

```
Authorization: Bearer <jwt_token>
```

Get a token by logging in:
```
POST /api/auth/login
{
  "email": "lawyer@lawfirm.com",
  "password": "lawyer123"
}
```

---

## Test Credentials

After seeding the database:

**Admin**
- Email: admin@lawfirm.com
- Password: admin123

**Lawyer**
- Email: lawyer@lawfirm.com
- Password: lawyer123

**Paralegal**
- Email: paralegal@lawfirm.com
- Password: paralegal123

---

## Features Breakdown

### Case Management
- ✅ Unique case IDs with auto-increment
- ✅ Case stages: filing → hearing → judgment → closed/appeal
- ✅ Case assignment to lawyers
- ✅ Case priority levels (urgent, high, medium, low)
- ✅ Next hearing date tracking
- ✅ Case status management

### Client Management
- ✅ Comprehensive client profiles
- ✅ KYC document storage (PAN, Aadhar, etc.)
- ✅ Client assignment to lawyers
- ✅ Contact information management
- ✅ Client communication logs

### Task Management
- ✅ Task creation with due dates
- ✅ Task assignment to users
- ✅ Task priority levels
- ✅ Task completion tracking
- ✅ Automated reminders for due tasks

### Calendar Integration
- ✅ Google Calendar sync
- ✅ Microsoft Outlook sync
- ✅ Hearing date management
- ✅ Deadline tracking
- ✅ Reminder notifications

### Billing System
- ✅ Time entry tracking
- ✅ Billable hour calculation
- ✅ Expense tracking
- ✅ GST-compliant invoices
- ✅ Payment status tracking
- ✅ Online payment processing

### Document Management
- ✅ Document upload and storage
- ✅ OCR-based text extraction
- ✅ Document version control
- ✅ Document tagging
- ✅ Full-text search
- ✅ E-signature support

---

## Next Steps

1. Configure environment variables for your APIs
2. Set up email service for reminders
3. Configure payment gateways
4. Set up calendar integrations
5. Configure OCR and e-signature services

---

## Support

For issues or questions, refer to the main README.md file.


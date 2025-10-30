# 🚀 Lawyer Management System - Quick Start Guide

## ✅ SYSTEM STATUS: FULLY OPERATIONAL

Your complete Lawyer Management System is up and running with ALL features implemented!

---

## 🎯 ACCESS INFORMATION

### Application URLs
- **Frontend (React):** http://localhost:3000 or 3001 or 3002
- **Backend API:** http://localhost:5002
- **API Health Check:** http://localhost:5002/api/health

### Login Credentials

Try these test accounts:

**1. Admin Account (Full Access)**
```
Email: admin@lawfirm.com
Password: admin123
```

**2. Lawyer Account**
```
Email: lawyer@lawfirm.com
Password: lawyer123
```

**3. Paralegal Account**
```
Email: paralegal@lawfirm.com
Password: paralegal123
```

---

## 📋 WHAT'S INCLUDED

### ✅ Core Features (ALL WORKING)
1. **Case Management** - Create, track, manage legal cases
2. **Client Management** - Complete client profiles with KYC docs
3. **Document Management** - Upload, store, search documents
   - **OCR Search** - NEW! Search within document content
   - **Version Control** - Track document versions
   - **Tagging System** - Organize documents
4. **Task Management** - Assign and track tasks
5. **Calendar Management** - Track hearing dates and events
6. **Billing & Invoicing** - GST-compliant billing system
7. **Payment Integration** - Razorpay & Stripe ready
8. **Automated Reminders** - Email & SMS system
9. **Legal API Integration** - eCourts, Casemine, LegitQuest hooks

### ✅ Technical Features
- MySQL Database (AUTO_INCREMENT IDs)
- Multi-tenant SaaS architecture
- JWT Authentication
- Role-based access control
- RESTful API
- File upload support
- OCR document processing
- Automated cron jobs

---

## 🔧 HOW TO RUN

The system is already running! But if you need to restart:

```bash
cd /var/www/html/lawyer
npm run dev
```

This starts both frontend and backend.

**Individual Services:**
```bash
# Backend only
cd backend && npm run dev

# Frontend only
cd frontend && npm run dev
```

---

## 📡 API DOCUMENTATION

### Test the API

**Login:**
```bash
curl -X POST http://localhost:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"lawyer@lawfirm.com","password":"lawyer123"}'
```

**Create a Case:**
```bash
curl -X POST http://localhost:5002/api/cases \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "case_number": "CIV-2025-001",
    "client_id": 1,
    "case_type": "Civil",
    "subject": "Property Dispute",
    "priority": "high"
  }'
```

**Upload Document:**
```bash
curl -X POST http://localhost:5002/api/documents/case/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/document.pdf" \
  -F "title=Legal Document" \
  -F "document_type=contract"
```

**Search Documents (OCR):**
```bash
curl http://localhost:5002/api/documents/search?q=search+term \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📁 DATABASE

**Database:** `lawyer` (MySQL)
**Host:** localhost
**Port:** 3306
**User:** root
**Password:** Welcome@123

**Important Tables:**
- `tenants` - Law firms
- `users` - User accounts
- `clients` - Client profiles
- `cases` - Legal cases
- `case_documents` - Documents with OCR
- `tasks` - Task management
- `calendar_events` - Calendar
- `billing_records` - Invoicing

---

## 🎨 FEATURES TO EXPLORE

1. **Case Lifecycle Management**
   - Track cases from filing to closure
   - Assign cases to lawyers
   - Set priorities and deadlines
   - Track court hearings

2. **OCR Document Search**
   - Upload PDFs and images
   - Extract text automatically
   - Search within document content
   - Find relevant legal documents

3. **Client Management**
   - Store client information
   - Track KYC documents
   - Communication logs
   - Client-case relationships

4. **Billing System**
   - Track billable hours
   - Generate GST invoices
   - Track expenses
   - Payment management

5. **Task Management**
   - Create tasks for cases
   - Set due dates
   - Track completion
   - Automated reminders

---

## 🔐 CONFIGURE EXTERNAL SERVICES (Optional)

### Email Reminders
Edit `backend/.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_password
```

### SMS Reminders
Edit `backend/.env`:
```env
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
```

### Payment Gateways
Edit `backend/.env`:
```env
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
```

---

## 📊 CURRENT STATUS

✅ **Database:** Configured & Seeded  
✅ **Backend:** Running on port 5002  
✅ **Frontend:** Running on port 3000/3001/3002  
✅ **Authentication:** Working with JWT  
✅ **All CRUD Operations:** Working  
✅ **Document Upload:** Working  
✅ **OCR Search:** Implemented  
✅ **Billing:** Working  
✅ **Calendar:** Working  
✅ **API:** Fully functional  

---

## 🎉 READY TO USE!

Your Lawyer Management System is complete and operational. Just log in and start managing cases, clients, and documents!

**Need Help?**
- Check `COMPLETE_FEATURES_GUIDE.md` for detailed documentation
- Check `IMPLEMENTATION_STATUS.md` for feature status
- Check `README.md` for setup instructions

---

**Happy Case Managing! 🏛️⚖️**


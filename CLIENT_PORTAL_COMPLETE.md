# Client Portal - Complete Implementation

## Overview

The client portal allows clients to login and access their cases, documents, invoices, and KYC documents with full document upload capabilities.

## Client Portal Features

### 1. Client Dashboard (`/client`)
- **Statistics**: Total cases, active cases, pending invoices
- **Recent Cases**: Quick view of latest cases
- **Recent Invoices**: Payment status overview
- **Upcoming Events**: Scheduled hearings and deadlines

### 2. My Cases (`/client/cases`)
- **All Cases**: View all cases assigned to the client
- **Case Details**: Case number, subject, court, stage, status
- **Next Hearing**: Upcoming hearing dates
- **View Details**: Navigate to full case details

### 3. My Documents (`/client/documents`)
- **View Documents**: All documents related to client's cases
- **Upload Documents**: Upload new documents for specific cases
- **Document Types**: Evidence, Correspondence, Medical Reports, Contracts
- **Download**: Download any document
- **Case-Linked**: Documents linked to specific cases

### 4. My Invoices (`/client/invoices`)
- **All Invoices**: View all invoices for client's cases
- **Payment Status**: Paid, pending, partial, overdue
- **Invoice Details**: Amounts, dates, descriptions
- **View Details**: Navigate to invoice details

### 5. KYC Documents (`/client/kyc`) **NEW**
- **Upload KYC**: Upload identity verification documents
- **Document Types**: Aadhaar, PAN, Passport, Driving License, etc.
- **Verification Status**: Track verification status
- **Download**: Download uploaded KYC documents

## Client Upload Capabilities

### Upload Case Documents
**Endpoint**: `POST /api/documents/client/upload`

**Requirements**:
- Select case (must belong to client)
- Document type (Evidence, Correspondence, Medical Report, Contract, Other)
- Document title
- Optional description
- File (PDF, DOC, DOCX, JPG, PNG, TXT)
- Max size: 10MB

**Security**:
- Client can only upload for their own cases
- Server verifies case ownership before allowing upload

### Upload KYC Documents
**Endpoint**: `POST /api/kyc/client/upload`

**Requirements**:
- Document type (Aadhaar, PAN, Passport, etc.)
- Optional document number
- Optional description
- File (PDF, JPG, PNG)
- Max size: 10MB

**Security**:
- Client can only upload their own KYC documents
- Tracks verification status

## API Endpoints

### Get Client Cases
```
GET /api/clients/me/cases
- Returns: List of cases where client_id matches
- Filters by client ownership
- Shows case details including assigned lawyer
```

### Get Client Documents
```
GET /api/clients/me/documents
- Returns: Documents for client's cases
- Joined with case information
```

### Upload Case Document
```
POST /api/documents/client/upload
Body: FormData
  - file: Document file
  - case_id: Case ID (must belong to client)
  - title: Document title
  - document_type: Type of document
  - description: Optional description
```

### Get KYC Documents
```
GET /api/kyc/client/documents
- Returns: Client's KYC documents
- Shows verification status
```

### Upload KYC Document
```
POST /api/kyc/client/upload
Body: FormData
  - file: KYC document
  - document_type: Type (aadhaar, pan, etc.)
  - document_number: Optional
  - description: Optional
```

## Client Permissions

Updated in `RBAC_PERMISSIONS`:

```javascript
client: [
  'case:view',           // View their cases
  'client:view',         // View their profile
  'document:view',        // View documents
  'document:upload',     // Upload documents
  'billing:view',        // View invoices
  'calendar:view'        // View calendar events
]
```

## Database Structure

### Client-Case Relationship
- Cases table has `client_id` field
- Links case to specific client
- Client can see only their cases (filtered by client_id)

### Document Upload
- Case documents: Stored in `uploads/client-documents/`
- KYC documents: Stored in `uploads/kyc/`
- Database records track ownership and metadata

## Testing

### Test Client Account

**Credentials**:
```
Email: client@lawfirm.com
Password: client123
```

**Expected Case**:
- CASE-2024-001 (Breach of Contract)
- Client: Amit Singh (client@lawfirm.com)

### Test Upload Functionality

1. **Login as Client**
2. **Navigate to "My Documents"**
3. **Click "Upload Document"**
4. **Select case**: CASE-2024-001
5. **Choose document type**: Evidence
6. **Upload file**: PDF, DOC, etc.
7. **Verify**: Document appears in list

### Test KYC Upload

1. **Navigate to "KYC Documents"**
2. **Click "Upload KYC Document"**
3. **Select type**: Aadhaar Card
4. **Enter document number**: 1234-5678-9012
5. **Upload file**: PDF or image
6. **Verify**: Status shows "Pending Verification"

## Troubleshooting

### Cases Not Showing

**Check**:
1. User email matches client email in database
2. Cases have correct `client_id`
3. Client record exists for that email

**Debug Commands**:
```bash
# Check client user
mysql> SELECT * FROM users WHERE email = 'client@lawfirm.com';

# Check client record
mysql> SELECT * FROM clients WHERE email = 'client@lawfirm.com';

# Check cases
mysql> SELECT * FROM cases WHERE client_id = (SELECT id FROM clients WHERE email = 'client@lawfirm.com');
```

### Upload Not Working

**Check**:
1. Upload directory exists
2. File permissions are correct
3. Case ownership verified
4. File type and size allowed

**Debug**:
- Check server console for errors
- Verify file upload permissions
- Check client ownership of case

## Navigation Menu

### For Clients (Simplified)
1. **Dashboard** → Overview and stats
2. **My Cases** → View all cases
3. **My Documents** → View and upload documents
4. **My Invoices** → View invoices
5. **KYC Documents** → Upload and manage KYC

### For Admin/Lawyer (Full Menu)
- Dashboard
- Cases
- Clients
- Tasks
- Calendar
- Billing
- Legal Data

## Security Features

1. **Role-Based Access**: Only client role can access `/client/*` routes
2. **Ownership Verification**: API checks if case belongs to client
3. **File Size Limits**: 10MB max per upload
4. **File Type Validation**: Only allowed types accepted
5. **Path Traversal Protection**: Secure file storage

## Complete Features

✅ Client login with dedicated portal
✅ View assigned cases
✅ View case documents
✅ Upload documents for cases
✅ View invoices
✅ Upload KYC documents
✅ Download documents
✅ Track document status
✅ View upcoming events
✅ Real-time statistics

## Next Steps

1. **Email Notifications**: Alert client when documents are added
2. **Document Preview**: Online document viewing
3. **E-Signature Integration**: Sign documents online
4. **Payment Gateway**: Direct invoice payment from portal
5. **Mobile App**: Native mobile client portal
6. **Document Versioning**: Track document versions


# Legal Data Integration Guide

This document provides a comprehensive guide to the legal data integration features implemented in the Lawyer Management System.

## Overview

The legal data integration module provides access to multiple legal data sources and verification services used in the Indian legal system:

- **eCourts API**: National Judicial Data Grid (NJDG) for case status, CNR number search, cause lists, and judgments
- **GST Verification API**: Verify GST numbers for client onboarding and billing
- **PAN Verification API**: Verify PAN numbers for client verification
- **DigiLocker API**: Secure document verification and sharing
- **eSign API (MeitY)**: Government-compliant e-signing

## Backend Implementation

### Files Created/Modified

1. **`backend/services/legalApis.js`**
   - Enhanced with new API classes:
     - `eCourtsAPI`: eCourts integration
     - `CasemineAPI`: Legal case law search
     - `LegitQuestAPI`: Legal research
     - `GSTVerificationAPI`: GST verification
     - `PANVerificationAPI`: PAN verification
     - `DigiLockerAPI`: Document verification
     - `eSignAPI`: Electronic signature

2. **`backend/routes/legalData.js`**
   - New route file with endpoints for:
     - eCourts case search by CNR
     - Case status retrieval
     - Cause list retrieval
     - GST verification
     - PAN verification
     - DigiLocker document verification
     - DigiLocker document fetching
     - eSign request creation
     - eSignature verification
     - Search history

3. **`backend/migrations/03_legal_data_integration.sql`**
   - New database tables:
     - `legal_data_searches`: Store search history
     - `case_sync_logs`: Track case synchronization
     - `legal_api_configs`: Store API configurations

4. **`backend/server.js`**
   - Added `/api/legal-data` route

### API Endpoints

#### eCourts Integration

```
POST /api/legal-data/ecourts/search-cnr
Body: { cnr_number: "string" }
Response: Case details by CNR number

GET /api/legal-data/ecourts/case-status/:caseNumber
Response: Case status information

POST /api/legal-data/ecourts/cause-list
Body: { court_id: "string", date: "YYYY-MM-DD" }
Response: Cause list for the court

GET /api/legal-data/ecourts/judgments
Query: { court_name: "string", limit: number }
Response: Judgment summaries
```

#### Verification Services

```
POST /api/legal-data/verify/gst
Body: { gstin: "string" }
Response: GST verification details

POST /api/legal-data/verify/pan
Body: { pan_number: "string" }
Response: PAN verification details
```

#### DigiLocker Integration

```
POST /api/legal-data/digitallocker/verify
Body: { document_type: "string", document_number: "string" }
Response: Document verification result

POST /api/legal-data/digitallocker/fetch
Body: { document_type: "string", client_aadhaar: "string" }
Response: Fetched document details
```

#### eSign Integration

```
POST /api/legal-data/esign/create
Body: { document_data: "string", signer_aadhaar: "string" }
Response: eSign request details

GET /api/legal-data/esign/verify/:signatureId
Response: Signature verification result
```

#### Legal Research

```
POST /api/legal-data/cases/search
Body: { query: "string" }
Response: Case search results

GET /api/legal-data/cases/judgment/:caseId
Response: Judgment details

POST /api/legal-data/legal-research
Body: { query: "string" }
Response: Legal research results
```

#### History

```
GET /api/legal-data/history
Response: List of recent searches

GET /api/legal-data/history/:id
Response: Specific search result details
```

### Environment Variables

Add these to your `.env` file:

```env
# eCourts API
ECOURTS_API_URL=https://services.ecourts.gov.in
ECOURTS_API_KEY=your_ecourts_api_key

# Legal Research APIs
CASEMINE_API_URL=https://api.casemine.com
CASEMINE_API_KEY=your_casemine_api_key

LEGITQUEST_API_URL=https://api.legitquest.com
LEGITQUEST_API_KEY=your_legitquest_api_key

# Verification APIs
GST_API_URL=https://api.mygst.com
GST_API_KEY=your_gst_api_key

PAN_API_URL=https://api.panverify.com
PAN_API_KEY=your_pan_api_key

# DigiLocker
DIGILOCKER_API_URL=https://api.digitallocker.gov.in
DIGILOCKER_CLIENT_ID=your_digitallocker_client_id
DIGILOCKER_CLIENT_SECRET=your_digitallocker_client_secret

# eSign
ESIGN_API_URL=https://api.esign.service.gov.in
ESIGN_API_KEY=your_esign_api_key
```

## Frontend Implementation

### Files Created/Modified

1. **`frontend/src/pages/LegalData.jsx`**
   - New page component with tabbed interface for:
     - eCourts search
     - GST verification
     - PAN verification
     - DigiLocker integration
     - eSign services

2. **`frontend/src/App.jsx`**
   - Added `/legal-data` route

3. **`frontend/src/components/Layout.jsx`**
   - Added "Legal Data" menu item with Gavel icon

### UI Features

The Legal Data page provides:

1. **Tab Navigation**
   - Separate tabs for each service type
   - Clean, Material-UI based interface

2. **eCourts Tab**
   - Search by CNR number
   - Get case status
   - Get cause lists
   - Display search results

3. **GST Verification Tab**
   - Enter GSTIN
   - Verify GST details
   - Display verification results

4. **PAN Verification Tab**
   - Enter PAN number
   - Verify PAN details
   - Display verification results

5. **DigiLocker Tab**
   - Verify documents
   - Fetch documents from DigiLocker
   - Display document details

6. **eSign Tab**
   - Create eSign requests
   - Track eSign status
   - Verify signatures

## Usage Examples

### Searching a Case by CNR Number

```javascript
// Backend
const result = await eCourtsAPI.searchCaseByCNR('CNR123456789');
console.log(result);
/*
{
  success: true,
  cnr: 'CNR123456789',
  case_status: 'Active',
  court_name: 'District Court',
  case_type: 'Civil',
  filing_date: '2024-01-15',
  next_hearing: '2024-12-20',
  petitioners: ['Petitioner Name 1'],
  respondents: ['Respondent Name 1'],
  judge_name: 'Judge Name'
}
*/
```

### Verifying GST Number

```javascript
// Backend
const result = await GSTVerificationAPI.verifyGSTIN('27AABCU9603R1ZM');
console.log(result);
/*
{
  success: true,
  gstin: '27AABCU9603R1ZM',
  is_valid: true,
  trade_name: 'Sample Trade Name',
  legal_name: 'Sample Legal Name',
  status: 'Active',
  registration_date: '2020-01-01'
}
*/
```

### Verifying PAN Number

```javascript
// Backend
const result = await PANVerificationAPI.verifyPAN('ABCDE1234F');
console.log(result);
/*
{
  success: true,
  pan: 'ABCDE1234F',
  is_valid: true,
  name: 'Sample Name',
  status: 'Active'
}
*/
```

## Database Tables

### legal_data_searches

Stores all legal data search queries and results:

```sql
CREATE TABLE legal_data_searches (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    search_type VARCHAR(100) NOT NULL,
    search_query VARCHAR(255) NOT NULL,
    result_data LONGTEXT,
    searched_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### case_sync_logs

Tracks case synchronization with external systems:

```sql
CREATE TABLE case_sync_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    case_id INT NOT NULL,
    sync_type VARCHAR(50) NOT NULL,
    sync_data LONGTEXT,
    sync_status VARCHAR(50) DEFAULT 'pending',
    error_message TEXT,
    synced_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### legal_api_configs

Stores API configuration for each tenant:

```sql
CREATE TABLE legal_api_configs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    api_provider VARCHAR(100) NOT NULL,
    api_key VARCHAR(500),
    api_secret VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    config_data JSON
);
```

## Running the Migration

To apply the database changes:

```bash
# Navigate to backend directory
cd backend

# Run the migration
node migrations/migrate.js

# Or manually execute
mysql -u your_username -p your_database < migrations/03_legal_data_integration.sql
```

## Testing

### Test eCourts Search

```bash
curl -X POST http://localhost:5002/api/legal-data/ecourts/search-cnr \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cnr_number": "CNR123456789"}'
```

### Test GST Verification

```bash
curl -X POST http://localhost:5002/api/legal-data/verify/gst \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"gstin": "27AABCU9603R1ZM"}'
```

## Security Considerations

1. **API Keys**: Store all API keys in environment variables, never in code
2. **Authentication**: All endpoints require authentication
3. **Authorization**: Role-based access control (admin, lawyer, paralegal)
4. **Rate Limiting**: Implement rate limiting for external API calls
5. **Data Privacy**: Ensure compliance with Indian data protection laws

## Future Enhancements

1. **Real-time Case Updates**: Automatic sync with eCourts for case status changes
2. **Document Integration**: Direct integration with DigiLocker for document uploads
3. **Bulk Operations**: Support for bulk verification and search
4. **Analytics**: Track usage and performance metrics
5. **Notifications**: Email/SMS notifications for case updates
6. **Mobile App**: Native mobile apps for iOS and Android

## Support

For issues or questions, please refer to:
- API Documentation: See individual API provider documentation
- Database Schema: See `backend/migrations/03_legal_data_integration.sql`
- Backend Routes: See `backend/routes/legalData.js`
- Frontend Page: See `frontend/src/pages/LegalData.jsx`

## License

This feature is part of the Lawyer Management System and follows the same license terms.


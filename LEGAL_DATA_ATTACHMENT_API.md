# Legal Data Attachment API Guide

This guide explains how to use the Legal Data Integration API to attach legal data to cases and clients.

## Overview

The Legal Data Attachment API allows you to:
- Attach eCourts case data to specific cases
- Attach GST verification to clients
- Attach PAN verification to clients
- Retrieve all attached legal data for a case or client

## API Endpoints

### 1. Attach eCourts Data to a Case

Attach eCourts case information to a specific case.

**Endpoint:** `POST /api/legal-data/attach/case/:caseId/ecourts`

**Parameters:**
- `caseId` - Case ID (path parameter)
- `cnr_number` - CNR number to search (body parameter)

**Request:**
```bash
curl -X POST http://localhost:5002/api/legal-data/attach/case/1/ecourts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cnr_number": "CNR-DL-2024-001234"}'
```

**Response:**
```json
{
  "success": true,
  "message": "Legal data attached successfully",
  "case": {
    "id": 1,
    "case_number": "CASE-2024-001"
  },
  "data": {
    "success": true,
    "cnr": "CNR-DL-2024-001234",
    "case_status": "Active",
    "court_name": "District Court",
    "filing_date": "2024-01-15",
    "next_hearing": "2024-12-20"
  }
}
```

### 2. Attach GST Verification to a Client

Verify and attach GST information to a client.

**Endpoint:** `POST /api/legal-data/attach/client/:clientId/gst`

**Parameters:**
- `clientId` - Client ID (path parameter)
- `gstin` - GST Number to verify (body parameter)

**Request:**
```bash
curl -X POST http://localhost:5002/api/legal-data/attach/client/1/gst \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"gstin": "27AAACH1234A1Z5"}'
```

**Response:**
```json
{
  "success": true,
  "message": "GST verification attached successfully",
  "client": {
    "id": 1,
    "first_name": "Amit",
    "last_name": "Singh"
  },
  "verification": {
    "success": true,
    "gstin": "27AAACH1234A1Z5",
    "business_name": "Business Name",
    "status": "Active"
  }
}
```

### 3. Attach PAN Verification to a Client

Verify and attach PAN information to a client.

**Endpoint:** `POST /api/legal-data/attach/client/:clientId/pan`

**Parameters:**
- `clientId` - Client ID (path parameter)
- `pan_number` - PAN Number to verify (body parameter)

**Request:**
```bash
curl -X POST http://localhost:5002/api/legal-data/attach/client/1/pan \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"pan_number": "ABCDE1234F"}'
```

### 4. Get Attached Legal Data for a Case

Retrieve all legal data attached to a specific case.

**Endpoint:** `GET /api/legal-data/attach/case/:caseId/data`

**Request:**
```bash
curl -X GET http://localhost:5002/api/legal-data/attach/case/1/data \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "case_id": 1,
  "data": [
    {
      "id": 1,
      "search_type": "ecourts_cnr",
      "search_query": "CNR-DL-2024-001234",
      "result_data": "{...}",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### 5. Get Attached Legal Data for a Client

Retrieve all legal data attached to a specific client.

**Endpoint:** `GET /api/legal-data/attach/client/:clientId/data`

**Request:**
```bash
curl -X GET http://localhost:5002/api/legal-data/attach/client/1/data \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Frontend Integration Example

### Attach eCourts Data to Case

```javascript
import api from '../utils/api';

const attachLegalDataToCase = async (caseId, cnrNumber) => {
  try {
    const response = await api.post(`/api/legal-data/attach/case/${caseId}/ecourts`, {
      cnr_number: cnrNumber
    });
    
    console.log('Legal data attached:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error attaching legal data:', error);
    throw error;
  }
};
```

### Get Case's Legal Data

```javascript
const getCaseLegalData = async (caseId) => {
  try {
    const response = await api.get(`/api/legal-data/attach/case/${caseId}/data`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching legal data:', error);
    throw error;
  }
};
```

## Database Schema

The legal data is stored in the `legal_data_searches` table:

```sql
CREATE TABLE legal_data_searches (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tenant_id INT NOT NULL,
  case_id INT NULL,          -- Links to specific case
  client_id INT NULL,        -- Links to specific client
  search_type VARCHAR(100),   -- ecourts_cnr, gst_verification, pan_verification
  search_query VARCHAR(255),  -- The query (CNR, GST, PAN)
  result_data LONGTEXT,       -- JSON result from API
  searched_by INT,            -- User ID who searched
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## Permissions Required

- `LEGAL_DATA_SEARCH` - Required for eCourts searches
- `LEGAL_DATA_VERIFY` - Required for GST/PAN verification

## Notes

- All API endpoints require authentication
- The system automatically updates case/client records with the verified information
- Search history is stored for audit purposes
- Mock responses are returned for development (replace with real API keys in production)


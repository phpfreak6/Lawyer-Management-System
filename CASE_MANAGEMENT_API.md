# Case Management API - Complete Reference

## Overview
Full CRUD (Create, Read, Update, Delete) functionality for case management with file upload support.

---

## ✅ All Endpoints

### 1. **LIST ALL CASES** 
**GET** `/api/cases`

Get all cases with optional filters.

**Query Parameters:**
- `status` - Filter by status (active, closed)
- `stage` - Filter by stage (filing, hearing, judgment, closed, appeal)
- `client_id` - Filter by client
- `assigned_to` - Filter by assigned user

**Example Request:**
```bash
GET /api/cases?status=active&stage=hearing
```

**Response:**
```json
{
  "cases": [
    {
      "id": 1,
      "case_number": "CASE-2024-001",
      "client_first_name": "Amit",
      "client_last_name": "Singh",
      "assigned_first_name": "Rajesh",
      "assigned_last_name": "Kumar",
      "case_stage": "hearing",
      "subject": "Breach of Contract",
      "status": "active",
      "priority": "high"
    }
  ]
}
```

---

### 2. **GET SINGLE CASE**
**GET** `/api/cases/:id`

Get detailed information about a specific case.

**Example Request:**
```bash
GET /api/cases/1
```

**Response:**
```json
{
  "case": {
    "id": 1,
    "case_number": "CASE-2024-001",
    "client_id": 1,
    "client_first_name": "Amit",
    "client_last_name": "Singh",
    "client_email": "amit.singh@email.com",
    "client_phone": "9876512345",
    "assigned_first_name": "Rajesh",
    "assigned_last_name": "Kumar",
    "cnr_number": "CNR-DL-2024-001234",
    "court_name": "Delhi High Court",
    "case_type": "Civil",
    "case_stage": "hearing",
    "subject": "Breach of Contract",
    "description": "Dispute regarding commercial contract breach",
    "filing_date": "2024-01-15",
    "next_hearing_date": "2024-12-20 10:00:00",
    "priority": "high",
    "billing_rate": 5000.00,
    "status": "active"
  }
}
```

---

### 3. **CREATE NEW CASE**
**POST** `/api/cases`

Create a new case for a client.

**Request Body:**
```json
{
  "case_number": "CASE-2024-004",
  "client_id": 1,
  "cnr_number": "CNR-DL-2024-004567",
  "court_name": "Delhi High Court",
  "court_type": "High Court",
  "case_type": "Civil",
  "case_stage": "filing",
  "subject": "Property Dispute",
  "description": "Dispute over property ownership rights",
  "filing_date": "2024-12-15",
  "next_hearing_date": "2024-12-30 10:00:00",
  "priority": "medium",
  "assigned_to": 2,
  "billing_rate": 5500.00
}
```

**Required Fields:**
- `case_number` - Unique case identifier
- `client_id` - ID of the client

**Response:**
```json
{
  "case": {
    "id": 4,
    "case_number": "CASE-2024-004",
    "client_id": 1,
    "status": "active",
    "case_stage": "filing"
  },
  "message": "Case created successfully"
}
```

---

### 4. **UPDATE CASE**
**PUT** `/api/cases/:id`

Update case information. You can update any field.

**Example Request:**
```json
PUT /api/cases/1

{
  "case_stage": "judgment",
  "next_hearing_date": "2025-01-15 10:00:00",
  "notes": "Waiting for court judgment",
  "status": "active"
}
```

**Response:**
```json
{
  "case": {
    "id": 1,
    "case_number": "CASE-2024-001",
    "case_stage": "judgment",
    "next_hearing_date": "2025-01-15 10:00:00",
    "notes": "Waiting for court judgment"
  },
  "message": "Case updated successfully"
}
```

---

### 5. **DELETE CASE**
**DELETE** `/api/cases/:id`

Delete a case. Only admins and lawyers can delete cases.

**Example Request:**
```bash
DELETE /api/cases/1
```

**Response:**
```json
{
  "message": "Case deleted successfully"
}
```

---

### 6. **UPDATE CASE STAGE**
**PUT** `/api/cases/:id/stage`

Update the case stage and add notes. Only admins and lawyers can change stages.

**Valid Stages:**
- `filing` - Initial filing
- `hearing` - Court hearing scheduled
- `judgment` - Waiting for judgment
- `closed` - Case closed
- `appeal` - Appeal filed

**Example Request:**
```json
PUT /api/cases/1/stage

{
  "case_stage": "hearing",
  "notes": "Hearing scheduled for next week"
}
```

**Response:**
```json
{
  "case": {
    "id": 1,
    "case_stage": "hearing",
    "notes": "Hearing scheduled for next week"
  },
  "message": "Case stage updated successfully"
}
```

**Note:** This automatically creates a communication log entry for the stage change.

---

### 7. **GET CASE STAGE HISTORY**
**GET** `/api/cases/:id/stage-history`

Get the history of all stage changes for a case.

**Example Request:**
```bash
GET /api/cases/1/stage-history
```

**Response:**
```json
{
  "history": [
    {
      "id": 1,
      "subject": "Case Stage Updated",
      "content": "Case stage changed to: hearing",
      "user_name": "Rajesh Kumar",
      "timestamp": "2024-12-15T10:30:00.000Z"
    }
  ]
}
```

---

### 8. **GET CASE DOCUMENTS**
**GET** `/api/cases/:id/documents`

Get all documents uploaded for a case.

**Example Request:**
```bash
GET /api/cases/1/documents
```

**Response:**
```json
{
  "documents": [
    {
      "id": 1,
      "case_id": 1,
      "document_type": "contract",
      "title": "Original Contract",
      "description": "Original signed contract document",
      "file_path": "uploads/file-12345.pdf",
      "file_size": 102400,
      "mime_type": "application/pdf",
      "uploaded_by_name": "Rajesh Kumar",
      "created_at": "2024-12-01T09:00:00.000Z"
    }
  ]
}
```

---

### 9. **UPLOAD DOCUMENT TO CASE**
**POST** `/api/documents/case/:case_id`

Upload a legal document, petition, or evidence file to a case.

**Required:**
- `multipart/form-data` with file field

**Form Fields:**
- `file` - The document file (PDF, images, etc.)
- `document_type` - Type of document (contract, petition, evidence, etc.)
- `title` - Document title
- `description` - Document description (optional)
- `tags` - Comma-separated tags (optional)

**Example Request:**
```bash
POST /api/documents/case/1

Form Data:
file: [select file]
document_type: contract
title: Original Contract
description: Original signed contract document
tags: contract, important, original
```

**Response:**
```json
{
  "document": {
    "id": 1,
    "case_id": 1,
    "document_type": "contract",
    "title": "Original Contract",
    "file_path": "uploads/file-1234567890.pdf",
    "file_size": 102400,
    "mime_type": "application/pdf",
    "uploaded_by": 2,
    "created_at": "2024-12-01T09:00:00.000Z"
  },
  "message": "Document uploaded successfully"
}
```

---

### 10. **DOWNLOAD DOCUMENT**
**GET** `/api/documents/:id/download`

Download a specific document.

**Example Request:**
```bash
GET /api/documents/1/download
```

**Response:** Downloads the file

---

### 11. **SEARCH DOCUMENTS**
**GET** `/api/documents/search`

Search documents by text content (uses OCR if available).

**Query Parameters:**
- `q` - Search query (required)
- `case_id` - Filter by case (optional)

**Example Request:**
```bash
GET /api/documents/search?q=contract&case_id=1
```

**Response:**
```json
{
  "documents": [
    {
      "id": 1,
      "title": "Original Contract",
      "case_number": "CASE-2024-001",
      "case_subject": "Breach of Contract"
    }
  ],
  "count": 1
}
```

---

### 12. **PROCESS DOCUMENT FOR OCR**
**POST** `/api/documents/:id/process-ocr`

Process a document for text extraction (OCR). Only admins and lawyers can trigger this.

**Example Request:**
```bash
POST /api/documents/1/process-ocr
```

**Response:**
```json
{
  "message": "Document processed successfully",
  "extracted_text_length": 1523
}
```

---

### 13. **GET CASE TIMELINE**
**GET** `/api/cases/:id/timeline`

Get all tasks and calendar events for a case.

**Example Request:**
```bash
GET /api/cases/1/timeline
```

**Response:**
```json
{
  "tasks": [
    {
      "id": 1,
      "title": "Prepare hearing documents",
      "status": "pending",
      "assigned_name": "Priya Sharma",
      "due_date": "2024-12-18T14:00:00.000Z"
    }
  ],
  "events": [
    {
      "id": 1,
      "title": "Hearing - Case Number: CASE-2024-001",
      "event_type": "hearing",
      "start_datetime": "2024-12-20T10:00:00.000Z",
      "location": "Delhi High Court, Court Room 3"
    }
  ]
}
```

---

## Case Status Options

### Status
- `active` - Case is active
- `closed` - Case is closed
- `on_hold` - Case is on hold

### Case Stage
- `filing` - Initial filing
- `hearing` - Court hearing scheduled
- `judgment` - Waiting for judgment
- `closed` - Case closed
- `appeal` - Appeal filed

### Priority
- `urgent` - Urgent priority
- `high` - High priority
- `medium` - Medium priority (default)
- `low` - Low priority

---

## Case Types

Common case types:
- `Civil` - Civil cases
- `Criminal` - Criminal cases
- `Family` - Family law cases
- `Corporate` - Corporate cases
- `Property` - Property disputes

---

## Authentication

All endpoints require JWT authentication:

```bash
Authorization: Bearer <your_jwt_token>
```

Get a token by logging in:
```bash
POST /api/auth/login
{
  "email": "lawyer@lawfirm.com",
  "password": "lawyer123"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Case number and client are required"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "error": "Access denied"
}
```

### 404 Not Found
```json
{
  "error": "Case not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Complete CRUD Summary

✅ **CREATE** - `POST /api/cases` - Create new case
✅ **READ** - `GET /api/cases` - List all cases
✅ **READ** - `GET /api/cases/:id` - Get single case
✅ **UPDATE** - `PUT /api/cases/:id` - Update case
✅ **DELETE** - `DELETE /api/cases/:id` - Delete case

Plus additional features:
- Case stage management
- Stage history tracking
- Document upload
- Document search
- Timeline tracking
- OCR text extraction

**All Create, Edit, Delete functionality is fully implemented and working!** ✓


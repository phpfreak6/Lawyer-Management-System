# Kleopatra eCourts India API Integration

This document describes the integration with the Kleopatra Court API for accessing Indian judiciary data.

## API Documentation
Reference: https://e-courts-india-api.readme.io/

## Base URL
```
https://court-api.kleopatra.io
```

## Configured Endpoints

### 1. Get High Court States
**Endpoint:** `GET /api/legal-data/ecourts/high-court/states`

**Description:** Retrieves all states with High Courts

**Original API:** `GET https://court-api.kleopatra.io/api/core/static/high-court/states`

**Usage:**
```bash
curl -X GET http://localhost:5002/api/legal-data/ecourts/high-court/states \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Get District Court States
**Endpoint:** `GET /api/legal-data/ecourts/district-court/states`

**Description:** Retrieves all states with District Courts

**Original API:** `GET https://court-api.kleopatra.io/api/core/static/district-court/states`

**Usage:**
```bash
curl -X GET http://localhost:5002/api/legal-data/ecourts/district-court/states \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Get High Court Benches
**Endpoint:** `POST /api/legal-data/ecourts/high-court/benches`

**Description:** Retrieves benches for a specific High Court state

**Original API:** `POST https://court-api.kleopatra.io/api/core/static/high-court/benches`

**Request Body:**
```json
{
  "state_code": "MH"  // Maharashtra, DL for Delhi, etc.
}
```

**Usage:**
```bash
curl -X POST http://localhost:5002/api/legal-data/ecourts/high-court/benches \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"state_code": "MH"}'
```

### 4. Lookup Case by CNR
**Endpoint:** `POST /api/legal-data/ecourts/lookup-cnr`

**Description:** Look up case by CNR number using Kleopatra API

**Request Body:**
```json
{
  "cnr_number": "CNR-XXXX-XXXX-XXXX",
  "court_level": "district"  // or "high"
}
```

**Usage:**
```bash
curl -X POST http://localhost:5002/api/legal-data/ecourts/lookup-cnr \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cnr_number": "CNR-DL-CT01-123456-2024",
    "court_level": "district"
  }'
```

## Environment Variables

Add these to your `.env` file:

```env
# Kleopatra Court API Configuration
KLEOPATRA_API_URL=https://court-api.kleopatra.io
KLEOPATRA_API_KEY=your_api_key_here

# Or use ECOURTS_API_KEY for the Bearer token
ECOURTS_API_KEY=your_api_key_here
```

## Integration in Frontend

```javascript
import api from '../utils/api';

// Get High Court states
const getHighCourtStates = async () => {
  try {
    const response = await api.get('/api/legal-data/ecourts/high-court/states');
    return response.data.result;
  } catch (error) {
    console.error('Error fetching High Court states:', error);
    throw error;
  }
};

// Get District Court states
const getDistrictCourtStates = async () => {
  try {
    const response = await api.get('/api/legal-data/ecourts/district-court/states');
    return response.data.result;
  } catch (error) {
    console.error('Error fetching District Court states:', error);
    throw error;
  }
};

// Get High Court benches for a state
const getHighCourtBenches = async (stateCode) => {
  try {
    const response = await api.post('/api/legal-data/ecourts/high-court/benches', {
      state_code: stateCode
    });
    return response.data.result;
  } catch (error) {
    console.error('Error fetching High Court benches:', error);
    throw error;
  }
};
```

## Supported API Categories

According to the Kleopatra API documentation, the following endpoints are available:

### District Court - Static
- Get all states
- Get districts
- Get complexes
- Get courts

### High Court - Static
- Get all states ✅ (Implemented)
- Get benches ✅ (Implemented)

### District Court - Live
- Lookup case by CNR ✅ (Implemented)
- Search by party name
- Search by advocate name
- Search by filing number
- Search by advocate number
- Get cause list

### High Court - Live
- Lookup case by CNR ✅ (Implemented)
- Search by party name
- Search by advocate name
- Search by filing number

## Notes

- All endpoints require authentication with a Bearer token
- The API uses timeout of 15 seconds by default
- Error handling is implemented with proper logging
- Results can be stored in the `legal_data_searches` table for audit purposes


# Supplier Questionnaire and Data Quality Rating API Integration

## Overview

This document describes the complete API integration for the Supplier Questionnaire and Data Quality Rating (DQR) features. These two components are interlinked - users first complete the Supplier Questionnaire, which then enables them to perform Data Quality Rating assessments.

## Architecture

### File Structure

```
src/
├── config/
│   └── questionnaireConfig.ts         # Centralized configuration for questions, options, and DQR settings
├── lib/
│   ├── supplierQuestionnaireService.ts # API service layer
│   └── authService.ts                  # Authentication service (existing)
└── pages/
    ├── SupplierQuestionnaire.tsx       # Questionnaire form component
    └── DataQualityRating.tsx           # DQR assessment component
```

## Key Features

### 1. Centralized Configuration (`questionnaireConfig.ts`)

All questions, options, field keys, and DQR configurations are maintained in one place for easy updates.

**What's included:**
- `FIELD_KEYS`: Maps UI field names to API field names
- `QUESTION_OPTIONS`: All dropdown and checkbox options
- `DQR_CONFIG`: Data Quality Rating configuration (TeR, TiR, GR, PDS, C)
- `QUESTIONNAIRE_SECTIONS`: Section metadata with icons
- `GDPR_MESSAGE`: GDPR compliance message

**Benefits:**
- Single source of truth for all questionnaire data
- Easy to update questions and options
- Consistent API payload structure
- Simplified maintenance

### 2. API Service Layer (`supplierQuestionnaireService.ts`)

Handles all API communication with comprehensive error handling.

**Available Methods:**

#### Questionnaire Operations
- `createQuestionnaire(data)` - Create new questionnaire
  - Endpoint: `POST /api/create-supplier-input-questions`
  - Returns: `{ success, message, data: { sgiq_id, ... } }`

- `updateQuestionnaire(sgiq_id, data)` - Update existing questionnaire
  - Endpoint: `POST /api/update-supplier-input-questions`
  - Returns: `{ success, message, data }`

- `getQuestionnaireById(sgiq_id, user_id)` - Fetch specific questionnaire
  - Endpoint: `GET /api/get-by-id-supplier-input-questions`
  - Returns: `{ success, message, data }`

- `listQuestionnaires()` - Get all questionnaires
  - Endpoint: `GET /api/supplier-input-questions-list`
  - Returns: `{ success, message, data: [] }`

#### DQR Operations
- `getDQRDetailsById(sgiq_id)` - Fetch DQR data with supplier questions
  - Endpoint: `GET /api/dqr-rating/get-by-id?sgiq_id=XXX`
  - Returns: `{ success, message, data: { supplier_questions, dqr_ratings } }`

- `listDQRRatings()` - Get all DQR ratings
  - Endpoint: `GET /api/dqr-rating/list`
  - Returns: `{ success, message, data: [] }`

#### Draft Management (Local Storage)
- `saveDraft(data, stepIndex)` - Save form progress locally
- `loadDraft()` - Load saved draft
- `clearDraft()` - Clear saved draft after submission

### 3. Supplier Questionnaire Component

**Key Features:**

1. **Multi-Step Form**
   - 10 sections covering all aspects from General Info to Additional Notes
   - Progress tracking with visual indicators
   - Step-by-step validation

2. **Form State Management**
   - Dynamic form data handling
   - Real-time validation
   - Error display per field

3. **Auto-Save Functionality**
   - Automatic draft saving to localStorage
   - Saves after 2 seconds of inactivity
   - Manual "Save Draft" button
   - Draft restoration on page reload

4. **API Integration**
   - `buildAPIPayload()` - Transforms form data to API format
   - `handleSubmit()` - Submits or updates questionnaire
   - Proper error handling and user feedback

5. **Success Flow**
   - Success modal after submission
   - Option to navigate to DQR or Dashboard
   - Questionnaire ID passed to DQR component

**Data Structure:**
The component maps UI fields to API structure:
```javascript
{
  bom_pcf_id: string,
  general_info: { ... },
  material_composition: { ... },
  energy_manufacturing: { ... },
  packaging: { ... },
  transportation_logistics: { ... },
  waste_by_products: { ... },
  end_of_life_circularity: { ... },
  emission_factors: { ... },
  certification_standards: { ... },
  additional_notes: { ... }
}
```

### 4. Data Quality Rating Component

**Key Features:**

1. **URL Parameter Integration**
   - Receives `sgiq_id` from URL query parameters
   - Example: `/data-quality-rating?sgiq_id=01K8Q9PF412CG7SVF62YRGBCDV`

2. **Data Loading**
   - Fetches supplier questionnaire data on mount
   - Populates data points dynamically from supplier data
   - Loading and error states with proper UI feedback

3. **Dynamic Data Points Generation**
   - `generateDataPoints()` - Creates assessment items from questionnaire data
   - Extracts material composition data
   - Extracts energy consumption data
   - Falls back to default data points if no data available

4. **DQR Assessment Interface**
   - Side panel for detailed assessment
   - Five DQR indicators: TeR, TiR, GR, PDS, C
   - Real-time rating calculations
   - Color-coded quality indicators

5. **Configuration Integration**
   - Uses `DQR_CONFIG` for all dropdown options
   - Consistent rating scales across the application
   - Easy to update rating criteria

**DQR Indicators:**

- **TeR** (Technological Representativeness)
  - Level 1: Applicable/Derived/Not Applicable
  - Level 2: Site specific/Similar process/Industry average/Proxy/Mismatch
  - Rating: 1 (best) to 5 (worst)

- **TiR** (Temporal Representativeness)
  - Level 1: Applicable/Derived/Not Applicable
  - Level 2: Data age ranges
  - Rating: 1 (< 1 year) to 5 (> 10 years)

- **GR** (Geographical Representativeness)
  - Level 1: Applicable/Derived/Not Applicable
  - Level 2: Site Specific/Country/Regional/Global/Mismatch
  - Rating: 1 (site specific) to 5 (mismatch)

- **PDS** (Primary Data Share)
  - Options: Primary/Secondary/Proxy
  - Indicates data source quality

- **C** (Completeness)
  - Options: Required/Optional
  - Marks mandatory data points

## Workflow

1. **User completes Supplier Questionnaire**
   - Fills multi-step form
   - Form auto-saves to localStorage
   - Can manually save draft at any time
   - Validates required fields before submission

2. **Questionnaire Submission**
   - Data transformed to API format via `buildAPIPayload()`
   - Sent to backend via `createQuestionnaire()` or `updateQuestionnaire()`
   - Backend generates `sgiq_id` (Supplier General Info Questions ID)
   - Success modal displays with options

3. **Navigation to DQR**
   - User clicks "Continue to DQR" button
   - Navigates to `/data-quality-rating?sgiq_id=XXX`
   - DQR component loads questionnaire data

4. **Data Quality Assessment**
   - Data points generated from questionnaire responses
   - User assesses each data point against DQR indicators
   - Ratings saved (to be implemented in backend)
   - Quality metrics calculated and displayed

## API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/create-supplier-input-questions` | POST | Create new questionnaire |
| `/api/update-supplier-input-questions` | POST | Update existing questionnaire |
| `/api/get-by-id-supplier-input-questions` | GET | Get questionnaire by ID |
| `/api/supplier-input-questions-list` | GET | List all questionnaires |
| `/api/dqr-rating/get-by-id` | GET | Get DQR data with supplier questions |
| `/api/dqr-rating/list` | GET | List all DQR ratings |

## Authentication

All API calls include authentication headers via `authService.getToken()`:
```javascript
headers: {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`
}
```

## Error Handling

1. **Network Errors**
   - Try-catch blocks around all API calls
   - User-friendly error messages
   - Console logging for debugging

2. **Validation Errors**
   - Field-level validation
   - Visual error indicators (red borders, error messages)
   - Prevents form submission until resolved

3. **Loading States**
   - Loading spinners during API calls
   - Disabled buttons during submission
   - Skeleton screens for data loading

4. **Empty States**
   - Fallback data when API returns empty
   - Helpful messages for missing data
   - Navigation options to retry or go back

## Local Storage Usage

**Draft Data Structure:**
```javascript
{
  formData: {...},      // Complete form state
  currentStep: 0,       // Current step index
  savedAt: "ISO date"   // Timestamp
}
```

**Storage Key:** `supplier_questionnaire_draft`

## Configuration Updates

To add or modify questions:

1. **Update `questionnaireConfig.ts`**
   - Add field key to `FIELD_KEYS`
   - Add options to `QUESTION_OPTIONS` if dropdown/checkbox
   - No code changes needed in components

2. **Update API Payload Builder**
   - Modify `buildAPIPayload()` in SupplierQuestionnaire.tsx
   - Map new fields to API structure

3. **Update DQR Data Points**
   - Modify `generateDataPoints()` in DataQualityRating.tsx
   - Extract new fields from supplier data

## Testing Recommendations

1. **Form Functionality**
   - Test all input fields
   - Verify validation rules
   - Check draft save/restore
   - Test multi-step navigation

2. **API Integration**
   - Test create and update operations
   - Verify error handling
   - Check authentication flow
   - Test with different user roles

3. **DQR Workflow**
   - Verify data loading from questionnaire
   - Test all DQR indicator selections
   - Check rating calculations
   - Verify color coding and UI feedback

4. **End-to-End**
   - Complete full questionnaire
   - Submit and verify backend response
   - Navigate to DQR page
   - Complete assessment
   - Check data persistence

## Future Enhancements

1. **DQR Save Functionality**
   - Implement API endpoint for saving DQR ratings
   - Add batch save for multiple data points
   - Progress tracking for DQR completion

2. **Validation Improvements**
   - Cross-field validation
   - Conditional required fields
   - Business rule validation

3. **File Upload**
   - Implement actual file upload for MSDS, documents
   - Progress indicators
   - File type and size validation

4. **Reporting**
   - Export questionnaire as PDF
   - Generate DQR quality reports
   - Summary dashboards

5. **Collaboration**
   - Multi-user questionnaire filling
   - Comments and notes
   - Approval workflows

## Troubleshooting

**Issue: Draft not saving**
- Check browser localStorage quota
- Verify no errors in console
- Clear old drafts if needed

**Issue: API calls failing**
- Verify authentication token
- Check network connectivity
- Confirm API base URL is correct
- Review CORS settings

**Issue: DQR page not loading data**
- Verify `sgiq_id` in URL
- Check user authentication
- Confirm questionnaire exists
- Review API response structure

**Issue: Form validation not working**
- Check `validateCurrentStep()` logic
- Verify field names match
- Test with different data types

## Support

For questions or issues:
- Check console for error messages
- Review API responses in Network tab
- Verify configuration in `questionnaireConfig.ts`
- Check authentication state

---

**Last Updated:** November 2025
**Version:** 1.0











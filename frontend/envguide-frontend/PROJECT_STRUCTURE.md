# EnviGuide Frontend - Complete Project Structure

## Overview

**EnviGuide** is a comprehensive environmental management platform focused on Product Carbon Footprint (PCF) tracking, supplier questionnaires, data quality assessment, and sustainability reporting. The frontend is built as a modern React application using TypeScript, Vite, and Tailwind CSS.

**Status**: In active development

**Base API URL**: `https://enviguide.nextechltd.in`

---

## Technology Stack

### Core Technologies
- **React 19.1.1** - UI framework
- **TypeScript 5.8.3** - Type safety
- **Vite 7.1.3** - Build tool and dev server
- **React Router DOM 7.8.0** - Client-side routing

### UI & Styling
- **Tailwind CSS 4.1.11** - Utility-first CSS framework
- **Ant Design 5.27.6** - Component library (partially used)
- **Lucide React 0.539.0** - Icon library
- **clsx & tailwind-merge** - Conditional class utilities

### HTTP & Utilities
- **Axios 1.13.2** - HTTP client (used in some services)
- **Fetch API** - Primary HTTP client (used in authService)
- **QRCode 1.5.4** - QR code generation for MFA

---

## Project Architecture

### Directory Structure

```
src/
├── components/          # Reusable UI components
│   ├── ComingSoon.tsx
│   ├── Header.tsx
│   ├── Layout.tsx
│   ├── LoadingSpinner.tsx
│   ├── Logo.tsx
│   ├── Notification.tsx
│   ├── ProtectedRoute.tsx
│   └── Sidebar.tsx
│
├── config/             # Configuration files
│   ├── menu.ts                    # Navigation menu structure
│   ├── questionnaireConfig.ts    # Supplier questionnaire config
│   └── questionnaireSchema.ts    # Form validation schemas
│
├── contexts/           # React Context providers
│   └── AuthContext.tsx           # Authentication state management
│
├── features/           # Feature-specific components
│   ├── pcf-create/               # PCF creation wizard steps
│   │   ├── BasicInformationStep.tsx
│   │   ├── DocumentationStep.tsx
│   │   ├── ProductDetailsStep.tsx
│   │   └── ReviewSubmitStep.tsx
│   └── supplier-questionnaire/   # Supplier questionnaire components
│       ├── DynamicQuestionnaireForm.tsx
│       ├── GeneralInfo.tsx
│       ├── OrganizationDetails.tsx
│       ├── ProductDetails.tsx
│       ├── Scope1.tsx
│       ├── Scope2.tsx
│       ├── Scope3.tsx
│       ├── Scope4.tsx
│       └── SupplierQuestionnaire.tsx
│
├── lib/                # Service layer & utilities
│   ├── authService.ts                    # Authentication API
│   ├── dataSetupService.ts              # Data setup operations
│   ├── documentMasterService.ts         # Document management API
│   ├── ownEmissionService.ts            # Emission tracking API
│   ├── pcfService.ts                    # PCF BOM operations
│   ├── productService.ts                # Product CRUD operations
│   ├── supplierQuestionnaireService.ts  # Supplier questionnaire API
│   ├── taskService.ts                   # Task management API
│   └── utils.ts                         # Utility functions
│
├── pages/              # Page components
│   ├── auth/                          # Authentication pages
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   ├── ForgotPassword.tsx
│   │   ├── ResetPassword.tsx
│   │   └── MFAVerification.tsx
│   │
│   ├── settings/                      # Settings pages
│   │   ├── Components.tsx
│   │   ├── Industry.tsx
│   │   ├── Products.tsx
│   │   ├── Users.tsx
│   │   ├── UsersCreate.tsx
│   │   └── UsersEdit.tsx
│   │
│   └── [Feature Pages]                # Main application pages
│       ├── Dashboard.tsx
│       ├── PCFRequest.tsx
│       ├── PCFRequestCreate.tsx
│       ├── PCFRequestView.tsx
│       ├── ProductPortfolio.tsx
│       ├── AllProducts.tsx
│       ├── ProductCreate.tsx
│       ├── ProductView.tsx
│       ├── ProductEdit.tsx
│       ├── Projects.tsx
│       ├── ActiveProjects.tsx
│       ├── ArchivedProjects.tsx
│       ├── ComponentsMaster.tsx
│       ├── DocumentMaster.tsx
│       ├── DocumentMasterCreate.tsx
│       ├── TaskManagement.tsx
│       ├── TaskCreate.tsx
│       ├── TaskView.tsx
│       ├── Reports.tsx
│       ├── SupplierQuestionnaire.tsx
│       ├── SupplierQuestionnaireList.tsx
│       ├── DataQualityRating.tsx
│       ├── DataQualityRatingList.tsx
│       └── [Legacy pages - may be deprecated]
│           ├── VisitorManagement.tsx
│           ├── SuiteManagement.tsx
│           ├── Bookings.tsx
│           ├── HardwareManagement.tsx
│           ├── DocumentsManagement.tsx
│           └── Settings.tsx
│
├── routes/             # Routing configuration
│   └── index.tsx                      # Main router setup
│
├── types/              # TypeScript type definitions
│   └── index.ts                       # Shared types & interfaces
│
├── App.tsx             # Root component
├── main.tsx            # Application entry point
├── index.css           # Global styles
└── vite-env.d.ts       # Vite type declarations
```

---

## Core Features & Modules

### 1. Authentication System
**Location**: `src/pages/auth/`, `src/contexts/AuthContext.tsx`, `src/lib/authService.ts`

**Features**:
- User login with email/password
- Multi-Factor Authentication (MFA) with QR code setup
- User registration/signup
- Password reset flow (forgot → reset)
- Protected routes with authentication checks
- Token-based authentication stored in localStorage
- Role-based access control (prepared, not fully implemented)

**Key Components**:
- `Login.tsx` - Login form with MFA detection
- `MFAVerification.tsx` - MFA token verification with QR code display
- `Signup.tsx` - User registration
- `ForgotPassword.tsx` / `ResetPassword.tsx` - Password recovery
- `AuthContext.tsx` - Global auth state management
- `ProtectedRoute.tsx` - Route guard component

**API Endpoints**:
- `POST /api/user/login` - Login
- `POST /api/user/verify` - MFA verification
- `POST /api/user/create` - User registration
- `POST /api/user/forgot/password` - Request password reset
- `POST /api/user/reset/password` - Reset password

---

### 2. Product Carbon Footprint (PCF) Management
**Location**: `src/pages/PCFRequest*.tsx`, `src/lib/pcfService.ts`, `src/features/pcf-create/`

**Features**:
- PCF Request listing with pagination
- Create new PCF requests
- View PCF request details
- Multi-step PCF creation wizard:
  - Basic Information
  - Product Details
  - Documentation
  - Review & Submit

**Key Components**:
- `PCFRequest.tsx` - List view
- `PCFRequestCreate.tsx` - Creation wizard
- `PCFRequestView.tsx` - Detail view
- `BasicInformationStep.tsx`, `ProductDetailsStep.tsx`, etc.

**API Service**: `pcfService.ts`
- `getPCFBOMList()` - Fetch paginated PCF BOM list
- Additional CRUD operations (in development)

---

### 3. Product Portfolio Management
**Location**: `src/pages/ProductPortfolio*.tsx`, `src/lib/productService.ts`

**Features**:
- Product portfolio overview
- List all products with filtering
- Create new products
- View product details
- Edit existing products
- Product categorization (category, sub-category)
- Manufacturing process tracking
- Life cycle stage management

**Key Components**:
- `ProductPortfolio.tsx` - Portfolio overview
- `AllProducts.tsx` - Product list with search/filter
- `ProductCreate.tsx` - Product creation form
- `ProductView.tsx` - Product detail view
- `ProductEdit.tsx` - Product editing form

**API Service**: `productService.ts`
- Uses Axios for HTTP requests
- CRUD operations for products
- Category and sub-category management
- Manufacturing process and life cycle stage data

---

### 4. Supplier Questionnaire System
**Location**: `src/pages/SupplierQuestionnaire*.tsx`, `src/features/supplier-questionnaire/`, `src/lib/supplierQuestionnaireService.ts`, `src/config/questionnaireConfig.ts`

**Features**:
- Multi-step questionnaire form (10+ sections)
- Auto-save draft functionality (localStorage)
- Dynamic form generation from configuration
- Comprehensive supplier data collection:
  - General Information
  - Organization Details
  - Product Details
  - Material Composition
  - Energy & Manufacturing
  - Packaging
  - Transportation & Logistics
  - Waste & By-products
  - End of Life & Circularity
  - Emission Factors
  - Certifications & Standards
  - Additional Notes

**Key Components**:
- `SupplierQuestionnaire.tsx` - Main questionnaire form
- `SupplierQuestionnaireList.tsx` - List of submitted questionnaires
- `DynamicQuestionnaireForm.tsx` - Dynamic form renderer
- Section-specific components (GeneralInfo, OrganizationDetails, etc.)

**Configuration**: `questionnaireConfig.ts`
- Centralized configuration for all questions
- Field mappings (UI → API)
- Dropdown options
- DQR configuration

**API Service**: `supplierQuestionnaireService.ts`
- `createQuestionnaire()` - Create new questionnaire
- `updateQuestionnaire()` - Update existing
- `getQuestionnaireById()` - Fetch by ID
- `listQuestionnaires()` - List all
- Draft management (localStorage)

**Workflow**:
1. User fills multi-step questionnaire
2. Auto-saves to localStorage every 2 seconds
3. Manual "Save Draft" option available
4. Submit → Backend generates `sgiq_id`
5. Option to navigate to Data Quality Rating

---

### 5. Data Quality Rating (DQR)
**Location**: `src/pages/DataQualityRating*.tsx`

**Features**:
- Assess data quality from supplier questionnaires
- Five DQR indicators:
  - **TeR** (Technological Representativeness)
  - **TiR** (Temporal Representativeness)
  - **GR** (Geographical Representativeness)
  - **PDS** (Primary Data Share)
  - **C** (Completeness)
- Dynamic data point generation from questionnaire responses
- Color-coded quality indicators
- Side panel for detailed assessment

**Key Components**:
- `DataQualityRating.tsx` - Main DQR assessment interface
- `DataQualityRatingList.tsx` - List of DQR assessments

**Integration**:
- Receives `sgiq_id` from URL query parameters
- Fetches supplier questionnaire data
- Generates data points dynamically
- Uses `DQR_CONFIG` from `questionnaireConfig.ts`

**API Service**: `supplierQuestionnaireService.ts`
- `getDQRDetailsById()` - Fetch DQR data with supplier questions
- `listDQRRatings()` - List all DQR ratings

---

### 6. Project Management
**Location**: `src/pages/Projects*.tsx`

**Features**:
- Project overview
- Active projects list
- Archived projects list
- Project tracking and management

**Key Components**:
- `Projects.tsx` - Main projects page
- `ActiveProjects.tsx` - Active projects view
- `ArchivedProjects.tsx` - Archived projects view

---

### 7. Components Master
**Location**: `src/pages/ComponentsMaster.tsx`

**Features**:
- Component catalog management
- Component categorization
- Component details tracking

---

### 8. Document Master
**Location**: `src/pages/DocumentMaster*.tsx`, `src/lib/documentMasterService.ts`

**Features**:
- Document listing
- Create new documents
- View document details
- Edit documents
- Document categorization and management

**Key Components**:
- `DocumentMaster.tsx` - Document list
- `DocumentMasterCreate.tsx` - Create/Edit/View form

**API Service**: `documentMasterService.ts`

---

### 9. Task Management
**Location**: `src/pages/TaskManagement*.tsx`, `src/lib/taskService.ts`

**Features**:
- Task listing
- Create new tasks
- View task details
- Task assignment and tracking

**Key Components**:
- `TaskManagement.tsx` - Task list
- `TaskCreate.tsx` - Task creation form
- `TaskView.tsx` - Task detail view

**API Service**: `taskService.ts`

---

### 10. Reports
**Location**: `src/pages/Reports.tsx`

**Features**:
- Report generation
- Data visualization
- Export capabilities

**Status**: In development (likely placeholder)

---

### 11. Settings
**Location**: `src/pages/settings/`, `src/pages/Settings.tsx`

**Features**:
- User management (list, create, edit)
- Product settings
- Component settings
- Industry settings
- Role and department management

**Key Components**:
- `Users.tsx` - User list
- `UsersCreate.tsx` - Create user
- `UsersEdit.tsx` - Edit user
- `Products.tsx` - Product settings
- `Components.tsx` - Component settings
- `Industry.tsx` - Industry settings

**API Integration**: Uses `authService.ts` for:
- `getDepartments()` - Fetch departments
- `getRoles()` - Fetch roles
- `createRole()` / `updateRole()` - Role management
- `createDepartment()` / `updateDepartment()` - Department management

---

## Application Flow

### Authentication Flow
```
1. User visits app → Redirected to /login if not authenticated
2. User enters credentials → POST /api/user/login
3. If MFA required → Redirect to /mfa-verification
   - Display QR code or manual setup code
   - User sets up authenticator app
   - User enters 6-digit token → POST /api/user/verify
4. On success → Store token & user in localStorage
5. Redirect to /dashboard
```

### Supplier Questionnaire → DQR Flow
```
1. User navigates to /supplier-questionnaire/new
2. Fills multi-step form (auto-saves to localStorage)
3. Submits form → POST /api/create-supplier-input-questions
4. Backend returns sgiq_id
5. Success modal → Option to "Continue to DQR"
6. Navigate to /data-quality-rating?sgiq_id=XXX
7. DQR component loads questionnaire data
8. User assesses data quality using DQR indicators
```

### Product Management Flow
```
1. User navigates to /product-portfolio
2. Can view all products → /product-portfolio/all-products
3. Create new product → /product-portfolio/new
4. View product → /product-portfolio/view/:id
5. Edit product → /product-portfolio/edit/:id
```

---

## State Management

### Authentication State
- **Context**: `AuthContext.tsx`
- **Storage**: localStorage (token, user)
- **State**:
  - `isAuthenticated: boolean`
  - `user: User | null`
  - `token: string | null`
  - `loading: boolean`

### Form State
- **Local component state** (useState hooks)
- **Draft persistence**: localStorage for supplier questionnaire
- **No global state management library** (Redux, Zustand, etc.)

---

## Routing Structure

### Public Routes
- `/login` - Login page
- `/signup` - Registration
- `/forgot-password` - Password reset request
- `/reset-password?token=XXX` - Password reset form
- `/mfa-verification` - MFA setup/verification

### Protected Routes (require authentication)
All routes under `/` are protected by `ProtectedRoute` component:

- `/dashboard` - Dashboard (currently "Coming Soon")
- `/pcf-request` - PCF request list
- `/pcf-request/new` - Create PCF request
- `/pcf-request/:id` - View PCF request
- `/product-portfolio` - Product portfolio overview
- `/product-portfolio/all-products` - All products list
- `/product-portfolio/new` - Create product
- `/product-portfolio/view/:id` - View product
- `/product-portfolio/edit/:id` - Edit product
- `/projects` - Projects overview
- `/projects/active` - Active projects
- `/projects/archived` - Archived projects
- `/components-master` - Components master
- `/document-master` - Document master list
- `/document-master/new` - Create document
- `/document-master/edit/:id` - Edit document
- `/document-master/view/:id` - View document
- `/task-management` - Task list
- `/task-management/new` - Create task
- `/task-management/view/:id` - View task
- `/reports` - Reports
- `/supplier-questionnaire` - Questionnaire list
- `/supplier-questionnaire/new` - Create questionnaire
- `/supplier-questionnaire/edit` - Edit questionnaire
- `/supplier-questionnaire/view` - View questionnaire
- `/data-quality-rating` - DQR list
- `/data-quality-rating/view?sgiq_id=XXX` - DQR assessment
- `/settings` - Settings overview
- `/settings/users` - User management
- `/settings/users/create` - Create user
- `/settings/users/edit/:userId` - Edit user
- `/settings/products` - Product settings
- `/settings/components` - Component settings
- `/settings/industry` - Industry settings

---

## API Integration Pattern

### Service Layer Architecture
All API calls are abstracted into service files in `src/lib/`:

1. **Service Class Pattern** (e.g., `authService.ts`, `pcfService.ts`)
   - Singleton pattern
   - Methods for each API endpoint
   - Error handling
   - Token management via `authService.getToken()`

2. **Axios Pattern** (e.g., `productService.ts`)
   - Axios instance with base URL
   - Request/response interceptors (if needed)
   - Type-safe interfaces

### Common Patterns

**Headers**:
```typescript
headers: {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}` // or just `${token}`
}
```

**Error Handling**:
- Try-catch blocks
- User-friendly error messages
- Console logging for debugging
- Handles both `{status: true}` and `{success: true}` response formats

**Response Format**:
```typescript
{
  status: boolean | success: boolean,
  message: string,
  code?: number,
  data?: T
}
```

---

## Configuration Files

### `src/config/menu.ts`
- Defines navigation menu structure
- Menu items with icons, paths, and children
- Used by `Sidebar.tsx` component

### `src/config/questionnaireConfig.ts`
- Centralized questionnaire configuration
- Field mappings (UI → API)
- Dropdown options
- DQR configuration (TeR, TiR, GR, PDS, C)
- Section metadata

### `src/config/questionnaireSchema.ts`
- Form validation schemas (if using a validation library)

---

## UI Components

### Layout Components
- **Layout.tsx** - Main application layout (sidebar + header + content)
- **Sidebar.tsx** - Collapsible navigation sidebar
- **Header.tsx** - Top header bar
- **ProtectedRoute.tsx** - Route guard

### Reusable Components
- **LoadingSpinner.tsx** - Loading indicator
- **Notification.tsx** - Toast notifications
- **ComingSoon.tsx** - Placeholder for incomplete features
- **Logo.tsx** - Application logo

---

## Styling Approach

### Tailwind CSS
- Utility-first CSS framework
- Custom color scheme (blue theme)
- Responsive design (mobile-first)
- Dark mode support (prepared, not fully implemented)

### Component Styling
- Inline Tailwind classes
- `cn()` utility for conditional classes (from `utils.ts`)
- No CSS modules or styled-components

---

## Development Status

### Completed Features
✅ Authentication system (login, MFA, signup, password reset)
✅ Protected routes
✅ Supplier questionnaire (multi-step form with auto-save)
✅ Data Quality Rating (DQR) assessment
✅ Product management (CRUD operations)
✅ PCF request management (structure in place)
✅ Document master (structure in place)
✅ Task management (structure in place)
✅ User management (CRUD)
✅ Settings pages (structure)

### In Development / Placeholder
🚧 Dashboard (shows "Coming Soon")
🚧 Reports (likely placeholder)
🚧 Some legacy pages (VisitorManagement, SuiteManagement, etc.)
🚧 Full PCF creation workflow
🚧 DQR save functionality (backend integration)

---

## Key Design Decisions

1. **No Global State Management Library**
   - Uses React Context API for auth only
   - Local state for components
   - localStorage for drafts

2. **Service Layer Pattern**
   - All API calls abstracted into service files
   - Consistent error handling
   - Token management centralized

3. **Configuration-Driven Forms**
   - Supplier questionnaire uses centralized config
   - Easy to update questions/options without code changes

4. **Multi-Step Forms**
   - Progress tracking
   - Step validation
   - Auto-save functionality

5. **TypeScript Throughout**
   - Type safety for all components
   - Shared types in `src/types/index.ts`
   - Service interfaces defined

---

## Environment Configuration

**API Base URL**: Hardcoded in service files (currently `https://enviguide.nextechltd.in`)

**Future Enhancement**: Should use environment variables:
```bash
VITE_API_BASE_URL=https://enviguide.nextechltd.in
```

---

## Build & Development

### Scripts
- `npm run dev` - Start development server (Vite)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Development Server
- Default: `http://localhost:5173` (Vite default port)

---

## Documentation Files

- **README.md** - Basic project overview
- **BACKEND_INTEGRATION.md** - Authentication API integration guide
- **SUPPLIER_QUESTIONNAIRE_INTEGRATION.md** - Supplier questionnaire & DQR integration guide
- **LIST_SCREENS_UPDATE.md** - Screen update documentation
- **PROJECT_STRUCTURE.md** - This file (complete project structure)

---

## Next Steps / Recommendations

1. **Environment Variables**: Move API base URL to `.env` file
2. **Error Boundaries**: Add React error boundaries for better error handling
3. **Loading States**: Standardize loading indicators across all pages
4. **Form Validation**: Consider using a validation library (Zod, Yup)
5. **State Management**: Consider Zustand or Redux Toolkit if state becomes complex
6. **Testing**: Add unit tests and integration tests
7. **API Client**: Standardize on one HTTP client (Axios or Fetch)
8. **Type Safety**: Ensure all API responses are fully typed
9. **Accessibility**: Add ARIA labels and keyboard navigation
10. **Performance**: Implement code splitting and lazy loading for routes

---

**Last Updated**: Based on current codebase analysis
**Version**: Development (0.0.0)

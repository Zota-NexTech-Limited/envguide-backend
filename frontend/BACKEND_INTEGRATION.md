# Backend Integration Guide

This document describes the backend integration for the EnviGuide frontend application, specifically for user authentication and management.

## API Endpoints

### Base URL

```
https://enviguide.nextechltd.in
```

### Authentication Endpoints

#### 1. User Login

- **URL**: `/api/user/login`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "user_email": "user@example.com",
    "password": "userpassword"
  }
  ```
- **Response**: Returns MFA setup data or authentication token
- **MFA Response**:
  ```json
  {
    "success": true,
    "message": "MFA setup initiated. Scan QR or use manual code.",
    "qrCode": "data:image/png;base64,...",
    "manualCode": "HIRTIV2PIFGCYW2KKREWMZTVOVFFA3DMEZ3C64BPJB4FMP3DEUWA",
    "localIP": "172.235.60.152"
  }
  ```

#### 2. MFA Verification

- **URL**: `/api/user/verify`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "user_email": "user@example.com",
    "token": "123456"
  }
  ```
- **Response**: Returns user data and authentication token
  ```json
  {
    "status": true,
    "message": "MFA verified successfully",
    "code": 200,
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user_id": "01K2CAQ55VWMW9DJKRPKF60QD4",
      "user_name": "Abhiram",
      "user_role": "admin",
      "user_email": "abhiram@zotanextech.com",
      "user_phone_number": "1234567",
      "user_department": "admin"
    }
  }
  ```

#### 3. User Registration

- **URL**: `/api/user/create`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "user_name": "Full Name",
    "user_role": "admin",
    "user_email": "user@example.com",
    "user_store_id": "ST2345",
    "user_phone_number": "1234567890",
    "user_department": "admin",
    "change_password_next_login": true,
    "password_never_expires": false,
    "user_password": "SecurePassword123!"
  }
  ```
- **Response**:
  ```json
  {
    "status": true,
    "message": "user created successfully",
    "code": 200,
    "data": null
  }
  ```

#### 4. Forgot Password

- **URL**: `/api/user/forgot/password`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "user_email": "user@example.com"
  }
  ```

#### 5. Reset Password

- **URL**: `/api/user/reset/password`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "token": "reset_token_from_email",
    "user_password": "NewPassword123!"
  }
  ```

## Frontend Implementation

### Components

1. **Login.tsx** - User login form with MFA detection
2. **Signup.tsx** - User registration form with all required fields
3. **ForgotPassword.tsx** - Password reset request form
4. **ResetPassword.tsx** - Password reset form (accessed via email link)
5. **MFAVerification.tsx** - MFA token verification form

### Services

- **authService.ts** - Handles all API calls, authentication logic, and MFA flow
- **AuthContext.tsx** - React context for managing authentication state

### Routes

- `/login` - Login page
- `/signup` - Registration page
- `/forgot-password` - Forgot password page
- `/reset-password?token=<token>` - Reset password page
- `/mfa-verification` - MFA verification page

## Environment Configuration

The API base URL can be configured using environment variables:

```bash
# .env file
VITE_API_BASE_URL=https://enviguide.nextechltd.in
```

If not set, it defaults to `https://enviguide.nextechltd.in`.

## Data Flow

### 1. **Login Flow with MFA**:

- User enters email and password
- Frontend calls `/api/user/login`
- If MFA is required, redirects to `/mfa-verification`
- User enters MFA token from authenticator app
- Frontend calls `/api/user/verify`
- On success, stores token and user data, redirects to dashboard

### 2. **Registration Flow**:

- User fills out registration form
- Frontend calls `/api/user/create`
- On success, shows success message and redirects to login

### 3. **Password Reset Flow**:

- User requests password reset via `/api/user/forgot/password`
- Backend sends email with reset link
- User clicks link and sets new password via `/api/user/reset/password`

## MFA Integration

### MFA Setup Process

1. User logs in with email/password
2. Backend returns MFA setup data (QR code + manual code)
3. User sets up authenticator app using QR code or manual code
4. User enters 6-digit token from authenticator app
5. Frontend verifies token with `/api/user/verify`
6. On success, user is authenticated and redirected to dashboard

### MFA Verification

- **QR Code Display**: Shows the QR code from the API response for easy scanning
- **QR Code Download**: Users can download the QR code image for offline setup
- **Tabbed Interface**: Toggle between QR code and manual setup code views
- **Manual Code Entry**: Alternative setup method using the manual code
- Supports both QR code scanning and manual code entry
- 6-digit TOTP (Time-based One-Time Password) tokens
- 30-second token refresh cycle
- Secure token validation

### QR Code Features

- **High Resolution**: Displays QR code at 192x192 pixels for optimal scanning
- **Downloadable**: Users can download the QR code as a PNG image
- **Responsive Design**: Adapts to different screen sizes
- **Accessibility**: Includes alt text and proper labeling
- **Cross-Platform**: Works with all major authenticator apps

## Error Handling

All API calls include proper error handling:

- Network errors
- API response errors (handles both `{status: true}` and `{success: true}` formats)
- Validation errors
- MFA verification errors
- User-friendly error messages

## Security Features

- Passwords are never stored in plain text on frontend
- Authentication tokens are stored securely in localStorage
- All sensitive operations require valid authentication
- Password strength validation
- MFA (Multi-Factor Authentication) support
- CSRF protection through proper API design

## Testing

To test the integration:

1. Start the frontend application
2. Navigate to `/signup` to create a new user
3. Navigate to `/login` to authenticate
4. Complete MFA setup if required
5. Test password reset functionality via `/forgot-password`
6. Verify all API calls are working correctly

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend allows requests from frontend domain
2. **API Timeout**: Check network connectivity and API server status
3. **Authentication Failures**: Verify API credentials and token handling
4. **MFA Issues**: Ensure authenticator app is properly configured
5. **Form Validation**: Ensure all required fields are properly filled

### Debug Mode

Enable browser developer tools to monitor:

- Network requests to API endpoints
- Console errors and warnings
- Local storage authentication data
- MFA flow state transitions

### MFA Troubleshooting

- **Token not working**: Check device time synchronization
- **QR code issues**: Use manual setup code instead
- **App not generating codes**: Verify app configuration
- **Token expired**: Wait for next 30-second cycle

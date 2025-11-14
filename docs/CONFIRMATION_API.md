# Email Confirmation API - Usage Examples

This document provides examples of how to use the new email confirmation endpoints.

## Overview

The registration flow has been updated to use email confirmation links instead of verification codes:

1. User registers → Receives confirmation email with link
2. User clicks link → Account is confirmed
3. If email not received → User can request resend

## Endpoints

### 1. Register User (Updated)

**Endpoint:** `POST /api/auth/register`

**Request:**
```bash
curl -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "createdAt": "2025-11-14T08:00:00.000Z",
    "updatedAt": "2025-11-14T08:00:00.000Z"
  },
  "message": "User created successfully"
}
```

**What happens:**
- User account is created
- Confirmation token (UUID) is generated
- Email is sent with confirmation link: `https://khdev.ru/register/confirmation?uuid={token}`

**Email Example:**
```
Subject: Confirm Your Email Address

Please confirm your email address by clicking the button below:

[Confirm Email]

Or copy and paste this link:
https://khdev.ru/register/confirmation?uuid=550e8400-e29b-41d4-a716-446655440000
```

---

### 2. Confirm Account

**Endpoint:** `POST /api/auth/register-confirmation`

**Request:**
```bash
curl -X POST http://localhost:3002/api/auth/register-confirmation \
  -H "Content-Type: application/json" \
  -d '{
    "uuid": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Account confirmed successfully"
}
```

**Error Responses:**

Token not found (404):
```json
{
  "success": false,
  "error": "No confirmation token found",
  "errorCode": "CONFIRMATION_TOKEN_NOT_FOUND"
}
```

Invalid UUID format (400):
```json
{
  "success": false,
  "error": "Invalid UUID format",
  "errorCode": "VALIDATION_FAILED"
}
```

**Important Notes:**
- Token can only be used once
- After successful confirmation, the token is deleted
- If token already used, returns `CONFIRMATION_TOKEN_NOT_FOUND`

---

### 3. Resend Confirmation Email

**Endpoint:** `POST /api/auth/resend-confirmation-email`

**Request:**
```bash
curl -X POST http://localhost:3002/api/auth/resend-confirmation-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Confirmation email sent successfully"
}
```

**Error Responses:**

User not found (404):
```json
{
  "success": false,
  "error": "User not found",
  "errorCode": "USER_NOT_FOUND"
}
```

Invalid email format (400):
```json
{
  "success": false,
  "error": "Invalid email address",
  "errorCode": "VALIDATION_FAILED"
}
```

**Important Notes:**
- Generates a new token and invalidates the old one
- Can be called multiple times, but rate limiting is recommended in production
- User must exist in the database

---

## Frontend Integration Guide

### Step 1: Registration
```javascript
async function register(email, password) {
  const response = await fetch('http://localhost:3002/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  if (response.ok) {
    // Show message: "Please check your email for confirmation link"
    return await response.json();
  }
  
  throw new Error('Registration failed');
}
```

### Step 2: Confirmation Page
Create a page at `/register/confirmation` that:

```javascript
// Parse UUID from URL query parameter
const urlParams = new URLSearchParams(window.location.search);
const uuid = urlParams.get('uuid');

async function confirmAccount(uuid) {
  const response = await fetch('http://localhost:3002/api/auth/register-confirmation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uuid })
  });
  
  if (response.ok) {
    // Show success message and redirect to login
    window.location.href = '/login?confirmed=true';
  } else if (response.status === 404) {
    // Show error: "Invalid or expired confirmation link"
  }
}

// Automatically confirm when page loads
if (uuid) {
  confirmAccount(uuid);
}
```

### Step 3: Resend Confirmation
```javascript
async function resendConfirmation(email) {
  const response = await fetch('http://localhost:3002/api/auth/resend-confirmation-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  
  if (response.ok) {
    // Show message: "Confirmation email sent! Check your inbox."
  } else if (response.status === 404) {
    // Show error: "No account found with this email"
  }
}
```

---

## Testing the Flow

### 1. Register a new user
```bash
curl -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 2. Check console/logs for confirmation link
If SMTP is not configured, the link will be printed to console:
```
Confirmation link for test@example.com: https://khdev.ru/register/confirmation?uuid=550e8400-e29b-41d4-a716-446655440000
```

### 3. Extract UUID from link and confirm
```bash
curl -X POST http://localhost:3002/api/auth/register-confirmation \
  -H "Content-Type: application/json" \
  -d '{
    "uuid": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

### 4. Try to use the same UUID again (should fail)
```bash
curl -X POST http://localhost:3002/api/auth/register-confirmation \
  -H "Content-Type: application/json" \
  -d '{
    "uuid": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

Response should be:
```json
{
  "success": false,
  "error": "No confirmation token found",
  "errorCode": "CONFIRMATION_TOKEN_NOT_FOUND"
}
```

### 5. Request resend
```bash
curl -X POST http://localhost:3002/api/auth/resend-confirmation-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

---

## Error Codes Reference

| Error Code | Status | Description |
|------------|--------|-------------|
| `CONFIRMATION_TOKEN_NOT_FOUND` | 404 | Token doesn't exist or was already used |
| `INVALID_CONFIRMATION_TOKEN` | 400 | Token format is invalid |
| `USER_NOT_FOUND` | 404 | User doesn't exist in database |
| `USER_ALREADY_EXISTS` | 409 | Email already registered |
| `VALIDATION_FAILED` | 400 | Request validation failed (invalid email, UUID, etc.) |

---

## Production Considerations

1. **SMTP Configuration**: Configure SMTP settings in `.env`:
   ```env
   SMPT_HOST=smtp.gmail.com
   SMPT_PORT=587
   SMPT_SERVICE=gmail
   SMPT_MAIL=your-email@gmail.com
   SMPT_APP_PASS=your-app-specific-password
   ```

2. **Rate Limiting**: Implement rate limiting on:
   - `/auth/register`: Max 5 requests per hour per IP
   - `/auth/resend-confirmation-email`: Max 3 requests per hour per email

3. **Database Migration**: Apply the migration before deploying:
   ```bash
   npm run db:push
   # or
   npm run db:migrate
   ```

4. **Email Template Customization**: Update `src/services/emailService.ts` to customize:
   - Email subject
   - Email body (HTML and text)
   - Sender name
   - Link domain (currently hardcoded to `https://khdev.ru`)

5. **Token Expiration**: Consider adding expiration to tokens (currently they don't expire)

6. **Verified Flag**: Consider adding a `verified` boolean field to the users table to track verification status

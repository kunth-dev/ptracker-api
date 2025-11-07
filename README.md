# Crypton Backend

Backend API for crypto trading application with user management and authentication.

## Features

- User registration and authentication
- Password reset flow with email verification codes
- User profile management
- Bearer token authentication for protected endpoints
- Input validation with Zod
- Error handling with detailed error messages

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Installation

```bash
npm install
```

### Configuration

Copy `.env.example` to `.env` and configure the environment variables:

```bash
cp .env.example .env
```

Required environment variables:
- `PORT` - Server port (default: 3002)
- `NODE_ENV` - Environment (development, production, test)
- `ALLOWED_DOMAINS` - Comma-separated list of allowed CORS domains
- `BEARER_TOKENS` - Comma-separated list of valid bearer tokens for authentication

### Running the Application

```bash
# Development mode with hot reload
npm run dev

# Production mode
npm start

# Type checking
npm run type-check

# Linting
npm run lint

# Run tests
npm test
```

## API Documentation

Base URL: `http://localhost:3002/api`

### Authentication

Protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer your_secret_bearer_token_here
```

---

## Auth Endpoints (Public - No Authentication Required)

### Register User

Create a new user account.

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Validation Rules:**
- `email`: Valid email format required
- `password`: Minimum 8 characters

**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "userId": "5cd1ceba-69c7-4f49-9c83-bd342a17e66a",
    "email": "user@example.com",
    "createdAt": "2025-11-07T13:18:43.934Z",
    "updatedAt": "2025-11-07T13:18:43.934Z"
  },
  "message": "User created successfully"
}
```

**Error Response (409 Conflict):**
```json
{
  "success": false,
  "error": "User with this email already exists"
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Invalid email address"
}
```

---

### Login

Authenticate user and get user data.

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Validation Rules:**
- `email`: Valid email format required
- `password`: Required

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "userId": "5cd1ceba-69c7-4f49-9c83-bd342a17e66a",
    "email": "user@example.com",
    "createdAt": "2025-11-07T13:18:43.934Z",
    "updatedAt": "2025-11-07T13:18:43.934Z"
  },
  "message": "Login successful"
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

---

### Forgot Password

Request a password reset code to be sent to the user's email.

**Endpoint:** `POST /api/auth/forgot-password`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Reset code sent to email",
  "data": {
    "expiresAt": "2025-11-07T13:33:21.568Z"
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "error": "User not found"
}
```

**Note:** In production, the reset code is sent via email. In development, it's logged to the console.

---

### Send Reset Code

Resend a password reset code (alternative to forgot-password).

**Endpoint:** `POST /api/auth/send-reset-code`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Reset code sent to email",
  "data": {
    "expiresAt": "2025-11-07T13:33:21.568Z"
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "error": "User not found"
}
```

---

### Reset Password

Reset user password using the code sent to their email.

**Endpoint:** `POST /api/auth/reset-password`

**Request Body:**
```json
{
  "email": "user@example.com",
  "code": "123456",
  "newPassword": "newpassword123"
}
```

**Validation Rules:**
- `email`: Valid email format required
- `code`: Minimum 6 characters
- `newPassword`: Minimum 8 characters

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "error": "User not found"
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Invalid reset code"
}
```

or

```json
{
  "success": false,
  "error": "Reset code has expired"
}
```

**Note:** Reset codes expire after 15 minutes.

---

## User Endpoints (Protected - Authentication Required)

All endpoints in this section require a valid Bearer token in the Authorization header.

### Get User Data

Retrieve user information by user ID.

**Endpoint:** `GET /api/user/:userId`

**Headers:**
```
Authorization: Bearer your_secret_bearer_token_here
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "userId": "5cd1ceba-69c7-4f49-9c83-bd342a17e66a",
    "email": "user@example.com",
    "createdAt": "2025-11-07T13:18:43.934Z",
    "updatedAt": "2025-11-07T13:18:43.934Z"
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "error": "User not found"
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Missing authorization",
  "message": "Authorization header is required. Format: Authorization: Bearer <token>",
  "timestamp": "2025-11-07T13:07:59.617Z"
}
```

---

### Update User

Update user email and/or password.

**Endpoint:** `PUT /api/user/:userId`

**Headers:**
```
Authorization: Bearer your_secret_bearer_token_here
```

**Request Body:**
```json
{
  "email": "newemail@example.com",
  "password": "newpassword123"
}
```

**Validation Rules:**
- `email`: Valid email format (optional)
- `password`: Minimum 8 characters (optional)
- At least one field must be provided

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "userId": "5cd1ceba-69c7-4f49-9c83-bd342a17e66a",
    "email": "newemail@example.com",
    "createdAt": "2025-11-07T13:18:43.934Z",
    "updatedAt": "2025-11-07T13:25:15.716Z"
  },
  "message": "User updated successfully"
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "error": "User not found"
}
```

**Error Response (409 Conflict):**
```json
{
  "success": false,
  "error": "Email already in use"
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "At least one field must be provided for update"
}
```

---

### Delete User

Delete a user account.

**Endpoint:** `DELETE /api/user/:userId`

**Headers:**
```
Authorization: Bearer your_secret_bearer_token_here
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "error": "User not found"
}
```

---

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error description (optional)",
  "timestamp": "2025-11-07T13:07:59.617Z"
}
```

### Common HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data or validation error
- `401 Unauthorized` - Missing or invalid authentication
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists (e.g., duplicate email)
- `500 Internal Server Error` - Server error

---

## Security Notes

### Current Implementation (Demo/Development)

- **Password Hashing:** Uses SHA-256 (NOT secure for production)
- **Storage:** In-memory Map (data lost on restart)
- **Reset Codes:** Logged to console (not sent via email)

### Production Requirements

Before deploying to production, implement:

1. **Password Hashing:** Replace SHA-256 with bcrypt, scrypt, or Argon2
2. **Database:** Replace in-memory storage with proper database (PostgreSQL, MongoDB, etc.)
3. **Email Service:** Integrate email service (SendGrid, AWS SES, etc.) for reset codes
4. **Rate Limiting:** Add rate limiting to prevent brute force attacks
5. **HTTPS:** Ensure all traffic uses HTTPS
6. **Token Management:** Implement JWT or session-based authentication
7. **Input Sanitization:** Add additional input sanitization for XSS prevention
8. **Audit Logging:** Log all security-relevant events

---

## Development

### Project Structure

```
src/
├── config/          # Environment configuration
├── middleware/      # Express middleware (auth, error handling)
├── routes/          # API route handlers
│   ├── auth.ts      # Authentication endpoints
│   ├── user.ts      # User management endpoints
│   ├── public.ts    # Public routes aggregator
│   └── private.ts   # Protected routes aggregator
├── services/        # Business logic
│   └── userService.ts
├── types/           # TypeScript type definitions
│   ├── api.ts
│   └── user.ts
├── app.ts           # Express app setup
└── server.ts        # Server entry point
```

### Testing

Example curl commands for testing:

```bash
# Register a new user
curl -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get user data (requires auth)
curl -X GET http://localhost:3002/api/user/USER_ID_HERE \
  -H "Authorization: Bearer your_secret_bearer_token_here"

# Update user (requires auth)
curl -X PUT http://localhost:3002/api/user/USER_ID_HERE \
  -H "Authorization: Bearer your_secret_bearer_token_here" \
  -H "Content-Type: application/json" \
  -d '{"email":"newemail@example.com"}'

# Delete user (requires auth)
curl -X DELETE http://localhost:3002/api/user/USER_ID_HERE \
  -H "Authorization: Bearer your_secret_bearer_token_here"
```

---

## License

MIT

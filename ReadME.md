# Meeting Room and Resource Booking System

An internal web application for booking meeting rooms and shared resources such as projectors and conference equipment. The system prevents double bookings and allows employees to check resource availability before making reservations.

## Tech Stack

| Component | Technology | 
|---|---|
| Frontend | React.js, Vite, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | PostgreSQL (Supabase) |
| Authentication | JSON Web Tokens (JWT) |

## User Roles

### Employee
- View available meeting rooms and shared resources.
- Create bookings.
- Edit their own bookings.
- Cancel their own bookings.
- View the booking calendar.

### Admin
- Access all employee features.
- Manage meeting rooms and shared resources.
- Manage operating hours.
- Configure booking restrictions.

## Current Development Status

**Day 2 — Backend Structure and Authentication Completed**

The backend project structure has been established, and the initial authentication functionality is implemented.

### Completed
- Set up the Node.js and Express.js server.
- Organized the backend into separate modules.
- Configured environment variables.
- Connected PostgreSQL through Supabase.
- Implemented user registration.
- Implemented user login.
- Added JWT-based authentication.
- Implemented protected routes.
- Added admin role-checking middleware.
- Implemented centralized error handling and input validation.

### Next Steps
- Develop the resource management APIs.
- Implement meeting room and resource booking.
- Prevent overlapping bookings and double reservations.
- Add booking updates and cancellations.
- Build the booking calendar and availability views.
- Implement operating hours and booking restrictions.
- Connect the React frontend to the backend APIs.

## Backend Folder Structure

```text
server/
├── database/
│   └── schema.sql
├── scripts/
│   └── setupDatabase.js
├── src/
│   ├── config/
│   │   ├── db.js
│   │   └── env.js
│   ├── controllers/
│   │   └── authController.js
│   ├── middleware/
│   │   ├── authenticate.js
│   │   ├── errorHandler.js
│   │   └── validate.js
│   ├── models/
│   │   └── userModel.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── index.js
│   ├── utils/
│   │   └── httpError.js
│   ├── validation/
│   │   └── authSchemas.js
│   ├── app.js
│   └── index.js
├── .env
├── .env.example
├── .gitignore
├── package.json
└── package-lock.json
```

### Folder Responsibilities

| Folder/File | Responsibility |
|---|---|
| `config/` | Environment configuration and database connection |
| `routes/` | Maps API endpoints to controllers |
| `controllers/` | Handles requests and sends responses |
| `models/` | Executes database queries |
| `middleware/` | Authentication, authorization, validation, and error handling |
| `validation/` | Defines input validation rules |
| `utils/` | Reusable helper functions |
| `database/` | Database schema |
| `scripts/` | Database setup scripts |
| `app.js` | Configures the Express application |
| `index.js` | Starts the backend server |

## API Endpoints

The following authentication endpoints have been implemented.

### 1. Health Check

**Endpoint:** `GET /api/health`

Checks the backend server and database connectivity.

### 2. User Registration

**Endpoint:** `POST /api/auth/register`

Creates a new employee account and returns an authentication token.

**Request body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "your-password"
}
```

### 3. User Login

**Endpoint:** `POST /api/auth/login`

Authenticates an existing user and returns a JWT and user information.

**Request body:**

```json
{
  "email": "john@example.com",
  "password": "your-password"
}
```

### 4. Get Current User

**Endpoint:** `GET /api/auth/me`

Returns information about the currently authenticated user.

**Request header:**

```http
Authorization: Bearer <your-jwt-token>
```

A valid JWT is required to access this endpoint.

## Authentication and Authorization

- JWT tokens are used to authenticate users.
- Protected endpoints require a valid bearer token.
- Authentication middleware verifies the token.
- Admin role-checking middleware restricts access to authorized administrative operations.
- User passwords must be stored securely as password hashes, never as plain text.

## Error Handling

All API errors are returned in JSON format with a `message` field.

Example:

```json
{
  "message": "Invalid credentials"
}
```

Validation errors also include an `errors` object containing a message for each invalid field.

Example:

```json
{
  "message": "Validation failed",
  "errors": {
    "email": "Please provide a valid email address",
    "password": "Password does not meet the requirements"
  }
}
```

*The messages above are illustrative examples.*

## Database

The application uses PostgreSQL hosted on Supabase.

The backend connects to the database through a configured connection pool. Database credentials and other secrets are stored in environment variables rather than committed to version control.

Example environment variables:

```env
PORT=5000
DATABASE_URL=your-database-connection-string
JWT_SECRET=your-secret-key
```

Use your actual local environment configuration, and keep `.env` out of Git. The `.env.example` file should contain placeholder values only.

## Project Goal

Build a reliable internal booking system that allows employees to reserve meeting rooms and shared resources efficiently while preventing conflicting reservations and giving administrators control over resources, operating hours, and booking policies.

## Development Progress

- [x] Backend project structure
- [x] PostgreSQL and Supabase connection
- [x] User registration
- [x] User login
- [x] JWT authentication
- [x] Protected routes
- [x] Admin role-checking middleware
- [x] Resource management
- [ ] Booking creation and validation
- [ ] Double-booking prevention
- [ ] Booking editing and cancellation
- [ ] Calendar and availability views
- [ ] Operating hours and booking restrictions
- [ ] Frontend integration
- [ ] Testing and deployment

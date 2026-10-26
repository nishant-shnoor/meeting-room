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

**Day 3 — Backend Structure and Authentication Completed**

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
- Develop the resource management APIs.

### Next Steps
- Implement meeting room and resource booking.
- Prevent overlapping bookings and double reservations.
- Add booking updates and cancellations.
- Build the booking calendar and availability views.
- Implement operating hours and booking restrictions.

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

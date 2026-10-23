Meeting Room and Resource Booking System

An internal web application for booking meeting rooms and shared resources such as projectors and conference equipment. It prevents double bookings and shows what is available.

Tech stack
Frontend: React.js, Vite, Tailwind CSS
Backend: Node.js, Express.js
Database: PostgreSQL (Supabase)

Users
Employee: view resources, book, edit and cancel own bookings, view calendar.
Admin: everything an employee can do, plus manage resources, operating hours and booking restrictions.

Current status
Day 2: backend project structure and authentication done (register, login, JWT protected routes, admin role check). Booking features come next.

Backend folder structure (server/src)
config: environment variables and database connection
routes: URL paths mapped to controllers
controllers: handle the request and send the response
models: SQL queries
middleware: authentication, validation, error handling
validation: input rules
utils: small helpers

API endpoints so far
GET  /api/health         server and database check
POST /api/auth/register  body: name, email, password. Creates an employee account and returns a token
POST /api/auth/login     body: email, password. Returns a token and the user
GET  /api/auth/me        needs header Authorization: Bearer <token>. Returns the logged in user

Errors always come back as JSON with a message field. Validation errors also include an errors object with one message per field.
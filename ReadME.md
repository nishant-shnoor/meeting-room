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

How to run the backend
1. Create a Supabase project and copy the Session pooler connection string (Project Settings, Database).
2. cd server
3. npm install
4. Copy .env.example to .env and fill in DATABASE_URL and a long random JWT_SECRET.
5. npm run db:setup (creates the users table)
6. npm run dev (API runs on http://localhost:5000)
7. Open http://localhost:5000/api/health to check it is running.

API endpoints so far
GET  /api/health         server and database check
POST /api/auth/register  body: name, email, password. Creates an employee account and returns a token
POST /api/auth/login     body: email, password. Returns a token and the user
GET  /api/auth/me        needs header Authorization: Bearer <token>. Returns the logged in user

Errors always come back as JSON with a message field. Validation errors also include an errors object with one message per field.

Making an admin
Register normally, then change the role of that user to admin in the Supabase table editor.
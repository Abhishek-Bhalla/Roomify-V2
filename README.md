<<<<<<< HEAD
# Room & Lab Booking Management System

A full-stack application with a React frontend and Node.js/Express backend, organized as a monorepo.

## Project Structure

├── frontend/                  # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── layout/       # Sidebar, Navbar, DashboardLayout
│   │   │   └── common/       # Button, Input, Card, Loader
│   │   ├── pages/            # Page components
│   │   │   ├── auth/         # Login
│   │   │   ├── admin/        # AdminDashboard, ManageUsers, ManageRooms
│   │   │   ├── approver/     # ApproverDashboard, BookingRequests
│   │   │   └── requester/   # RequesterDashboard, SearchRooms, MyBookings
│   │   ├── context/          # AuthContext
│   │   ├── services/         # API service
│   │   └── routes/          # ProtectedRoute
│   ├── public/              # Static assets
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── backend/                   # Node.js + Express + MongoDB
│   ├── config/               # Database connection (db.js)
│   ├── controllers/          # Business logic
│   ├── models/              # Mongoose schemas (User, Room, Booking)
│   ├── routes/              # API routes
│   ├── middleware/         # Auth & validation
│   ├── utils/              # Helpers & seeder
│   ├── app.js              # Express app setup
│   ├── server.js           # Server entry point
│   ├── package.json
│   └── .env                 # Environment variables
│
├── package.json              # Root monorepo config (npm workspaces)
├── .env.example             # Example environment variables
├── MONGODB_SETUP.md         # MongoDB Atlas setup guide
└── README.md
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (see [MONGODB_SETUP.md](MONGODB_SETUP.md))

### 1. Clone and Install

```bash
# Install all dependencies (frontend + backend)
npm run install:all
```

### 2. Configure MongoDB Atlas

1. Follow the guide in [MONGODB_SETUP.md](MONGODB_SETUP.md)
2. Update `backend/.env` with your connection string:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.lbuku8g.mongodb.net/<dbname>
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=7d
NODE_ENV=development
```

### 3. Seed the Database (First Time Only)

```bash
cd backend
npm run seed
```

### 4. Run the Application

**Option A - Run both simultaneously:**
```bash
npm run dev
```
This runs both frontend (port 3000) and backend (port 5000) with `concurrently`.

**Option B - Run separately:**

Terminal 1 (Backend):
```bash
npm run dev:backend
# Server runs on http://localhost:5000
```

Terminal 2 (Frontend):
```bash
npm run dev:frontend
# App runs on http://localhost:3000
```

---

## Demo Credentials

After running `npm run seed`:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@university.edu | admin123 |
| Approver | approver@university.edu | approver123 |
| Requester | requester@university.edu | requester123 |

---

## API Endpoints

### Auth
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register (admin only)
- `GET /api/auth/me` - Get current user

### Users (Admin only)
- `GET /api/users` - List all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `PATCH /api/users/:id/block` - Block user
- `PATCH /api/users/:id/unblock` - Unblock user

### Rooms (Admin only)
- `GET /api/rooms` - List all rooms
- `POST /api/rooms` - Create room
- `PUT /api/rooms/:id` - Update room
- `DELETE /api/rooms/:id` - Delete room
- `PATCH /api/rooms/:id/status` - Toggle room status

### Bookings
- `POST /api/bookings` - Create booking (requester)
- `GET /api/bookings/my` - My bookings (requester)
- `GET /api/bookings/pending` - Pending requests (approver)
- `PATCH /api/bookings/:id/approve` - Approve (approver)
- `PATCH /api/bookings/:id/reject` - Reject (approver)
- `GET /api/bookings/all` - All bookings (admin)

---

## Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/<dbname>
JWT_SECRET=<your-secret-key>
JWT_EXPIRE=7d
NODE_ENV=development
```

### Frontend (`frontend/.env`) - Optional
```env
VITE_API_URL=/api
```

---

## Features

- **JWT Authentication** with role-based access control
- **Admin Panel**: Manage users, rooms, view all bookings
- **Approver Panel**: Review and approve/reject booking requests
- **Requester Panel**: Search rooms, create bookings, view own bookings
- **Conflict Prevention**: Prevents double booking of same room/time slot
- **Input Validation**: All inputs validated using express-validator
- **Password Security**: Hashed with bcrypt (12 rounds)
- **Vite Proxy**: API requests proxied to backend during development
=======

  # College Room Booking System UI

  This is a code bundle for College Room Booking System UI. 

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.
  
>>>>>>> 1f0fd5a46acb9a62295417d6fbe763d7ad16a0be
"# Roomify-V2" 

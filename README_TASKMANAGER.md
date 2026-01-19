# Task Manager Application

A full-stack task management application with user authentication, CRUD operations, and status filtering.

## Tech Stack

### Backend
- Node.js & Express
- PostgreSQL
- JWT for authentication
- bcryptjs for password hashing

### Frontend
- React 18
- Material-UI (MUI)
- Axios for API calls
- Context API for state management

## Features

- ✅ User registration and login with JWT authentication
- ✅ Create, read, update, and delete tasks
- ✅ Mark tasks as complete/incomplete
- ✅ Filter tasks by status (all, pending, completed)
- ✅ Clean and responsive UI with Material-UI
- ✅ Secure API endpoints with authentication middleware

## Project Structure

```
fullstack-cicd-demo/
├── backend/
│   ├── config/
│   │   └── database.js          # PostgreSQL connection
│   ├── database/
│   │   └── schema.sql            # Database schema
│   ├── middleware/
│   │   └── auth.js               # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js               # Authentication routes
│   │   └── tasks.js              # Task CRUD routes
│   ├── .env.example              # Environment variables template
│   ├── .gitignore
│   ├── package.json
│   └── server.js                 # Express server
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.js      # Main dashboard
│   │   │   ├── Login.js          # Login form
│   │   │   ├── Register.js       # Registration form
│   │   │   ├── TaskForm.js       # Create/Edit task form
│   │   │   └── TaskList.js       # Task list display
│   │   ├── context/
│   │   │   └── AuthContext.js    # Authentication context
│   │   ├── services/
│   │   │   └── api.js            # API service layer
│   │   ├── App.js
│   │   └── index.js
│   ├── .env.example
│   ├── .gitignore
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Database Setup

1. Create a PostgreSQL database:
```bash
createdb taskmanager
```

2. Run the schema file to create tables:
```bash
psql -d taskmanager -f backend/database/schema.sql
```

Or manually execute the SQL in the schema.sql file.

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:
```env
PORT=5000
DATABASE_URL=postgresql://username:password@localhost:5432/taskmanager
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
```

5. Start the backend server:
```bash
# Development mode with nodemon
npm run dev

# Production mode
npm start
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

4. Update the `.env` file if needed (default is correct):
```env
REACT_APP_API_URL=http://localhost:5000/api
```

5. Start the frontend development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Tasks (Protected)
- `GET /api/tasks` - Get all tasks (with optional status filter)
- `GET /api/tasks/:id` - Get a single task
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task
- `PATCH /api/tasks/:id/toggle` - Toggle task status

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Register a new account or login with existing credentials
3. Create tasks using the "Add Task" button
4. Click the checkbox to mark tasks as complete/incomplete
5. Use the filter chips to view all, pending, or completed tasks
6. Edit or delete tasks using the respective buttons

## Environment Variables

### Backend (.env)
- `PORT` - Server port (default: 5000)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT token generation
- `JWT_EXPIRE` - JWT token expiration time

### Frontend (.env)
- `REACT_APP_API_URL` - Backend API URL

## Security Features

- Passwords are hashed using bcryptjs
- JWT tokens for stateless authentication
- Protected API routes with authentication middleware
- CORS enabled for frontend-backend communication
- SQL injection prevention using parameterized queries

## Future Enhancements

- Task due dates and reminders
- Task categories/tags
- Task priority levels
- Search functionality
- Task sharing between users
- Email notifications
- Dark mode theme

## License

MIT

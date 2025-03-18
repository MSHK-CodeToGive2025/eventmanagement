# Zubin Foundation Event Management System

A web-based platform designed to streamline the management of events for Hong Kong's ethnic minorities. This system supports the Zubin Foundation's mission to improve the lives of ethnic minorities by facilitating event organization, participant registration, and communication between volunteers and participants.

## Features

- User Authentication and Role Management (Admin, Volunteers, Participants)
- Event Management (Create, Read, Update, Delete)
- Participant Registration System
- WhatsApp Integration for Communication
- Dashboard and Analytics
- Responsive Design for Desktop and Mobile

## Tech Stack

### Frontend
- React.js with JavaScript
- Vite for optimized development
- TailwindCSS for responsive design
- React Router for navigation
- Axios for API communication

### Backend
- Express.js with JavaScript
- MongoDB with Mongoose ODM
- JWT for authentication
- RESTful API architecture

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd zubin-foundation-event-system
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory with the following variables:
```env
PORT=5050
MONGODB_URI=mongodb://localhost:27017/zubin-foundation
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Start the frontend development server:
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5050

## Project Structure

```
zubin-foundation-event-system/
├── backend/
│   ├── src/
│   │   └── index.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get specific user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Events
- `GET /api/events` - Get all events
- `POST /api/events` - Create new event
- `GET /api/events/:id` - Get specific event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

### Registrations
- `GET /api/events/:id/registrations` - Get registrations for event
- `POST /api/events/:id/register` - Register for event
- `DELETE /api/events/:id/unregister` - Cancel registration

## Development

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests (to be implemented)
cd frontend
npm test
```

### Building for Production
```bash
# Frontend build
cd frontend
npm run build
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please contact the Zubin Foundation team or create an issue in the repository. 
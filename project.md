# Project Specification: Zubin Foundation Event Management System

## 1. Project Overview

The Zubin Foundation Event Management System is a web-based platform designed to streamline the management of events for Hong Kong's ethnic minorities. The system will support the foundation's mission to improve the lives of ethnic minorities by facilitating event organization, participant registration, and communication between staff and participants.

## 2. Organization Background

The Zubin Foundation is an integrated service provider for Hong Kong's ethnic minorities. They improve the lives of these communities by reducing suffering and providing opportunities. The foundation runs various events for low-income ethnic minorities, including:
- Educational workshops for students to guide their studies
- Career development events for job opportunities
- Support sessions for women facing challenges like domestic violence

## 3. User Roles and Permissions

### 3.1 Admin
- Full control over the system
- Access to comprehensive dashboards and analytics
- User management (create, modify, delete)
- Event management (create, modify, delete)
- Staff management

### 3.2 Staff
- Create and manage events
- View participant information for their events
- Send messages and reminders to participants
- Generate attendance reports

### 3.3 Participants
- Browse and search for available events
- Register for events
- View their upcoming and past events
- Receive notifications and reminders

### 3.4 Unregistered Users
- Browse and search for available events
- Cannot register for events until they have logged in as participants

## 4. Functional Requirements

### 4.1 User Authentication and Management
- Secure login and registration system
- Role-based access control
- User profile management
- Password reset functionality

### 4.2 Event Management
- Create, read, update, and delete (CRUD) operations for events
- Event categorization
- Event scheduling with date, time, location
- Capacity management
- Attendance tracking

### 4.3 Registration System
- Participant registration for events
- Registration confirmation
- Waitlist functionality for fully booked events
- Registration cancellation

### 4.4 Communication System
- WhatsApp integration for sending messages
- Automated event reminders
- Bulk messaging to event participants
- Message templates for common communications

### 4.5 Dashboard and Reporting
- Admin dashboard with key metrics
- Event attendance reports
- Participant engagement analytics
- Staff activity tracking

## 5. Technical Architecture

### 5.1 Frontend
- React.js with JavaScript
- Built with Vite for optimized development
- TailwindCSS for responsive design
- Support for both desktop and mobile browsers
- Intuitive user interface with appropriate localization

### 5.2 Backend
- Express.js with JavaScript
- RESTful API endpoints for CRUD operations
- MongoDB database with Mongoose ODM
- JWT (JSON Web Token) for authentication
- WhatsApp Business API integration for messaging

### 5.3 Database Schema (Key Collections)
- Users (Admin, Staff, Participants)
- Events
- Registrations
- Messages
- Categories

## 6. API Endpoints

### 6.1 Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info

### 6.2 Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get specific user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### 6.3 Events
- `GET /api/events` - Get all events
- `POST /api/events` - Create new event
- `GET /api/events/:id` - Get specific event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

### 6.4 Registrations
- `GET /api/events/:id/registrations` - Get registrations for event
- `POST /api/events/:id/register` - Register for event
- `DELETE /api/events/:id/unregister` - Cancel registration

### 6.5 Messages
- `POST /api/messages/send` - Send message to participants
- `POST /api/messages/reminder` - Send event reminder

## 7. Non-Functional Requirements

### 7.1 Performance
- Page load time under 3 seconds
- Support for at least 100 concurrent users
- Database query optimization

### 7.2 Security
- HTTPS implementation
- Data encryption
- Protection against common web vulnerabilities
- Regular security audits

### 7.3 Scalability
- Horizontal scaling capability
- Efficient database indexing
- Caching for frequently accessed data

### 7.4 Reliability
- 99.9% uptime
- Regular database backups
- Error logging and monitoring

## 8. Implementation Plan

### 8.1 Phase 1: Setup and Core Functionality
- Project repository setup
- Backend API development for authentication
- Basic frontend with authentication
- Database schema implementation

### 8.2 Phase 2: Event Management
- Event CRUD operations
- Event listing and details pages
- Admin dashboard for event management
- Event registration functionality

### 8.3 Phase 3: Communication Features
- WhatsApp integration
- Messaging system
- Automated reminders
- Notification preferences

### 8.4 Phase 4: Reporting and Analytics
- Advanced dashboard features
- Reporting functionality
- Analytics implementation
- Performance optimization -->

## 9. Testing Strategy

- Unit testing for frontend and backend components
- Integration testing for API endpoints
- User acceptance testing with stakeholders
- Performance and load testing
- Cross-browser and responsive design testing

## 10. Deployment and Maintenance

- CI/CD pipeline for automated testing and deployment.  Use GitHub actions and push to AWS.
- Production, staging, and development environments
- Monitoring and logging infrastructure
- Regular updates and maintenance schedule

## 11. Documentation

- Use Swagger to generate API documentation
- User manuals for different roles
- System architecture documentation
- Code documentation and comments

## 12. Future Enhancements

- Multi-language support
- Advanced analytics and reporting
- Mobile app development
- Integration with other communication channels
- Event recommendation system

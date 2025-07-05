import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import eventRoutes from '../events.js';
import Event from '../../models/Event.js';
import User from '../../models/User.js';
import RegistrationForm from '../../models/RegistrationForm.js';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

// Load environment variables
dotenv.config();

// Create an express app for testing
const app = express();
app.use(express.json());
app.use('/api/events', eventRoutes);

let mongod;
let adminUser, regularUser;
let adminToken, regularToken;
let testEvent, testRegistrationForm;

describe('Events Routes', () => {
  beforeAll(async () => {
    // Create an in-memory MongoDB instance
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    
    // Connect to the in-memory database
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    // Close database connection and stop MongoDB
    await mongoose.connection.close();
    await mongod.stop();
  });

  beforeEach(async () => {
    // Clear the database before each test
    await Event.deleteMany({});
    await User.deleteMany({});
    await RegistrationForm.deleteMany({});

    // Create admin user
    adminUser = new User({
      username: 'admin',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      mobile: '1234567890',
      email: 'admin@example.com',
      role: 'admin'
    });
    await adminUser.save();

    // Create regular user
    regularUser = new User({
      username: 'user',
      password: 'user123',
      firstName: 'Regular',
      lastName: 'User',
      mobile: '1234567891',
      email: 'user@example.com',
      role: 'participant'
    });
    await regularUser.save();

    // Generate tokens
    adminToken = jwt.sign(
      { userId: adminUser._id },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '24h' }
    );

    regularToken = jwt.sign(
      { userId: regularUser._id },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '24h' }
    );

    // Create a test registration form
    testRegistrationForm = new RegistrationForm({
      title: 'Test Form',
      description: 'Test Form Description',
      sections: [],
      createdBy: adminUser._id
    });
    await testRegistrationForm.save();

    // Create a test event
    testEvent = new Event({
      title: 'Test Event',
      description: 'Test Description',
      category: 'Education & Training',
      targetGroup: 'All Hong Kong Residents',
      location: {
        venue: 'Test Venue',
        address: 'Test Address',
        district: 'Central and Western',
        onlineEvent: false
      },
      startDate: new Date(Date.now() + 86400000), // tomorrow
      endDate: new Date(Date.now() + 86400000 + 7200000), // tomorrow + 2 hours
      coverImageUrl: 'test-image.jpg',
      isPrivate: false,
      status: 'Published',
      registrationFormId: testRegistrationForm._id,
      sessions: [
        {
          title: 'Test Session',
          description: 'Test Session Description',
          date: new Date(Date.now() + 86400000),
          startTime: '10:00',
          endTime: '12:00',
          location: {
            venue: 'Test Session Venue'
          },
          capacity: 10
        }
      ],
      capacity: 10,
      createdBy: adminUser._id
    });
    await testEvent.save();
  });

  describe('GET /api/events', () => {
    it('should return all events', async () => {
      const response = await request(app)
        .get('/api/events');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].title).toBe('Test Event');
      expect(response.body[0]).toHaveProperty('availableSpots');
      expect(response.body[0]).toHaveProperty('isFull');
    });
  });

  describe('GET /api/events/:id', () => {
    it('should return a single event', async () => {
      const response = await request(app)
        .get(`/api/events/${testEvent._id}`);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Test Event');
      expect(response.body).toHaveProperty('availableSpots');
      expect(response.body).toHaveProperty('isFull');
    });

    it('should return 404 for non-existent event', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/events/${nonExistentId}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Event not found');
    });
  });

  describe('POST /api/events', () => {
    it('should create a new event for admin', async () => {
      const eventData = {
        title: 'New Event',
        description: 'New Description',
        category: 'Career Development',
        targetGroup: 'Professionals',
        location: {
          venue: 'New Venue',
          address: 'New Address',
          district: 'Wan Chai',
          onlineEvent: false
        },
        startDate: new Date(Date.now() + 172800000), // 2 days from now
        endDate: new Date(Date.now() + 172800000 + 7200000), // 2 days from now + 2 hours
        coverImageUrl: 'new-image.jpg',
        isPrivate: false,
        status: 'Draft',
        registrationFormId: testRegistrationForm._id,
        sessions: [],
        capacity: 20
      };

      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(eventData);

      expect(response.status).toBe(201);
      expect(response.body.title).toBe(eventData.title);
      expect(response.body.description).toBe(eventData.description);
      expect(response.body.createdBy).toBe(adminUser._id.toString());
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          title: 'New Event',
          description: 'New Description',
          category: 'Career Development',
          targetGroup: 'Professionals',
          location: {
            venue: 'New Venue',
            address: 'New Address',
            district: 'Wan Chai',
            onlineEvent: false
          },
          startDate: new Date(),
          endDate: new Date(Date.now() + 7200000),
          registrationFormId: testRegistrationForm._id,
          sessions: [],
          capacity: 20
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Not authorized to create events');
    });
  });

  describe('PUT /api/events/:id', () => {
    it('should update event for admin', async () => {
      const updateData = {
        title: 'Updated Event',
        description: 'Updated Description',
        capacity: 15
      };

      const response = await request(app)
        .put(`/api/events/${testEvent._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe(updateData.title);
      expect(response.body.description).toBe(updateData.description);
      expect(response.body.capacity).toBe(updateData.capacity);
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .put(`/api/events/${testEvent._id}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          title: 'Updated Event'
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Not authorized to update this event');
    });
  });

  describe('DELETE /api/events/:id', () => {
    it('should delete event for admin', async () => {
      const response = await request(app)
        .delete(`/api/events/${testEvent._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Event deleted successfully');

      // Verify event was deleted
      const deletedEvent = await Event.findById(testEvent._id);
      expect(deletedEvent).toBeNull();
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .delete(`/api/events/${testEvent._id}`)
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Not authorized to delete this event');
    });
  });
}); 
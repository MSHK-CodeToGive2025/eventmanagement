import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import eventsRoutes from '../events.js';
import Event from '../../models/Event.js';
import User from '../../models/User.js';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

// Load environment variables
dotenv.config();

// Create an express app for testing
const app = express();
app.use(express.json());
app.use('/api/events', eventsRoutes);

let mongod;
let adminUser;
let adminToken;
let regularUser;
let regularToken;
let testEvent;

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

    // Create admin user
    adminUser = new User({
      email: 'admin@example.com',
      password: 'admin123',
      name: 'Admin User',
      role: 'admin'
    });
    await adminUser.save();

    // Create regular user
    regularUser = new User({
      email: 'user@example.com',
      password: 'user123',
      name: 'Regular User',
      role: 'participant'
    });
    await regularUser.save();

    // Generate tokens
    adminToken = jwt.sign(
      { userId: adminUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    regularToken = jwt.sign(
      { userId: regularUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Create a test event
    testEvent = new Event({
      title: 'Test Event',
      description: 'Test Description',
      category: 'educational',
      date: new Date(Date.now() + 86400000), // tomorrow
      startTime: '10:00',
      endTime: '12:00',
      location: 'Test Location',
      capacity: 10,
      organizer: adminUser._id
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
        category: 'career',
        date: new Date(Date.now() + 172800000), // 2 days from now
        startTime: '14:00',
        endTime: '16:00',
        location: 'New Location',
        capacity: 20
      };

      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(eventData);

      expect(response.status).toBe(201);
      expect(response.body.title).toBe(eventData.title);
      expect(response.body.description).toBe(eventData.description);
      expect(response.body.organizer).toBe(adminUser._id.toString());
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          title: 'New Event',
          description: 'New Description',
          category: 'career',
          date: new Date(),
          startTime: '14:00',
          endTime: '16:00',
          location: 'New Location',
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

  describe('POST /api/events/:id/register', () => {
    it.skip('should register user for event', async () => {
      const response = await request(app)
        .post(`/api/events/${testEvent._id}/register`)
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(200);
      expect(response.body.registeredParticipants).toContain(regularUser._id.toString());
    });

    it.skip('should add user to waitlist when event is full', async () => {
      // Fill up the event
      testEvent.registeredParticipants = Array(testEvent.capacity).fill(regularUser._id);
      await testEvent.save();

      const response = await request(app)
        .post(`/api/events/${testEvent._id}/register`)
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(200);
      expect(response.body.waitlist).toContain(regularUser._id.toString());
    });
  });

  describe('POST /api/events/:id/unregister', () => {
    it('should unregister user from event', async () => {
      // First register the user
      testEvent.registeredParticipants.push(regularUser._id);
      await testEvent.save();

      const response = await request(app)
        .post(`/api/events/${testEvent._id}/unregister`)
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(200);
      expect(response.body.registeredParticipants).not.toContain(regularUser._id.toString());
    });
  });
}); 
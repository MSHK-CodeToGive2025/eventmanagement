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
let testEventNoImage;

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
      coverImage: {
        data: Buffer.from('test-image-data'),
        contentType: 'image/jpeg',
        size: 12345
      },
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

    // Create a test event without cover image for testing 404 scenarios
    testEventNoImage = new Event({
      title: 'Test Event No Image',
      description: 'Test Description No Image',
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
      isPrivate: false,
      status: 'Published',
      registrationFormId: testRegistrationForm._id,
      sessions: [],
      capacity: 10,
      createdBy: adminUser._id
    });
    await testEventNoImage.save();
  });

  describe('GET /api/events', () => {
    it('should return all events', async () => {
      const response = await request(app)
        .get('/api/events');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2); // Now two events
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
        coverImage: {
          data: Buffer.from('new-image-data'),
          contentType: 'image/jpeg',
          size: 12346
        },
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

    it('should create event with image upload for admin', async () => {
      const imageBuffer = Buffer.from('fake-image-data');
      
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('title', 'Event with Image')
        .field('description', 'Event Description')
        .field('category', 'Education & Training')
        .field('targetGroup', 'All Hong Kong Residents')
        .field('location[venue]', 'Test Venue')
        .field('location[address]', 'Test Address')
        .field('location[district]', 'Central and Western')
        .field('location[onlineEvent]', 'false')
        .field('startDate', new Date(Date.now() + 86400000).toISOString())
        .field('endDate', new Date(Date.now() + 86400000 + 7200000).toISOString())
        .field('isPrivate', 'false')
        .field('status', 'Draft')
        .field('registrationFormId', testRegistrationForm._id.toString())
        .field('capacity', '20')
        .attach('image', imageBuffer, 'test.jpg');

      expect(response.status).toBe(201);
      expect(response.body.title).toBe('Event with Image');
      expect(response.body.coverImage).toBeDefined();
      expect(response.body.coverImage.data).toBeDefined();
      expect(response.body.coverImage.contentType).toBe('image/jpeg');
      expect(response.body.coverImage.size).toBe(imageBuffer.length);
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

    it('should update event with image for admin', async () => {
      const imageBuffer = Buffer.from('updated-image-data');
      
      const response = await request(app)
        .put(`/api/events/${testEvent._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('title', 'Updated Event with Image')
        .field('description', 'Updated Description')
        .attach('image', imageBuffer, 'updated.jpg');

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Updated Event with Image');
      expect(response.body.coverImage).toBeDefined();
      expect(response.body.coverImage.data).toBeDefined();
      expect(response.body.coverImage.contentType).toBe('image/jpeg');
      expect(response.body.coverImage.size).toBe(imageBuffer.length);
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

  describe('Cover Image Endpoints', () => {
    // Create a small test image buffer (1x1 pixel PNG)
    const createTestImageBuffer = () => {
      // Simple 1x1 pixel PNG image (67 bytes)
      return Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
        0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0xFF,
        0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0xE2, 0x21, 0xBC, 0x33, 0x00,
        0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);
    };

    describe('POST /api/events/:id/cover-image', () => {
      it('should upload cover image for admin', async () => {
        const imageBuffer = createTestImageBuffer();
        
        const response = await request(app)
          .post(`/api/events/${testEvent._id}/cover-image`)
          .set('Authorization', `Bearer ${adminToken}`)
          .attach('coverImage', imageBuffer, 'test.png');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Cover image uploaded successfully');
        expect(response.body).toHaveProperty('imageSize');
        expect(response.body).toHaveProperty('contentType');

        // Verify image was saved in database
        const updatedEvent = await Event.findById(testEvent._id);
        expect(updatedEvent.coverImage).toBeDefined();
        expect(updatedEvent.coverImage.data).toBeDefined();
        expect(updatedEvent.coverImage.contentType).toBe('image/png');
        expect(updatedEvent.coverImage.size).toBe(imageBuffer.length);
      });

      it('should return 403 for non-admin users', async () => {
        const imageBuffer = createTestImageBuffer();
        
        const response = await request(app)
          .post(`/api/events/${testEvent._id}/cover-image`)
          .set('Authorization', `Bearer ${regularToken}`)
          .attach('coverImage', imageBuffer, 'test.png');

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('message', 'Not authorized to upload images for this event');
      });

      it('should return 400 when no image is provided', async () => {
        const response = await request(app)
          .post(`/api/events/${testEvent._id}/cover-image`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message', 'No image file provided');
      });

      it('should return 404 for non-existent event', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const imageBuffer = createTestImageBuffer();
        
        const response = await request(app)
          .post(`/api/events/${nonExistentId}/cover-image`)
          .set('Authorization', `Bearer ${adminToken}`)
          .attach('coverImage', imageBuffer, 'test.png');

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('message', 'Event not found');
      });
    });

    describe('GET /api/events/:id/cover-image', () => {
      it('should return cover image when it exists', async () => {
        // First upload an image
        const imageBuffer = createTestImageBuffer();
        await request(app)
          .post(`/api/events/${testEvent._id}/cover-image`)
          .set('Authorization', `Bearer ${adminToken}`)
          .attach('coverImage', imageBuffer, 'test.png');

        // Then get the image
        const response = await request(app)
          .get(`/api/events/${testEvent._id}/cover-image`);

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toBe('image/png');
        expect(response.headers['content-length']).toBe(imageBuffer.length.toString());
        expect(response.body).toEqual(imageBuffer);
      });

      it('should return 404 when cover image does not exist', async () => {
        const response = await request(app)
          .get(`/api/events/${testEventNoImage._id}/cover-image`); // Use testEventNoImage

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('message', 'Cover image not found');
      });

      it('should return 404 for non-existent event', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const response = await request(app)
          .get(`/api/events/${nonExistentId}/cover-image`);

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('message', 'Cover image not found');
      });
    });

    describe('PUT /api/events/:id/cover-image', () => {
      it('should update cover image for admin', async () => {
        // First upload an initial image
        const initialImageBuffer = createTestImageBuffer();
        await request(app)
          .post(`/api/events/${testEvent._id}/cover-image`)
          .set('Authorization', `Bearer ${adminToken}`)
          .attach('coverImage', initialImageBuffer, 'initial.png');

        // Then update with a new image
        const newImageBuffer = createTestImageBuffer();
        const response = await request(app)
          .put(`/api/events/${testEvent._id}/cover-image`)
          .set('Authorization', `Bearer ${adminToken}`)
          .attach('coverImage', newImageBuffer, 'updated.png');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Cover image updated successfully');
        expect(response.body).toHaveProperty('imageSize');
        expect(response.body).toHaveProperty('contentType');

        // Verify image was updated in database
        const updatedEvent = await Event.findById(testEvent._id);
        expect(updatedEvent.coverImage.data.toString('hex')).toEqual(newImageBuffer.toString('hex'));
      });

      it('should return 403 for non-admin users', async () => {
        const imageBuffer = createTestImageBuffer();
        
        const response = await request(app)
          .put(`/api/events/${testEvent._id}/cover-image`)
          .set('Authorization', `Bearer ${regularToken}`)
          .attach('coverImage', imageBuffer, 'test.png');

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('message', 'Not authorized to update images for this event');
      });
    });

    describe('DELETE /api/events/:id/cover-image', () => {
      it('should delete cover image for admin', async () => {
        // First upload an image
        const imageBuffer = createTestImageBuffer();
        await request(app)
          .post(`/api/events/${testEvent._id}/cover-image`)
          .set('Authorization', `Bearer ${adminToken}`)
          .attach('coverImage', imageBuffer, 'test.png');

        // Then delete the image
        const response = await request(app)
          .delete(`/api/events/${testEvent._id}/cover-image`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Cover image deleted successfully');

        // Verify image was deleted from database
        const updatedEvent = await Event.findById(testEvent._id);
        expect(updatedEvent.coverImage?.data).toBeUndefined();
      });

      it('should return 403 for non-admin users', async () => {
        const response = await request(app)
          .delete(`/api/events/${testEvent._id}/cover-image`)
          .set('Authorization', `Bearer ${regularToken}`);

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('message', 'Not authorized to delete images for this event');
      });

      it('should return 404 when no cover image exists', async () => {
        const response = await request(app)
          .delete(`/api/events/${testEventNoImage._id}/cover-image`) // Use testEventNoImage
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('message', 'No cover image found for this event');
      });
    });

    describe('Private Event Creation', () => {
      it('should create a private event with participants', async () => {
        const privateEventData = {
          title: 'Private Test Event',
          description: 'Private Event Description',
          category: 'Education & Training',
          targetGroup: 'All Hong Kong Residents',
          location: {
            venue: 'Test Venue',
            address: 'Test Address',
            district: 'Central and Western',
            onlineEvent: false
          },
          startDate: new Date(Date.now() + 86400000), // Tomorrow
          endDate: new Date(Date.now() + 172800000), // Day after tomorrow
          isPrivate: true,
          status: 'Draft',
          registrationFormId: testRegistrationForm._id.toString(),
          'participants[]': [regularUser._id.toString()]
        };

        const response = await request(app)
          .post('/api/events')
          .set('Authorization', `Bearer ${adminToken}`)
          .field('title', privateEventData.title)
          .field('description', privateEventData.description)
          .field('category', privateEventData.category)
          .field('targetGroup', privateEventData.targetGroup)
          .field('location[venue]', privateEventData.location.venue)
          .field('location[address]', privateEventData.location.address)
          .field('location[district]', privateEventData.location.district)
          .field('location[onlineEvent]', privateEventData.location.onlineEvent.toString())
          .field('startDate', privateEventData.startDate.toISOString())
          .field('endDate', privateEventData.endDate.toISOString())
          .field('isPrivate', privateEventData.isPrivate.toString())
          .field('status', privateEventData.status)
          .field('registrationFormId', privateEventData.registrationFormId)
          .field('participants[]', privateEventData['participants[]'][0]);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('title', 'Private Test Event');
        expect(response.body).toHaveProperty('isPrivate', true);
        expect(response.body).toHaveProperty('participants');
        expect(response.body.participants).toHaveLength(1);
        expect(response.body.participants[0]).toBe(regularUser._id.toString());
      });

      it('should create a private event without participants', async () => {
        const privateEventData = {
          title: 'Private Event No Participants',
          description: 'Private Event Description',
          category: 'Education & Training',
          targetGroup: 'All Hong Kong Residents',
          location: {
            venue: 'Test Venue',
            address: 'Test Address',
            district: 'Central and Western',
            onlineEvent: false
          },
          startDate: new Date(Date.now() + 86400000), // Tomorrow
          endDate: new Date(Date.now() + 172800000), // Day after tomorrow
          isPrivate: true,
          status: 'Draft',
          registrationFormId: testRegistrationForm._id.toString()
        };

        const response = await request(app)
          .post('/api/events')
          .set('Authorization', `Bearer ${adminToken}`)
          .field('title', privateEventData.title)
          .field('description', privateEventData.description)
          .field('category', privateEventData.category)
          .field('targetGroup', privateEventData.targetGroup)
          .field('location[venue]', privateEventData.location.venue)
          .field('location[address]', privateEventData.location.address)
          .field('location[district]', privateEventData.location.district)
          .field('location[onlineEvent]', privateEventData.location.onlineEvent.toString())
          .field('startDate', privateEventData.startDate.toISOString())
          .field('endDate', privateEventData.endDate.toISOString())
          .field('isPrivate', privateEventData.isPrivate.toString())
          .field('status', privateEventData.status)
          .field('registrationFormId', privateEventData.registrationFormId);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('title', 'Private Event No Participants');
        expect(response.body).toHaveProperty('isPrivate', true);
        expect(response.body).toHaveProperty('participants');
        expect(response.body.participants).toHaveLength(0);
      });
    });
  });
}); 
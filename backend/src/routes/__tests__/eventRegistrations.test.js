import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import eventRegistrationsRoutes from '../eventRegistrations.js';
import User from '../../models/User.js';
import Event from '../../models/Event.js';
import EventRegistration from '../../models/EventRegistration.js';
import RegistrationForm from '../../models/RegistrationForm.js';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
app.use(express.json());
app.use('/api/event-registrations', eventRegistrationsRoutes);

let mongod;
let adminUser, staffUser, regularUser;
let adminToken, staffToken, regularToken;
let testForm, testEvent;

describe('Event Registrations Bulk Upload', () => {
  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.connection.close();
    await mongod.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Event.deleteMany({});
    await EventRegistration.deleteMany({});
    await RegistrationForm.deleteMany({});

    adminUser = new User({
      username: 'admin',
      password: 'adminpassword',
      firstName: 'Admin',
      lastName: 'User',
      mobile: '+85212345678',
      email: 'admin@example.com',
      role: 'admin'
    });
    await adminUser.save();

    staffUser = new User({
      username: 'staff',
      password: 'staffpassword',
      firstName: 'Staff',
      lastName: 'User',
      mobile: '+85287654321',
      email: 'staff@example.com',
      role: 'staff'
    });
    await staffUser.save();

    regularUser = new User({
      username: 'existinguser',
      password: 'userpassword',
      firstName: 'Existing',
      lastName: 'Person',
      mobile: '+85222334455',
      email: 'existing@example.com',
      role: 'participant'
    });
    await regularUser.save();

    adminToken = jwt.sign({ userId: adminUser._id }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '24h' });
    staffToken = jwt.sign({ userId: staffUser._id }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '24h' });
    regularToken = jwt.sign({ userId: regularUser._id }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '24h' });

    testForm = new RegistrationForm({
      title: 'Default Form',
      createdBy: adminUser._id,
      sections: [{
        title: 'Personal Info',
        order: 0,
        fields: [{
          label: 'Name',
          type: 'text',
          order: 0
        }]
      }]
    });
    await testForm.save();

    testEvent = new Event({
      title: 'Community Career Workshop',
      description: 'A great workshop for the community',
      category: 'Career Development',
      targetGroup: 'All Hong Kong Residents',
      eventType: 'Single Session',
      registrationFormId: testForm._id,
      location: {
        venue: 'Community Centre',
        address: '100 Nathan Road',
        district: 'Eastern',
        onlineEvent: false
      },
      status: 'Published',
      startDate: new Date(Date.now() + 86400000),
      endDate: new Date(Date.now() + 172800000),
      createdBy: adminUser._id,
      sessions: [
        {
          id: 'session-1',
          title: 'Morning Session',
          date: new Date(Date.now() + 86400000),
          startTime: '09:00',
          endTime: '12:00'
        }
      ]
    });
    await testEvent.save();
  });

  it('should process mixed list: create new users and register existing users', async () => {
    const response = await request(app)
      .post(`/api/event-registrations/event/${testEvent._id}/bulk-upload`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        participants: [
          // Path B: Existing user in system
          { firstName: 'existing', lastName: 'person', mobile: '22334455' },
          // Path A: Brand new user with "Nil" last name and same email as existing user
          { firstName: 'sarah', lastName: 'nil', mobile: '25409588', email: 'existing@example.com' },
          // Invalid row: bad mobile
          { firstName: 'Invalid', lastName: 'Mobile', mobile: '123' }
        ]
      });

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(3);
    expect(response.body.successful).toBe(2);
    expect(response.body.failed).toBe(1);

    // Verify existing user was assigned to event
    const regExisting = await EventRegistration.findOne({
      eventId: testEvent._id,
      userId: regularUser._id
    });
    expect(regExisting).not.toBeNull();
    expect(regExisting.status).toBe('registered');

    // Verify new user was created with Title Case and auto credentials even with shared participant email
    const newUser = await User.findOne({ username: 'sarah25409588' });
    expect(newUser).not.toBeNull();
    expect(newUser.firstName).toBe('Sarah');
    expect(newUser.lastName).toBe('Nil');
    expect(newUser.email).toBe('existing@example.com');
    expect(newUser.role).toBe('participant');

    // Verify new user is registered for the event
    const regNew = await EventRegistration.findOne({
      eventId: testEvent._id,
      userId: newUser._id
    });
    expect(regNew).not.toBeNull();
    expect(regNew.status).toBe('registered');

    // Verify registeredCount on Event updated
    const updatedEvent = await Event.findById(testEvent._id);
    expect(updatedEvent.registeredCount).toBe(2);
  });

  it('should skip users already registered for the event', async () => {
    // Register existing user first
    const initialReg = new EventRegistration({
      eventId: testEvent._id,
      userId: regularUser._id,
      attendee: {
        firstName: regularUser.firstName,
        lastName: regularUser.lastName,
        phone: regularUser.mobile
      },
      status: 'registered'
    });
    await initialReg.save();

    // Now bulk upload containing this user
    const response = await request(app)
      .post(`/api/event-registrations/event/${testEvent._id}/bulk-upload`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        participants: [
          { firstName: 'Existing', lastName: 'Person', mobile: '+85222334455' }
        ]
      });

    expect(response.status).toBe(200);
    expect(response.body.successful).toBe(0);
    expect(response.body.skipped).toBe(1);
    expect(response.body.skippedRegistrations[0].reason).toBe('Already registered for this event');
  });

  it('should return 403 for participant users', async () => {
    const response = await request(app)
      .post(`/api/event-registrations/event/${testEvent._id}/bulk-upload`)
      .set('Authorization', `Bearer ${regularToken}`)
      .send({
        participants: [
          { firstName: 'Test', lastName: 'User', mobile: '25409588' }
        ]
      });

    expect(response.status).toBe(403);
  });
});

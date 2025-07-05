import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import registrationFormRoutes from '../registrationForms.js';
import auth from '../../middleware/auth.js';
import RegistrationForm from '../../models/RegistrationForm.js';
import User from '../../models/User.js';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

// Load environment variables
dotenv.config();

// Create an express app for testing
const app = express();
app.use(express.json());
app.use('/api/registration-forms', registrationFormRoutes);

let mongod;
let adminUser, staffUser, participantUser;
let adminToken, staffToken, participantToken;

describe('Registration Forms Routes', () => {
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
    await User.deleteMany({});
    await RegistrationForm.deleteMany({});

    // Create test users
    adminUser = new User({
      username: 'admin',
      password: 'password123',
      firstName: 'Admin',
      lastName: 'User',
      mobile: '1234567890',
      email: 'admin@example.com',
      role: 'admin'
    });
    await adminUser.save();

    staffUser = new User({
      username: 'staff',
      password: 'password123',
      firstName: 'Staff',
      lastName: 'User',
      mobile: '1234567891',
      email: 'staff@example.com',
      role: 'staff'
    });
    await staffUser.save();

    participantUser = new User({
      username: 'participant',
      password: 'password123',
      firstName: 'Participant',
      lastName: 'User',
      mobile: '1234567892',
      email: 'participant@example.com',
      role: 'participant'
    });
    await participantUser.save();

    // Generate tokens
    adminToken = jwt.sign({ userId: adminUser._id }, process.env.JWT_SECRET || 'test-secret');
    staffToken = jwt.sign({ userId: staffUser._id }, process.env.JWT_SECRET || 'test-secret');
    participantToken = jwt.sign({ userId: participantUser._id }, process.env.JWT_SECRET || 'test-secret');
  });

  describe('GET /api/registration-forms', () => {
    it('should return all forms for admin user', async () => {
      // Create test forms
      const form1 = new RegistrationForm({
        title: 'Test Form 1',
        description: 'Test Description 1',
        sections: [],
        createdBy: adminUser._id
      });
      await form1.save();

      const form2 = new RegistrationForm({
        title: 'Test Form 2',
        description: 'Test Description 2',
        sections: [],
        createdBy: staffUser._id
      });
      await form2.save();

      const response = await request(app)
        .get('/api/registration-forms')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      // Forms are sorted by createdAt descending, so form2 (created later) comes first
      expect(response.body[0]).toHaveProperty('title', 'Test Form 2');
      expect(response.body[1]).toHaveProperty('title', 'Test Form 1');
    });

    it('should return all forms for staff user', async () => {
      const form = new RegistrationForm({
        title: 'Test Form',
        description: 'Test Description',
        sections: [],
        createdBy: adminUser._id
      });
      await form.save();

      const response = await request(app)
        .get('/api/registration-forms')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('title', 'Test Form');
    });

    it('should return 403 for participant user', async () => {
      const response = await request(app)
        .get('/api/registration-forms')
        .set('Authorization', `Bearer ${participantToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Not authorized to view forms');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/registration-forms');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/registration-forms/active', () => {
    it('should return only active forms', async () => {
      // Create active and inactive forms
      const activeForm = new RegistrationForm({
        title: 'Active Form',
        description: 'Active Description',
        sections: [],
        isActive: true,
        createdBy: adminUser._id
      });
      await activeForm.save();

      const inactiveForm = new RegistrationForm({
        title: 'Inactive Form',
        description: 'Inactive Description',
        sections: [],
        isActive: false,
        createdBy: adminUser._id
      });
      await inactiveForm.save();

      const response = await request(app)
        .get('/api/registration-forms/active');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('title', 'Active Form');
      expect(response.body[0]).toHaveProperty('isActive', true);
    });

    it('should return empty array when no active forms exist', async () => {
      const inactiveForm = new RegistrationForm({
        title: 'Inactive Form',
        description: 'Inactive Description',
        sections: [],
        isActive: false,
        createdBy: adminUser._id
      });
      await inactiveForm.save();

      const response = await request(app)
        .get('/api/registration-forms/active');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
    });
  });

  describe('GET /api/registration-forms/:id', () => {
    it('should return a specific form', async () => {
      const form = new RegistrationForm({
        title: 'Test Form',
        description: 'Test Description',
        sections: [
          {
            title: 'Section 1',
            description: 'Section Description',
            fields: [
              {
                label: 'Name',
                type: 'text',
                required: true,
                order: 1
              }
            ],
            order: 1
          }
        ],
        createdBy: adminUser._id
      });
      await form.save();

      const response = await request(app)
        .get(`/api/registration-forms/${form._id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('title', 'Test Form');
      expect(response.body).toHaveProperty('description', 'Test Description');
      expect(response.body.sections).toHaveLength(1);
      expect(response.body.sections[0].title).toBe('Section 1');
    });

    it('should return 404 for non-existent form', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/registration-forms/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Registration form not found');
    });
  });

  describe('POST /api/registration-forms', () => {
    it('should create a new form for admin user', async () => {
      const formData = {
        title: 'New Form',
        description: 'New Form Description',
        sections: [
          {
            title: 'Personal Information',
            description: 'Basic personal details',
            fields: [
              {
                label: 'Full Name',
                type: 'text',
                required: true,
                placeholder: 'Enter your full name',
                order: 1
              },
              {
                label: 'Email',
                type: 'email',
                required: true,
                placeholder: 'Enter your email',
                order: 2
              }
            ],
            order: 1
          }
        ],
        isActive: true
      };

      const response = await request(app)
        .post('/api/registration-forms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(formData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('title', 'New Form');
      expect(response.body).toHaveProperty('description', 'New Form Description');
      expect(response.body.sections).toHaveLength(1);
      expect(response.body.sections[0].fields).toHaveLength(2);
      expect(response.body).toHaveProperty('isActive', true);
      expect(response.body).toHaveProperty('createdBy');
    });

    it('should create a new form for staff user', async () => {
      const formData = {
        title: 'Staff Form',
        description: 'Staff Form Description',
        sections: [],
        isActive: false
      };

      const response = await request(app)
        .post('/api/registration-forms')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(formData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('title', 'Staff Form');
      expect(response.body).toHaveProperty('isActive', false);
    });

    it('should return 403 for participant user', async () => {
      const formData = {
        title: 'Participant Form',
        description: 'Participant Form Description',
        sections: []
      };

      const response = await request(app)
        .post('/api/registration-forms')
        .set('Authorization', `Bearer ${participantToken}`)
        .send(formData);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Not authorized to create forms');
    });

    it('should return 401 without authentication', async () => {
      const formData = {
        title: 'Unauthorized Form',
        description: 'Unauthorized Form Description',
        sections: []
      };

      const response = await request(app)
        .post('/api/registration-forms')
        .send(formData);

      expect(response.status).toBe(401);
    });

    it('should create form with default isActive true when not provided', async () => {
      const formData = {
        title: 'Default Active Form',
        description: 'Default Active Form Description',
        sections: []
      };

      const response = await request(app)
        .post('/api/registration-forms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(formData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('isActive', true);
    });
  });

  describe('PUT /api/registration-forms/:id', () => {
    it('should update a form for admin user', async () => {
      const form = new RegistrationForm({
        title: 'Original Title',
        description: 'Original Description',
        sections: [],
        createdBy: adminUser._id
      });
      await form.save();

      const updateData = {
        title: 'Updated Title',
        description: 'Updated Description',
        sections: [
          {
            title: 'New Section',
            description: 'New Section Description',
            fields: [
              {
                label: 'Updated Field',
                type: 'text',
                required: true,
                order: 1
              }
            ],
            order: 1
          }
        ],
        isActive: false
      };

      const response = await request(app)
        .put(`/api/registration-forms/${form._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('title', 'Updated Title');
      expect(response.body).toHaveProperty('description', 'Updated Description');
      expect(response.body.sections).toHaveLength(1);
      expect(response.body).toHaveProperty('isActive', false);
      expect(response.body).toHaveProperty('updatedBy');
    });

    it('should update a form for staff user', async () => {
      const form = new RegistrationForm({
        title: 'Staff Form',
        description: 'Staff Description',
        sections: [],
        createdBy: staffUser._id
      });
      await form.save();

      const updateData = {
        title: 'Updated Staff Form',
        description: 'Updated Staff Description'
      };

      const response = await request(app)
        .put(`/api/registration-forms/${form._id}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('title', 'Updated Staff Form');
    });

    it('should return 403 for participant user', async () => {
      const form = new RegistrationForm({
        title: 'Test Form',
        description: 'Test Description',
        sections: [],
        createdBy: adminUser._id
      });
      await form.save();

      const response = await request(app)
        .put(`/api/registration-forms/${form._id}`)
        .set('Authorization', `Bearer ${participantToken}`)
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Not authorized to update forms');
    });

    it('should return 404 for non-existent form', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/registration-forms/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Registration form not found');
    });
  });

  describe('DELETE /api/registration-forms/:id', () => {
    it('should delete a form for admin user', async () => {
      const form = new RegistrationForm({
        title: 'Form to Delete',
        description: 'Form to Delete Description',
        sections: [],
        createdBy: adminUser._id
      });
      await form.save();

      const response = await request(app)
        .delete(`/api/registration-forms/${form._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Registration form deleted successfully');

      // Verify form was actually deleted
      const deletedForm = await RegistrationForm.findById(form._id);
      expect(deletedForm).toBeNull();
    });

    it('should return 403 for staff user', async () => {
      const form = new RegistrationForm({
        title: 'Form to Delete',
        description: 'Form to Delete Description',
        sections: [],
        createdBy: staffUser._id
      });
      await form.save();

      const response = await request(app)
        .delete(`/api/registration-forms/${form._id}`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Not authorized to delete forms');
    });

    it('should return 403 for participant user', async () => {
      const form = new RegistrationForm({
        title: 'Form to Delete',
        description: 'Form to Delete Description',
        sections: [],
        createdBy: adminUser._id
      });
      await form.save();

      const response = await request(app)
        .delete(`/api/registration-forms/${form._id}`)
        .set('Authorization', `Bearer ${participantToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Not authorized to delete forms');
    });

    it('should return 404 for non-existent form', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/registration-forms/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Registration form not found');
    });
  });

  describe('PATCH /api/registration-forms/:id/toggle', () => {
    it('should toggle form active status for admin user', async () => {
      const form = new RegistrationForm({
        title: 'Toggle Form',
        description: 'Toggle Form Description',
        sections: [],
        isActive: true,
        createdBy: adminUser._id
      });
      await form.save();

      const response = await request(app)
        .patch(`/api/registration-forms/${form._id}/toggle`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('isActive', false);
      expect(response.body).toHaveProperty('updatedBy');
    });

    it('should toggle form active status for staff user', async () => {
      const form = new RegistrationForm({
        title: 'Staff Toggle Form',
        description: 'Staff Toggle Form Description',
        sections: [],
        isActive: false,
        createdBy: staffUser._id
      });
      await form.save();

      const response = await request(app)
        .patch(`/api/registration-forms/${form._id}/toggle`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('isActive', true);
    });

    it('should return 403 for participant user', async () => {
      const form = new RegistrationForm({
        title: 'Toggle Form',
        description: 'Toggle Form Description',
        sections: [],
        isActive: true,
        createdBy: adminUser._id
      });
      await form.save();

      const response = await request(app)
        .patch(`/api/registration-forms/${form._id}/toggle`)
        .set('Authorization', `Bearer ${participantToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Not authorized to toggle form status');
    });

    it('should return 404 for non-existent form', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .patch(`/api/registration-forms/${fakeId}/toggle`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Registration form not found');
    });
  });
}); 
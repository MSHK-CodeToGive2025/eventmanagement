import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import usersRoutes from '../users.js';
import User from '../../models/User.js';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

// Load environment variables
dotenv.config();

// Create an express app for testing
const app = express();
app.use(express.json());
app.use('/api/users', usersRoutes);

let mongod;
let adminUser, regularUser;
let adminToken, regularToken;

describe('Users Routes', () => {
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

    // Create admin user
    adminUser = new User({
      username: 'admin',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      mobile: '+85212345678',
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
      mobile: '+85212345679',
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
  });

  describe('GET /api/users', () => {
    it('should return all users for admin', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2); // admin and regular user
      expect(response.body[0]).not.toHaveProperty('password');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Unauthorized: Only admin and staff can view users');
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/users');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/users', () => {
    it('should create new user for admin', async () => {
      const newUserData = {
        username: 'newuser',
        password: 'newuser123',
        firstName: 'New',
        lastName: 'User',
        mobile: '+85212345672',
        email: 'newuser@example.com',
        role: 'participant'
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUserData);

      expect(response.status).toBe(201);
      expect(response.body.username).toBe(newUserData.username);
      expect(response.body.firstName).toBe(newUserData.firstName);
      expect(response.body.lastName).toBe(newUserData.lastName);
      expect(response.body.role).toBe(newUserData.role);
      expect(response.body).not.toHaveProperty('password');

      // Verify user was created in database
      const createdUser = await User.findOne({ username: newUserData.username });
      expect(createdUser).toBeTruthy();
      expect(createdUser.firstName).toBe(newUserData.firstName);
      expect(createdUser.lastName).toBe(newUserData.lastName);
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          username: 'testuser',
          password: 'test123',
          firstName: 'Test',
          lastName: 'User',
          mobile: '+85212345670'
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Unauthorized: Only admin can create users');
    });

    it('should return 400 for duplicate username', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'user', // already exists
          password: 'test123',
          firstName: 'Test',
          lastName: 'User',
          mobile: '+85212345670'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Username already exists');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user for admin', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        email: 'updated@example.com',
        mobile: '+85298765432',
        role: 'staff'
      };

      const response = await request(app)
        .put(`/api/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.firstName).toBe(updateData.firstName);
      expect(response.body.lastName).toBe(updateData.lastName);
      expect(response.body.email).toBe(updateData.email);
      expect(response.body.mobile).toBe(updateData.mobile);
      expect(response.body.role).toBe(updateData.role);
      expect(response.body).not.toHaveProperty('password');

      // Verify user was updated in database
      const updatedUser = await User.findById(regularUser._id);
      expect(updatedUser.firstName).toBe(updateData.firstName);
      expect(updatedUser.lastName).toBe(updateData.lastName);
      expect(updatedUser.email).toBe(updateData.email);
    });

    it('should return 403 when non-admin tries to update another user', async () => {
      const response = await request(app)
        .put(`/api/users/${adminUser._id}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          firstName: 'Hacked'
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Unauthorized: You can only update your own profile');
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/users/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Updated'
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'User not found');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user for admin', async () => {
      const response = await request(app)
        .delete(`/api/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'User deleted successfully');

      // Verify user was deleted from database
      const deletedUser = await User.findById(regularUser._id);
      expect(deletedUser).toBeNull();
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .delete(`/api/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Unauthorized: Only admin can delete users');
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/users/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'User not found');
    });
  });

  describe('POST /api/users/bulk', () => {
    let staffUser, staffToken;

    beforeEach(async () => {
      staffUser = new User({
        username: 'staffuser',
        password: 'staffpassword',
        firstName: 'Staff',
        lastName: 'Member',
        mobile: '+85298765432',
        role: 'staff'
      });
      await staffUser.save();

      staffToken = jwt.sign(
        { userId: staffUser._id },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '24h' }
      );
    });

    it('should allow admin to bulk upload participants and staff', async () => {
      const response = await request(app)
        .post('/api/users/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          users: [
            {
              firstName: 'john',
              lastName: 'deo',
              mobile: '25409588',
              email: 'JOHN.DEO@EXAMPLE.COM',
              role: 'Participant'
            },
            {
              firstName: 'sarah',
              lastName: 'nil',
              mobile: '+85225409588',
              role: 'Staff'
            }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(2);
      expect(response.body.successful).toBe(2);
      expect(response.body.failed).toBe(0);

      // Verify Title Case name & lowercase username/password
      const john = await User.findOne({ username: 'john25409588' });
      expect(john).not.toBeNull();
      expect(john.firstName).toBe('John');
      expect(john.lastName).toBe('Deo');
      expect(john.email).toBe('john.deo@example.com');
      expect(john.mobile).toBe('+85225409588');
      expect(john.role).toBe('participant');
      expect(john.isActive).toBe(true);

      // Verify Nil last name handling
      const sarah = await User.findOne({ username: 'sarah25409588' });
      expect(sarah).not.toBeNull();
      expect(sarah.firstName).toBe('Sarah');
      expect(sarah.lastName).toBe('Nil');
      expect(sarah.role).toBe('staff');
    });

    it('should skip duplicate users based on (firstName, lastName, mobile)', async () => {
      // First insert John Deo
      await request(app)
        .post('/api/users/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          users: [
            { firstName: 'John', lastName: 'Deo', mobile: '25409588' }
          ]
        });

      // Try uploading again with different casing
      const response = await request(app)
        .post('/api/users/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          users: [
            { firstName: 'JOHN', lastName: 'DEO', mobile: '+85225409588' }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body.successful).toBe(0);
      expect(response.body.skipped).toBe(1);
      expect(response.body.skippedUsers[0].reason).toBe('User already exists in system');
    });

    it('should allow staff to bulk upload participants only', async () => {
      const response = await request(app)
        .post('/api/users/bulk')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          users: [
            { firstName: 'Alice', lastName: 'Wong', mobile: '23456789', role: 'participant' },
            { firstName: 'Bob', lastName: 'Chan', mobile: '34567890', role: 'staff' },
            { firstName: 'Charlie', lastName: 'Lee', mobile: '45678901', role: 'admin' }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body.successful).toBe(1);
      expect(response.body.failed).toBe(2);

      // Verify error messages
      expect(response.body.errors[0].errors).toContain('Staff users are only permitted to create Participant accounts');
      expect(response.body.errors[1].errors).toContain('Admin accounts cannot be created via bulk upload');
    });

    it('should validate names and numbers with clear errors', async () => {
      const response = await request(app)
        .post('/api/users/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          users: [
            { firstName: 'John123', lastName: 'Doe', mobile: '999' }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body.failed).toBe(1);
      expect(response.body.errors[0].errors).toContain('First Name must contain only characters, no numbers');
      expect(response.body.errors[0].errors).toContain('Mobile number must be a valid 8-digit Hong Kong number (e.g. 25409588 or +85225409588)');
    });

    it('should return 403 for participant users', async () => {
      const response = await request(app)
        .post('/api/users/bulk')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          users: [
            { firstName: 'Test', lastName: 'User', mobile: '25409588' }
          ]
        });

      expect(response.status).toBe(403);
    });
  });
}); 
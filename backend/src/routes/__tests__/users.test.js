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
      expect(response.body).toHaveProperty('message', 'Unauthorized: Only admin can view all users');
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
        mobile: '1234567892',
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
          mobile: '1234567890'
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
          mobile: '1234567890'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'User already exists');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user for admin', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        email: 'updated@example.com',
        mobile: '9876543210',
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

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .put(`/api/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          firstName: 'Updated'
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Unauthorized: Only admin can update users');
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
}); 
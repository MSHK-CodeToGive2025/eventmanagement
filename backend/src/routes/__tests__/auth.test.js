import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import authRoutes from '../auth.js';
import User from '../../models/User.js';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

// Load environment variables
dotenv.config();

// Create an express app for testing
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

let mongod;
let testUser;
let testToken;

describe('Auth Routes', () => {
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
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        mobile: '1234567890',
        email: 'test@example.com'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.username).toBe(userData.username);
      expect(response.body.user.firstName).toBe(userData.firstName);
      expect(response.body.user.lastName).toBe(userData.lastName);
      expect(response.body.user.role).toBe('admin');

      // Verify the user was actually saved to the database
      const savedUser = await User.findOne({ username: userData.username });
      expect(savedUser).toBeTruthy();
      expect(savedUser.firstName).toBe(userData.firstName);
      expect(savedUser.lastName).toBe(userData.lastName);
      expect(savedUser.mobile).toBe(userData.mobile);
    });

    it('should return 400 if user already exists', async () => {
      const userData = {
        username: 'existinguser',
        password: 'password123',
        firstName: 'Existing',
        lastName: 'User',
        mobile: '1234567890',
        email: 'existing@example.com'
      };

      // First create a user
      await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Try to create the same user again
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'User already exists');

      // Verify only one user exists in the database
      const users = await User.find({ username: userData.username });
      expect(users.length).toBe(1);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          // Missing required fields
          username: 'testuser'
        });

      expect(response.status).toBe(500);
    });

    it('should create admin user when requested by existing admin', async () => {
      // First create an admin user
      const adminUser = new User({
        username: 'admin',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User',
        mobile: '1234567890',
        email: 'admin@example.com',
        role: 'admin'
      });
      await adminUser.save();

      // Generate token for admin
      const adminToken = jwt.sign(
        { userId: adminUser._id },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '24h' }
      );

      const newAdminData = {
        username: 'newadmin',
        password: 'password123',
        firstName: 'New',
        lastName: 'Admin',
        mobile: '1234567891',
        email: 'newadmin@example.com',
        role: 'admin'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newAdminData);

      expect(response.status).toBe(201);
      expect(response.body.user.role).toBe('admin');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      testUser = new User({
        username: 'loginuser',
        password: 'password123',
        firstName: 'Login',
        lastName: 'User',
        mobile: '1234567890',
        email: 'login@example.com'
      });
      await testUser.save();
    });

    it('should login user successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'loginuser',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.username).toBe('loginuser');
      expect(response.body.user.firstName).toBe('Login');
      expect(response.body.user.lastName).toBe('User');
      testToken = response.body.token;
    });

    it('should return 400 with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'loginuser',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('should return 400 with non-existent username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistentuser',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });
  });

  describe('GET /api/auth/me', () => {
    beforeEach(async () => {
      // Create a test user and get token
      testUser = new User({
        username: 'meuser',
        password: 'password123',
        firstName: 'Me',
        lastName: 'User',
        mobile: '1234567890',
        email: 'me@example.com'
      });
      await testUser.save();

      testToken = jwt.sign(
        { userId: testUser._id },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '24h' }
      );
    });

    it('should return user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.username).toBe('meuser');
      expect(response.body.firstName).toBe('Me');
      expect(response.body.lastName).toBe('User');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken');

      expect(response.status).toBe(401);
    });
  });
}); 
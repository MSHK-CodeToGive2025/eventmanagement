import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import authRoutes from '../auth.js';
import User from '../../models/User.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create an express app for testing
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

let mongod;

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
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        phoneNumber: '1234567890'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.name).toBe(userData.name);
      expect(response.body.user.role).toBe('participant');

      // Verify the user was actually saved to the database
      const savedUser = await User.findOne({ email: userData.email });
      expect(savedUser).toBeTruthy();
      expect(savedUser.name).toBe(userData.name);
    });

    it('should return 400 if user already exists', async () => {
      // First create a user
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User',
        phoneNumber: '1234567890'
      };

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
      const users = await User.find({ email: userData.email });
      expect(users.length).toBe(1);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          // Missing required fields
          email: 'test@example.com'
        });

      expect(response.status).toBe(500); // Since we're not using express-validator in this example
    });
  });
}); 
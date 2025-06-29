import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();
const expiresIn = '24h';

// Register new user
router.post('/register', async (req, res) => { 
  try {
    const { username, password, firstName, lastName, mobile, email, role } = req.body;
    console.log('[AUTH] Registration attempt:', { username: username, firstName: firstName, role: role });

    // Check if user already exists
    let user = await User.findOne({ username });
    if (user) {
      console.log('[AUTH] Registration failed: User exists:', { username });
      return res.status(400).json({ message: 'User already exists' });
    }

    // If trying to create staff or admin role, check if the request is from an admin
    if (role === 'staff' || role === 'admin') {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(403).json({ message: 'Unauthorized: Only admin can create staff or admin users' });
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const adminUser = await User.findById(decoded.userId);

      if (!adminUser || adminUser.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized: Only admin can create staff or admin users' });
      }
    }

    // Create new user
    user = new User({
      username,
      password,
      firstName,
      lastName,
      mobile,
      email,
      role: role || 'participant'
    });

    await user.save();
    console.log('[AUTH] User registered successfully:', { 
      userId: user._id, 
      username: user.username, 
      role: user.role 
    });

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: expiresIn }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('[AUTH] Registration error:', { 
      error: error.message, 
      stack: error.stack 
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {

  try {
    const { username, password } = req.body;
    console.log('[AUTH] Login attempt:', { username: username });

    // Check if user exists
    const user = await User.findOne({ username });
    if (!user) {
      console.log('[AUTH] Login failed: User not found:', { username });
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('[AUTH] Login failed: Invalid password:', { username });
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: expiresIn }
    );
    console.log('[AUTH] Login successful:', { 
      userId: user._id, 
      username: user.username, 
      role: user.role 
    });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('[AUTH] Login error:', { 
      error: error.message, 
      stack: error.stack 
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user info
router.get('/me', auth, async (req, res) => {
  console.log('[AUTH] Fetching user profile:', { userId: req.user.userId });
  
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      console.log('[AUTH] User profile not found:', { userId: req.user.userId });
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('[AUTH] User profile retrieved successfully:', { 
      userId: user._id, 
      username: user.username, 
      role: user.role 
    });
    res.json(user);
  } catch (error) {
    console.error('[AUTH] Profile fetch error:', { 
      userId: req.user.userId, 
      error: error.message, 
      stack: error.stack 
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router; 
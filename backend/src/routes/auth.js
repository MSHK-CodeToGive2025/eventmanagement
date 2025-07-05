import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();
const expiresIn = '24h';

// Register new user (public registration - always creates participants, except first user is admin)
router.post('/register', async (req, res) => { 
  try {
    const { username, password, firstName, lastName, mobile, email } = req.body;
    if (!username || !password || !firstName || !lastName || !mobile) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // First user is admin, all others are participant
    const userCount = await User.countDocuments();
    const userRole = userCount === 0 ? 'admin' : 'participant';

    const user = new User({
      username,
      password,
      firstName,
      lastName,
      mobile,
      email,
      role: userRole
    });

    await user.save();

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
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
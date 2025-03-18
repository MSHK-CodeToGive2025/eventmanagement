import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();
const expiresIn = '24h';

// Register new user
router.post('/register', async (req, res) => { 
  try {
    const { email, password, name, phoneNumber, role } = req.body;
    console.log('[AUTH] Registration attempt:', { email: email, name: name, role: role });

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      console.log('[AUTH] Registration failed: User exists:', { email });
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    user = new User({
      email,
      password,
      name,
      phoneNumber,
      role: role || 'participant'
    });

    await user.save();
    console.log('[AUTH] User registered successfully:', { 
      userId: user._id, 
      email: user.email, 
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
        email: user.email,
        role: user.role,
        name: user.name
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
    const { email, password } = req.body;
    console.log('[AUTH] Login attempt:', { email: email });

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      console.log('[AUTH] Login failed: User not found:', { email });
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('[AUTH] Login failed: Invalid password:', { email });
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
      email: user.email, 
      role: user.role 
    });

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name
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
      email: user.email, 
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
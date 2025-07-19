import express from 'express';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get all users (admin and staff can view)
router.get('/', auth, async (req, res) => {
  try {
    console.log('[USERS] Fetch users request from user ID:', req.user.userId);
    
    // Check if user is admin or staff
    const user = await User.findById(req.user.userId);
    console.log('[USERS] Requesting user found:', { userId: user?._id, username: user?.username, role: user?.role });
    
    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
      console.log('[USERS] Unauthorized access attempt:', { userId: req.user.userId, userRole: user?.role });
      return res.status(403).json({ message: 'Unauthorized: Only admin and staff can view users' });
    }

    console.log('[USERS] Fetching all users from database...');
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    console.log('[USERS] Found users:', users.length, 'users');
    console.log('[USERS] User details:', users.map(u => ({ 
      id: u._id, 
      username: u.username, 
      role: u.role, 
      firstName: u.firstName,
      lastName: u.lastName,
      createdAt: u.createdAt 
    })));
    
    res.json(users);
  } catch (error) {
    console.error('[USERS] Error fetching users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new user (admin only)
router.post('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized: Only admin can create users' });
    }

    const { username, password, firstName, lastName, mobile, email, role } = req.body;
    if (!username || !password || !firstName || !lastName || !mobile) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Check if email already exists (if email is provided)
    if (email) {
      const existingEmailUser = await User.findOne({ email });
      if (existingEmailUser) {
        return res.status(400).json({ message: 'Email address already exists' });
      }
    }

    const newUser = new User({
      username,
      password,
      firstName,
      lastName,
      mobile,
      email,
      role: role || 'participant'
    });

    await newUser.save();

    const userWithoutPassword = await User.findById(newUser._id).select('-password');
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('[USERS] Error creating user:', error);
    
    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      if (field === 'username') {
        return res.status(400).json({ message: 'Username already exists' });
      } else if (field === 'email') {
        return res.status(400).json({ message: 'Email address already exists' });
      } else {
        return res.status(400).json({ message: `${field} already exists` });
      }
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user (admin only, or user updating their own profile)
router.put('/:id', auth, async (req, res) => {
  try {
    const requestingUser = await User.findById(req.user.userId);
    if (!requestingUser) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Check if user is updating their own profile or is admin
    const isOwnProfile = req.user.userId === req.params.id;
    const isAdmin = requestingUser.role === 'admin';

    if (!isOwnProfile && !isAdmin) {
      return res.status(403).json({ message: 'Unauthorized: You can only update your own profile' });
    }

    const { firstName, lastName, email, mobile, role, isActive } = req.body;
    
    // If user is updating their own profile, don't allow role changes
    const updateData = isOwnProfile 
      ? { firstName, lastName, email, mobile }
      : { firstName, lastName, email, mobile, role, isActive };

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`[USERS] User ${requestingUser.username} updated ${isOwnProfile ? 'their own' : 'user'} profile: ${updatedUser.username}`);
    res.json(updatedUser);
  } catch (error) {
    console.error('[USERS] Error updating user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Change user password (admin only, or user changing their own password)
router.patch('/:id/password', auth, async (req, res) => {
  try {
    const requestingUser = await User.findById(req.user.userId);
    if (!requestingUser) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Check if user is changing their own password or is admin
    const isOwnPassword = req.user.userId === req.params.id;
    const isAdmin = requestingUser.role === 'admin';

    if (!isOwnPassword && !isAdmin) {
      return res.status(403).json({ message: 'Unauthorized: You can only change your own password' });
    }

    const { newPassword, currentPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({ message: 'New password is required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const userToUpdate = await User.findById(req.params.id);
    if (!userToUpdate) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If user is changing their own password, verify current password
    if (isOwnPassword && currentPassword) {
      const isCurrentPasswordValid = await userToUpdate.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
    }

    // Update the password
    userToUpdate.password = newPassword;
    await userToUpdate.save();

    const action = isOwnPassword ? 'changed their own password' : `reset password for user ${userToUpdate.username}`;
    console.log(`[USERS] ${requestingUser.username} ${action}`);
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('[USERS] Error changing password:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reset user password (admin only) - generates a temporary password
router.post('/:id/reset-password', auth, async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized: Only admin can reset user passwords' });
    }

    const userToUpdate = await User.findById(req.params.id);
    if (!userToUpdate) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate a temporary password (8 characters, alphanumeric)
    const tempPassword = Math.random().toString(36).slice(-4) + Math.random().toString(36).slice(-4);
    
    // Update the password
    userToUpdate.password = tempPassword;
    await userToUpdate.save();

    console.log(`[USERS] Admin ${user.username} reset password for user ${userToUpdate.username}`);
    
    res.json({ 
      message: 'Password reset successfully',
      temporaryPassword: tempPassword,
      user: {
        username: userToUpdate.username,
        firstName: userToUpdate.firstName,
        lastName: userToUpdate.lastName,
        mobile: userToUpdate.mobile
      }
    });
  } catch (error) {
    console.error('[USERS] Error resetting password:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete user (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized: Only admin can delete users' });
    }

    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('[USERS] Error deleting user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router; 
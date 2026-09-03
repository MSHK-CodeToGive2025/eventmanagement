import express from 'express';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import { validatePhoneNumberMiddleware } from '../utils/phoneUtils.js';
import {
  validateFirstName,
  validateLastName,
  validateAndNormalizeMobile,
  validateRole,
  validateAndNormalizeEmail,
  escapeRegex,
  generateCredentials
} from '../utils/bulkUploadUtils.js';

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

// Bulk upload users (admin and staff can upload; permissions & validations enforced per row)
router.post('/bulk', auth, async (req, res) => {
  try {
    const requestingUser = await User.findById(req.user.userId);
    if (!requestingUser || (requestingUser.role !== 'admin' && requestingUser.role !== 'staff')) {
      return res.status(403).json({ message: 'Unauthorized: Only admin and staff can perform bulk upload' });
    }

    const { users } = req.body;
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ message: 'Request body must include a non-empty users array' });
    }

    const successfulUsers = [];
    const skippedUsers = [];
    const errors = [];
    const seenStaffAdminEmails = new Set();
    const seenStaffAdminMobiles = new Set();

    for (let i = 0; i < users.length; i++) {
      const row = users[i];
      const rowNumber = row.rowNumber || (i + 1);
      const rowErrors = [];

      try {
        // 1. Validate First Name
        const fnResult = validateFirstName(row.firstName);
        if (!fnResult.valid) rowErrors.push(fnResult.error);

        // 2. Validate Last Name ("Nil" supported)
        const lnResult = validateLastName(row.lastName);
        if (!lnResult.valid) rowErrors.push(lnResult.error);

        // 3. Validate Mobile
        const mobileResult = validateAndNormalizeMobile(row.mobile);
        if (!mobileResult.valid) rowErrors.push(mobileResult.error);

        // 4. Validate Role
        const roleResult = validateRole(row.role, requestingUser.role);
        if (!roleResult.valid) rowErrors.push(roleResult.error);

        // 5. Validate Email
        const emailResult = validateAndNormalizeEmail(row.email);
        if (!emailResult.valid) rowErrors.push(emailResult.error);

        // If validation errors exist, record failure and continue
        if (rowErrors.length > 0) {
          errors.push({
            row: rowNumber,
            data: row,
            errors: rowErrors
          });
          continue;
        }

        const firstName = fnResult.value;
        const lastName = lnResult.value;
        const normalizedMobile = mobileResult.normalizedMobile;
        const phone8 = mobileResult.phone8;
        const role = roleResult.role;
        const email = emailResult.email;

        // Check if user already exists based on triplet (firstName + lastName + mobile)
        const existingUser = await User.findOne({
          firstName: { $regex: new RegExp(`^${escapeRegex(firstName)}$`, 'i') },
          lastName: { $regex: new RegExp(`^${escapeRegex(lastName)}$`, 'i') },
          mobile: normalizedMobile
        });

        if (existingUser) {
          skippedUsers.push({
            row: rowNumber,
            data: row,
            reason: 'User already exists in system'
          });
          continue;
        }

        // Check email uniqueness: staff and admin emails must be unique and cannot be repeated
        // Participant emails can be repeated
        if (email && (role === 'staff' || role === 'admin')) {
          if (seenStaffAdminEmails.has(email)) {
            errors.push({
              row: rowNumber,
              data: row,
              errors: ['Staff and admin email must be unique and cannot be repeated in upload']
            });
            continue;
          }

          const existingStaffAdmin = await User.findOne({
            email,
            role: { $in: ['admin', 'staff'] }
          });

          if (existingStaffAdmin) {
            errors.push({
              row: rowNumber,
              data: row,
              errors: ['Staff and admin email must be unique and is already in use by another staff/admin user']
            });
            continue;
          }

          seenStaffAdminEmails.add(email);
        }

        // Check mobile uniqueness: staff and admin mobile numbers must be unique and cannot be repeated
        // Participant mobile numbers can be repeated
        if (role === 'staff' || role === 'admin') {
          if (seenStaffAdminMobiles.has(normalizedMobile)) {
            errors.push({
              row: rowNumber,
              data: row,
              errors: ['Staff and admin mobile number must be unique and cannot be repeated in upload']
            });
            continue;
          }

          const existingStaffAdminMobile = await User.findOne({
            mobile: normalizedMobile,
            role: { $in: ['admin', 'staff'] }
          });

          if (existingStaffAdminMobile) {
            errors.push({
              row: rowNumber,
              data: row,
              errors: ['Staff and admin mobile number must be unique and is already in use by another staff/admin user']
            });
            continue;
          }

          seenStaffAdminMobiles.add(normalizedMobile);
        }

        // Generate unique credentials: [lowercase firstName][8-digit mobile]
        const { username, tempPassword } = await generateCredentials(firstName, phone8, User);

        // Create and save user
        const newUser = new User({
          username,
          password: tempPassword, // Mongoose pre('save') hook will hash this
          firstName,
          lastName,
          mobile: normalizedMobile,
          email, // undefined if not provided
          role,
          isActive: true,
          whatsappOptOut: false
        });

        await newUser.save();

        successfulUsers.push({
          id: newUser._id,
          row: rowNumber,
          firstName,
          lastName,
          mobile: normalizedMobile,
          email: email || '',
          username,
          tempPassword,
          role,
          isActive: true
        });
      } catch (rowErr) {
        console.error(`[USERS BULK] Error processing row ${rowNumber}:`, rowErr);
        errors.push({
          row: rowNumber,
          data: row,
          errors: [rowErr.message || 'Failed to process user record']
        });
      }
    }

    res.json({
      total: users.length,
      successful: successfulUsers.length,
      skipped: skippedUsers.length,
      failed: errors.length,
      successfulUsers,
      skippedUsers,
      errors
    });
  } catch (error) {
    console.error('[USERS BULK] Server error:', error);
    res.status(500).json({ message: 'Server error during bulk upload', error: error.message });
  }
});

// Create new user (admin only)
router.post('/', auth, validatePhoneNumberMiddleware, async (req, res) => {
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

    const targetRole = role || 'participant';

    // Staff and admin emails must be unique
    if (email && (targetRole === 'admin' || targetRole === 'staff')) {
      const existingEmailUser = await User.findOne({
        email: email.trim().toLowerCase(),
        role: { $in: ['admin', 'staff'] }
      });
      if (existingEmailUser) {
        return res.status(400).json({ message: 'Email address already exists for a staff or admin account' });
      }
    }

    // Staff and admin mobile numbers must be unique
    if (mobile && (targetRole === 'admin' || targetRole === 'staff')) {
      const existingMobileUser = await User.findOne({
        mobile,
        role: { $in: ['admin', 'staff'] }
      });
      if (existingMobileUser) {
        return res.status(400).json({ message: 'Mobile number already exists for a staff or admin account' });
      }
    }

    const newUser = new User({
      username,
      password,
      firstName,
      lastName,
      mobile,
      email: email ? email.trim().toLowerCase() : undefined,
      role: targetRole
    });

    await newUser.save();

    const userWithoutPassword = await User.findById(newUser._id).select('-password');
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('[USERS] Error creating user:', error);
    
    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      if (field === 'username') {
        return res.status(400).json({ message: 'Username already exists' });
      } else if (field === 'email') {
        return res.status(400).json({ message: 'Email address already exists for a staff or admin account' });
      } else if (field === 'mobile') {
        return res.status(400).json({ message: 'Mobile number already exists for a staff or admin account' });
      } else {
        return res.status(400).json({ message: `${field} already exists` });
      }
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user (admin only, or user updating their own profile)
router.put('/:id', auth, validatePhoneNumberMiddleware, async (req, res) => {
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
    
    // Determine target role for email uniqueness check
    const existingTargetUser = await User.findById(req.params.id);
    if (!existingTargetUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    const finalRole = isOwnProfile ? existingTargetUser.role : (role || existingTargetUser.role);

    if (email && (finalRole === 'admin' || finalRole === 'staff')) {
      const existingEmailUser = await User.findOne({
        email: email.trim().toLowerCase(),
        _id: { $ne: req.params.id },
        role: { $in: ['admin', 'staff'] }
      });
      if (existingEmailUser) {
        return res.status(400).json({ message: 'Email address already exists for a staff or admin account' });
      }
    }

    if (mobile && (finalRole === 'admin' || finalRole === 'staff')) {
      const existingMobileUser = await User.findOne({
        mobile,
        _id: { $ne: req.params.id },
        role: { $in: ['admin', 'staff'] }
      });
      if (existingMobileUser) {
        return res.status(400).json({ message: 'Mobile number already exists for a staff or admin account' });
      }
    }

    // If user is updating their own profile, don't allow role changes
    const updateData = isOwnProfile 
      ? { firstName, lastName, email: email ? email.trim().toLowerCase() : undefined, mobile }
      : { firstName, lastName, email: email ? email.trim().toLowerCase() : undefined, mobile, role, isActive };

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
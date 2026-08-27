import express from 'express';
import auth from '../middleware/auth.js';
import EventRegistration from '../models/EventRegistration.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import {
  validateFirstName,
  validateLastName,
  validateAndNormalizeMobile,
  validateAndNormalizeEmail,
  escapeRegex,
  generateCredentials
} from '../utils/bulkUploadUtils.js';

const router = express.Router();

// Get all event registrations (admin/staff only)
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
      return res.status(403).json({ message: 'Not authorized to view registrations' });
    }

    const registrations = await EventRegistration.find()
      .populate('eventId', 'title startDate endDate registrationFormId sessions')
      .populate('userId', 'firstName lastName email mobile')
      .sort({ registeredAt: -1 });

    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get registrations for a specific event (admin or event creator)
router.get('/event/:eventId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(403).json({ message: 'User not found' });
    }

    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const isAdmin = user.role === 'admin';
    const isCreator = event.createdBy && event.createdBy.toString() === req.user.userId;
    if (!isAdmin && !isCreator) {
      return res.status(403).json({ message: 'Not authorized to view registrations for this event' });
    }

    const registrations = await EventRegistration.find({ eventId: req.params.eventId })
      .populate('eventId', 'title startDate endDate registrationFormId sessions')
      .populate('userId', 'firstName lastName email mobile')
      .sort({ registeredAt: -1 });

    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Register for an event
router.post('/event/:eventId', auth, async (req, res) => {
  try {
    console.log('[REGISTRATION] Starting registration process for event:', req.params.eventId);
    console.log('[REGISTRATION] User ID:', req.user.userId);
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      console.log('[REGISTRATION] User not found');
      return res.status(403).json({ message: 'User not found' });
    }

    const event = await Event.findById(req.params.eventId);
    if (!event) {
      console.log('[REGISTRATION] Event not found');
      return res.status(404).json({ message: 'Event not found' });
    }

    console.log('[REGISTRATION] Event status:', event.status);

    // Check if event is published
    if (event.status !== 'Published') {
      console.log('[REGISTRATION] Event not published');
      return res.status(400).json({ message: 'Event is not available for registration' });
    }

    // Check if event is completed
    const now = new Date();
    const endDate = event.endDate ? new Date(event.endDate) : (event.startDate ? new Date(event.startDate) : null);
    if (endDate && endDate < now) {
      console.log('[REGISTRATION] Cannot register for a completed event');
      return res.status(400).json({ message: 'Cannot register for a completed event' });
    }

    // Check if user is already registered (only active registrations)
    const existingRegistration = await EventRegistration.findOne({
      eventId: req.params.eventId,
      userId: req.user.userId,
      status: 'registered'
    });

    console.log('[REGISTRATION] Existing registration check:', existingRegistration ? 'Found' : 'Not found');
    if (existingRegistration) {
      console.log('[REGISTRATION] User already registered, registration ID:', existingRegistration._id);
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    // Also check for any registrations (for debugging)
    const allUserRegistrations = await EventRegistration.find({
      eventId: req.params.eventId,
      userId: req.user.userId
    });
    console.log('[REGISTRATION] All user registrations for this event:', allUserRegistrations.map(r => ({ id: r._id, status: r.status })));

    const { sessions, formResponses, attendee } = req.body;
    console.log('[REGISTRATION] Request body:', { sessions, formResponses, attendee });

    // Create registration
    const registration = new EventRegistration({
      eventId: req.params.eventId,
      userId: req.user.userId,
      attendee: attendee || {
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.mobile,
        email: user.email
      },
      sessions: sessions || [],
      formResponses: formResponses || [],
      status: 'registered'
    });

    console.log('[REGISTRATION] Creating new registration:', registration);
    await registration.save();
    console.log('[REGISTRATION] Registration saved successfully, ID:', registration._id);

    // Update event registered count
    await Event.findByIdAndUpdate(req.params.eventId, {
      $inc: { registeredCount: 1 }
    });

    const populatedRegistration = await EventRegistration.findById(registration._id)
      .populate('eventId', 'title startDate endDate registrationFormId sessions')
      .populate('userId', 'firstName lastName email mobile');

    res.status(201).json(populatedRegistration);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Bulk upload event registrations (admin and staff can upload; supports mixed new and existing users)
router.post('/event/:eventId/bulk-upload', auth, async (req, res) => {
  try {
    const requestingUser = await User.findById(req.user.userId);
    if (!requestingUser) {
      return res.status(403).json({ message: 'User not found' });
    }

    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const isAdmin = requestingUser.role === 'admin';
    const isStaff = requestingUser.role === 'staff';
    const isCreator = event.createdBy && event.createdBy.toString() === req.user.userId;

    if (!isAdmin && !isStaff && !isCreator) {
      return res.status(403).json({ message: 'Unauthorized: Only admin and staff can bulk register attendees' });
    }

    const participants = req.body.participants || req.body.users;
    if (!Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({ message: 'Request body must include a non-empty participants array' });
    }

    // Determine default sessions from event if available
    const defaultSessions = Array.isArray(event.sessions)
      ? event.sessions.map(s => (s.id || (s._id ? s._id.toString() : ''))).filter(Boolean)
      : [];

    const successfulRegistrations = [];
    const skippedRegistrations = [];
    const errors = [];
    let newRegistrationsCount = 0;

    for (let i = 0; i < participants.length; i++) {
      const row = participants[i];
      const rowNumber = row.rowNumber || (i + 1);
      const rowErrors = [];

      try {
        // 1. Validate First Name
        const fnResult = validateFirstName(row.firstName);
        if (!fnResult.valid) rowErrors.push(fnResult.error);

        // 2. Validate Last Name ("Nil" supported)
        const lnResult = validateLastName(row.lastName);
        if (!lnResult.valid) rowErrors.push(lnResult.error);

        // 3. Validate Mobile (accepts mobile or phone)
        const mobileResult = validateAndNormalizeMobile(row.mobile || row.phone);
        if (!mobileResult.valid) rowErrors.push(mobileResult.error);

        // 4. Validate Email
        const emailResult = validateAndNormalizeEmail(row.email);
        if (!emailResult.valid) rowErrors.push(emailResult.error);

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
        const email = emailResult.email;

        // Check if user already exists based on triplet (firstName + lastName + mobile)
        let targetUser = await User.findOne({
          firstName: { $regex: new RegExp(`^${escapeRegex(firstName)}$`, 'i') },
          lastName: { $regex: new RegExp(`^${escapeRegex(lastName)}$`, 'i') },
          mobile: normalizedMobile
        });

        let isNewUser = false;
        let tempPassword = '';

        // Path A: Create new user if not found
        if (!targetUser) {
          // Check if optional email already in use
          if (email) {
            const emailUser = await User.findOne({ email });
            if (emailUser) {
              errors.push({
                row: rowNumber,
                data: row,
                errors: ['Email is already in use by another user in the system']
              });
              continue;
            }
          }

          const creds = await generateCredentials(firstName, phone8, User);
          tempPassword = creds.tempPassword;

          targetUser = new User({
            username: creds.username,
            password: creds.tempPassword, // Hashes on save
            firstName,
            lastName,
            mobile: normalizedMobile,
            email, // undefined if omitted
            role: 'participant',
            isActive: true,
            whatsappOptOut: false
          });

          await targetUser.save();
          isNewUser = true;
        }

        // Check if already registered for this specific event
        const existingRegistration = await EventRegistration.findOne({
          eventId: event._id,
          userId: targetUser._id,
          status: 'registered'
        });

        if (existingRegistration) {
          skippedRegistrations.push({
            row: rowNumber,
            data: row,
            userId: targetUser._id,
            username: targetUser.username,
            reason: 'Already registered for this event'
          });
          continue;
        }

        // Create new EventRegistration (Path A or Path B)
        const newRegistration = new EventRegistration({
          eventId: event._id,
          userId: targetUser._id,
          attendee: {
            firstName: targetUser.firstName,
            lastName: targetUser.lastName,
            phone: targetUser.mobile,
            email: targetUser.email || undefined
          },
          sessions: defaultSessions,
          formResponses: [],
          status: 'registered'
        });

        await newRegistration.save();
        newRegistrationsCount++;

        successfulRegistrations.push({
          id: newRegistration._id,
          userId: targetUser._id,
          row: rowNumber,
          firstName: targetUser.firstName,
          lastName: targetUser.lastName,
          mobile: targetUser.mobile,
          email: targetUser.email || '',
          username: targetUser.username,
          tempPassword: isNewUser ? tempPassword : '',
          isNewUser,
          role: targetUser.role,
          status: 'registered'
        });

      } catch (rowErr) {
        console.error(`[EVENT REG BULK] Error processing row ${rowNumber}:`, rowErr);
        errors.push({
          row: rowNumber,
          data: row,
          errors: [rowErr.message || 'Failed to process event registration']
        });
      }
    }

    // Increment registered count on Event
    if (newRegistrationsCount > 0) {
      await Event.findByIdAndUpdate(event._id, {
        $inc: { registeredCount: newRegistrationsCount }
      });
    }

    res.json({
      total: participants.length,
      successful: successfulRegistrations.length,
      skipped: skippedRegistrations.length,
      failed: errors.length,
      successfulRegistrations,
      skippedRegistrations,
      errors
    });

  } catch (error) {
    console.error('[EVENT REG BULK] Server error:', error);
    res.status(500).json({ message: 'Server error during event bulk upload', error: error.message });
  }
});

// Update registration status (admin or event creator)
router.put('/:id/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(403).json({ message: 'User not found' });
    }

    const { status } = req.body;
    const validStatuses = ['registered', 'cancelled', 'rejected'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const registration = await EventRegistration.findById(req.params.id);
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    const event = await Event.findById(registration.eventId);
    const isAdmin = user.role === 'admin';
    const isCreator = event && event.createdBy && event.createdBy.toString() === req.user.userId;
    if (!isAdmin && !isCreator) {
      return res.status(403).json({ message: 'Not authorized to update registration status for this event' });
    }

    const updateData = { status };
    if (status === 'cancelled' || status === 'rejected') {
      updateData.cancelledAt = new Date();
    }

    const updatedRegistration = await EventRegistration.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('eventId', 'title startDate endDate registrationFormId sessions')
     .populate('userId', 'firstName lastName email mobile');

    res.json(updatedRegistration);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Cancel registration (user can cancel their own registration)
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(403).json({ message: 'User not found' });
    }

    const registration = await EventRegistration.findById(req.params.id);
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    // User can only cancel their own registration, or admin/staff can cancel any
    if (registration.userId.toString() !== req.user.userId && 
        user.role !== 'admin' && user.role !== 'staff') {
      return res.status(403).json({ message: 'Not authorized to cancel this registration' });
    }

    // Update status to cancelled
    registration.status = 'cancelled';
    registration.cancelledAt = new Date();
    await registration.save();

    // Decrease event registered count
    await Event.findByIdAndUpdate(registration.eventId, {
      $inc: { registeredCount: -1 }
    });

    res.json({ message: 'Registration cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's own registrations
router.get('/my-registrations', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(403).json({ message: 'User not found' });
    }

    const registrations = await EventRegistration.find({ userId: req.user.userId })
      .populate('eventId', 'title startDate endDate location category targetGroup coverImageUrl registrationFormId sessions')
      .sort({ registeredAt: -1 });

    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Assign participants to private event (admin/staff only)
router.post('/event/:eventId/assign-participants', auth, async (req, res) => {
  try {
    console.log('[ASSIGN PARTICIPANTS] Starting assignment process for event:', req.params.eventId);
    
    const user = await User.findById(req.user.userId);
    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
      return res.status(403).json({ message: 'Not authorized to assign participants' });
    }

    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is event creator or admin/staff
    if (event.createdBy.toString() !== req.user.userId && user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to assign participants to this event' });
    }

    const { participantIds } = req.body;
    if (!Array.isArray(participantIds)) {
      return res.status(400).json({ message: 'participantIds must be an array' });
    }

    console.log('[ASSIGN PARTICIPANTS] Assigning participants:', participantIds);

    const results = [];
    const errors = [];

    for (const participantId of participantIds) {
      try {
        // Check if user exists
        const participantUser = await User.findById(participantId);
        if (!participantUser) {
          errors.push({ participantId, error: 'User not found' });
          continue;
        }

        // Check if already registered
        const existingRegistration = await EventRegistration.findOne({
          eventId: req.params.eventId,
          userId: participantId,
          status: 'registered'
        });

        if (existingRegistration) {
          results.push({ 
            participantId, 
            status: 'already_registered', 
            registrationId: existingRegistration._id,
            user: {
              firstName: participantUser.firstName,
              lastName: participantUser.lastName,
              email: participantUser.email
            }
          });
          continue;
        }

        // Create registration
        const registration = new EventRegistration({
          eventId: req.params.eventId,
          userId: participantId,
          attendee: {
            firstName: participantUser.firstName,
            lastName: participantUser.lastName,
            phone: participantUser.mobile,
            email: participantUser.email
          },
          sessions: event.sessions.map(session => session._id.toString()), // Register for all sessions
          formResponses: [], // Empty form responses for admin-assigned participants
          status: 'registered'
        });

        await registration.save();

        // Update event registered count
        await Event.findByIdAndUpdate(req.params.eventId, {
          $inc: { registeredCount: 1 }
        });

        results.push({ 
          participantId, 
          status: 'assigned', 
          registrationId: registration._id,
          user: {
            firstName: participantUser.firstName,
            lastName: participantUser.lastName,
            email: participantUser.email
          }
        });

        console.log('[ASSIGN PARTICIPANTS] Successfully assigned participant:', participantId);

      } catch (error) {
        console.error('[ASSIGN PARTICIPANTS] Error assigning participant:', participantId, error);
        errors.push({ participantId, error: error.message });
      }
    }

    // Update event participants list (for visibility control)
    await Event.findByIdAndUpdate(req.params.eventId, {
      $addToSet: { participants: { $each: participantIds } }
    });

    res.json({
      message: 'Participant assignment completed',
      results,
      errors,
      summary: {
        total: participantIds.length,
        assigned: results.filter(r => r.status === 'assigned').length,
        alreadyRegistered: results.filter(r => r.status === 'already_registered').length,
        errors: errors.length
      }
    });

  } catch (error) {
    console.error('[ASSIGN PARTICIPANTS] Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove participants from private event (admin/staff only)
router.post('/event/:eventId/remove-participants', auth, async (req, res) => {
  try {
    console.log('[REMOVE PARTICIPANTS] Starting removal process for event:', req.params.eventId);
    
    const user = await User.findById(req.user.userId);
    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
      return res.status(403).json({ message: 'Not authorized to remove participants' });
    }

    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is event creator or admin/staff
    if (event.createdBy.toString() !== req.user.userId && user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to remove participants from this event' });
    }

    const { participantIds } = req.body;
    if (!Array.isArray(participantIds)) {
      return res.status(400).json({ message: 'participantIds must be an array' });
    }

    console.log('[REMOVE PARTICIPANTS] Removing participants:', participantIds);

    const results = [];
    const errors = [];

    for (const participantId of participantIds) {
      try {
        // Check if user exists
        const participantUser = await User.findById(participantId);
        if (!participantUser) {
          errors.push({ participantId, error: 'User not found' });
          continue;
        }

        // Find and remove registration
        const registration = await EventRegistration.findOneAndDelete({
          eventId: req.params.eventId,
          userId: participantId,
          status: 'registered'
        });

        if (!registration) {
          results.push({ 
            participantId, 
            status: 'not_found', 
            user: {
              firstName: participantUser.firstName,
              lastName: participantUser.lastName,
              email: participantUser.email
            }
          });
          continue;
        }

        // Update event registered count
        await Event.findByIdAndUpdate(req.params.eventId, {
          $inc: { registeredCount: -1 }
        });

        results.push({ 
          participantId, 
          status: 'removed', 
          user: {
            firstName: participantUser.firstName,
            lastName: participantUser.lastName,
            email: participantUser.email
          }
        });

        console.log('[REMOVE PARTICIPANTS] Successfully removed participant:', participantId);

      } catch (error) {
        console.error('[REMOVE PARTICIPANTS] Error removing participant:', participantId, error);
        errors.push({ participantId, error: error.message });
      }
    }

    // Update event participants list (for visibility control)
    await Event.findByIdAndUpdate(req.params.eventId, {
      $pull: { participants: { $in: participantIds } }
    });

    res.json({
      message: 'Participant removal completed',
      results,
      errors,
      summary: {
        total: participantIds.length,
        removed: results.filter(r => r.status === 'removed').length,
        notFound: results.filter(r => r.status === 'not_found').length,
        errors: errors.length
      }
    });

  } catch (error) {
    console.error('[REMOVE PARTICIPANTS] Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router; 
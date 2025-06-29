import express from 'express';
import auth from '../middleware/auth.js';
import EventRegistration from '../models/EventRegistration.js';
import Event from '../models/Event.js';
import User from '../models/User.js';

const router = express.Router();

// Get all event registrations (admin/staff only)
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
      return res.status(403).json({ message: 'Not authorized to view registrations' });
    }

    const registrations = await EventRegistration.find()
      .populate('eventId', 'title startDate endDate')
      .populate('userId', 'firstName lastName email mobile')
      .sort({ registeredAt: -1 });

    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get registrations for a specific event
router.get('/event/:eventId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
      return res.status(403).json({ message: 'Not authorized to view registrations' });
    }

    const registrations = await EventRegistration.find({ eventId: req.params.eventId })
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
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(403).json({ message: 'User not found' });
    }

    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if event is published
    if (event.status !== 'Published') {
      return res.status(400).json({ message: 'Event is not available for registration' });
    }

    // Check if user is already registered
    const existingRegistration = await EventRegistration.findOne({
      eventId: req.params.eventId,
      userId: req.user.userId
    });

    if (existingRegistration) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    const { sessions, formResponses, attendee } = req.body;

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
      status: 'pending'
    });

    await registration.save();

    // Update event registered count
    await Event.findByIdAndUpdate(req.params.eventId, {
      $inc: { registeredCount: 1 }
    });

    const populatedRegistration = await EventRegistration.findById(registration._id)
      .populate('eventId', 'title startDate endDate')
      .populate('userId', 'firstName lastName email mobile');

    res.status(201).json(populatedRegistration);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update registration status (admin/staff only)
router.put('/:id/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
      return res.status(403).json({ message: 'Not authorized to update registration status' });
    }

    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'attended', 'cancelled', 'waitlisted'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const updateData = { status };
    if (status === 'cancelled') {
      updateData.cancelledAt = new Date();
    }

    const registration = await EventRegistration.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('eventId', 'title startDate endDate')
     .populate('userId', 'firstName lastName email mobile');

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    res.json(registration);
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

export default router; 
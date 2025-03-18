import express from 'express';
import auth from '../middleware/auth.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import multer from 'multer';

const router = express.Router();

// Configure multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
});

// Get all events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find()
      .populate('organizer', 'firstName lastName email')
      .sort({ date: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single event
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'firstName lastName email')
      .populate('registeredParticipants', 'firstName lastName email')
      .populate('waitlist', 'firstName lastName email');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create event (requires auth)
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || (user.role !== 'admin' && user.role !== 'volunteer')) {
      return res.status(403).json({ message: 'Not authorized to create events' });
    }

    const eventData = { ...req.body, organizer: req.user.userId };
    
    // Add image data if an image was uploaded
    if (req.file) {
      eventData.image = {
        data: req.file.buffer,
        contentType: req.file.mimetype
      };
    }

    const event = new Event(eventData);
    await event.save();
    
    // Don't send image data in response
    const eventResponse = event.toObject();
    if (eventResponse.image) {
      delete eventResponse.image.data;
    }
    
    res.status(201).json(eventResponse);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update event (requires auth)
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!user || (user.role !== 'admin' && event.organizer.toString() !== req.user.userId)) {
      return res.status(403).json({ message: 'Not authorized to update this event' });
    }

    const updateData = { ...req.body };
    
    // Add image data if an image was uploaded
    if (req.file) {
      updateData.image = {
        data: req.file.buffer,
        contentType: req.file.mimetype
      };
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    // Don't send image data in response
    const eventResponse = updatedEvent.toObject();
    if (eventResponse.image) {
      delete eventResponse.image.data;
    }

    res.json(eventResponse);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete event (requires auth)
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!user || (user.role !== 'admin' && event.organizer.toString() !== req.user.userId)) {
      return res.status(403).json({ message: 'Not authorized to delete this event' });
    }

    await event.deleteOne();
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Register for event (requires auth)
router.post('/:id/register', auth, async (req, res) => {
  try {
    // Check if user is a participant
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'participant') {
      return res.status(403).json({ 
        message: 'Only participants can register for events' 
      });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is already registered
    if (event.registeredParticipants.includes(req.user.userId)) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    // Check if user is on waitlist
    if (event.waitlist.includes(req.user.userId)) {
      return res.status(400).json({ message: 'Already on waitlist for this event' });
    }

    if (event.registeredParticipants.length < event.capacity) {
      event.registeredParticipants.push(req.user.userId);
    } else {
      event.waitlist.push(req.user.userId);
    }

    await event.save();
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Unregister from event (requires auth)
router.post('/:id/unregister', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Remove from registered participants
    event.registeredParticipants = event.registeredParticipants.filter(
      id => id.toString() !== req.user.userId
    );

    // Remove from waitlist
    event.waitlist = event.waitlist.filter(
      id => id.toString() !== req.user.userId
    );

    // If there was a spot opened and there are people on waitlist, move first person from waitlist
    if (event.registeredParticipants.length < event.capacity && event.waitlist.length > 0) {
      const nextParticipant = event.waitlist[0];
      event.registeredParticipants.push(nextParticipant);
      event.waitlist = event.waitlist.slice(1);
    }

    await event.save();
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add route to get event image
router.get('/:id/image', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event || !event.image || !event.image.data) {
      return res.status(404).json({ message: 'Image not found' });
    }

    res.set('Content-Type', event.image.contentType);
    res.send(event.image.data);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router; 
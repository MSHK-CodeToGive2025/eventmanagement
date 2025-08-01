import dotenv from 'dotenv';
import express from 'express';
import auth from '../middleware/auth.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import EventRegistration from '../models/EventRegistration.js';
import multer from 'multer';
import twilio from 'twilio';
import { formatForWhatsApp } from '../utils/phoneUtils.js';

dotenv.config();

const router = express.Router();

// Initialize Twilio client with proper credentials and error handling
let twilioClient = null;
try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    console.log('[EVENTS] Twilio client initialized successfully');
  } else {
    console.log('[EVENTS] Twilio credentials not found, SMS features will be disabled');
  }
} catch (error) {
  console.error('[EVENTS] Failed to initialize Twilio client:', error.message);
  console.log('[EVENTS] SMS features will be disabled');
}

// Configure multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 // 500KB limit to match coverImage requirements
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
});

// Configure multer specifically for cover images (500KB limit)
const coverImageUpload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 // 500KB limit
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
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .sort({ startDate: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get published, non-private events (for public display)
router.get('/public', async (req, res) => {
  try {
    const events = await Event.find({
      status: 'Published',
      isPrivate: false
    })
      .populate('createdBy', 'firstName lastName email')
      .sort({ startDate: 1 });
    
    console.log(`[EVENTS] Found ${events.length} published, non-private events`);
    res.json(events);
  } catch (error) {
    console.error('[EVENTS] Error fetching public events:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get published, non-private, non-expired events (for public display)
router.get('/public-nonexpired', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    const events = await Event.find({
      status: 'Published',
      isPrivate: false,
      endDate: { $gte: today } // endDate is greater than or equal to today
    })
      .populate('createdBy', 'firstName lastName email')
      .sort({ startDate: 1 });
    
    console.log(`[EVENTS] Found ${events.length} published, non-private, non-expired events`);
    res.json(events);
  } catch (error) {
    console.error('[EVENTS] Error fetching public non-expired events:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single event
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');
    
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
    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
      return res.status(403).json({ message: 'Not authorized to create events' });
    }

    const eventData = { ...req.body, createdBy: req.user.userId };
    
    // Handle reminder times array
    if (req.body['reminderTimes[]']) {
      eventData.reminderTimes = Array.isArray(req.body['reminderTimes[]']) 
        ? req.body['reminderTimes[]'].map(time => parseInt(time))
        : [parseInt(req.body['reminderTimes[]'])];
    }
    
    // Handle image upload
    if (req.file) {
      // Check file size (500KB limit)
      if (req.file.size > 500 * 1024) {
        return res.status(400).json({ message: 'Image size must be less than 500KB' });
      }
      
      // Store in coverImage field
      eventData.coverImage = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
        size: req.file.size
      };
    }

    const event = new Event(eventData);
    await event.save();
    
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update event (requires auth)
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    console.log('[EVENTS] Update request for event:', req.params.id);
    console.log('[EVENTS] User from token:', req.user);
    
    const user = await User.findById(req.user.userId);
    console.log('[EVENTS] User found in database:', user ? { 
      _id: user._id, 
      username: user.username, 
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    } : null);
    
    const event = await Event.findById(req.params.id);
    console.log('[EVENTS] Event found:', event ? { 
      _id: event._id, 
      title: event.title,
      createdBy: event.createdBy,
      status: event.status
    } : null);

    if (!event) {
      console.log('[EVENTS] Event not found');
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!user) {
      console.log('[EVENTS] User not found in database');
      return res.status(403).json({ message: 'User not found' });
    }

    console.log('[EVENTS] Authorization check:');
    console.log('[EVENTS] - User role:', user.role);
    console.log('[EVENTS] - Event createdBy:', event.createdBy.toString());
    console.log('[EVENTS] - Current user ID:', req.user.userId);
    console.log('[EVENTS] - Is admin:', user.role === 'admin');
    console.log('[EVENTS] - Is staff:', user.role === 'staff');
    console.log('[EVENTS] - Is creator:', event.createdBy.toString() === req.user.userId);

    // Admin, staff, or event creator can update
    if (user.role !== 'admin' && user.role !== 'staff' && event.createdBy.toString() !== req.user.userId) {
      console.log('[EVENTS] Authorization failed - user not authorized');
      return res.status(403).json({ message: 'Not authorized to update this event' });
    }

    console.log('[EVENTS] Authorization successful - proceeding with update');

    const updateData = { ...req.body, updatedBy: req.user.userId };
    
    // Handle reminder times array
    if (req.body['reminderTimes[]']) {
      updateData.reminderTimes = Array.isArray(req.body['reminderTimes[]']) 
        ? req.body['reminderTimes[]'].map(time => parseInt(time))
        : [parseInt(req.body['reminderTimes[]'])];
    }
    
    // Handle image removal
    if (req.body.removeImage === 'true') {
      console.log('[EVENTS] Removing image from event:', req.params.id);
      // Use $unset to completely remove the coverImage field
      const updatedEvent = await Event.findByIdAndUpdate(
        req.params.id,
        { $unset: { coverImage: 1 }, ...updateData },
        { new: true, runValidators: true }
      ).populate('createdBy', 'firstName lastName email')
       .populate('updatedBy', 'firstName lastName email');
      
      console.log('[EVENTS] Image removed successfully, updated event:', updatedEvent._id);
      res.json(updatedEvent);
      return;
    }
    // Handle image upload (only if not removing)
    else if (req.file) {
      // Check file size (500KB limit)
      if (req.file.size > 500 * 1024) {
        return res.status(400).json({ message: 'Image size must be less than 500KB' });
      }
      
      // Store in coverImage field
      updateData.coverImage = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
        size: req.file.size
      };
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName email')
     .populate('updatedBy', 'firstName lastName email');

    res.json(updatedEvent);
  } catch (error) {
    console.error('[EVENTS] Error updating event:', error);
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

    // Admin, staff, or event creator can delete
    if (!user || (user.role !== 'admin' && user.role !== 'staff' && event.createdBy.toString() !== req.user.userId)) {
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
    // Check if user exists
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(403).json({ 
        message: 'User not found' 
      });
    }

    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('registeredParticipants', 'name email phoneNumber')
      .populate('waitlist', 'name email phoneNumber');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is already registered
    if (event.registeredParticipants.some(p => p._id.toString() === req.user.userId)) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    // Check if user is on waitlist
    if (event.waitlist.some(p => p._id.toString() === req.user.userId)) {
      return res.status(400).json({ message: 'Already on waitlist for this event' });
    }

    if (event.registeredParticipants.length < event.capacity) {
      event.registeredParticipants.push(req.user.userId);
    } else {
      event.waitlist.push(req.user.userId);
    }

    await event.save();

    // Populate the response data
    const populatedEvent = await Event.findById(event._id)
      .populate('createdBy', 'name email')
      .populate('registeredParticipants', 'name email phoneNumber')
      .populate('waitlist', 'name email phoneNumber');

    res.json(populatedEvent);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Unregister from event (requires auth)
router.post('/:id/unregister', auth, async (req, res) => {
  try {
    let event = await Event.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('registeredParticipants', 'firstName lastName email')
      .populate('waitlist', 'firstName lastName email');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Get the raw event document for modifications
    const rawEvent = await Event.findById(req.params.id);

    // Remove from registered participants
    rawEvent.registeredParticipants = rawEvent.registeredParticipants.filter(
      id => id.toString() !== req.user.userId
    );

    // Remove from waitlist
    rawEvent.waitlist = rawEvent.waitlist.filter(
      id => id.toString() !== req.user.userId
    );

    // If there was a spot opened and there are people on waitlist, move first person from waitlist
    if (rawEvent.registeredParticipants.length < rawEvent.capacity && rawEvent.waitlist.length > 0) {
      const nextParticipant = rawEvent.waitlist[0];
      rawEvent.registeredParticipants.push(nextParticipant);
      rawEvent.waitlist = rawEvent.waitlist.slice(1);
    }

    await rawEvent.save();
    
    // Get the updated populated event
    const populatedEvent = await Event.findById(rawEvent._id)
      .populate('createdBy', 'firstName lastName email')
      .populate('registeredParticipants', 'firstName lastName email')
      .populate('waitlist', 'firstName lastName email');

    res.json(populatedEvent);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add route to get event image
router.get('/:id/image', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event || !event.coverImage) {
      return res.status(404).json({ message: 'Image not found' });
    }

    res.set('Content-Type', event.coverImage.contentType || 'image/jpeg');
    res.set('Content-Length', event.coverImage.size);
    res.send(event.coverImage.data);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get event cover image (new endpoint)
router.get('/:id/cover-image', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event || !event.coverImage || !event.coverImage.data) {
      return res.status(404).json({ message: 'Cover image not found' });
    }

    res.set('Content-Type', event.coverImage.contentType || 'image/jpeg');
    res.set('Content-Length', event.coverImage.size);
    res.send(event.coverImage.data);
  } catch (error) {
    console.error('[EVENTS] Error fetching cover image:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Upload cover image for event (requires auth)
router.post('/:id/cover-image', auth, coverImageUpload.single('coverImage'), async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Admin, staff, or event creator can upload images
    if (!user || (user.role !== 'admin' && user.role !== 'staff' && event.createdBy.toString() !== req.user.userId)) {
      return res.status(403).json({ message: 'Not authorized to upload images for this event' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Check file size
    if (req.file.size > 500 * 1024) {
      return res.status(400).json({ message: 'Image size must be less than 500KB' });
    }

    // Update event with new cover image
    event.coverImage = {
      data: req.file.buffer,
      contentType: req.file.mimetype,
      size: req.file.size
    };
    event.updatedBy = req.user.userId;
    event.updatedAt = new Date();

    await event.save();

    res.json({ 
      message: 'Cover image uploaded successfully',
      imageSize: req.file.size,
      contentType: req.file.mimetype
    });
  } catch (error) {
    console.error('[EVENTS] Error uploading cover image:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update cover image for event (requires auth)
router.put('/:id/cover-image', auth, coverImageUpload.single('coverImage'), async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Admin, staff, or event creator can update images
    if (!user || (user.role !== 'admin' && user.role !== 'staff' && event.createdBy.toString() !== req.user.userId)) {
      return res.status(403).json({ message: 'Not authorized to update images for this event' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Check file size
    if (req.file.size > 500 * 1024) {
      return res.status(400).json({ message: 'Image size must be less than 500KB' });
    }

    // Update event with new cover image
    event.coverImage = {
      data: req.file.buffer,
      contentType: req.file.mimetype,
      size: req.file.size
    };
    event.updatedBy = req.user.userId;
    event.updatedAt = new Date();

    await event.save();

    res.json({ 
      message: 'Cover image updated successfully',
      imageSize: req.file.size,
      contentType: req.file.mimetype
    });
  } catch (error) {
    console.error('[EVENTS] Error updating cover image:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete cover image from event (requires auth)
router.delete('/:id/cover-image', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Admin, staff, or event creator can delete images
    if (!user || (user.role !== 'admin' && user.role !== 'staff' && event.createdBy.toString() !== req.user.userId)) {
      return res.status(403).json({ message: 'Not authorized to delete images for this event' });
    }

    if (!event.coverImage || !event.coverImage.data) {
      return res.status(404).json({ message: 'No cover image found for this event' });
    }

    // Remove cover image using unset
    event.updatedBy = req.user.userId;
    event.updatedAt = new Date();

    await Event.findByIdAndUpdate(req.params.id, {
      $unset: { coverImage: 1 },
      updatedBy: req.user.userId,
      updatedAt: new Date()
    });

    res.json({ message: 'Cover image deleted successfully' });
  } catch (error) {
    console.error('[EVENTS] Error deleting cover image:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send WhatsApp message to registered participant (requires auth)
router.post('/send-whatsapp-reminder', async (req, res) => {
  try {
    const { to, message } = req.body;
    
    // Log the attempt (without sensitive data)
    console.log(`Attempting to send WhatsApp message to: ${to}`);
    
    if (!twilioClient) {
      console.error('Twilio client not initialized, cannot send WhatsApp message');
      return res.status(503).json({ 
        success: false, 
        error: 'SMS service not available',
        message: 'WhatsApp messaging is currently unavailable'
      });
    }
    
    const result = await twilioClient.messages.create({
      body: message,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${to}`
    });
    
    console.log('WhatsApp message sent successfully:', result.sid);
    res.json({ success: true, sid: result.sid });
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      code: error.code,
      moreInfo: error.moreInfo
    });
  }
});

// Send WhatsApp message to all registered participants (requires auth)
router.post('/:id/send-whatsapp', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    // Only admin, staff, or event creator can send messages
    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
      console.error(`[WhatsApp] Unauthorized access attempt by user: ${req.user.userId}`);
      return res.status(403).json({ message: 'Only admin or staff can send WhatsApp messages' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      console.error(`[WhatsApp] Event not found: ${req.params.id}`);
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is event creator (additional authorization)
    if (user.role !== 'admin' && user.role !== 'staff' && event.createdBy.toString() !== req.user.userId) {
      console.error(`[WhatsApp] Unauthorized access attempt by user: ${req.user.userId} for event: ${req.params.id}`);
      return res.status(403).json({ message: 'Only admin, staff, or event creator can send WhatsApp messages' });
    }

    const { title, message } = req.body;
    if (!message) {
      console.error('[WhatsApp] Message content is required');
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Use provided title as subtitle (optional)
    const messageSubtitle = title || "";

    // Get all registered participants for this event
    const registrations = await EventRegistration.find({
      eventId: req.params.id,
      status: 'registered'
    });

    console.log(`[WhatsApp] Starting message send for event: ${event.title} (${event._id})`);
    console.log(`[WhatsApp] Message content: ${message}`);
    console.log(`[WhatsApp] Number of registered participants: ${registrations.length}`);

    const failedNumbers = [];
    const successfulNumbers = [];

    // Send message to each participant
    for (const registration of registrations) {
      if (registration.attendee && registration.attendee.phone) {
        try {
          console.log(`[WhatsApp] Sending to ${registration.attendee.firstName} ${registration.attendee.lastName} (${registration.attendee.phone})`);
          
          // Format phone number for Twilio WhatsApp compliance
          const formattedNumber = formatForWhatsApp(registration.attendee.phone);

          if (!twilioClient) {
            console.error('Twilio client not initialized, cannot send WhatsApp message');
            failedNumbers.push(registration.attendee.phone);
            continue;
          }
          
          await twilioClient.messages.create({
            body: `Zubin Event Notification: ${event.title}${messageSubtitle ? `\n${messageSubtitle}` : ''}\n\n${message}`,
            from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
            to: `whatsapp:${formattedNumber}`
          });
          
          console.log(`[WhatsApp] Successfully sent to ${formattedNumber}`);
          successfulNumbers.push(formattedNumber);
        } catch (error) {
          console.error(`[WhatsApp] Failed to send to ${registration.attendee.phone}:`, error.message);
          failedNumbers.push(registration.attendee.phone);
        }
      } else {
        console.log(`[WhatsApp] Skipping participant - no phone number or invalid data`);
      }
    }

    console.log(`[WhatsApp] Message send completed. Successful: ${successfulNumbers.length}, Failed: ${failedNumbers.length}`);
    if (failedNumbers.length > 0) {
      console.error(`[WhatsApp] Failed numbers: ${failedNumbers.join(', ')}`);
    }

    res.json({
      message: 'WhatsApp messages sent',
      successful: successfulNumbers.length,
      failed: failedNumbers.length,
      failedNumbers
    });
  } catch (error) {
    console.error('[WhatsApp] Unexpected error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router; 
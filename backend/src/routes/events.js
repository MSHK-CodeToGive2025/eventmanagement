import dotenv from 'dotenv';
import express from 'express';
import auth from '../middleware/auth.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import EventRegistration from '../models/EventRegistration.js';
import multer from 'multer';
import twilio from 'twilio';
import { formatForWhatsApp, ensureWhatsAppPrefix } from '../utils/phoneUtils.js';

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

// Get all events (requires auth - implements private event access control)
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(403).json({ message: 'User not found' });
    }

    let query = {};
    
    // If user is not admin, implement access control for private events
    if (user.role !== 'admin') {
      query = {
        $or: [
          // Public events
          { isPrivate: false },
          // Private events created by the user (if they're staff)
          { $and: [{ isPrivate: true }, { createdBy: req.user.userId }] },
          // Private events where user is an authorized participant
          { $and: [{ isPrivate: true }, { participants: req.user.userId }] }
        ]
      };
    }
    // Admin can see all events (no query filter needed)

    const events = await Event.find(query)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .populate('participants', 'firstName lastName email')
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

// Get single event (requires auth - implements private event access control)
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(403).json({ message: 'User not found' });
    }

    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .populate('participants', 'firstName lastName email');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Access control for private events
    if (event.isPrivate) {
      const isAdmin = user.role === 'admin';
      const isCreator = event.createdBy._id.toString() === req.user.userId;
      const isAuthorizedParticipant = event.participants.some(p => p._id.toString() === req.user.userId);

      if (!isAdmin && !isCreator && !isAuthorizedParticipant) {
        return res.status(403).json({ message: 'Not authorized to view this private event' });
      }
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
    console.log('[EVENTS] Reminder times in request body:', req.body['reminderTimes[]']);
    console.log('[EVENTS] All request body keys:', Object.keys(req.body));
    console.log('[EVENTS] Staff contact in request body:', req.body['staffContact[name]'], req.body['staffContact[phone]']);
    console.log('[EVENTS] Participants in request body:', req.body['participants[]']);
    
    // Handle staff contact information
    if (req.body['staffContact[name]'] || req.body['staffContact[phone]']) {
      eventData.staffContact = {
        name: req.body['staffContact[name]'] || "",
        phone: req.body['staffContact[phone]'] || ""
      };
    }
    
    // Handle participants array for private events
    if (req.body['participants[]']) {
      eventData.participants = Array.isArray(req.body['participants[]']) 
        ? req.body['participants[]']
        : [req.body['participants[]']];
      console.log('[EVENTS] Set participants to:', eventData.participants);
    } else if (eventData.isPrivate) {
      // For private events, if no participants are specified, default to empty array
      eventData.participants = [];
      console.log('[EVENTS] Private event with no participants specified, setting empty array');
    }
    
    if (req.body['reminderTimes[]']) {
      eventData.reminderTimes = Array.isArray(req.body['reminderTimes[]']) 
        ? req.body['reminderTimes[]'].map(time => parseInt(time))
        : [parseInt(req.body['reminderTimes[]'])];
      console.log('[EVENTS] Set reminder times to:', eventData.reminderTimes);
    } else {
      console.log('[EVENTS] No reminder times provided, will use default');
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
    console.log('[EVENTS] Update - Reminder times in request body:', req.body['reminderTimes[]']);
    console.log('[EVENTS] Update - Staff contact in request body:', req.body['staffContact[name]'], req.body['staffContact[phone]']);
    console.log('[EVENTS] Update - Participants in request body:', req.body['participants[]']);
    
    // Handle staff contact information
    if (req.body['staffContact[name]'] || req.body['staffContact[phone]']) {
      updateData.staffContact = {
        name: req.body['staffContact[name]'] || "",
        phone: req.body['staffContact[phone]'] || ""
      };
    }
    
    // Handle participants array for private events
    if (req.body['participants[]']) {
      updateData.participants = Array.isArray(req.body['participants[]']) 
        ? req.body['participants[]']
        : [req.body['participants[]']];
      console.log('[EVENTS] Update - Set participants to:', updateData.participants);
    } else if (updateData.isPrivate) {
      // For private events, if no participants are specified, default to empty array
      updateData.participants = [];
      console.log('[EVENTS] Update - Private event with no participants specified, setting empty array');
    }
    
    if (req.body['reminderTimes[]']) {
      updateData.reminderTimes = Array.isArray(req.body['reminderTimes[]']) 
        ? req.body['reminderTimes[]'].map(time => parseInt(time))
        : [parseInt(req.body['reminderTimes[]'])];
      console.log('[EVENTS] Update - Set reminder times to:', updateData.reminderTimes);
    } else {
      console.log('[EVENTS] Update - No reminder times provided, keeping existing');
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
    const { to, message, useTemplate, eventTitle } = req.body;
    
    // Log the attempt (without sensitive data)
    console.log(`Attempting to send WhatsApp message to: ${to}`);
    console.log(`Using template: ${useTemplate ? 'Yes' : 'No'}`);
    
    if (!twilioClient) {
      console.error('Twilio client not initialized, cannot send WhatsApp message');
      return res.status(503).json({ 
        success: false, 
        error: 'SMS service not available',
        message: 'WhatsApp messaging is currently unavailable'
      });
    }
    
    if (useTemplate) {
      // Use template system
      // Note: contentVariables must be an object, not a JSON string
      const result = await twilioClient.messages.create({
        from: ensureWhatsAppPrefix(process.env.TWILIO_WHATSAPP_NUMBER),
        contentSid: process.env.TWILIO_WHATSAPP_TEMPLATE_SID,
        contentVariables: {
          "1": new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }),
          "2": new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })
        },
        to: `whatsapp:${to}`
      });
      
      console.log('WhatsApp template message sent successfully:', result.sid);
      res.json({ success: true, sid: result.sid, method: 'template' });
    } else {
      // Use custom message system
      if (!message) {
        return res.status(400).json({ 
          success: false, 
          error: 'Message content required when not using template'
        });
      }
      
      // Twilio accepts freeform WhatsApp messages with HTTP 201 but may fail
      // them asynchronously with error 63016. Poll status and fall back to template.
      const whatsAppFrom = ensureWhatsAppPrefix(process.env.TWILIO_WHATSAPP_NUMBER);
      const sentMsg = await twilioClient.messages.create({
        body: message,
        from: whatsAppFrom,
        to: `whatsapp:${to}`
      });

      let method = 'custom';
      for (let attempt = 0; attempt < 3; attempt++) {
        await new Promise(r => setTimeout(r, 2000));
        const status = await twilioClient.messages(sentMsg.sid).fetch();
        if (status.status === 'delivered' || status.status === 'read') {
          break;
        }
        if (status.status === 'undelivered' || status.status === 'failed') {
          if (status.errorCode === 63016 && process.env.TWILIO_WHATSAPP_MARKETING_TEMPLATE_SID) {
            console.log('Freeform undelivered (63016), falling back to marketing template...');
            const fallback = await twilioClient.messages.create({
              from: whatsAppFrom,
              contentSid: process.env.TWILIO_WHATSAPP_MARKETING_TEMPLATE_SID,
              contentVariables: {
                "1": eventTitle || "Event Update",
                "2": message
              },
              to: `whatsapp:${to}`
            });
            console.log('Marketing template sent:', fallback.sid);
            method = 'marketing_template';
          } else {
            throw new Error(`WhatsApp message ${status.status}: error ${status.errorCode}`);
          }
          break;
        }
      }

      console.log(`WhatsApp message sent via ${method}:`, sentMsg.sid);
      res.json({ success: true, sid: sentMsg.sid, method });
    }
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

    const { title, message, useTemplate } = req.body;
    if (!message && !useTemplate) {
      console.error('[WhatsApp] Message content is required when not using template');
      return res.status(400).json({ message: 'Message content is required when not using template' });
    }

    // Use provided title as subtitle (optional)
    const messageSubtitle = title || "";

    // Get all registered participants for this event
    const registrations = await EventRegistration.find({
      eventId: req.params.id,
      status: 'registered'
    });

    // Filter out users who opted out of WhatsApp messages
    const optedOutUsers = await User.find({ whatsappOptOut: true }).select('mobile');
    const optedOutNumbers = new Set(optedOutUsers.map(u => u.mobile));

    console.log(`[WhatsApp] Starting message send for event: ${event.title} (${event._id})`);
    console.log(`[WhatsApp] Using template: ${useTemplate ? 'Yes' : 'No'}`);
    if (!useTemplate) {
      console.log(`[WhatsApp] Message content: ${message}`);
    }
    console.log(`[WhatsApp] Number of registered participants: ${registrations.length}`);
    if (optedOutNumbers.size > 0) {
      console.log(`[WhatsApp] Opted-out numbers to skip: ${optedOutNumbers.size}`);
    }

    const failedNumbers = [];
    const successfulNumbers = [];

    // Send message to each participant
    const skippedOptOut = [];
    for (const registration of registrations) {
      if (registration.attendee && registration.attendee.phone) {
        // Skip users who opted out of WhatsApp messages
        if (optedOutNumbers.has(registration.attendee.phone)) {
          console.log(`[WhatsApp] Skipping opted-out user: ${registration.attendee.firstName} ${registration.attendee.lastName}`);
          skippedOptOut.push(registration.attendee.phone);
          continue;
        }

        try {
          console.log(`[WhatsApp] Sending to ${registration.attendee.firstName} ${registration.attendee.lastName} (${registration.attendee.phone})`);
          
          // Format phone number for Twilio WhatsApp compliance
          const formattedNumber = formatForWhatsApp(registration.attendee.phone);

          if (!twilioClient) {
            console.error('Twilio client not initialized, cannot send WhatsApp message');
            failedNumbers.push(registration.attendee.phone);
            continue;
          }
          
          if (useTemplate) {
            // Use template system
            // Note: contentVariables must be an object, not a JSON string
            await twilioClient.messages.create({
              from: ensureWhatsAppPrefix(process.env.TWILIO_WHATSAPP_NUMBER),
              contentSid: process.env.TWILIO_WHATSAPP_TEMPLATE_SID,
              contentVariables: {
                "1": new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit'
                }),
                "2": new Date().toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })
              },
              to: `whatsapp:${formattedNumber}`
            });
          } else {
            // Try custom message first, fall back to marketing template if outside 24h window.
            // Twilio accepts freeform WhatsApp messages with HTTP 201 but may fail them
            // asynchronously with error 63016 (outside 24h session window). We must poll
            // the message status to detect this and fall back to a marketing template.
            const fullMessage = `Zubin Event Notification: ${event.title}${messageSubtitle ? `\n${messageSubtitle}` : ''}\n\n${message}`;
            const whatsAppFrom = ensureWhatsAppPrefix(process.env.TWILIO_WHATSAPP_NUMBER);
            
            const sentMsg = await twilioClient.messages.create({
              body: fullMessage,
              from: whatsAppFrom,
              to: `whatsapp:${formattedNumber}`
            });

            // Poll for async delivery failure (63016 is reported asynchronously)
            let needsFallback = false;
            for (let attempt = 0; attempt < 3; attempt++) {
              await new Promise(r => setTimeout(r, 2000));
              const status = await twilioClient.messages(sentMsg.sid).fetch();
              if (status.status === 'delivered' || status.status === 'read') {
                break;
              }
              if (status.status === 'undelivered' || status.status === 'failed') {
                console.log(`[WhatsApp] Freeform message ${sentMsg.sid} ${status.status} (error: ${status.errorCode})`);
                if (status.errorCode === 63016 && process.env.TWILIO_WHATSAPP_MARKETING_TEMPLATE_SID) {
                  needsFallback = true;
                } else {
                  throw new Error(`WhatsApp message ${status.status}: error ${status.errorCode}`);
                }
                break;
              }
            }

            if (needsFallback) {
              console.log(`[WhatsApp] Falling back to marketing template for ${formattedNumber}...`);
              await twilioClient.messages.create({
                from: whatsAppFrom,
                contentSid: process.env.TWILIO_WHATSAPP_MARKETING_TEMPLATE_SID,
                contentVariables: {
                  "1": event.title,
                  "2": message
                },
                to: `whatsapp:${formattedNumber}`
              });
            }
          }
          
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
      failedNumbers,
      skippedOptOut: skippedOptOut.length
    });
  } catch (error) {
    console.error('[WhatsApp] Unexpected error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add participants to private event (admin, staff, or event creator only)
router.post('/:id/participants', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(403).json({ message: 'User not found' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check authorization: admin, staff, or event creator
    if (user.role !== 'admin' && user.role !== 'staff' && event.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to manage participants for this event' });
    }

    const { participantIds } = req.body;
    if (!Array.isArray(participantIds)) {
      return res.status(400).json({ message: 'participantIds must be an array' });
    }

    // Add new participants (avoid duplicates)
    const newParticipants = participantIds.filter(id =>
      !event.participants.includes(id)
    );

    event.participants.push(...newParticipants);
    await event.save();

    const updatedEvent = await Event.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('participants', 'firstName lastName email');

    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove participants from private event (admin, staff, or event creator only)
router.delete('/:id/participants', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(403).json({ message: 'User not found' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check authorization: admin, staff, or event creator
    if (user.role !== 'admin' && user.role !== 'staff' && event.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to manage participants for this event' });
    }

    const { participantIds } = req.body;
    if (!Array.isArray(participantIds)) {
      return res.status(400).json({ message: 'participantIds must be an array' });
    }

    // Remove specified participants
    event.participants = event.participants.filter(id => !participantIds.includes(id.toString()));
    await event.save();

    const updatedEvent = await Event.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('participants', 'firstName lastName email');

    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get available users for participant selection (admin, staff, or event creator only)
router.get('/:id/available-users', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(403).json({ message: 'User not found' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check authorization: admin, staff, or event creator
    if (user.role !== 'admin' && user.role !== 'staff' && event.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to manage participants for this event' });
    }

    // Get all users (admin can see all, staff/creator see limited info)
    const users = await User.find({}, 'firstName lastName email role');
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router; 
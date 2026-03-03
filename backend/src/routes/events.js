import dotenv from 'dotenv';
import express from 'express';
import auth from '../middleware/auth.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import EventRegistration from '../models/EventRegistration.js';
import multer from 'multer';
import twilio from 'twilio';
import { formatForWhatsApp, ensureWhatsAppPrefix } from '../utils/phoneUtils.js';
import { getEventDateRangeFromSessions } from '../utils/eventDateRange.js';

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

// Build location object from multipart body (keys like 'location[venue]')
function buildLocationFromBody(body) {
  const venue = body['location[venue]'] ?? body.location?.venue;
  const address = body['location[address]'] ?? body.location?.address;
  const district = body['location[district]'] ?? body.location?.district;
  const rawOnline = body['location[onlineEvent]'] ?? body.location?.onlineEvent;
  const onlineEvent = rawOnline === true || String(rawOnline).toLowerCase() === 'true' || rawOnline === '1';
  const meetingLinkRaw = body['location[meetingLink]'] ?? body.location?.meetingLink;
  const meetingLink = meetingLinkRaw ? String(meetingLinkRaw).trim() : undefined;
  // Treat as online if flag is true OR if user provided a meeting link (defensive for form/parsing issues)
  const isOnline = onlineEvent || (meetingLink && (!venue || !String(venue).trim()));
  if (venue !== undefined || address !== undefined || district !== undefined || meetingLink !== undefined || body['location[onlineEvent]'] !== undefined) {
    if (isOnline) {
      return {
        venue: undefined,
        address: undefined,
        district: undefined,
        onlineEvent: true,
        meetingLink: meetingLink || undefined
      };
    }
    return {
      venue: (venue && String(venue).trim()) || '',
      address: (address && String(address).trim()) || '',
      district: (district && String(district).trim()) || '',
      onlineEvent: false,
      meetingLink: undefined
    };
  }
  return undefined;
}

// Build sessions array from multipart body (keys like 'sessions[0][title]')
function buildSessionsFromBody(body) {
  const sessions = [];
  let index = 0;
  while (body[`sessions[${index}][title]`] !== undefined || body[`sessions[${index}][date]`] !== undefined) {
    const title = body[`sessions[${index}][title]`];
    const date = body[`sessions[${index}][date]`];
    const startTime = body[`sessions[${index}][startTime]`];
    const endTime = body[`sessions[${index}][endTime]`];
    const description = body[`sessions[${index}][description]`];
    const capacity = body[`sessions[${index}][capacity]`];
    const venue = body[`sessions[${index}][location][venue]`];
    const meetingLink = body[`sessions[${index}][location][meetingLink]`];
    sessions.push({
      title: title ?? '',
      description: description || undefined,
      date: date ? new Date(date) : new Date(),
      startTime: startTime ?? '',
      endTime: endTime ?? '',
      capacity: capacity ? parseInt(capacity, 10) : undefined,
      location: (venue || meetingLink) ? { venue: venue || undefined, meetingLink: meetingLink || undefined } : undefined
    });
    index++;
  }
  return sessions.length ? sessions : undefined;
}

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

    const locationFromBody = buildLocationFromBody(req.body);
    if (locationFromBody) eventData.location = locationFromBody;
    const sessionsFromBody = buildSessionsFromBody(req.body);
    if (sessionsFromBody) {
      eventData.sessions = sessionsFromBody;
      const range = getEventDateRangeFromSessions(sessionsFromBody);
      if (range) {
        eventData.startDate = range.startDate;
        eventData.endDate = range.endDate;
      }
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
    console.error('[EVENTS] Create error:', error);
    const message = error.message || 'Server error';
    const status = error.name === 'ValidationError' ? 400 : 500;
    res.status(status).json({ message, error: message });
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
    const locationFromBody = buildLocationFromBody(req.body);
    if (locationFromBody) updateData.location = locationFromBody;
    const sessionsFromBody = buildSessionsFromBody(req.body);
    if (sessionsFromBody) {
      updateData.sessions = sessionsFromBody;
      const range = getEventDateRangeFromSessions(sessionsFromBody);
      if (range) {
        updateData.startDate = range.startDate;
        updateData.endDate = range.endDate;
      }
    }

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
    const message = error.message || 'Server error';
    const status = error.name === 'ValidationError' ? 400 : 500;
    res.status(status).json({ message, error: message });
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
// All manual WhatsApp messages use the marketing template only (no freeform). Variable 1 = title, Variable 2 = message.
router.post('/send-whatsapp-reminder', async (req, res) => {
  try {
    const { to, message, eventTitle } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Message content is required (template variable 2)' });
    }

    console.log(`Attempting to send WhatsApp message to: ${to}`);

    if (!twilioClient) {
      console.error('Twilio client not initialized, cannot send WhatsApp message');
      return res.status(503).json({
        success: false,
        error: 'SMS service not available',
        message: 'WhatsApp messaging is currently unavailable'
      });
    }

    if (!process.env.TWILIO_WHATSAPP_MARKETING_TEMPLATE_SID) {
      return res.status(503).json({
        success: false,
        error: 'Marketing template not configured',
        message: 'TWILIO_WHATSAPP_MARKETING_TEMPLATE_SID is required'
      });
    }

    const result = await twilioClient.messages.create({
      from: ensureWhatsAppPrefix(process.env.TWILIO_WHATSAPP_NUMBER),
      contentSid: process.env.TWILIO_WHATSAPP_MARKETING_TEMPLATE_SID,
      contentVariables: JSON.stringify({
        "1": eventTitle || "Event Update",
        "2": message.trim()
      }),
      to: `whatsapp:${to}`
    });

    console.log('WhatsApp marketing template message sent successfully:', result.sid);
    res.json({ success: true, sid: result.sid, method: 'marketing_template' });
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
    if (!message || !String(message).trim()) {
      console.error('[WhatsApp] Message content is required (template variable 2)');
      return res.status(400).json({ message: 'Message content is required (used as template variable 2)' });
    }

    if (!process.env.TWILIO_WHATSAPP_MARKETING_TEMPLATE_SID) {
      console.error('[WhatsApp] Marketing template not configured');
      return res.status(503).json({ message: 'WhatsApp marketing template is not configured (TWILIO_WHATSAPP_MARKETING_TEMPLATE_SID)' });
    }

    const messageText = String(message).trim();
    // Use client-provided title when present (matches what user sees on manage-registrations page); else DB event title
    const titleForTemplate = (title != null && String(title).trim()) ? String(title).trim() : (event.title || 'Event');

    // Get all registered participants for this event
    const registrations = await EventRegistration.find({
      eventId: req.params.id,
      status: 'registered'
    });

    // Filter out users who opted out of WhatsApp messages
    const optedOutUsers = await User.find({ whatsappOptOut: true }).select('mobile');
    const optedOutNumbers = new Set(optedOutUsers.map(u => u.mobile));

    console.log(`[WhatsApp] Starting message send for event: ${event.title} (${event._id})`);
    console.log(`[WhatsApp] Template variables: 1="${titleForTemplate}" 2="${messageText}"`);
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

          // All manual WhatsApp sends use the marketing template only (variable 1 = event title, variable 2 = message).
          await twilioClient.messages.create({
            from: ensureWhatsAppPrefix(process.env.TWILIO_WHATSAPP_NUMBER),
            contentSid: process.env.TWILIO_WHATSAPP_MARKETING_TEMPLATE_SID,
            contentVariables: JSON.stringify({
              "1": titleForTemplate,
              "2": messageText
            }),
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

/**
 * For tests only: inject a mock Twilio client so we can assert on payload (contentSid, contentVariables).
 */
export function setTwilioClientForTesting(client) {
  twilioClient = client;
}

export default router; 
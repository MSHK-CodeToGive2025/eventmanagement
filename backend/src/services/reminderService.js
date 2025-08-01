import cron from 'node-cron';
import Event from '../models/Event.js';
import EventRegistration from '../models/EventRegistration.js';
import twilio from 'twilio';
import { formatForWhatsApp } from '../utils/phoneUtils.js';

// Initialize Twilio client
let twilioClient = null;
try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    console.log('[REMINDER SERVICE] Twilio client initialized successfully');
  } else {
    console.log('[REMINDER SERVICE] Twilio credentials not found, reminder service will be disabled');
  }
} catch (error) {
  console.error('[REMINDER SERVICE] Failed to initialize Twilio client:', error.message);
  console.log('[REMINDER SERVICE] Reminder service will be disabled');
}

class ReminderService {
  constructor() {
    this.isRunning = false;
  }

  // Start the reminder service
  start() {
    if (this.isRunning) {
      console.log('[REMINDER SERVICE] Service is already running');
      return;
    }

    if (!twilioClient) {
      console.log('[REMINDER SERVICE] Cannot start service - Twilio client not available');
      return;
    }

    // Schedule job to run every hour
    cron.schedule('0 * * * *', () => {
      this.processReminders();
    }, {
      scheduled: true,
      timezone: "Asia/Hong_Kong" // Hong Kong timezone
    });

    this.isRunning = true;
    console.log('[REMINDER SERVICE] Reminder service started - running every hour');
  }

  // Stop the reminder service
  stop() {
    if (!this.isRunning) {
      console.log('[REMINDER SERVICE] Service is not running');
      return;
    }

    // Note: node-cron doesn't have a direct stop method for individual jobs
    // In a production environment, you might want to store the cron job reference
    this.isRunning = false;
    console.log('[REMINDER SERVICE] Reminder service stopped');
  }

  // Process reminders for all events
  async processReminders() {
    try {
      console.log('[REMINDER SERVICE] Starting reminder processing...');
      
      const now = new Date();
      console.log(`[REMINDER SERVICE] Current time: ${now.toISOString()}`);
      
      const events = await Event.find({
        status: 'Published', // Only process published events
        startDate: { $gt: now } // Only future events
      });

      console.log(`[REMINDER SERVICE] Found ${events.length} published future events`);

      let totalRemindersSent = 0;
      let totalSessionsChecked = 0;

      for (const event of events) {
        const result = await this.processEventReminders(event, now);
        if (result) {
          totalRemindersSent += result.remindersSent;
          totalSessionsChecked += result.sessionsChecked;
        }
      }

      console.log(`[REMINDER SERVICE] 📈 SUMMARY: Checked ${totalSessionsChecked} sessions/events, sent ${totalRemindersSent} reminders`);
      console.log('[REMINDER SERVICE] Reminder processing completed');
    } catch (error) {
      console.error('[REMINDER SERVICE] Error processing reminders:', error);
    }
  }

  // Process reminders for a specific event
  async processEventReminders(event, now) {
    try {
      console.log(`[REMINDER SERVICE] Processing reminders for event: ${event.title}`);
      console.log(`[REMINDER SERVICE] Event reminder times: ${event.reminderTimes.join(', ')} hours before`);
      console.log(`[REMINDER SERVICE] Event reminders already sent: ${event.remindersSent.join(', ')}`);

      // Check reminders for the main event
      if (event.startDate) {
        console.log(`[REMINDER SERVICE] Main event start date: ${event.startDate.toISOString()}`);
        await this.processSingleEventReminder(event, event.startDate, now, 'main event');
      }

      // Check reminders for all sessions
      if (event.sessions && event.sessions.length > 0) {
        console.log(`[REMINDER SERVICE] Event has ${event.sessions.length} sessions to check`);
        
        for (const session of event.sessions) {
          // Validate session has required fields
          if (!session.date || !session.startTime || !session.title) {
            console.log(`[REMINDER SERVICE] Skipping session - missing required fields: ${session.title || 'Unknown'}`);
            continue;
          }
          
          // Combine session date with start time to get the actual session start datetime
          const sessionDate = new Date(session.date);
          const [hours, minutes] = session.startTime.split(':').map(Number);
          sessionDate.setHours(hours, minutes, 0, 0);
          
          console.log(`[REMINDER SERVICE] Session "${session.title}" scheduled for ${sessionDate.toISOString()}`);
          await this.processSingleEventReminder(event, sessionDate, now, `session: ${session.title}`);
        }
      } else {
        console.log(`[REMINDER SERVICE] Event has no sessions, only checking main event`);
      }
    } catch (error) {
      console.error(`[REMINDER SERVICE] Error processing reminders for event ${event.title}:`, error);
    }
  }

  // Process reminder for a single event or session
  async processSingleEventReminder(event, startDateTime, now, eventType) {
    try {
      const timeUntilEvent = startDateTime.getTime() - now.getTime();
      const hoursUntilEvent = timeUntilEvent / (1000 * 60 * 60);

      console.log(`[REMINDER SERVICE] ${eventType} - ${hoursUntilEvent.toFixed(1)} hours until start`);

      // Check each configured reminder time
      for (const reminderHours of event.reminderTimes) {
        console.log(`[REMINDER SERVICE] Checking ${reminderHours}h reminder for ${eventType}`);
        console.log(`[REMINDER SERVICE] Time window: ${reminderHours - 0.5} to ${reminderHours + 0.5} hours before`);
        console.log(`[REMINDER SERVICE] Current hours until event: ${hoursUntilEvent.toFixed(1)}`);
        
        // Check if reminder is due (within 1 hour window)
        if (hoursUntilEvent >= reminderHours - 0.5 && hoursUntilEvent <= reminderHours + 0.5) {
          console.log(`[REMINDER SERVICE] ✅ ${reminderHours}h reminder MATCHES criteria for ${eventType}`);
          
          // Create a unique identifier for this reminder (event + session + reminder time)
          const reminderKey = eventType === 'main event' 
            ? `main_${reminderHours}` 
            : `session_${eventType.replace('session: ', '')}_${reminderHours}`;
          
          console.log(`[REMINDER SERVICE] Reminder key: ${reminderKey}`);
          console.log(`[REMINDER SERVICE] Already sent reminders: ${event.remindersSent.join(', ')}`);
          
          // Check if this reminder has already been sent
          if (!event.remindersSent.includes(reminderKey)) {
            console.log(`[REMINDER SERVICE] 🚀 Sending ${reminderHours}h reminder for ${eventType}: ${event.title}`);
            await this.sendEventReminder(event, reminderHours, eventType, startDateTime);
          } else {
            console.log(`[REMINDER SERVICE] ⏭️ ${reminderHours}h reminder already sent for ${eventType}: ${event.title}`);
          }
        } else {
          console.log(`[REMINDER SERVICE] ❌ ${reminderHours}h reminder does NOT match criteria for ${eventType}`);
        }
      }
    } catch (error) {
      console.error(`[REMINDER SERVICE] Error processing reminder for ${eventType}:`, error);
    }
  }

  // Send reminder for a specific event
  async sendEventReminder(event, reminderHours, eventType, startDateTime) {
    try {
      console.log(`[REMINDER SERVICE] 📤 Starting to send ${reminderHours}h reminder for ${eventType}: ${event.title}`);
      
      // Get all registered participants for this event
      const registrations = await EventRegistration.find({
        eventId: event._id,
        status: 'registered'
      });

      console.log(`[REMINDER SERVICE] Found ${registrations.length} registered participants for event: ${event.title}`);

      if (registrations.length === 0) {
        console.log(`[REMINDER SERVICE] ⚠️ No registered participants for event: ${event.title}`);
        // Still mark as sent to avoid repeated processing
        await this.markReminderSent(event._id, reminderHours, eventType, startDateTime);
        return;
      }

      const failedNumbers = [];
      const successfulNumbers = [];

      // Send reminder to each participant
      for (const registration of registrations) {
        if (registration.attendee && registration.attendee.phone) {
          try {
            const message = this.createReminderMessage(event, reminderHours, eventType, startDateTime);
            
            // Format phone number for Twilio WhatsApp compliance
            const formattedNumber = formatForWhatsApp(registration.attendee.phone);

            console.log(`[REMINDER SERVICE] 📱 Sending reminder to ${formattedNumber} for ${eventType}`);

            await twilioClient.messages.create({
              body: message,
              from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
              to: `whatsapp:${formattedNumber}`
            });

            console.log(`[REMINDER SERVICE] ✅ Successfully sent ${reminderHours}h reminder to ${formattedNumber}`);
            successfulNumbers.push(formattedNumber);
          } catch (error) {
            console.error(`[REMINDER SERVICE] ❌ Failed to send reminder to ${registration.attendee.phone}:`, error.message);
            failedNumbers.push(registration.attendee.phone);
          }
        } else {
          console.log(`[REMINDER SERVICE] ⚠️ Skipping participant - no phone number`);
        }
      }

      console.log(`[REMINDER SERVICE] 📊 ${reminderHours}h reminder completed for ${eventType}: ${event.title}`);
      console.log(`[REMINDER SERVICE] ✅ Successful: ${successfulNumbers.length}, ❌ Failed: ${failedNumbers.length}`);

      // Mark reminder as sent regardless of failures
      await this.markReminderSent(event._id, reminderHours, eventType, startDateTime);

    } catch (error) {
      console.error(`[REMINDER SERVICE] Error sending reminder for event ${event.title}:`, error);
    }
  }

  // Create reminder message
  createReminderMessage(event, reminderHours, eventType, startDateTime) {
    const eventStartTime = startDateTime; // Use the actual startDateTime
    const formattedDate = eventStartTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = eventStartTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    let timeText;
    if (reminderHours >= 24) {
      const days = Math.floor(reminderHours / 24);
      timeText = `${days} day${days > 1 ? 's' : ''}`;
    } else {
      timeText = `${reminderHours} hour${reminderHours > 1 ? 's' : ''}`;
    }

    // Determine if this is a session or main event
    const isSession = eventType.startsWith('session:');
    const sessionTitle = isSession ? eventType.replace('session: ', '') : null;

    let message = `🔔 Event Reminder: "${event.title}"`;
    
    if (isSession) {
      message += `\n📋 Session: "${sessionTitle}"`;
    }
    
    message += `\n\n⏰ The ${isSession ? 'session' : 'event'} will start in ${timeText}\n📅 Date: ${formattedDate}\n🕐 Time: ${formattedTime}`;
    
    // Add location information
    if (isSession) {
      // For sessions, use session location if available, otherwise fall back to event location
      const session = event.sessions.find(s => s.title === sessionTitle);
      if (session && session.location && session.location.venue) {
        message += `\n📍 Location: ${session.location.venue}`;
        if (session.location.meetingLink) {
          message += `\n🔗 Meeting Link: ${session.location.meetingLink}`;
        }
      } else {
        message += `\n📍 Location: ${event.location.venue}, ${event.location.district}`;
        if (event.location.meetingLink) {
          message += `\n🔗 Meeting Link: ${event.location.meetingLink}`;
        }
      }
    } else {
      message += `\n📍 Location: ${event.location.venue}, ${event.location.district}`;
      if (event.location.meetingLink) {
        message += `\n🔗 Meeting Link: ${event.location.meetingLink}`;
      }
    }
    
    message += `\n\nWe look forward to seeing you!`;
    
    return message;
  }

  // Mark reminder as sent
  async markReminderSent(eventId, reminderHours, eventType, startDateTime) {
    try {
      const reminderKey = eventType === 'main event' 
        ? `main_${reminderHours}` 
        : `session_${eventType.replace('session: ', '')}_${reminderHours}`;

      await Event.findByIdAndUpdate(eventId, {
        $addToSet: { remindersSent: reminderKey }
      });
      console.log(`[REMINDER SERVICE] Marked ${reminderHours}h reminder as sent for ${eventType}: ${eventId}`);
    } catch (error) {
      console.error(`[REMINDER SERVICE] Error marking reminder as sent:`, error);
    }
  }

  // Manual trigger for testing
  async triggerReminders() {
    console.log('[REMINDER SERVICE] Manual trigger requested');
    await this.processReminders();
  }
}

// Create singleton instance
const reminderService = new ReminderService();

export default reminderService; 
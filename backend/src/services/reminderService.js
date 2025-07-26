import cron from 'node-cron';
import Event from '../models/Event.js';
import EventRegistration from '../models/EventRegistration.js';
import twilio from 'twilio';

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
      const events = await Event.find({
        status: 'Published', // Only process published events
        startDate: { $gt: now } // Only future events
      });

      console.log(`[REMINDER SERVICE] Found ${events.length} published future events`);

      for (const event of events) {
        await this.processEventReminders(event, now);
      }

      console.log('[REMINDER SERVICE] Reminder processing completed');
    } catch (error) {
      console.error('[REMINDER SERVICE] Error processing reminders:', error);
    }
  }

  // Process reminders for a specific event
  async processEventReminders(event, now) {
    try {
      const eventStartTime = new Date(event.startDate);
      const timeUntilEvent = eventStartTime.getTime() - now.getTime();
      const hoursUntilEvent = timeUntilEvent / (1000 * 60 * 60);

      console.log(`[REMINDER SERVICE] Event: ${event.title} - ${hoursUntilEvent.toFixed(1)} hours until start`);

      // Check each configured reminder time
      for (const reminderHours of event.reminderTimes) {
        // Check if reminder is due (within 1 hour window)
        if (hoursUntilEvent >= reminderHours - 0.5 && hoursUntilEvent <= reminderHours + 0.5) {
          // Check if this reminder has already been sent
          if (!event.remindersSent.includes(reminderHours)) {
            console.log(`[REMINDER SERVICE] Sending ${reminderHours}h reminder for event: ${event.title}`);
            await this.sendEventReminder(event, reminderHours);
          } else {
            console.log(`[REMINDER SERVICE] ${reminderHours}h reminder already sent for event: ${event.title}`);
          }
        }
      }
    } catch (error) {
      console.error(`[REMINDER SERVICE] Error processing reminders for event ${event.title}:`, error);
    }
  }

  // Send reminder for a specific event
  async sendEventReminder(event, reminderHours) {
    try {
      // Get all registered participants for this event
      const registrations = await EventRegistration.find({
        eventId: event._id,
        status: 'registered'
      });

      console.log(`[REMINDER SERVICE] Found ${registrations.length} registered participants for event: ${event.title}`);

      if (registrations.length === 0) {
        console.log(`[REMINDER SERVICE] No registered participants for event: ${event.title}`);
        // Still mark as sent to avoid repeated processing
        await this.markReminderSent(event._id, reminderHours);
        return;
      }

      const failedNumbers = [];
      const successfulNumbers = [];

      // Send reminder to each participant
      for (const registration of registrations) {
        if (registration.attendee && registration.attendee.phone) {
          try {
            const message = this.createReminderMessage(event, reminderHours);
            
            // Format phone number to E.164 format if needed
            const formattedNumber = registration.attendee.phone.startsWith('+') 
              ? registration.attendee.phone 
              : `+${registration.attendee.phone.replace(/\D/g, '')}`;

            await twilioClient.messages.create({
              body: message,
              from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
              to: `whatsapp:${formattedNumber}`
            });

            console.log(`[REMINDER SERVICE] Successfully sent ${reminderHours}h reminder to ${formattedNumber}`);
            successfulNumbers.push(formattedNumber);
          } catch (error) {
            console.error(`[REMINDER SERVICE] Failed to send reminder to ${registration.attendee.phone}:`, error.message);
            failedNumbers.push(registration.attendee.phone);
          }
        } else {
          console.log(`[REMINDER SERVICE] Skipping participant - no phone number`);
        }
      }

      console.log(`[REMINDER SERVICE] ${reminderHours}h reminder completed for event: ${event.title}`);
      console.log(`[REMINDER SERVICE] Successful: ${successfulNumbers.length}, Failed: ${failedNumbers.length}`);

      // Mark reminder as sent regardless of failures
      await this.markReminderSent(event._id, reminderHours);

    } catch (error) {
      console.error(`[REMINDER SERVICE] Error sending reminder for event ${event.title}:`, error);
    }
  }

  // Create reminder message
  createReminderMessage(event, reminderHours) {
    const eventStartTime = new Date(event.startDate);
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

    return `🔔 Event Reminder: "${event.title}"\n\n⏰ The event will start in ${timeText}\n📅 Date: ${formattedDate}\n🕐 Time: ${formattedTime}\n📍 Location: ${event.location.venue}, ${event.location.district}\n\nWe look forward to seeing you!`;
  }

  // Mark reminder as sent
  async markReminderSent(eventId, reminderHours) {
    try {
      await Event.findByIdAndUpdate(eventId, {
        $addToSet: { remindersSent: reminderHours }
      });
      console.log(`[REMINDER SERVICE] Marked ${reminderHours}h reminder as sent for event: ${eventId}`);
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
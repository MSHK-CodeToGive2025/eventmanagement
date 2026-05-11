import cron from 'node-cron';
import Event from '../models/Event.js';
import EventRegistration from '../models/EventRegistration.js';
import User from '../models/User.js';
import twilio from 'twilio';
import { formatForWhatsApp, ensureWhatsAppPrefix } from '../utils/phoneUtils.js';
import { getEventDateRangeFromSessions } from '../utils/eventDateRange.js';
import { buildEventUpdateMessageBodyVariable } from '../utils/whatsappEventUpdateVariables.js';

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

const HKT = 'Asia/Hong_Kong';

function formatDateHKT(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: HKT
  }) + ' HKT';
}

function formatTimeHKT(date) {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: HKT
  }) + ' HKT';
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



    // Schedule job to run every 5 minutes in Hong Kong time.
    cron.schedule('*/5 * * * *', () => {
      this.processReminders();
    }, {
      scheduled: true,
      timezone: "Asia/Hong_Kong"
    });

    this.isRunning = true;
    console.log('[REMINDER SERVICE] Reminder service started - running every 5 minutes (Asia/Hong_Kong)');
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
      
      // Get all published events - we need to check both main events and all sessions
      // The filtering for which events/sessions need reminders happens in processEventReminders
      const events = await Event.find({
        status: 'Published' // Only process published events
      });

      // Filter out events that are already completed (endDate < now).
      // If an event has sessions but stored endDate is in the past (e.g. created with wrong dates),
      // compute effective end from sessions (HKT) so it still gets reminders.
      const activeEvents = events.filter(event => {
        if (!event.endDate) return true;
        if (event.endDate > now) return true;
        const hasSessions = event.sessions && event.sessions.length > 0;
        if (hasSessions) {
          const range = getEventDateRangeFromSessions(event.sessions);
          if (range && range.endDate > now) return true;
        }
        return false;
      });

      console.log(`[REMINDER SERVICE] Found ${events.length} published events, ${activeEvents.length} are still active`);

      console.log(`[REMINDER SERVICE] Found ${activeEvents.length} active published events`);

      // Debug: Log all events and their reminder times
      for (const event of activeEvents) {
        console.log(`[REMINDER SERVICE] DEBUG - Event: ${event.title}`);
        console.log(`[REMINDER SERVICE] DEBUG - Reminder times: ${JSON.stringify(event.reminderTimes)}`);
        console.log(`[REMINDER SERVICE] DEBUG - Reminders sent: ${JSON.stringify(event.remindersSent)}`);
      }

      let totalRemindersSent = 0;
      let totalSessionsChecked = 0;

      for (const event of activeEvents) {
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
      const reminderTimesList = Array.isArray(event.reminderTimes) ? event.reminderTimes : [24];
      const remindersSentKeys = Array.isArray(event.remindersSent) ? event.remindersSent : [];
      console.log(`[REMINDER SERVICE] Processing reminders for event: ${event.title}`);
      console.log(`[REMINDER SERVICE] Event reminder times: ${reminderTimesList.join(', ')} hours before`);
      console.log(`[REMINDER SERVICE] Event reminders already sent: ${remindersSentKeys.join(', ')}`);
      console.log(`[REMINDER SERVICE] Event ID: ${event._id}`);
      console.log(`[REMINDER SERVICE] Raw reminder times:`, JSON.stringify(event.reminderTimes));

      let remindersSent = 0;
      let sessionsChecked = 0;

      // Check reminders for the main event only when there are no sessions (sessions get their own reminders)
      const hasSessions = event.sessions && event.sessions.length > 0;
      if (event.startDate && !hasSessions) {
        console.log(`[REMINDER SERVICE] Main event start date: ${event.startDate.toISOString()}`);
        const mainEventResult = await this.processSingleEventReminder(event, event.startDate, now, 'main event');
        if (mainEventResult && mainEventResult.reminderSent) {
          remindersSent++;
        }
        sessionsChecked++;
      }

      // Check reminders for all sessions
      if (hasSessions) {
        console.log(`[REMINDER SERVICE] Event has ${event.sessions.length} sessions to check`);
        
        for (const session of event.sessions) {
          // Validate session has required fields
          if (!session.date || !session.startTime || !session.title) {
            console.log(`[REMINDER SERVICE] Skipping session - missing required fields: ${session.title || 'Unknown'}`);
            continue;
          }
          
          // Interpret session date + startTime in Hong Kong time (Asia/Hong_Kong)
          // Use UTC date parts so the calendar day doesn't shift with server timezone
          const d = new Date(session.date);
          const y = d.getUTCFullYear();
          const m = String(d.getUTCMonth() + 1).padStart(2, '0');
          const day = String(d.getUTCDate()).padStart(2, '0');
          const dateStr = `${y}-${m}-${day}`;
          const timeParts = String(session.startTime || '').trim().split(':').map(s => Number(s.trim()));
          const hours = Number.isFinite(timeParts[0]) ? timeParts[0] : 0;
          const minutes = Number.isFinite(timeParts[1]) ? timeParts[1] : 0;
          const sessionDate = new Date(`${dateStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00+08:00`);
          
          console.log(`[REMINDER SERVICE] Session "${session.title}" date=${dateStr} startTime="${session.startTime}" -> ${sessionDate.toISOString()} (HKT ${hours}:${String(minutes).padStart(2,'0')})`);
          const sessionResult = await this.processSingleEventReminder(event, sessionDate, now, `session: ${session.title}`);
          if (sessionResult && sessionResult.reminderSent) {
            remindersSent++;
          }
          sessionsChecked++;
        }
      } else {
        console.log(`[REMINDER SERVICE] Event has no sessions, only main event was checked`);
      }

      console.log(`[REMINDER SERVICE] 📊 Event "${event.title}": Checked ${sessionsChecked} sessions/events, sent ${remindersSent} reminders`);
      return { remindersSent, sessionsChecked };
    } catch (error) {
      console.error(`[REMINDER SERVICE] Error processing reminders for event ${event.title}:`, error);
      return { remindersSent: 0, sessionsChecked: 0 };
    }
  }

  // Process reminder for a single event or session
  async processSingleEventReminder(event, startDateTime, now, eventType) {
    try {
      const timeUntilEvent = startDateTime.getTime() - now.getTime();
      const hoursUntilEvent = timeUntilEvent / (1000 * 60 * 60);

      console.log(`[REMINDER SERVICE] ${eventType} - now=${now.toISOString()} start=${startDateTime.toISOString()} -> ${hoursUntilEvent.toFixed(3)} h until start`);

      let reminderSent = false;

      // Check each configured reminder time (coerce to number - form/API may send strings)
      const reminderTimesList = Array.isArray(event.reminderTimes) ? event.reminderTimes : [24];
      console.log(`[REMINDER SERVICE] Total reminder times to check: ${reminderTimesList.length}`);
      for (const raw of reminderTimesList) {
        const reminderHours = Number(raw);
        if (!Number.isFinite(reminderHours) || reminderHours <= 0) {
          console.log(`[REMINDER SERVICE] Skipping invalid reminder time: ${raw}`);
          continue;
        }
        const halfWindow = Math.min(0.5, Math.max(0.05, reminderHours / 2));
        const windowStart = reminderHours - halfWindow;
        const windowEnd = reminderHours + halfWindow;
        console.log(`[REMINDER SERVICE] Checking ${reminderHours}h reminder for ${eventType} (window: ${windowStart.toFixed(2)}–${windowEnd.toFixed(2)} h before)`);
        console.log(`[REMINDER SERVICE] Current hours until event: ${hoursUntilEvent.toFixed(2)}`);
        
        if (hoursUntilEvent >= windowStart && hoursUntilEvent <= windowEnd) {
          console.log(`[REMINDER SERVICE] ✅ ${reminderHours}h reminder MATCHES criteria for ${eventType}`);
          const reminderKey = eventType === 'main event'
            ? `main_${reminderHours}`
            : `session_${eventType.replace('session: ', '')}_${reminderHours}`;
          console.log(`[REMINDER SERVICE] Reminder key: ${reminderKey}`);
          console.log(`[REMINDER SERVICE] Already sent reminders: ${(event.remindersSent || []).join(', ')}`);
          if (!(event.remindersSent || []).includes(reminderKey)) {
            console.log(`[REMINDER SERVICE] 🚀 Sending ${reminderHours}h reminder for ${eventType}: ${event.title}`);
            await this.sendEventReminder(event, reminderHours, eventType, startDateTime);
            reminderSent = true;
          } else {
            console.log(`[REMINDER SERVICE] ⏭️ ${reminderHours}h reminder already sent for ${eventType}: ${event.title}`);
          }
        } else {
          console.log(`[REMINDER SERVICE] ❌ ${reminderHours}h reminder does NOT match criteria for ${eventType}`);
        }
      }

      return { reminderSent };
    } catch (error) {
      console.error(`[REMINDER SERVICE] Error processing reminder for ${eventType}:`, error);
      return { reminderSent: false };
    }
  }

  // Send reminder for a specific event
  async sendEventReminder(event, reminderHours, eventType, startDateTime, useTemplate = null) {
    try {
      // If useTemplate is not specified, use the event's default setting
      if (useTemplate === null) {
        useTemplate = event.defaultReminderMode === 'template';
      }
      
      console.log(`[REMINDER SERVICE] 📤 Starting to send ${reminderHours}h reminder for ${eventType}: ${event.title}`);
      console.log(`[REMINDER SERVICE] Using template: ${useTemplate ? 'Yes' : 'No'} (${event.defaultReminderMode} default)`);
      
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

      // Filter out users who opted out of WhatsApp messages
      const optedOutUsers = await User.find({ whatsappOptOut: true }).select('mobile');
      const optedOutNumbers = new Set(optedOutUsers.map(u => u.mobile));
      if (optedOutNumbers.size > 0) {
        console.log(`[REMINDER SERVICE] Opted-out numbers to skip: ${optedOutNumbers.size}`);
      }

      const failedNumbers = [];
      const successfulNumbers = [];

      // Send reminder to each participant
      for (const registration of registrations) {
        if (registration.attendee && registration.attendee.phone) {
          // Skip users who opted out
          if (optedOutNumbers.has(registration.attendee.phone)) {
            console.log(`[REMINDER SERVICE] Skipping opted-out user: ${registration.attendee.phone}`);
            continue;
          }

          try {
            // Format phone number for Twilio WhatsApp compliance
            const formattedNumber = formatForWhatsApp(registration.attendee.phone);

            console.log(`[REMINDER SERVICE] 📱 Sending reminder to ${formattedNumber} for ${eventType}`);

            // WhatsApp: only templates (no freeform body) to avoid 63016 outside 24h window.
            if (useTemplate && process.env.TWILIO_WHATSAPP_TEMPLATE_SID) {
              const templateVariables = this.createTemplateVariables(event, reminderHours, eventType, startDateTime);
              console.log(`[REMINDER SERVICE] Using 8-var reminder template SID: ${process.env.TWILIO_WHATSAPP_TEMPLATE_SID}`);
              await twilioClient.messages.create({
                from: ensureWhatsAppPrefix(process.env.TWILIO_WHATSAPP_NUMBER),
                contentSid: process.env.TWILIO_WHATSAPP_TEMPLATE_SID,
                contentVariables: JSON.stringify(templateVariables),
                to: `whatsapp:${formattedNumber}`
              });
            } else if (process.env.TWILIO_WHATSAPP_UPDATE_TEMPLATE_SID) {
              // Event set to "custom" reminder: send full reminder text as variable 3 via event update template.
              // Variables: 1=event title, 2=session, 3=message body (includes post-body disclaimer), 4=contact name, 5=contact phone.
              const message = this.createReminderMessage(event, reminderHours, eventType, startDateTime);
              const isSession = eventType.startsWith('session:');
              const sessionTitle = isSession ? eventType.replace('session: ', '') : ' ';
              const contactName = (event.staffContact && event.staffContact.name) ? event.staffContact.name : ' ';
              const contactPhone = (event.staffContact && event.staffContact.phone) ? event.staffContact.phone : ' ';
              console.log(`[REMINDER SERVICE] Using event update template for reminder to ${formattedNumber}`);
              await twilioClient.messages.create({
                from: ensureWhatsAppPrefix(process.env.TWILIO_WHATSAPP_NUMBER),
                contentSid: process.env.TWILIO_WHATSAPP_UPDATE_TEMPLATE_SID,
                contentVariables: JSON.stringify({
                  "1": this.sanitizeContentVariable(event.title),
                  "2": this.sanitizeContentVariable(sessionTitle),
                  "3": buildEventUpdateMessageBodyVariable(message),
                  "4": this.sanitizeContentVariable(contactName),
                  "5": this.sanitizeContentVariable(contactPhone)
                }),
                to: `whatsapp:${formattedNumber}`
              });
            } else {
              console.error(`[REMINDER SERVICE] No template SID configured; set TWILIO_WHATSAPP_TEMPLATE_SID or TWILIO_WHATSAPP_UPDATE_TEMPLATE_SID`);
              throw new Error('WhatsApp template not configured for reminders');
            }

            console.log(`[REMINDER SERVICE] ✅ Successfully sent ${reminderHours}h reminder to ${formattedNumber}`);
            successfulNumbers.push(formattedNumber);
                      } catch (error) {
              console.error(`[REMINDER SERVICE] ❌ Failed to send reminder to ${registration.attendee.phone}:`, error.message);
              console.error(`[REMINDER SERVICE] Error details:`, error);
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
    const eventStartTime = startDateTime;
    const formattedDate = formatDateHKT(eventStartTime);
    const formattedTime = formatTimeHKT(eventStartTime);

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
    
    // Add staff contact information if available (right after location/meeting link)
    if (event.staffContact && event.staffContact.name && event.staffContact.phone) {
      message += `\n👤 Contact: ${event.staffContact.name}`;
      message += `\n📞 Phone: ${event.staffContact.phone}`;
    }
    
    message += `\n\nWe look forward to seeing you!`;
    
    return message;
  }

  // Sanitize a value for Twilio Content API: no null/empty, no newlines/tabs, max 4 consecutive spaces (error 21656)
  sanitizeContentVariable(val) {
    if (val == null || val === '') return ' ';
    let s = String(val).replace(/\r\n|\r|\n|\t/g, ' ').replace(/\s{5,}/g, '    ');
    return s.trim() === '' ? ' ' : s;
  }

  // Create template variables for WhatsApp template (zubin_foundation_event_reminder_v2)
  // Template structure:
  // 🔔 Event Reminder from The Zubin Foundation
  //
  // 📢 Event: {{1}}
  // 📋 Session: {{2}}
  //
  // ⏰ The session will start in {{3}}
  // 📅 Date: {{4}}
  // 🕐 Time: {{5}}
  // 📍 Location: {{6}}
  // 👤 Contact: {{7}}
  // 📞 Phone: {{8}}
  //
  // We look forward to seeing you!
  createTemplateVariables(event, reminderHours, eventType, startDateTime) {
    const eventStartTime = startDateTime;
    const formattedDate = formatDateHKT(eventStartTime);
    const formattedTime = formatTimeHKT(eventStartTime);

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

    // Variable 1: Event title
    const eventTitle = event.title;
    
    // Variable 2: Session title (empty for main event, or session name for sessions)
    // Note: Template shows "📋 Session: {{2}}" - if empty, it will show "📋 Session: "
    const sessionTitleText = isSession ? sessionTitle : '';
    
    // Variable 3: Time until event
    const timeUntilEvent = timeText;
    
    // Variable 4: Date
    const dateText = formattedDate;
    
    // Variable 5: Time
    const timeText2 = formattedTime;
    
    // Variable 6: Location (Twilio rejects empty string - use space)
    let locationText = '';
    if (isSession) {
      const session = event.sessions.find(s => s.title === sessionTitle);
      if (session && session.location && session.location.venue) {
        locationText = session.location.venue;
      } else if (event.location) {
        locationText = [event.location.venue, event.location.district].filter(Boolean).join(', ') || (event.location.meetingLink ? 'Online' : '');
      }
    } else if (event.location) {
      locationText = [event.location.venue, event.location.district].filter(Boolean).join(', ') || (event.location.meetingLink ? 'Online' : '');
    }

    const contactName = event.staffContact && event.staffContact.name ? event.staffContact.name : '';
    const contactPhone = event.staffContact && event.staffContact.phone ? event.staffContact.phone : '';

    // Twilio 21656: no null/empty; sanitize newlines/tabs and >4 spaces
    return {
      "1": this.sanitizeContentVariable(eventTitle),
      "2": this.sanitizeContentVariable(sessionTitleText),
      "3": this.sanitizeContentVariable(timeUntilEvent),
      "4": this.sanitizeContentVariable(dateText),
      "5": this.sanitizeContentVariable(timeText2),
      "6": this.sanitizeContentVariable(locationText),
      "7": this.sanitizeContentVariable(contactName),
      "8": this.sanitizeContentVariable(contactPhone)
    };
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
/**
 * Tests for reminder service template building:
 * - Event template (8-var): createTemplateVariables
 * - Custom template (marketing, 2-var): createReminderMessage used with vars "1"=title, "2"=message
 */
import reminderService from '../reminderService.js';

describe('ReminderService template building', () => {
  const baseEvent = {
    title: 'Test Event',
    location: {
      venue: 'Test Venue',
      district: 'Central and Western',
      meetingLink: null
    },
    staffContact: {
      name: 'Jane Doe',
      phone: '+852 1234 5678'
    },
    sessions: [
      {
        title: 'Morning Session',
        location: { venue: 'Room A', meetingLink: null }
      }
    ]
  };

  const startDateTime = new Date('2025-02-15T14:00:00.000Z'); // 2:00 PM UTC

  describe('createTemplateVariables (event template - 8 variables)', () => {
    it('returns all 8 variables for main event', () => {
      const eventType = 'main event';
      const reminderHours = 1;
      const vars = reminderService.createTemplateVariables(baseEvent, reminderHours, eventType, startDateTime);

      expect(vars).toBeDefined();
      expect(vars['1']).toBe('Test Event');
      expect(vars['2']).toBe(' '); // session title empty for main event (sanitized for Twilio)
      expect(vars['3']).toBe('1 hour');
      expect(vars['4']).toMatch(/February/);
      expect(vars['4']).toMatch(/15/);
      expect(vars['4']).toMatch(/2025/);
      expect(vars['5']).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/);
      expect(vars['6']).toBe('Test Venue, Central and Western');
      expect(vars['7']).toBe('Jane Doe');
      expect(vars['8']).toBe('+852 1234 5678');
    });

    it('returns session title in variable 2 for session reminder', () => {
      const eventType = 'session: Morning Session';
      const reminderHours = 2;
      const vars = reminderService.createTemplateVariables(baseEvent, reminderHours, eventType, startDateTime);

      expect(vars['1']).toBe('Test Event');
      expect(vars['2']).toBe('Morning Session');
      expect(vars['3']).toBe('2 hours');
      expect(vars['6']).toBe('Room A'); // session location
    });

    it('uses days for 24h+ reminder', () => {
      const vars = reminderService.createTemplateVariables(baseEvent, 24, 'main event', startDateTime);
      expect(vars['3']).toBe('1 day');
    });

    it('handles missing staffContact', () => {
      const eventNoStaff = { ...baseEvent, staffContact: undefined };
      const vars = reminderService.createTemplateVariables(eventNoStaff, 1, 'main event', startDateTime);
      expect(vars['7']).toBe(' '); // sanitized for Twilio (no empty string)
      expect(vars['8']).toBe(' ');
    });
  });

  describe('createReminderMessage (custom / marketing template variable 2)', () => {
    it('includes event title and main event details', () => {
      const msg = reminderService.createReminderMessage(baseEvent, 1, 'main event', startDateTime);
      expect(msg).toContain('Test Event');
      expect(msg).toContain('1 hour');
      expect(msg).toContain('Test Venue');
      expect(msg).toContain('Central and Western');
      expect(msg).toContain('Jane Doe');
      expect(msg).toContain('+852 1234 5678');
      expect(msg).toContain('Event Reminder');
    });

    it('includes session title for session reminder', () => {
      const msg = reminderService.createReminderMessage(baseEvent, 1, 'session: Morning Session', startDateTime);
      expect(msg).toContain('Morning Session');
      expect(msg).toContain('session');
    });
  });
});

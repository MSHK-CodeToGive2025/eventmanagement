/**
 * Tests for reminder service template building:
 * - Single session template (8-var: 1, 2, 4..9 with 3 removed)
 * - Multiple session template (9-var: 1..9)
 * - Custom template message: createReminderMessage
 */
import reminderService from '../reminderService.js';

describe('ReminderService template building', () => {
  const singleSessionEvent = {
    title: 'Single Session Event',
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
        title: 'Only Session',
        location: { venue: 'Room A', meetingLink: null }
      }
    ]
  };

  const multipleSessionsEvent = {
    title: 'Multi Session Event',
    location: {
      venue: 'Main Venue',
      district: 'Wan Chai',
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
      },
      {
        title: 'Afternoon Session',
        location: { venue: 'Room B', meetingLink: null }
      }
    ]
  };

  const startDateTime = new Date('2025-02-15T14:00:00.000Z'); // 2:00 PM UTC

  describe('createTemplateVariables (single session - 8 variables, {{3}} omitted)', () => {
    it('returns 8 variables without variable 3 for single session event', () => {
      const eventType = 'session: Only Session';
      const reminderHours = 1;
      const vars = reminderService.createTemplateVariables(singleSessionEvent, reminderHours, eventType, startDateTime, 'Alice');

      expect(vars).toBeDefined();
      expect(vars['1']).toBe('Alice');
      expect(vars['2']).toBe('Single Session Event');
      expect(vars['3']).toBeUndefined(); // {{3}} removed from single session template
      expect(vars['4']).toBe('1 hour');
      expect(vars['5']).toMatch(/February/);
      expect(vars['5']).toMatch(/15/);
      expect(vars['5']).toMatch(/2025/);
      expect(vars['6']).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/);
      expect(vars['7']).toBe('Room A');
      expect(vars['8']).toBe('Jane Doe');
      expect(vars['9']).toBe('+852 1234 5678');
    });

    it('returns single session variables for main event without sessions', () => {
      const eventNoSessions = { ...singleSessionEvent, sessions: [] };
      const vars = reminderService.createTemplateVariables(eventNoSessions, 24, 'main event', startDateTime, 'Bob');

      expect(vars['1']).toBe('Bob');
      expect(vars['2']).toBe('Single Session Event');
      expect(vars['3']).toBeUndefined();
      expect(vars['4']).toBe('1 day');
      expect(vars['7']).toBe('Test Venue, Central and Western');
    });

    it('handles missing staffContact in single session template', () => {
      const eventNoStaff = { ...singleSessionEvent, staffContact: undefined };
      const vars = reminderService.createTemplateVariables(eventNoStaff, 1, 'session: Only Session', startDateTime, 'Charlie');
      expect(vars['3']).toBeUndefined();
      expect(vars['8']).toBe(' '); // sanitized for Twilio
      expect(vars['9']).toBe(' ');
    });
  });

  describe('createTemplateVariables (multiple sessions - 9 variables)', () => {
    it('returns all 9 variables including session title for variable 3', () => {
      const eventType = 'session: Morning Session';
      const reminderHours = 2;
      const vars = reminderService.createTemplateVariables(multipleSessionsEvent, reminderHours, eventType, startDateTime, 'Alice');

      expect(vars).toBeDefined();
      expect(vars['1']).toBe('Alice');
      expect(vars['2']).toBe('Multi Session Event');
      expect(vars['3']).toBe('Morning Session');
      expect(vars['4']).toBe('2 hours');
      expect(vars['5']).toMatch(/February/);
      expect(vars['5']).toMatch(/15/);
      expect(vars['5']).toMatch(/2025/);
      expect(vars['6']).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/);
      expect(vars['7']).toBe('Room A');
      expect(vars['8']).toBe('Jane Doe');
      expect(vars['9']).toBe('+852 1234 5678');
    });
  });

  describe('createReminderMessage (custom / event update message body)', () => {
    it('includes event title and main event details', () => {
      const msg = reminderService.createReminderMessage(singleSessionEvent, 1, 'main event', startDateTime);
      expect(msg).toContain('Single Session Event');
      expect(msg).toContain('1 hour');
      expect(msg).toContain('Test Venue');
      expect(msg).toContain('Central and Western');
      expect(msg).toContain('Jane Doe');
      expect(msg).toContain('+852 1234 5678');
      expect(msg).toContain('Event Reminder');
    });

    it('includes session title for session reminder', () => {
      const msg = reminderService.createReminderMessage(multipleSessionsEvent, 1, 'session: Morning Session', startDateTime);
      expect(msg).toContain('Morning Session');
      expect(msg).toContain('session');
    });
  });
});

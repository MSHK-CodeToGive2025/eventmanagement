import {
  buildEventUpdateTemplateVariables,
  getDefaultSessionLabel,
  sanitizeContentVariable
} from '../whatsappTemplates.js';

describe('whatsappTemplates helpers', () => {
  it('builds the event update utility template variables', () => {
    expect(buildEventUpdateTemplateVariables({
      eventTitle: 'Event Title',
      sessionTitle: 'Session A',
      messageBody: 'Message body',
      contactName: 'Jane Doe',
      contactPhone: '+85212345678'
    })).toEqual({
      '1': 'Event Title',
      '2': 'Session A',
      '3': 'Message body',
      '4': 'Jane Doe',
      '5': '+85212345678'
    });
  });

  it('sanitizes empty values for Twilio content variables', () => {
    expect(sanitizeContentVariable('')).toBe(' ');
    expect(sanitizeContentVariable('Line 1\nLine 2')).toBe('Line 1 Line 2');
  });

  it('returns a sensible default session label', () => {
    expect(getDefaultSessionLabel([])).toBe('Main event');
    expect(getDefaultSessionLabel([{ title: 'Only Session' }])).toBe('Only Session');
    expect(getDefaultSessionLabel([{ title: 'A' }, { title: 'B' }])).toBe('All sessions');
  });
});

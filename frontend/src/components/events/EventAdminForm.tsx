import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import eventService, { authHeader, Event, EventFormData } from '../../services/eventService';
import registrationService, { EventRegistration } from '../../services/registrationService';
import { eventCategories } from '../../types/event-types';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface AdminEventFormData {
  title: string;
  description: string;
  category: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  capacity?: number;
  reminderRemarks: string;
}

const EventAdminForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [formData, setFormData] = useState<AdminEventFormData>({
    title: '',
    description: '',
    category: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    capacity: undefined,
    reminderRemarks: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [whatsappError, setWhatsappError] = useState<string | null>(null);
  const [whatsappSuccess, setWhatsappSuccess] = useState<string | null>(null);
  const [isTemplateMode, setIsTemplateMode] = useState(true);
  const [whatsappMessage, setWhatsappMessage] = useState('');

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        if (id) {
          const eventData = await eventService.getEvent(id);
          setEvent(eventData);

          const firstSession = eventData.sessions?.[0];
          const dateStr = eventData.startDate
            ? eventData.startDate.split('T')[0]
            : (firstSession?.date ? firstSession.date.split('T')[0] : '');
          const startTimeStr = firstSession?.startTime || '';
          const endTimeStr = firstSession?.endTime || '';
          const locationStr = typeof eventData.location === 'string'
            ? eventData.location
            : (eventData.location?.venue || eventData.location?.address || '');

          setFormData({
            title: eventData.title || '',
            description: eventData.description || '',
            date: dateStr,
            startTime: startTimeStr,
            endTime: endTimeStr,
            location: locationStr,
            category: eventData.category || '',
            capacity: eventData.capacity ?? firstSession?.capacity,
            reminderRemarks: eventData.reminderRemarks || '',
          });

          try {
            const regData = await registrationService.getEventRegistrations(id);
            setRegistrations(regData);
          } catch (regErr) {
            console.error('Failed to fetch event registrations', regErr);
          }
        }
      } catch (err) {
        setError('Failed to fetch event details');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: AdminEventFormData) => ({
      ...prev,
      [name]: name === 'capacity' ? (value === '' ? undefined : parseInt(value, 10)) : value
    }));
  };

  const handleWhatsappSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWhatsappError(null);
    setWhatsappSuccess(null);
    setWhatsappLoading(true);

    try {
      if (id) {
        const trimmedMessage = whatsappMessage.trim();
        if (!trimmedMessage) {
          throw new Error('Please enter a message to send.');
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL}/events/${id}/send-whatsapp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeader(),
          },
          body: JSON.stringify({ 
            title: formData.title || event?.title || "", 
            message: trimmedMessage,
            useTemplate: isTemplateMode
          }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to send WhatsApp message');
        }

        const messageType = isTemplateMode ? 'Template' : 'Custom';
        setWhatsappSuccess(`${messageType} message sent successfully to ${data.successful} participants. ${data.failed > 0 ? `${data.failed} failed.` : ''}`);
        
        setWhatsappMessage('');
      }
    } catch (err) {
      setWhatsappError(err instanceof Error ? err.message : 'Failed to send WhatsApp message');
    } finally {
      setWhatsappLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (id && event) {
        const locationObj = {
          venue: formData.location,
          address: formData.location,
          district: event.location?.district || undefined,
          onlineEvent: event.location?.onlineEvent ?? false,
          meetingLink: event.location?.meetingLink || '',
        };

        const startDate = formData.date
          ? new Date(`${formData.date}T${formData.startTime || '00:00'}`).toISOString()
          : (event.startDate || new Date().toISOString());

        const endDate = formData.date
          ? new Date(`${formData.date}T${formData.endTime || '23:59'}`).toISOString()
          : (event.endDate || new Date().toISOString());

        const sessions = event.sessions && event.sessions.length > 0
          ? event.sessions.map((session, index) => {
              if (index === 0) {
                return {
                  ...session,
                  date: formData.date || session.date,
                  startTime: formData.startTime || session.startTime,
                  endTime: formData.endTime || session.endTime,
                  capacity: formData.capacity,
                  location: {
                    venue: formData.location,
                    meetingLink: session.location?.meetingLink
                  }
                };
              }
              return session;
            })
          : [
              {
                title: formData.title || 'Main Session',
                date: formData.date || new Date().toISOString().split('T')[0],
                startTime: formData.startTime || '09:00',
                endTime: formData.endTime || '10:00',
                capacity: formData.capacity,
                location: {
                  venue: formData.location
                }
              }
            ];

        const payload: EventFormData = {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          targetGroup: event.targetGroup || 'Other',
          location: locationObj,
          startDate,
          endDate,
          isPrivate: event.isPrivate ?? false,
          status: event.status || 'Draft',
          registrationFormId: event.registrationFormId || '',
          capacity: formData.capacity,
          sessions,
          reminderRemarks: formData.reminderRemarks,
          defaultReminderMode: 'template',
          tags: event.tags,
          reminderTimes: event.reminderTimes,
          staffContact: event.staffContact,
          participants: event.participants,
        };

        const updated = await eventService.updateEvent(id, payload);
        setEvent(updated);
        setSuccess('Event updated successfully!');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update event');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (!event) {
    return <div className="text-center text-red-500">Event not found</div>;
  }

  const registeredList = registrations.filter((r) => r.status === 'registered');
  const totalRegistered = registeredList.length || event.registeredCount || 0;
  const currentCapacity = formData.capacity ?? event.capacity ?? event.sessions?.[0]?.capacity;
  const availableSpots = currentCapacity !== undefined ? Math.max(0, currentCapacity - totalRegistered) : 'Unlimited';

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Event</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            >
              <option value="">Select a category</option>
              {eventCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="reminderRemarks" className="block text-sm font-medium text-gray-700">
              WhatsApp Reminder Remarks (Optional)
            </label>
            <textarea
              id="reminderRemarks"
              name="reminderRemarks"
              value={formData.reminderRemarks || ''}
              onChange={handleChange}
              rows={3}
              maxLength={500}
              placeholder="e.g., Please bring your HKID card and wear comfortable shoes."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Custom remark to include in the WhatsApp reminder template (Remark: &#123;&#123;10&#125;&#125;).
              If left blank, it defaults to: <em>"No special remarks for this activity. We look forward to seeing you."</em>
            </p>
            <input type="hidden" name="defaultReminderMode" value="template" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Start Time</label>
            <input
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">End Time</label>
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Capacity</label>
            <input
              type="number"
              name="capacity"
              value={formData.capacity ?? ''}
              onChange={handleChange}
              min="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Save Changes
          </button>
        </div>
      </form>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Event Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Registered</h3>
            <p className="text-2xl font-semibold">{totalRegistered}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Waitlist</h3>
            <p className="text-2xl font-semibold">0</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Available Spots</h3>
            <p className="text-2xl font-semibold">{availableSpots}</p>
          </div>
        </div>
      </div>

      {/* Registered Participants Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Registered Participants</h2>
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {registeredList.map((participant: EventRegistration) => (
              <li key={participant._id} className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {participant.attendee.firstName} {participant.attendee.lastName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {participant.attendee.email || 'No email provided'}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <p className={`text-sm font-medium ${
                      !participant.attendee.phone 
                        ? 'text-gray-500' 
                        : 'text-green-600'
                    }`}>
                      {participant.attendee.phone || 'No phone number'}
                    </p>
                  </div>
                </div>
              </li>
            ))}
            {registeredList.length === 0 && (
              <li className="px-4 py-4 text-center text-gray-500">
                No registered participants yet
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* WhatsApp Message Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Send WhatsApp Message</h2>
        <form onSubmit={handleWhatsappSubmit} className="space-y-4">
          {whatsappError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {whatsappError}
            </div>
          )}
          
          {whatsappSuccess && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {whatsappSuccess}
            </div>
          )}

          {/* Template Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-base font-medium">Use WhatsApp Template</Label>
              <p className="text-sm text-gray-500">
                {isTemplateMode 
                  ? "Send using pre-approved template (cheaper, compliant)" 
                  : "Send custom message (more expensive, flexible)"
                }
              </p>
            </div>
            <Switch
              checked={isTemplateMode}
              onCheckedChange={setIsTemplateMode}
              disabled={whatsappLoading}
            />
          </div>

          {isTemplateMode && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Using Twilio WhatsApp Template</h3>
              <p className="text-sm text-blue-700 mb-2">
                Messages will be sent using the pre-approved WhatsApp event update template.
              </p>
              <p className="text-sm text-blue-600">
                The message below will be included as the update message body (Variable 4).
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Message Content</label>
            <textarea
              value={whatsappMessage}
              onChange={(e) => setWhatsappMessage(e.target.value)}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Enter your update message here (e.g., Please note the meeting point has moved to Room 204)..."
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              {isTemplateMode
                ? "This text will be inserted into the WhatsApp template as the message body."
                : "This custom message will be sent to all registered participants with phone numbers."}
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={whatsappLoading || !whatsappMessage.trim()}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {whatsappLoading ? 'Sending...' : `Send ${isTemplateMode ? 'Template' : 'Custom'} Message`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventAdminForm; 
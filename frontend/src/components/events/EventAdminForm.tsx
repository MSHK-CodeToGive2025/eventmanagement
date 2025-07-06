import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import eventService, { authHeader } from '../../services/eventService';
import { Event, EventFormData } from '../../services/eventService';

const EventAdminForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    category: '',
    capacity: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [whatsappError, setWhatsappError] = useState<string | null>(null);
  const [whatsappSuccess, setWhatsappSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        if (id) {
          const eventData = await eventService.getEvent(id);
          setEvent(eventData);
          setFormData({
            title: eventData.title,
            description: eventData.description,
            date: eventData.date.split('T')[0],
            startTime: eventData.startTime,
            endTime: eventData.endTime,
            location: eventData.location,
            category: eventData.category,
            capacity: eventData.capacity,
          });
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
    setFormData((prev: EventFormData) => ({
      ...prev,
      [name]: name === 'capacity' ? parseInt(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      if (id) {
        await eventService.updateEvent(id, formData);
        setSuccess('Event updated successfully');
        // Refresh event data
        const updatedEvent = await eventService.getEvent(id);
        setEvent(updatedEvent);
      }
    } catch (err) {
      setError('Failed to update event');
    }
  };

  const handleWhatsappSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWhatsappError(null);
    setWhatsappSuccess(null);
    setWhatsappLoading(true);

    try {
      if (id) {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/events/${id}/send-whatsapp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeader(),
          },
          body: JSON.stringify({ message: whatsappMessage }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to send WhatsApp message');
        }

        setWhatsappSuccess(`Message sent successfully to ${data.successful} participants. ${data.failed > 0 ? `${data.failed} failed.` : ''}`);
        setWhatsappMessage('');
      }
    } catch (err) {
      setWhatsappError(err instanceof Error ? err.message : 'Failed to send WhatsApp message');
    } finally {
      setWhatsappLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (!event) {
    return <div className="text-center text-red-500">Event not found</div>;
  }

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
              <option value="workshop">Workshop</option>
              <option value="seminar">Seminar</option>
              <option value="conference">Conference</option>
              <option value="social">Social</option>
            </select>
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
              value={formData.capacity}
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
            <p className="text-2xl font-semibold">{event.registeredParticipants.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Waitlist</h3>
            <p className="text-2xl font-semibold">{event.waitlist.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Available Spots</h3>
            <p className="text-2xl font-semibold">{event.availableSpots}</p>
          </div>
        </div>
      </div>

      {/* Registered Participants Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Registered Participants</h2>
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {event.registeredParticipants.map((participant) => (
              <li key={typeof participant === 'string' ? participant : participant._id} className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {typeof participant === 'string' ? 'Loading...' : participant.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {typeof participant === 'string' ? 'Loading...' : participant.email}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <p className={`text-sm font-medium ${
                      typeof participant === 'string' || !participant.phoneNumber 
                        ? 'text-gray-500' 
                        : 'text-green-600'
                    }`}>
                      {typeof participant === 'string' || !participant.phoneNumber 
                        ? 'No phone number' 
                        : participant.phoneNumber}
                    </p>
                  </div>
                </div>
              </li>
            ))}
            {event.registeredParticipants.length === 0 && (
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

          <div>
            <label className="block text-sm font-medium text-gray-700">Message</label>
            <textarea
              value={whatsappMessage}
              onChange={(e) => setWhatsappMessage(e.target.value)}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Enter your message here..."
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              This message will be sent to all registered participants with phone numbers.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={whatsappLoading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {whatsappLoading ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventAdminForm; 
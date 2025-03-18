import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import eventService from '../services/eventService';

const EventList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const data = await eventService.getAllEvents();
      setEvents(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch events');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (eventId) => {
    try {
      await eventService.registerForEvent(eventId);
      fetchEvents(); // Refresh the events list
    } catch (err) {
      setError('Failed to register for event');
      console.error('Error registering for event:', err);
    }
  };

  const handleUnregister = async (eventId) => {
    try {
      await eventService.unregisterFromEvent(eventId);
      fetchEvents(); // Refresh the events list
    } catch (err) {
      setError('Failed to unregister from event');
      console.error('Error unregistering from event:', err);
    }
  };

  if (loading) return <div>Loading events...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <div
          key={event._id}
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
            <p className="text-gray-600 mb-4">{event.description}</p>
            <div className="mb-4">
              <p className="text-sm text-gray-500">
                <span className="font-medium">Date:</span>{' '}
                {new Date(event.date).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-500">
                <span className="font-medium">Time:</span> {event.startTime} -{' '}
                {event.endTime}
              </p>
              <p className="text-sm text-gray-500">
                <span className="font-medium">Location:</span> {event.location}
              </p>
              <p className="text-sm text-gray-500">
                <span className="font-medium">Available Spots:</span>{' '}
                {event.availableSpots}
              </p>
            </div>
            <div className="flex justify-between items-center">
              <Link
                to={`/events/${event._id}`}
                className="text-indigo-600 hover:text-indigo-800"
              >
                View Details
              </Link>
              {user && (
                <div>
                  {event.registeredParticipants.includes(user.id) ? (
                    <button
                      onClick={() => handleUnregister(event._id)}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                      Unregister
                    </button>
                  ) : event.waitlist.includes(user.id) ? (
                    <button
                      onClick={() => handleUnregister(event._id)}
                      className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
                    >
                      Leave Waitlist
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRegister(event._id)}
                      className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                      disabled={event.isFull}
                    >
                      {event.isFull ? 'Join Waitlist' : 'Register'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EventList; 
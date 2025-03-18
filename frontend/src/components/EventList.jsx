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
      const data = await eventService.getEvents();
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
      fetchEvents();
    } catch (err) {
      setError('Failed to register for event');
      console.error('Error registering for event:', err);
    }
  };

  const handleUnregister = async (eventId) => {
    try {
      await eventService.unregisterFromEvent(eventId);
      fetchEvents();
    } catch (err) {
      setError('Failed to unregister from event');
      console.error('Error unregistering from event:', err);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="text-zubin-accent">Loading events...</div>
    </div>
  );

  if (error) return (
    <div className="flex justify-center items-center h-64">
      <div className="text-red-600">{error}</div>
    </div>
  );

  return (
    <div className="container mx-auto py-12 px-4">
      {/* Header Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-heading font-bold text-zubin-text mb-4">
          Upcoming Events
        </h1>
        <p className="text-zubin-gray max-w-2xl mx-auto">
          Join our events designed to support and empower Hong Kong's ethnic minorities through education, career development, and community building.
        </p>
      </div>

      {/* Events Grid */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <div
            key={event._id}
            className="bg-white rounded-lg shadow-lg overflow-hidden transform transition duration-300 hover:shadow-xl hover:-translate-y-1"
          >
            <div className="p-6">
              <div className="mb-4">
                <span className="inline-block px-3 py-1 text-xs font-semibold text-zubin-text bg-zubin-secondary rounded-full">
                  {event.category}
                </span>
              </div>
              <h3 className="text-xl font-bold text-zubin-text mb-3">{event.title}</h3>
              <p className="text-zubin-gray mb-4 line-clamp-2">{event.description}</p>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center text-sm text-zubin-gray">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  {new Date(event.date).toLocaleDateString()}
                </div>
                <div className="flex items-center text-sm text-zubin-gray">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  {event.startTime} - {event.endTime}
                </div>
                <div className="flex items-center text-sm text-zubin-gray">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  {event.location}
                </div>
                <div className="flex items-center text-sm text-zubin-gray">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  {event.capacity - (event.registeredParticipants?.length || 0)} spots available
                </div>
              </div>

              <div className="flex justify-between items-center">
                <Link
                  to={`/events/${event._id}`}
                  className="text-zubin-accent hover:text-zubin-text font-medium text-sm transition-colors"
                >
                  View Details →
                </Link>
                {user && (
                  <div>
                    {event.registeredParticipants?.includes(user.id) ? (
                      <button
                        onClick={() => handleUnregister(event._id)}
                        className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-opacity-90 transition-colors"
                      >
                        Unregister
                      </button>
                    ) : event.waitlist?.includes(user.id) ? (
                      <button
                        onClick={() => handleUnregister(event._id)}
                        className="bg-zubin-accent text-zubin-text px-4 py-2 rounded-full text-sm font-medium hover:bg-zubin-primary transition-colors"
                      >
                        Leave Waitlist
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRegister(event._id)}
                        className="bg-zubin-primary text-zubin-text px-4 py-2 rounded-full text-sm font-medium hover:bg-zubin-accent transition-colors"
                        disabled={event.registeredParticipants?.length >= event.capacity}
                      >
                        {event.registeredParticipants?.length >= event.capacity ? 'Join Waitlist' : 'Register'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventList; 
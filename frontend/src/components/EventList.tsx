import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import eventService from '../services/eventService';

interface Participant {
  _id: string;
}

interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  category: string;
  capacity: number;
  image?: string;
  registeredParticipants: Array<Participant | string>;
  waitlist: Array<Participant | string>;
}

const EventList: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
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

  const handleRegister = async (eventId: string) => {
    try {
      await eventService.registerForEvent(eventId);
      fetchEvents();
    } catch (err) {
      setError('Failed to register for event');
      console.error('Error registering for event:', err);
    }
  };

  const handleUnregister = async (eventId: string) => {
    try {
      await eventService.unregisterFromEvent(eventId);
      fetchEvents();
    } catch (err) {
      setError('Failed to unregister from event');
      console.error('Error unregistering from event:', err);
    }
  };

  const isUserRegistered = (event: Event) => {
    return event.registeredParticipants.some(p => 
      typeof p === 'string' ? p === user?.id : p._id === user?.id
    );
  };

  const isUserWaitlisted = (event: Event) => {
    return event.waitlist.some(p => 
      typeof p === 'string' ? p === user?.id : p._id === user?.id
    );
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
            <div className="aspect-w-16 aspect-h-9">
              <img
                src={event.image ? `/api/events/${event._id}/image` : '/Events.webp'}
                alt={event.title}
                className="w-full h-48 object-cover"
              />
            </div>
            
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 text-sm font-medium bg-zubin-secondary text-zubin-text rounded-full">
                  {event.category}
                </span>
                <span className="text-sm text-zubin-gray">
                  {new Date(event.date).toLocaleDateString()}
                </span>
              </div>

              <h3 className="text-xl font-bold text-zubin-text mb-2">
                {event.title}
              </h3>
              <p className="text-zubin-gray mb-4 line-clamp-2">
                {event.description}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-zubin-gray">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 100-12 6 6 0 000 12zm1-6a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                  </svg>
                  {event.location}
                </div>
                <div className="flex items-center text-sm text-zubin-gray">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  {event.capacity - event.registeredParticipants.length} spots available
                </div>
              </div>

              <div className="flex justify-between items-center">
                <Link
                  to={`/events/${event._id}`}
                  className="text-zubin-accent hover:text-zubin-text font-medium text-sm transition-colors"
                >
                  View Details →
                </Link>
                {user ? (
                  <div>
                    {isUserRegistered(event) ? (
                      <button
                        onClick={() => handleUnregister(event._id)}
                        className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-opacity-90 transition-colors"
                      >
                        Unregister
                      </button>
                    ) : isUserWaitlisted(event) ? (
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
                        disabled={event.registeredParticipants.length >= event.capacity}
                      >
                        {event.registeredParticipants.length >= event.capacity ? 'Join Waitlist' : 'Register'}
                      </button>
                    )}
                  </div>
                ) : (
                  <span className="text-zubin-gray text-sm italic">
                    Login to register for events
                  </span>
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
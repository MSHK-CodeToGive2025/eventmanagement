import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import eventService from '../services/eventService';

const EventDetail = () => {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const data = await eventService.getEvent(id);
      setEvent(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch event details');
      console.error('Error fetching event:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      await eventService.registerForEvent(id);
      fetchEvent();
    } catch (err) {
      setError('Failed to register for event');
      console.error('Error registering for event:', err);
    }
  };

  const handleUnregister = async () => {
    try {
      await eventService.unregisterFromEvent(id);
      fetchEvent();
    } catch (err) {
      setError('Failed to unregister from event');
      console.error('Error unregistering from event:', err);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await eventService.deleteEvent(id);
        navigate('/events');
      } catch (err) {
        setError('Failed to delete event');
        console.error('Error deleting event:', err);
      }
    }
  };

  if (loading) return <div>Loading event details...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!event) return <div>Event not found</div>;

  const isOrganizer = user && (user.role === 'admin' || event.organizer.id === user.id);
  const isRegistered = user && event.registeredParticipants.some(p => p.id === user.id);
  const isWaitlisted = user && event.waitlist.some(p => p.id === user.id);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-8">
          <h2 className="text-3xl font-bold mb-4">{event.title}</h2>
          <p className="text-gray-600 mb-6">{event.description}</p>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-lg font-semibold mb-2">Event Details</h3>
              <p className="text-gray-600">
                <span className="font-medium">Date:</span>{' '}
                {new Date(event.date).toLocaleDateString()}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Time:</span> {event.startTime} - {event.endTime}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Location:</span> {event.location}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Category:</span> {event.category}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Registration</h3>
              <p className="text-gray-600">
                <span className="font-medium">Capacity:</span> {event.capacity}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Available Spots:</span>{' '}
                {event.availableSpots}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Waitlist:</span> {event.waitlist.length} people
              </p>
            </div>
          </div>

          {user && (
            <div className="flex justify-between items-center">
              <div>
                {isRegistered ? (
                  <button
                    onClick={handleUnregister}
                    className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
                  >
                    Unregister
                  </button>
                ) : isWaitlisted ? (
                  <button
                    onClick={handleUnregister}
                    className="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700"
                  >
                    Leave Waitlist
                  </button>
                ) : (
                  <button
                    onClick={handleRegister}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
                    disabled={event.isFull && !event.waitlist}
                  >
                    {event.isFull ? 'Join Waitlist' : 'Register'}
                  </button>
                )}
              </div>

              {isOrganizer && (
                <div className="space-x-4">
                  <button
                    onClick={() => navigate(`/events/${id}/edit`)}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                  >
                    Edit Event
                  </button>
                  <button
                    onClick={handleDelete}
                    className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
                  >
                    Delete Event
                  </button>
                </div>
              )}
            </div>
          )}

          {event.registeredParticipants.length > 0 && isOrganizer && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Registered Participants</h3>
              <div className="grid grid-cols-2 gap-4">
                {event.registeredParticipants.map((participant) => (
                  <div
                    key={participant.id}
                    className="p-3 bg-gray-50 rounded-lg"
                  >
                    <p className="font-medium">{participant.name}</p>
                    <p className="text-sm text-gray-600">{participant.email}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetail; 
import React from 'react';
import EventForm from '../components/EventForm';
import eventService from '../services/eventService';

interface EventData {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  capacity: number;
  category: string;
  registrationDeadline: string;
  status: 'draft' | 'published' | 'cancelled';
}

const CreateEvent: React.FC = () => {
  const handleCreateEvent = async (eventData: EventData) => {
    try {
      return await eventService.createEvent(eventData);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create event');
    }
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-heading font-bold text-zubin-text mb-4">
            Create New Event
          </h1>
          <p className="text-zubin-gray max-w-2xl mx-auto">
            Create an event to support and empower Hong Kong's ethnic minorities. All events should align with our mission of reducing suffering and providing opportunities.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-8">
          <EventForm onSubmit={handleCreateEvent} />
        </div>
      </div>
    </div>
  );
};

export default CreateEvent; 
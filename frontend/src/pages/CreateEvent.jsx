import React from 'react';
import EventForm from '../components/EventForm';
import eventService from '../services/eventService';

const CreateEvent = () => {
  const handleCreateEvent = async (eventData) => {
    try {
      return await eventService.createEvent(eventData);
    } catch (error) {
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
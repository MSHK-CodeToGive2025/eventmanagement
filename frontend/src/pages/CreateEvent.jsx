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
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Event</h1>
          <p className="mt-2 text-sm text-gray-600">
            Fill in the details below to create a new event for the Zubin Foundation
          </p>
        </div>
        
        <EventForm onSubmit={handleCreateEvent} />
      </div>
    </div>
  );
};

export default CreateEvent; 
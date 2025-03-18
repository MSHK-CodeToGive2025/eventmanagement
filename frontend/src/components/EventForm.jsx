import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const EventForm = ({ onSubmit, initialData = {}, isEditing = false }) => {
  const [formData, setFormData] = useState({
    title: initialData.title || '',
    description: initialData.description || '',
    date: initialData.date || '',
    startTime: initialData.startTime || '',
    endTime: initialData.endTime || '',
    location: initialData.location || '',
    capacity: initialData.capacity || '',
    category: initialData.category || 'educational',
    status: initialData.status || 'upcoming'
  });

  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const eventData = {
        ...formData,
        date: new Date(formData.date).toISOString(),
      };
      await onSubmit(eventData);
      navigate('/events');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    }
  };

  const inputClasses = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-zubin-accent focus:ring focus:ring-zubin-primary focus:ring-opacity-50";
  const labelClasses = "block text-sm font-medium text-zubin-text";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="title" className={labelClasses}>
          Event Title *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          required
          value={formData.title}
          onChange={handleChange}
          className={inputClasses}
          placeholder="Enter event title"
        />
      </div>

      <div>
        <label htmlFor="description" className={labelClasses}>
          Description *
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={4}
          value={formData.description}
          onChange={handleChange}
          className={inputClasses}
          placeholder="Describe the event and its objectives"
        />
      </div>

      <div>
        <label htmlFor="date" className={labelClasses}>
          Date *
        </label>
        <input
          type="date"
          id="date"
          name="date"
          required
          value={formData.date}
          onChange={handleChange}
          className={inputClasses}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="startTime" className={labelClasses}>
            Start Time *
          </label>
          <input
            type="time"
            id="startTime"
            name="startTime"
            required
            value={formData.startTime}
            onChange={handleChange}
            className={inputClasses}
          />
        </div>

        <div>
          <label htmlFor="endTime" className={labelClasses}>
            End Time *
          </label>
          <input
            type="time"
            id="endTime"
            name="endTime"
            required
            value={formData.endTime}
            onChange={handleChange}
            className={inputClasses}
          />
        </div>
      </div>

      <div>
        <label htmlFor="location" className={labelClasses}>
          Location *
        </label>
        <input
          type="text"
          id="location"
          name="location"
          required
          value={formData.location}
          onChange={handleChange}
          className={inputClasses}
          placeholder="Enter event location"
        />
      </div>

      <div>
        <label htmlFor="capacity" className={labelClasses}>
          Capacity *
        </label>
        <input
          type="number"
          id="capacity"
          name="capacity"
          required
          min="1"
          value={formData.capacity}
          onChange={handleChange}
          className={inputClasses}
          placeholder="Enter maximum number of participants"
        />
      </div>

      <div>
        <label htmlFor="category" className={labelClasses}>
          Category *
        </label>
        <select
          id="category"
          name="category"
          required
          value={formData.category}
          onChange={handleChange}
          className={inputClasses}
        >
          <option value="educational">Educational Workshop</option>
          <option value="career">Career Development</option>
          <option value="support">Support Session</option>
        </select>
      </div>

      <div className="flex justify-end space-x-4 pt-6">
        <button
          type="button"
          onClick={() => navigate('/events')}
          className="px-6 py-2 border border-gray-300 text-zubin-gray rounded-full text-sm font-medium hover:bg-zubin-secondary transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-zubin-primary text-zubin-text rounded-full text-sm font-medium hover:bg-zubin-accent transition-colors"
        >
          {isEditing ? 'Update Event' : 'Create Event'}
        </button>
      </div>
    </form>
  );
};

export default EventForm; 
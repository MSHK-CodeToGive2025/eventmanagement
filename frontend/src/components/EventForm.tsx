import React, { useState, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

interface EventFormData {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  capacity: string | number;
  category: 'educational' | 'cultural' | 'social' | 'other';
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  imageUrl?: string;
}

interface EventFormProps {
  onSubmit: (formData: FormData) => Promise<void>;
  initialData?: Partial<EventFormData>;
  isEditing?: boolean;
}

const EventForm: React.FC<EventFormProps> = ({ onSubmit, initialData = {}, isEditing = false }) => {
  const [formData, setFormData] = useState<EventFormData>({
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

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData.imageUrl || null);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image size should be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        const value = formData[key as keyof EventFormData];
        if (key === 'date' && value) {
          formDataToSend.append(key, new Date(value as string).toISOString());
        } else if (value !== undefined) {
          formDataToSend.append(key, String(value));
        }
      });

      if (selectedImage) {
        formDataToSend.append('image', selectedImage);
      }

      await onSubmit(formDataToSend);
      navigate('/events');
    } catch (err: any) {
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
        <label htmlFor="image" className={labelClasses}>
          Event Image
        </label>
        <div className="mt-2 flex items-center space-x-4">
          <input
            type="file"
            id="image"
            name="image"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
          <label
            htmlFor="image"
            className="px-4 py-2 bg-zubin-primary text-zubin-text rounded-md cursor-pointer hover:bg-zubin-accent transition-colors"
          >
            {isEditing ? 'Change Image' : 'Upload Image'}
          </label>
          {imagePreview && (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="h-20 w-20 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => {
                  setSelectedImage(null);
                  setImagePreview(null);
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

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
          <option value="educational">Educational</option>
          <option value="cultural">Cultural</option>
          <option value="social">Social</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-zubin-primary hover:bg-zubin-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zubin-primary"
        >
          {isEditing ? 'Update Event' : 'Create Event'}
        </button>
      </div>
    </form>
  );
};

export default EventForm; 
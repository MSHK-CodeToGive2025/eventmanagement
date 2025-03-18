import axios from 'axios';
import authService from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthConfig = () => ({
  headers: { Authorization: `Bearer ${authService.getToken()}` }
});

const eventService = {
  // Get all events
  async getAllEvents() {
    const response = await axios.get(`${API_URL}/events`);
    return response.data;
  },

  // Get single event
  async getEvent(id) {
    const response = await axios.get(`${API_URL}/events/${id}`);
    return response.data;
  },

  // Create event
  async createEvent(eventData) {
    const response = await axios.post(
      `${API_URL}/events`,
      eventData,
      getAuthConfig()
    );
    return response.data;
  },

  // Update event
  async updateEvent(id, eventData) {
    const response = await axios.put(
      `${API_URL}/events/${id}`,
      eventData,
      getAuthConfig()
    );
    return response.data;
  },

  // Delete event
  async deleteEvent(id) {
    const response = await axios.delete(
      `${API_URL}/events/${id}`,
      getAuthConfig()
    );
    return response.data;
  },

  // Register for event
  async registerForEvent(id) {
    const response = await axios.post(
      `${API_URL}/events/${id}/register`,
      {},
      getAuthConfig()
    );
    return response.data;
  },

  // Unregister from event
  async unregisterFromEvent(id) {
    const response = await axios.post(
      `${API_URL}/events/${id}/unregister`,
      {},
      getAuthConfig()
    );
    return response.data;
  }
};

export default eventService; 
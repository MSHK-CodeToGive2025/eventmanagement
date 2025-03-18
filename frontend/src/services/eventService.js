import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';

// Add auth token to requests
const authHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const eventService = {
  // Get all events
  async getEvents() {
    const response = await axios.get(`${API_URL}/events`, {
      headers: authHeader(),
    });
    return response.data;
  },

  // Get single event
  async getEvent(id) {
    const response = await axios.get(`${API_URL}/events/${id}`, {
      headers: authHeader(),
    });
    return response.data;
  },

  // Create event
  async createEvent(eventData) {
    const response = await axios.post(`${API_URL}/events`, eventData, {
      headers: {
        ...authHeader(),
        ...(eventData instanceof FormData ? {} : { 'Content-Type': 'application/json' })
      },
    });
    return response.data;
  },

  // Update event
  async updateEvent(id, eventData) {
    const response = await axios.put(`${API_URL}/events/${id}`, eventData, {
      headers: {
        ...authHeader(),
        ...(eventData instanceof FormData ? {} : { 'Content-Type': 'application/json' })
      },
    });
    return response.data;
  },

  // Delete event
  async deleteEvent(id) {
    const response = await axios.delete(`${API_URL}/events/${id}`, {
      headers: authHeader(),
    });
    return response.data;
  },

  // Register for event
  async registerForEvent(id) {
    const response = await axios.post(`${API_URL}/events/${id}/register`, {}, {
      headers: authHeader(),
    });
    return response.data;
  },

  // Unregister from event
  async unregisterFromEvent(id) {
    const response = await axios.delete(`${API_URL}/events/${id}/unregister`, {
      headers: authHeader(),
    });
    return response.data;
  }
};

export default eventService; 
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Debug logging
//console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
//console.log('Final API_URL:', API_URL);

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export interface User {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

// Helper function to get user's full name
export const getUserName = (user: User): string => {
  return `${user.firstName} ${user.lastName}`;
};

class AuthService {
  private static instance: AuthService;
  private token: string | null = null;

  private constructor() {
    // Initialize token from localStorage
    this.token = localStorage.getItem('token');
    if (this.token) {
      this.setAuthHeader(this.token);
    }
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private setAuthHeader(token: string) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  private clearAuthHeader() {
    delete axios.defaults.headers.common['Authorization'];
  }

  public async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, credentials);
      const { token, user } = response.data;
      
      // Store token
      this.token = token;
      localStorage.setItem('token', token);
      this.setAuthHeader(token);
      
      return { token, user };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  }

  public async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      const { token, user } = response.data;
      
      // Store token
      this.token = token;
      localStorage.setItem('token', token);
      this.setAuthHeader(token);
      
      return { token, user };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  }

  public async getCurrentUser(): Promise<User> {
    try {
      const response = await axios.get(`${API_URL}/auth/me`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get user info');
    }
  }

  public logout(): void {
    this.token = null;
    localStorage.removeItem('token');
    this.clearAuthHeader();
  }

  public getToken(): string | null {
    return this.token;
  }

  public isAuthenticated(): boolean {
    return !!this.token;
  }

  public async refreshToken(): Promise<void> {
    try {
      const response = await axios.post(`${API_URL}/auth/refresh`);
      const { token } = response.data;
      
      this.token = token;
      localStorage.setItem('token', token);
      this.setAuthHeader(token);
    } catch (error) {
      this.logout();
      throw error;
    }
  }
}

export default AuthService; 
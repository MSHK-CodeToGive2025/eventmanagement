import axios from 'axios';
import type { User, UserRole } from "@/types/user-types"
import { type CreateUserData, type UpdateUserData, type UserFilterCriteria, type UserSortCriteria, type UserPaginationParams } from "@/types/user-types"

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Interface for user form data when creating/updating users
 * Note: This is a simplified version of the User interface
 * used specifically for form submissions
 */
interface UserFormData {
  username: string
  email: string
  role: UserRole
  name: string
  phone?: string
}

/**
 * Helper function to simulate API delay
 * @param ms - Milliseconds to delay
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export class UserServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public status?: number
  ) {
    super(message)
    this.name = "UserServiceError"
  }
}

export class UserService {
  private static instance: UserService

  private constructor() {}

  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService()
    }
    return UserService.instance
  }

  private async makeRequest<T>(config: any): Promise<T> {
    try {
      const response = await axios(config);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new UserServiceError(
          error.response.data?.message || 'Request failed',
          error.response.status.toString(),
          error.response.status
        );
      }
      throw new UserServiceError(
        'Network error',
        'NETWORK_ERROR',
        500
      );
    }
  }

  private transformBackendUser(backendUser: any): User {
    return {
      _id: backendUser._id,
      username: backendUser.username,
      password: '', // Backend doesn't return password
      phoneNumber: backendUser.mobile || backendUser.phoneNumber || '',
      email: backendUser.email,
      role: backendUser.role,
      firstName: backendUser.firstName,
      lastName: backendUser.lastName,
      createdAt: new Date(backendUser.createdAt),
      updatedAt: new Date(backendUser.updatedAt),
      lastLogin: backendUser.lastLogin ? new Date(backendUser.lastLogin) : undefined,
      isActive: backendUser.isActive
    };
  }

  async createUser(data: CreateUserData): Promise<User> {
    // Transform frontend data to backend format
    const backendData = {
      username: data.username,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      mobile: data.mobile,
      email: data.email,
      role: data.role
    };
    
    const backendUser = await this.makeRequest<any>({
      method: 'POST',
      url: `${API_URL}/users`,
      data: backendData
    });
    return this.transformBackendUser(backendUser);
  }

  async updateUser(id: string, data: UpdateUserData): Promise<User> {
    // Transform frontend data to backend format
    const backendData: any = {};
    if (data.firstName !== undefined) backendData.firstName = data.firstName;
    if (data.lastName !== undefined) backendData.lastName = data.lastName;
    if (data.email !== undefined) backendData.email = data.email;
    if (data.mobile !== undefined) backendData.mobile = data.mobile;
    if (data.role !== undefined) backendData.role = data.role;
    if (data.isActive !== undefined) backendData.isActive = data.isActive;
    
    const backendUser = await this.makeRequest<any>({
      method: 'PUT',
      url: `${API_URL}/users/${id}`,
      data: backendData
    });
    return this.transformBackendUser(backendUser);
  }

  async deleteUser(id: string): Promise<void> {
    await this.makeRequest<{ message: string }>({
      method: 'DELETE',
      url: `${API_URL}/users/${id}`
    });
  }

  async changeUserPassword(id: string, newPassword: string): Promise<void> {
    await this.makeRequest<{ message: string }>({
      method: 'PATCH',
      url: `${API_URL}/users/${id}/password`,
      data: { newPassword }
    });
  }

  async resetUserPassword(id: string): Promise<{ temporaryPassword: string; user: any }> {
    const response = await this.makeRequest<{ temporaryPassword: string; user: any }>({
      method: 'POST',
      url: `${API_URL}/users/${id}/reset-password`
    });
    return response;
  }

  async getUserById(id: string): Promise<User> {
    const backendUser = await this.makeRequest<any>({
      method: 'GET',
      url: `${API_URL}/users/${id}`
    });
    return this.transformBackendUser(backendUser);
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const backendUsers = await this.makeRequest<any[]>({
        method: 'GET',
        url: `${API_URL}/users`
      });
      
      // Debug logging
      console.log('getAllUsers response:', backendUsers);
      console.log('Response type:', typeof backendUsers);
      console.log('Is array:', Array.isArray(backendUsers));
      
      // Ensure we have an array
      if (!Array.isArray(backendUsers)) {
        console.error('getAllUsers: Response is not an array:', backendUsers);
        return [];
      }
      
      return backendUsers.map(user => this.transformBackendUser(user));
    } catch (error) {
      console.error('getAllUsers error:', error);
      return [];
    }
  }

  async searchUsers(
    criteria: UserFilterCriteria,
    sort?: UserSortCriteria,
    pagination?: UserPaginationParams
  ): Promise<{ users: User[]; total: number }> {
    // For now, get all users and filter client-side
    // In a real implementation, you'd pass these parameters to the backend
    const allUsers = await this.getAllUsers();
    
    let filteredUsers = [...allUsers];

    // Apply filters
    if (criteria.role) {
      filteredUsers = filteredUsers.filter(user => user.role === criteria.role);
    }
    if (criteria.isActive !== undefined) {
      filteredUsers = filteredUsers.filter(user => user.isActive === criteria.isActive);
    }
    if (criteria.phone) {
      filteredUsers = filteredUsers.filter(user => user.phoneNumber.includes(criteria.phone!));
    }
    if (criteria.searchQuery) {
      const query = criteria.searchQuery.toLowerCase();
      filteredUsers = filteredUsers.filter(user =>
        user.username.toLowerCase().includes(query) ||
        user.firstName.toLowerCase().includes(query) ||
        user.lastName.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.phoneNumber.includes(query)
      );
    }

    // Apply sorting
    if (sort) {
      filteredUsers.sort((a, b) => {
        const aValue = a[sort.field] as string | number | Date;
        const bValue = b[sort.field] as string | number | Date;
        
        // Handle undefined values
        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined) return sort.direction === "asc" ? 1 : -1;
        if (bValue === undefined) return sort.direction === "asc" ? -1 : 1;
        
        // Compare values
        if (sort.direction === "asc") {
          return aValue > bValue ? 1 : -1;
        }
        return aValue < bValue ? 1 : -1;
      });
    }

    const total = filteredUsers.length;

    // Apply pagination
    if (pagination) {
      const start = (pagination.page - 1) * pagination.itemsPerPage;
      filteredUsers = filteredUsers.slice(start, start + pagination.itemsPerPage);
    }

    return { users: filteredUsers, total };
  }
}

// Legacy functions for backward compatibility
export async function getUsers(): Promise<User[]> {
  const userService = UserService.getInstance();
  return userService.getAllUsers();
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const userService = UserService.getInstance();
    return await userService.getUserById(id);
  } catch (error) {
    if (error instanceof UserServiceError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function searchUsers(
  query: string,
  searchFields: string[] = ["username", "mobile", "email"],
): Promise<User[]> {
  const userService = UserService.getInstance();
  const result = await userService.searchUsers({ searchQuery: query });
  return result.users;
}

export async function filterUsers(filters: {
  role?: UserRole
  status?: boolean
  phone?: string
}): Promise<User[]> {
  const userService = UserService.getInstance();
  const criteria: UserFilterCriteria = {};
  
  if (filters.role) criteria.role = filters.role;
  if (filters.status !== undefined) criteria.isActive = filters.status;
  if (filters.phone) criteria.phone = filters.phone;
  
  const result = await userService.searchUsers(criteria);
  return result.users;
}

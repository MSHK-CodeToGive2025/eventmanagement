import { mockUsers } from "@/types/mock-enhanced-event-data"
import type { User, UserRole } from "@/types/user-types"
import { type CreateUserData, type UpdateUserData, type UserFilterCriteria, type UserSortCriteria, type UserPaginationParams } from "@/types/user-types"

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

/**
 * Fetches all users from the API
 * @returns Promise resolving to an array of users
 */
export async function getUsers(): Promise<User[]> {
  await delay(500) // Simulate API delay
  return [...mockUsers]
}

/**
 * Fetches a single user by their ID
 * @param id - The user's ID to fetch
 * @returns Promise resolving to the user or null if not found
 */
export async function getUserById(id: string): Promise<User | null> {
  await delay(300)
  const user = mockUsers.find((u) => u._id === id)
  return user || null
}

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
  private users: User[] = [...mockUsers]

  private constructor() {}

  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService()
    }
    return UserService.instance
  }

  private validateUserData(data: Partial<User>): void {
    if (data.username && data.username.length < 3) {
      throw new UserServiceError(
        "Username must be at least 3 characters",
        "INVALID_USERNAME"
      )
    }
    if (data.mobile && data.mobile.length < 8) {
      throw new UserServiceError(
        "Mobile number must be at least 8 digits",
        "INVALID_MOBILE"
      )
    }
    if (data.email && !data.email.includes("@")) {
      throw new UserServiceError(
        "Invalid email address",
        "INVALID_EMAIL"
      )
    }
  }

  async createUser(data: CreateUserData): Promise<User> {
    try {
      this.validateUserData(data)

      // Check if username already exists
      if (this.users.some(user => user.username === data.username)) {
        throw new UserServiceError(
          "Username already exists",
          "USERNAME_EXISTS",
          409
        )
      }

      const newUser: User = {
        _id: Math.random().toString(36).substr(2, 9),
        ...data,
        passwordHash: "hashed_" + data.password, // In real app, use proper hashing
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      this.users.push(newUser)
      return newUser
    } catch (error) {
      if (error instanceof UserServiceError) {
        throw error
      }
      throw new UserServiceError(
        "Failed to create user",
        "CREATE_ERROR",
        500
      )
    }
  }

  async updateUser(id: string, data: UpdateUserData): Promise<User> {
    try {
      this.validateUserData(data)

      const userIndex = this.users.findIndex(user => user._id === id)
      if (userIndex === -1) {
        throw new UserServiceError(
          "User not found",
          "USER_NOT_FOUND",
          404
        )
      }

      // Check username uniqueness if being updated
      if (data.username && data.username !== this.users[userIndex].username) {
        if (this.users.some(user => user.username === data.username)) {
          throw new UserServiceError(
            "Username already exists",
            "USERNAME_EXISTS",
            409
          )
        }
      }

      const updatedUser = {
        ...this.users[userIndex],
        ...data,
        updatedAt: new Date(),
      }

      if (data.password) {
        updatedUser.passwordHash = "hashed_" + data.password // In real app, use proper hashing
      }

      this.users[userIndex] = updatedUser
      return updatedUser
    } catch (error) {
      if (error instanceof UserServiceError) {
        throw error
      }
      throw new UserServiceError(
        "Failed to update user",
        "UPDATE_ERROR",
        500
      )
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      const userIndex = this.users.findIndex(user => user._id === id)
      if (userIndex === -1) {
        throw new UserServiceError(
          "User not found",
          "USER_NOT_FOUND",
          404
        )
      }

      this.users.splice(userIndex, 1)
    } catch (error) {
      if (error instanceof UserServiceError) {
        throw error
      }
      throw new UserServiceError(
        "Failed to delete user",
        "DELETE_ERROR",
        500
      )
    }
  }

  async getUserById(id: string): Promise<User> {
    try {
      const user = this.users.find(user => user._id === id)
      if (!user) {
        throw new UserServiceError(
          "User not found",
          "USER_NOT_FOUND",
          404
        )
      }
      return user
    } catch (error) {
      if (error instanceof UserServiceError) {
        throw error
      }
      throw new UserServiceError(
        "Failed to get user",
        "GET_ERROR",
        500
      )
    }
  }

  async searchUsers(
    criteria: UserFilterCriteria,
    sort?: UserSortCriteria,
    pagination?: UserPaginationParams
  ): Promise<{ users: User[]; total: number }> {
    try {
      let filteredUsers = [...this.users]

      // Apply filters
      if (criteria.role) {
        filteredUsers = filteredUsers.filter(user => user.role === criteria.role)
      }
      if (criteria.isActive !== undefined) {
        filteredUsers = filteredUsers.filter(user => user.isActive === criteria.isActive)
      }
      if (criteria.phone) {
        filteredUsers = filteredUsers.filter(user => user.mobile.includes(criteria.phone!))
      }
      if (criteria.searchQuery) {
        const query = criteria.searchQuery.toLowerCase()
        filteredUsers = filteredUsers.filter(user =>
          user.username.toLowerCase().includes(query) ||
          user.firstName.toLowerCase().includes(query) ||
          user.lastName.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query) ||
          user.mobile.includes(query)
        )
      }

      // Apply sorting
      if (sort) {
        filteredUsers.sort((a, b) => {
          const aValue = a[sort.field] as string | number | Date
          const bValue = b[sort.field] as string | number | Date
          
          // Handle undefined values
          if (aValue === undefined && bValue === undefined) return 0
          if (aValue === undefined) return sort.direction === "asc" ? 1 : -1
          if (bValue === undefined) return sort.direction === "asc" ? -1 : 1
          
          // Compare values
          if (sort.direction === "asc") {
            return aValue > bValue ? 1 : -1
          }
          return aValue < bValue ? 1 : -1
        })
      }

      // Apply pagination
      const total = filteredUsers.length
      if (pagination) {
        const start = (pagination.page - 1) * pagination.itemsPerPage
        filteredUsers = filteredUsers.slice(start, start + pagination.itemsPerPage)
      }

      return { users: filteredUsers, total }
    } catch (error) {
      if (error instanceof UserServiceError) {
        throw error
      }
      throw new UserServiceError(
        "Failed to search users",
        "SEARCH_ERROR",
        500
      )
    }
  }
}

/**
 * Searches for users based on a query string
 * @param query - The search query
 * @param searchFields - Optional array of fields to search in
 * @returns Promise resolving to array of matching users
 */
export async function searchUsers(
  query: string,
  searchFields: string[] = ["username", "mobile", "email"],
): Promise<User[]> {
  await delay(400)
  const lowercaseQuery = query.toLowerCase()

  return mockUsers.filter((user) => {
    return searchFields.some((field) => {
      const fieldValue = user[field as keyof User]
      return fieldValue && typeof fieldValue === "string" && fieldValue.toLowerCase().includes(lowercaseQuery)
    })
  })
}

/**
 * Filters users based on various criteria
 * @param filters - Object containing filter criteria
 * @param filters.role - Filter by user role
 * @param filters.status - Filter by active status
 * @param filters.phone - Filter by phone number
 * @returns Promise resolving to array of filtered users
 */
export async function filterUsers(filters: {
  role?: UserRole
  status?: boolean
  phone?: string
}): Promise<User[]> {
  await delay(400)

  return mockUsers.filter((user) => {
    if (filters.role && user.role !== filters.role) {
      return false
    }
    if (filters.status !== undefined && user.isActive !== filters.status) {
      return false
    }
    if (filters.phone && !user.mobile.includes(filters.phone)) {
      return false
    }
    return true
  })
}

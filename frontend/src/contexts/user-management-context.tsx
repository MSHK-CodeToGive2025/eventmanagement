import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { User, UserRole, type CreateUserData, type UpdateUserData } from "@/types/user-types"
import { UserService } from "@/services/user-service"
import { useToast } from "@/hooks/use-toast"

/**
 * Interface defining the shape of the User Management Context
 * This context provides all the necessary functions and state for managing users
 */
interface UserManagementContextType {
  /** List of all users */
  users: User[]
  /** Loading state indicator */
  loading: boolean
  /** Error message if any */
  error: string | null
  /** Currently selected user for detailed view/editing */
  selectedUser: User | null
  /** Function to fetch all users */
  fetchUsers: () => Promise<void>
  /** Function to fetch a specific user by ID */
  fetchUserById: (id: string) => Promise<User | null>
  /** Function to create a new user */
  addUser: (userData: CreateUserData) => Promise<User | null>
  /** Function to update an existing user */
  editUser: (id: string, userData: UpdateUserData) => Promise<User | null>
  /** Function to delete a user */
  removeUser: (id: string) => Promise<boolean>
  /** Function to search users by query string */
  searchForUsers: (query: string) => Promise<void>
  /** Function to filter users by role, status, and phone */
  filterUsersList: (filters: { role?: UserRole; status?: boolean; phone?: string }) => Promise<void>
  /** Function to set the currently selected user */
  setSelectedUser: (user: User | null) => void
  /** Function to change a user's password */
  changeUserPassword: (userId: string, newPassword: string) => Promise<boolean>
  /** Function to reset a user's password */
  resetUserPassword: (userId: string) => Promise<{ success: boolean; tempPassword?: string; user?: any }>
}

const UserManagementContext = createContext<UserManagementContextType | undefined>(undefined)

/**
 * Provider component for User Management functionality
 * This component manages the state and provides methods for user management operations
 */
export function UserManagementProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const { toast } = useToast()
  const userService = UserService.getInstance()

  /**
   * Fetches all users from the API
   */
  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await userService.searchUsers({})
      setUsers(result.users)
    } catch (err) {
      setError("Failed to fetch users")
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      })
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Fetches a specific user by ID
   */
  const fetchUserById = async (id: string): Promise<User | null> => {
    try {
      setLoading(true)
      setError(null)
      const user = await userService.getUserById(id)
      if (user) {
        setSelectedUser(user)
      }
      return user
    } catch (err) {
      setError("Failed to fetch user")
      toast({
        title: "Error",
        description: "Failed to fetch user details",
        variant: "destructive",
      })
      console.error(err)
      return null
    } finally {
      setLoading(false)
    }
  }

  /**
   * Creates a new user
   */
  const addUser = async (userData: CreateUserData): Promise<User | null> => {
    try {
      setLoading(true)
      setError(null)
      const newUser = await userService.createUser(userData)
      setUsers((prevUsers) => [...prevUsers, newUser])
      toast({
        title: "Success",
        description: "User created successfully",
      })
      return newUser
    } catch (err: any) {
      setError(err.message || "Failed to create user")
      toast({
        title: "Error",
        description: err.message || "Failed to create user",
        variant: "destructive",
      })
      console.error(err)
      return null
    } finally {
      setLoading(false)
    }
  }

  /**
   * Updates an existing user
   */
  const editUser = async (id: string, userData: UpdateUserData): Promise<User | null> => {
    try {
      setLoading(true)
      setError(null)
      const updatedUser = await userService.updateUser(id, userData)
      setUsers((prevUsers) => prevUsers.map((user) => (user._id === id ? updatedUser : user)))
      if (selectedUser && selectedUser._id === id) {
        setSelectedUser(updatedUser)
      }
      toast({
        title: "Success",
        description: "User updated successfully",
      })
      return updatedUser
    } catch (err: any) {
      setError(err.message || "Failed to update user")
      toast({
        title: "Error",
        description: err.message || "Failed to update user",
        variant: "destructive",
      })
      console.error(err)
      return null
    } finally {
      setLoading(false)
    }
  }

  /**
   * Deletes a user
   */
  const removeUser = async (id: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      await userService.deleteUser(id)
      setUsers((prevUsers) => prevUsers.filter((user) => user._id !== id))
      if (selectedUser && selectedUser._id === id) {
        setSelectedUser(null)
      }
      toast({
        title: "Success",
        description: "User deleted successfully",
      })
      return true
    } catch (err: any) {
      setError(err.message || "Failed to delete user")
      toast({
        title: "Error",
        description: err.message || "Failed to delete user",
        variant: "destructive",
      })
      console.error(err)
      return false
    } finally {
      setLoading(false)
    }
  }

  /**
   * Searches users based on a query string
   */
  const searchForUsers = async (query: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      const result = await userService.searchUsers({ searchQuery: query })
      setUsers(result.users)
    } catch (err) {
      setError("Failed to search users")
      toast({
        title: "Error",
        description: "Failed to search users",
        variant: "destructive",
      })
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Filters users based on role, status, and phone
   */
  const filterUsersList = async (filters: {
    role?: UserRole
    status?: boolean
    phone?: string
  }): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      const result = await userService.searchUsers({
        role: filters.role,
        isActive: filters.status,
        phone: filters.phone
      })
      setUsers(result.users)
    } catch (err) {
      setError("Failed to filter users")
      toast({
        title: "Error",
        description: "Failed to filter users",
        variant: "destructive",
      })
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Changes a user's password
   */
  const changeUserPassword = async (userId: string, newPassword: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      await userService.changeUserPassword(userId, newPassword)

      toast({
        title: "Success",
        description: "Password changed successfully",
      })
      return true
    } catch (err: any) {
      setError(err.message || "Failed to change password")
      toast({
        title: "Error",
        description: err.message || "Failed to change password",
        variant: "destructive",
      })
      console.error(err)
      return false
    } finally {
      setLoading(false)
    }
  }

  /**
   * Resets a user's password with a temporary password
   */
  const resetUserPassword = async (userId: string) => {
    try {
      setLoading(true)
      setError(null)

      const result = await userService.resetUserPassword(userId)
      return { success: true, tempPassword: result.temporaryPassword, user: result.user }
    } catch (error: any) {
      setError(error.message || "Failed to reset password")
      console.error("Error resetting password:", error)
      return { success: false }
    } finally {
      setLoading(false)
    }
  }

  // Load users on initial mount
  useEffect(() => {
    fetchUsers()
  }, [])

  return (
    <UserManagementContext.Provider
      value={{
        users,
        loading,
        error,
        selectedUser,
        fetchUsers,
        fetchUserById,
        addUser,
        editUser,
        removeUser,
        searchForUsers,
        filterUsersList,
        setSelectedUser,
        changeUserPassword,
        resetUserPassword,
      }}
    >
      {children}
    </UserManagementContext.Provider>
  )
}

/**
 * Custom hook to use the User Management context
 * @throws Error if used outside of UserManagementProvider
 */
export function useUserManagement() {
  const context = useContext(UserManagementContext)
  if (context === undefined) {
    throw new Error("useUserManagement must be used within a UserManagementProvider")
  }
  return context
}

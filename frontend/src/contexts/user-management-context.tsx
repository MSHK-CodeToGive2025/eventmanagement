import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { User, UserFormData, UserRole, UserStatus } from "@/types/user-types"
import { getUsers, getUserById, createUser, updateUser, deleteUser, searchUsers, filterUsers } from "@/services/user-service"
import { useToast } from "@/hooks/use-toast"

interface UserManagementContextType {
  users: User[]
  loading: boolean
  error: string | null
  selectedUser: User | null
  fetchUsers: () => Promise<void>
  fetchUserById: (id: string) => Promise<User | null>
  addUser: (userData: UserFormData) => Promise<User | null>
  editUser: (id: string, userData: Partial<UserFormData>) => Promise<User | null>
  removeUser: (id: string) => Promise<boolean>
  searchForUsers: (query: string) => Promise<void>
  filterUsersList: (filters: { role?: UserRole; status?: UserStatus; department?: string }) => Promise<void>
  setSelectedUser: (user: User | null) => void
  changeUserPassword: (userId: string, newPassword: string) => Promise<boolean>
}

const UserManagementContext = createContext<UserManagementContextType | undefined>(undefined)

export function UserManagementProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const { toast } = useToast()

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const fetchedUsers = await getUsers()
      setUsers(fetchedUsers)
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

  const fetchUserById = async (id: string): Promise<User | null> => {
    try {
      setLoading(true)
      setError(null)
      const user = await getUserById(id)
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

  const addUser = async (userData: UserFormData): Promise<User | null> => {
    try {
      setLoading(true)
      setError(null)
      const newUser = await createUser(userData)
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

  const editUser = async (id: string, userData: Partial<UserFormData>): Promise<User | null> => {
    try {
      setLoading(true)
      setError(null)
      const updatedUser = await updateUser(id, userData)
      setUsers((prevUsers) => prevUsers.map((user) => (user.id === id ? updatedUser : user)))
      if (selectedUser && selectedUser.id === id) {
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

  const removeUser = async (id: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      await deleteUser(id)
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== id))
      if (selectedUser && selectedUser.id === id) {
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

  const searchForUsers = async (query: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      const results = await searchUsers(query)
      setUsers(results)
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

  const filterUsersList = async (filters: {
    role?: UserRole
    status?: UserStatus
    department?: string
  }): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      const results = await filterUsers(filters)
      setUsers(results)
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

  const changeUserPassword = async (userId: string, newPassword: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      // In a real app, this would call an API to change the password
      // For this demo, we'll just simulate a successful password change
      await new Promise((resolve) => setTimeout(resolve, 1000))

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
      }}
    >
      {children}
    </UserManagementContext.Provider>
  )
}

export function useUserManagement() {
  const context = useContext(UserManagementContext)
  if (context === undefined) {
    throw new Error("useUserManagement must be used within a UserManagementProvider")
  }
  return context
}

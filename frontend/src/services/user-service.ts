import type { User, UserFormData, UserRole, UserStatus } from "@/types/user-types"

// Mock users data
const mockUsers: User[] = [
  {
    id: "1",
    name: "John Doe",
    username: "johndoe",
    email: "john@example.com",
    role: "admin",
    status: "active",
    department: "IT",
    phone: "+1 (555) 123-4567",
    createdAt: new Date("2023-01-15").toISOString(),
    lastLogin: new Date("2023-05-10").toISOString(),
  },
  {
    id: "2",
    name: "Jane Smith",
    username: "janesmith",
    email: "jane@example.com",
    role: "staff",
    status: "active",
    department: "HR",
    phone: "+1 (555) 987-6543",
    createdAt: new Date("2023-02-20").toISOString(),
    lastLogin: new Date("2023-05-08").toISOString(),
  },
  {
    id: "3",
    name: "Bob Johnson",
    username: "bobjohnson",
    email: "bob@example.com",
    role: "participant",
    status: "inactive",
    department: "",
    phone: "+1 (555) 456-7890",
    createdAt: new Date("2023-03-10").toISOString(),
    lastLogin: new Date("2023-04-15").toISOString(),
  },
  {
    id: "4",
    name: "Alice Brown",
    username: "alicebrown",
    email: "alice@example.com",
    role: "staff",
    status: "active",
    department: "Marketing",
    phone: "+1 (555) 234-5678",
    createdAt: new Date("2023-01-05").toISOString(),
    lastLogin: new Date("2023-05-12").toISOString(),
  },
  {
    id: "5",
    name: "Charlie Wilson",
    username: "charliewilson",
    email: "charlie@example.com",
    role: "participant",
    status: "active",
    department: "",
    phone: "+1 (555) 876-5432",
    createdAt: new Date("2023-04-01").toISOString(),
    lastLogin: new Date("2023-05-01").toISOString(),
  },
]

// Helper function to simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Get all users
export async function getUsers(): Promise<User[]> {
  await delay(500) // Simulate API delay
  return [...mockUsers]
}

// Get user by ID
export async function getUserById(id: string): Promise<User | null> {
  await delay(300)
  const user = mockUsers.find((u) => u.id === id)
  return user || null
}

// Create a new user
export async function createUser(userData: UserFormData): Promise<User> {
  await delay(800)
  const newUser: User = {
    id: `${mockUsers.length + 1}`,
    name: userData.name,
    username: userData.username || userData.name.toLowerCase().replace(/\s+/g, ""),
    email: userData.email,
    role: userData.role,
    status: userData.status || "active",
    department: userData.department || "",
    phone: userData.phone || "",
    createdAt: new Date().toISOString(),
    lastLogin: "",
  }

  // In a real app, this would add to a database
  // For this demo, we'll just return the new user
  return newUser
}

// Update an existing user
export async function updateUser(id: string, userData: Partial<UserFormData>): Promise<User> {
  await delay(600)
  const userIndex = mockUsers.findIndex((u) => u.id === id)

  if (userIndex === -1) {
    throw new Error("User not found")
  }

  const updatedUser = {
    ...mockUsers[userIndex],
    ...userData,
  }

  // In a real app, this would update the database
  // For this demo, we'll just return the updated user
  return updatedUser
}

// Delete a user
export async function deleteUser(id: string): Promise<void> {
  await delay(500)
  const userIndex = mockUsers.findIndex((u) => u.id === id)

  if (userIndex === -1) {
    throw new Error("User not found")
  }

  // In a real app, this would delete from the database
  // For this demo, we'll just simulate success
}

// Search users
export async function searchUsers(
  query: string,
  searchFields: string[] = ["name", "email", "department"],
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

// Filter users
export async function filterUsers(filters: {
  role?: UserRole
  status?: UserStatus
  department?: string
}): Promise<User[]> {
  await delay(400)

  return mockUsers.filter((user) => {
    if (filters.role && user.role !== filters.role) {
      return false
    }
    if (filters.status && user.status !== filters.status) {
      return false
    }
    if (filters.department && user.department !== filters.department) {
      return false
    }
    return true
  })
}

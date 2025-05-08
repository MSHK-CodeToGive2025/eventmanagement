import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { User, UserRole } from "@/types/user-types"

interface AuthContextType {
  user: User | null
  userRole: UserRole
  isAuthenticated: boolean
  login: (user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<UserRole>("unregistered")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initializeAuth = () => {
      const storedUser = localStorage.getItem("user")
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser)
          setUser(parsedUser)
          setUserRole(parsedUser.role)
          setIsAuthenticated(true)
        } catch (error) {
          console.error("Failed to parse stored user:", error)
          setUser(null)
          setUserRole("unregistered")
          setIsAuthenticated(false)
        }
      } else {
        setUser(null)
        setUserRole("unregistered")
        setIsAuthenticated(false)
      }
      setIsLoading(false)
    }

    initializeAuth()

    // Listen for storage events (in case user logs in/out in another tab)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "user") {
        if (event.newValue) {
          try {
            const parsedUser = JSON.parse(event.newValue)
            setUser(parsedUser)
            setUserRole(parsedUser.role)
            setIsAuthenticated(true)
          } catch (error) {
            console.error("Failed to parse stored user:", error)
            setUser(null)
            setUserRole("unregistered")
            setIsAuthenticated(false)
          }
        } else {
          setUser(null)
          setUserRole("unregistered")
          setIsAuthenticated(false)
        }
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  const login = (newUser: User) => {
    localStorage.setItem("user", JSON.stringify(newUser))
    setUser(newUser)
    setUserRole(newUser.role)
    setIsAuthenticated(true)
  }

  const logout = () => {
    localStorage.removeItem("user")
    setUser(null)
    setUserRole("unregistered")
    setIsAuthenticated(false)
  }

  // Don't render children until we've initialized auth state
  if (isLoading) {
    return null
  }

  return React.createElement(
    AuthContext.Provider,
    { value: { user, userRole, isAuthenticated, login, logout } },
    children
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

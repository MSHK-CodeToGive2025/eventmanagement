import type React from "react"

import { useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"

interface RouteGuardProps {
  children: React.ReactNode
  requiredRoles?: string[]
}

export default function RouteGuard({ children, requiredRoles }: RouteGuardProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated } = useAuth()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    // Check if the user is authenticated and has the required role
    const checkAuth = () => {
      // If no specific roles are required, just check if authenticated
      if (!requiredRoles || requiredRoles.length === 0) {
        return isAuthenticated
      }

      // Check if the user has any of the required roles
      return isAuthenticated && user?.role && requiredRoles.includes(user.role)
    }

    if (!checkAuth()) {
      // Not authorized, redirect to login
      navigate("/sign-in")
      setAuthorized(false)
    } else {
      setAuthorized(true)
    }
  }, [location.pathname, requiredRoles, navigate, isAuthenticated, user])

  return authorized ? <>{children}</> : null
}

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
  const { user, isAuthenticated, loading } = useAuth()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    if (loading) {
      return
    }

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
      navigate("/sign-in", { state: { from: location }, replace: true })
      setAuthorized(false)
    } else {
      setAuthorized(true)
    }
  }, [location.pathname, requiredRoles, navigate, isAuthenticated, user, loading])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    )
  }

  return authorized ? <>{children}</> : null
}

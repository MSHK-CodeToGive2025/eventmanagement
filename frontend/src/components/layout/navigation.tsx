import { useState, useEffect } from "react"
import { useLocation, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Calendar,
  BarChart3,
  CalendarDays,
  ArrowRight,
  Users,
  PenTool,
  Layers,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { UserMenu } from "@/components/user-profile/user-menu"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { useAuth } from "@/contexts/auth-context"

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isManagementOpen, setIsManagementOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const location = useLocation()
  const { isAuthenticated, user, logout } = useAuth()

  // Check if user has management access
  const hasManagementAccess = user?.role === 'admin' || user?.role === 'staff'

  // Track scroll position to add shadow when scrolled
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    // Add scroll event listener
    window.addEventListener("scroll", handleScroll)

    // Check initial scroll position
    handleScroll()

    // Clean up event listener
    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const toggleManagement = () => {
    setIsManagementOpen(!isManagementOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`)
  }

  const isManagementActive = () => {
    return (
      isActive("/manage/events-builder") ||
      isActive("/manage/forms") ||
      isActive("/manage/users")
    )
  }

  return (
    <header
      className={cn(
        "bg-white border-b border-gray-200 sticky top-0 z-50 w-full transition-shadow duration-200",
        isScrolled ? "shadow-md" : "",
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center" onClick={closeMenu}>
              <Calendar className="h-6 w-6 text-yellow-500 mr-2" aria-hidden="true" />
              <span className="text-xl font-bold text-yellow-500">Zubin</span>
              <span className="text-xl font-bold ml-1">Events</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            {/* Prominent Events Button - Now positioned first and with enhanced styling */}
            <Link
              to="/enhanced-events"
              className={cn(
                "flex items-center px-4 py-2 rounded-full font-medium transition-all duration-300",
                "hover:bg-yellow-100 hover:scale-105 hover:shadow-md",
                isActive("/events")
                  ? "bg-yellow-100 text-yellow-700 border border-yellow-300 shadow-sm"
                  : "bg-yellow-50 text-yellow-600 border border-yellow-200",
              )}
            >
              <CalendarDays className="h-5 w-5 mr-1.5" />
              <span className="font-semibold">Events</span>
              <ArrowRight
                className={cn(
                  "ml-1 h-4 w-4 transition-transform duration-300",
                  isActive("/events") ? "translate-x-1" : "",
                )}
              />
            </Link>

            {isAuthenticated && hasManagementAccess && (
              <div className="relative">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        "flex items-center px-4 py-2 rounded-full font-medium transition-all duration-300",
                        "hover:bg-yellow-100 hover:scale-105 hover:shadow-md",
                        isManagementActive()
                          ? "bg-yellow-100 text-yellow-700 border border-yellow-300 shadow-sm"
                          : "bg-yellow-50 text-yellow-600 border border-yellow-200",
                      )}
                    >
                      <BarChart3 className="h-5 w-5 mr-1.5" />
                      <span className="font-semibold">Management</span>
                      <ChevronDown
                        className={cn(
                          "ml-1 h-4 w-4 transition-transform duration-300",
                          isManagementActive() ? "rotate-180" : "",
                        )}
                      />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="z-50 p-2 bg-white border border-yellow-100 shadow-lg rounded-lg min-w-[200px]"
                  >
                    <DropdownMenuItem asChild>
                      <Link
                        to="/manage/events-builder"
                        className={cn(
                          "w-full cursor-pointer flex items-center p-2 rounded-md transition-colors",
                          isActive("/manage/events-builder")
                            ? "bg-yellow-50 text-yellow-700 font-medium"
                            : "text-gray-700 hover:bg-yellow-50 hover:text-yellow-600",
                        )}
                      >
                        <Layers className="h-4 w-4 mr-2" />
                        Events Builder
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        to="/manage/forms"
                        className={cn(
                          "w-full cursor-pointer flex items-center p-2 rounded-md transition-colors",
                          isActive("/manage/forms")
                            ? "bg-yellow-50 text-yellow-700 font-medium"
                            : "text-gray-700 hover:bg-yellow-50 hover:text-yellow-600",
                        )}
                      >
                        <PenTool className="h-4 w-4 mr-2" />
                        Forms Builder
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        to="/manage/users"
                        className={cn(
                          "w-full cursor-pointer flex items-center p-2 rounded-md transition-colors",
                          isActive("/manage/users")
                            ? "bg-yellow-50 text-yellow-700 font-medium"
                            : "text-gray-700 hover:bg-yellow-50 hover:text-yellow-600",
                        )}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Users
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </nav>

          <div className="hidden md:flex items-center space-x-2">
            {/*
            <LanguageSelector />
            */}
            {!isAuthenticated ? (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/sign-in">Sign In</Link>
                </Button>
                <Button size="sm" className="bg-yellow-400 hover:bg-yellow-500 text-black" asChild>
                  <Link to="/sign-up">Sign Up</Link>
                </Button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                {/*
                <NotificationBell />
                */}
                <UserMenu />
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Mobile Events Quick Access Button */}
            <Button
              variant="ghost"
              size="sm"
              className={cn("p-1.5 mr-1", isActive("/events") ? "bg-yellow-100 text-yellow-700" : "text-gray-600")}
              asChild
            >
              <Link to="/events">
                <CalendarDays className="h-5 w-5" />
              </Link>
            </Button>

            {isAuthenticated && (
              <>
                <NotificationBell />
                <UserMenu />
              </>
            )}
            <button onClick={toggleMenu}>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="container mx-auto px-4 py-4 space-y-3">
            {/* Enhanced Mobile Events Link */}
            <Link
              to="/events"
              className={cn(
                "flex items-center justify-between py-3 px-4 rounded-lg text-base font-medium transition-all",
                isActive("/events")
                  ? "bg-yellow-50 text-yellow-600 border border-yellow-200"
                  : "bg-gray-50 text-gray-700 hover:bg-yellow-50 hover:text-yellow-600",
              )}
              onClick={closeMenu}
            >
              <div className="flex items-center">
                <CalendarDays className="h-5 w-5 mr-2" />
                <span>Browse All Events</span>
              </div>
              <ArrowRight className="h-4 w-4" />
            </Link>

            {isAuthenticated && hasManagementAccess && (
              <>
                <button
                  onClick={toggleManagement}
                  className={cn(
                    "flex items-center justify-between py-3 px-4 rounded-lg text-base font-medium transition-all w-full",
                    isManagementActive()
                      ? "bg-yellow-50 text-yellow-600 border border-yellow-200"
                      : "bg-gray-50 text-gray-700 hover:bg-yellow-50 hover:text-yellow-600",
                  )}
                >
                  <div className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    <span>Management</span>
                  </div>
                  {isManagementOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>

                {isManagementOpen && (
                  <div className="mt-2 space-y-2">
                    <Link
                      to="/manage/events-builder"
                      className={cn(
                        "flex items-center py-2 px-4 rounded-md text-base font-medium transition-all",
                        isActive("/manage/events-builder")
                          ? "bg-yellow-50 text-yellow-700 border-l-4 border-yellow-400 pl-3"
                          : "text-gray-600 hover:bg-gray-50 hover:text-yellow-600 pl-4",
                      )}
                      onClick={closeMenu}
                    >
                      <Layers className="h-5 w-5 mr-2" />
                      Events Builder
                    </Link>
                    <Link
                      to="/manage/forms"
                      className={cn(
                        "flex items-center py-2 px-4 rounded-md text-base font-medium transition-all",
                        isActive("/manage/forms")
                          ? "bg-yellow-50 text-yellow-700 border-l-4 border-yellow-400 pl-3"
                          : "text-gray-600 hover:bg-gray-50 hover:text-yellow-600 pl-4",
                      )}
                      onClick={closeMenu}
                    >
                      <PenTool className="h-5 w-5 mr-2" />
                      Forms Builder
                    </Link>
                    <Link
                      to="/manage/users"
                      className={cn(
                        "flex items-center py-2 px-4 rounded-md text-base font-medium transition-all",
                        isActive("/manage/users")
                          ? "bg-yellow-50 text-yellow-700 border-l-4 border-yellow-400 pl-3"
                          : "text-gray-600 hover:bg-gray-50 hover:text-yellow-600 pl-4",
                      )}
                      onClick={closeMenu}
                    >
                      <Users className="h-5 w-5 mr-2" />
                      Users
                    </Link>
                    {/*
                    <Link
                      to="/manage/analytics"
                      className={cn(
                        "flex items-center py-2 px-4 rounded-md text-base font-medium transition-all",
                        isActive("/manage/analytics")
                          ? "bg-yellow-50 text-yellow-700 border-l-4 border-yellow-400 pl-3"
                          : "text-gray-600 hover:bg-gray-50 hover:text-yellow-600 pl-4",
                      )}
                      onClick={closeMenu}
                    >
                      <BarChart3 className="h-5 w-5 mr-2" />
                      Analytics
                    </Link>
                    */}
                  </div>
                )}
              </>
            )}

            <div className="pt-4 border-t border-gray-200">
              {/*
              <div className="flex items-center mb-4">
                <LanguageSelector className="mr-2" />
                <span className="text-sm text-gray-500">Select Language</span>
              </div>
              */}
              {!isAuthenticated && (
                <div className="flex flex-col space-y-2">
                  <Button variant="outline" asChild onClick={closeMenu}>
                    <Link to="/sign-in">Sign In</Link>
                  </Button>
                  <Button className="bg-yellow-400 hover:bg-yellow-500 text-black" asChild onClick={closeMenu}>
                    <Link to="/sign-up">Sign Up</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default Navigation
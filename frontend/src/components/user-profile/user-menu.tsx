import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Settings, LogOut, UserCircle, Calendar, FileText, Bell, HelpCircle } from "lucide-react"
import { Avatar } from "@/components/user-profile/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"

export function UserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = () => {
    logout()
    setOpen(false)
    navigate("/")
  }

  // Get display name based on identifier
  const getDisplayName = () => {
    if (!user) return "User"

    if (user.username === "admin") return "admin"
    if (user.username === "staff") return "staff"
    if (user.username === "nelson") return "nelson"

    return user.name || user.username || "User"
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center space-x-2 focus:outline-none">
          <Avatar user={user} size="sm" />
          <span className="hidden sm:inline text-sm font-medium text-gray-700">{getDisplayName()}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center gap-2 p-2">
          <Avatar user={user} size="sm" />
          <div className="flex flex-col">
            <span className="font-medium text-sm">{getDisplayName()}</span>
            <span className="text-xs text-gray-500">{user?.email}</span>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link to="/profile" className="cursor-pointer flex items-center">
              <UserCircle className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/profile/events" className="cursor-pointer flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              <span>My Events</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/profile/registrations" className="cursor-pointer flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              <span>My Registrations</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/profile/notifications" className="cursor-pointer flex items-center">
              <Bell className="mr-2 h-4 w-4" />
              <span>Notification Settings</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/settings" className="cursor-pointer flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/help" className="cursor-pointer flex items-center">
            <HelpCircle className="mr-2 h-4 w-4" />
            <span>Help & Support</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

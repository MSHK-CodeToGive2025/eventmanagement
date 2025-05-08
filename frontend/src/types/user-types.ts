export type UserRole = "admin" | "staff" | "participant" | "unregistered"

export type UserStatus = "active" | "inactive" | "pending" | "suspended"

export interface User {
  id: string
  name: string
  username?: string
  email: string
  role: UserRole
  status: UserStatus
  lastLogin: string
  createdAt: string
  permissions?: string[]
  profileImage?: string
  phone?: string
  department?: string
}

export interface UserFormData {
  name: string
  username?: string
  email: string
  role: UserRole
  status: UserStatus
  phone?: string
  department?: string
  permissions?: string[]
}

export const defaultPermissions = {
  admin: ["manage_users", "manage_events", "manage_forms", "manage_templates", "view_analytics", "manage_settings"],
  staff: ["manage_events", "manage_forms", "manage_templates", "view_analytics"],
  participant: ["register_events", "submit_forms", "view_own_data"],
}

export const allPermissions = [
  { id: "manage_users", label: "Manage Users" },
  { id: "manage_events", label: "Manage Events" },
  { id: "manage_forms", label: "Manage Forms" },
  { id: "manage_templates", label: "Manage Templates" },
  { id: "view_analytics", label: "View Analytics" },
  { id: "manage_settings", label: "Manage Settings" },
  { id: "register_events", label: "Register for Events" },
  { id: "submit_forms", label: "Submit Forms" },
  { id: "view_own_data", label: "View Own Data" },
]

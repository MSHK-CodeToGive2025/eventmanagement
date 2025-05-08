import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Eye, Edit, Trash2, MoreHorizontal, UserPlus, Key, Search } from "lucide-react"
import { UserStatus, UserRole, User } from "@/types/user-types"

interface UserListProps {
  users: User[]
  onSearch: (query: string, searchFields?: string[]) => Promise<void>
  onFilter: (filters: { role?: UserRole; status?: UserStatus; department?: string }) => Promise<void>
  onView: (user: User) => void
  onEdit: (user: User) => void
  onDelete: (user: User) => void
  onAddNew: () => void
  onChangePassword: (user: User) => void
  currentPage?: number
  itemsPerPage?: number
  onPageChange?: (page: number) => void
  onItemsPerPageChange?: (count: number) => void
  sortField?: string
  sortDirection?: "asc" | "desc"
  onSort?: (field: string) => void
}

export function UserList({
  users,
  onSearch,
  onFilter,
  onView,
  onEdit,
  onDelete,
  onAddNew,
  onChangePassword,
  currentPage = 1,
  itemsPerPage = 10,
  onPageChange,
  onItemsPerPageChange,
  sortField = "username",
  sortDirection = "asc",
  onSort,
}: UserListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("")
  const [statusFilter, setStatusFilter] = useState<UserStatus | "">("")
  const [searchFields, setSearchFields] = useState<string[]>(["username", "phone", "email"])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(searchQuery, searchFields)
  }

  const handleRoleFilterChange = (value: string) => {
    const role = value as UserRole | ""
    setRoleFilter(role)
    onFilter({ role: role || undefined, status: statusFilter || undefined })
  }

  const handleStatusFilterChange = (value: string) => {
    const status = value as UserStatus | ""
    setStatusFilter(status)
    onFilter({ role: roleFilter || undefined, status: status || undefined })
  }

  const clearFilters = () => {
    setRoleFilter("")
    setStatusFilter("")
    onFilter({})
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "Never"
    return new Date(dateString).toLocaleDateString()
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 hover:bg-red-200"
      case "staff":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200"
      case "participant":
        return "bg-green-100 text-green-800 hover:bg-green-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 hover:bg-green-200"
      case "inactive":
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
      case "suspended":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }

  const toggleSearchField = (field: string) => {
    setSearchFields((prev) => (prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]))
  }

  const getSortedPaginatedUsers = () => {
    // Apply sorting if enabled
    const sortedUsers = [...users]
    if (sortField && onSort) {
      sortedUsers.sort((a, b) => {
        // Handle different field types
        const aValue = a[sortField as keyof User]
        const bValue = b[sortField as keyof User]

        // Handle string comparison
        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
        }

        // Handle date comparison
        if (sortField === "createdAt" || sortField === "lastLogin") {
          const aDate = aValue ? new Date(aValue as string).getTime() : 0
          const bDate = bValue ? new Date(bValue as string).getTime() : 0
          return sortDirection === "asc" ? aDate - bDate : bDate - aDate
        }

        // Default comparison
        const valA = aValue ?? 0
        const valB = bValue ?? 0
        return sortDirection === "asc" ? (valA > valB ? 1 : -1) : valA < valB ? 1 : -1
      })
    }

    // Apply pagination if enabled
    if (currentPage && itemsPerPage && onPageChange) {
      const startIndex = (currentPage - 1) * itemsPerPage
      return sortedUsers.slice(startIndex, startIndex + itemsPerPage)
    }

    return sortedUsers
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          <div className="flex gap-2 items-center">
            <div className="flex gap-2 items-center text-sm">
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={searchFields.includes("username")}
                  onChange={() => toggleSearchField("username")}
                  className="rounded text-primary"
                />
                Username
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={searchFields.includes("phone")}
                  onChange={() => toggleSearchField("phone")}
                  className="rounded text-primary"
                />
                Phone
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={searchFields.includes("email")}
                  onChange={() => toggleSearchField("email")}
                  className="rounded text-primary"
                />
                Email
              </label>
            </div>
            <Button type="submit">Search</Button>
          </div>
        </form>
        <Button onClick={onAddNew}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add New User
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <p className="text-sm font-medium">Filter by Role</p>
          <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Roles</SelectLabel>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="participant">Participant</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium">Filter by Status</p>
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Status</SelectLabel>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {(roleFilter || statusFilter) && (
          <Button variant="ghost" onClick={clearFilters}>
            Clear Filters
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className={sortField === "username" ? "cursor-pointer bg-gray-50" : "cursor-pointer"}
                onClick={() => onSort && onSort("username")}
              >
                Username
                {sortField === "username" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
              </TableHead>
              <TableHead
                className={sortField === "phone" ? "cursor-pointer bg-gray-50" : "cursor-pointer"}
                onClick={() => onSort && onSort("phone")}
              >
                Phone
                {sortField === "phone" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
              </TableHead>
              <TableHead
                className={sortField === "email" ? "cursor-pointer bg-gray-50" : "cursor-pointer"}
                onClick={() => onSort && onSort("email")}
              >
                Email
                {sortField === "email" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
              </TableHead>
              <TableHead
                className={sortField === "role" ? "cursor-pointer bg-gray-50" : "cursor-pointer"}
                onClick={() => onSort && onSort("role")}
              >
                Role
                {sortField === "role" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
              </TableHead>
              <TableHead
                className={sortField === "status" ? "cursor-pointer bg-gray-50" : "cursor-pointer"}
                onClick={() => onSort && onSort("status")}
              >
                Status
                {sortField === "status" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
              </TableHead>
              <TableHead
                className={sortField === "lastLogin" ? "cursor-pointer bg-gray-50" : "cursor-pointer"}
                onClick={() => onSort && onSort("lastLogin")}
              >
                Last Login
                {sortField === "lastLogin" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {getSortedPaginatedUsers().length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              getSortedPaginatedUsers().map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username || user.name}</TableCell>
                  <TableCell>{user.phone || "-"}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(user.role)} variant="outline">
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeColor(user.status)} variant="outline">
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(user.lastLogin)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onView(user)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(user)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onChangePassword(user)}>
                          <Key className="mr-2 h-4 w-4" />
                          Change Password
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => onDelete(user)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

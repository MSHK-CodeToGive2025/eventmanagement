import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { User } from "@/types/user-types"
import { Edit, Trash2, Key, RefreshCw } from "lucide-react"

interface UserDetailsProps {
  user: User
  onEdit: () => void
  onDelete: () => void
  onChangePassword: () => void
  onResetPassword: () => void
  onBack?: () => void
  hideBackButton?: boolean
  showAdminActions?: boolean
}

export function UserDetails({
  user,
  onEdit,
  onDelete,
  onChangePassword,
  onResetPassword,
  onBack,
  hideBackButton = false,
  showAdminActions = true,
}: UserDetailsProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return "Never"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{user.firstName} {user.lastName}</h2>
          <p className="text-gray-500">{user.email || user.username}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {showAdminActions && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onChangePassword}>
            <Key className="mr-2 h-4 w-4" />
            Change Password
          </Button>
          {showAdminActions && (
            <Button variant="outline" size="sm" onClick={onResetPassword} className="text-orange-600 hover:text-orange-700">
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset Password
            </Button>
          )}
          {showAdminActions && (
            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={onDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">User ID</h3>
              <p className="mt-1">{user._id}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Role</h3>
              <div className="mt-1">
                <Badge className={getRoleBadgeColor(user.role)} variant="outline">
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </Badge>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <div className="mt-1">
                <Badge className={getStatusBadgeColor(user.isActive ? "active" : "inactive")} variant="outline">
                  {user.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Mobile</h3>
              <p className="mt-1">{user.phoneNumber}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Created At</h3>
              <p className="mt-1">{formatDate(user.createdAt.toString())}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Last Login</h3>
              <p className="mt-1">{user.lastLogin ? formatDate(user.lastLogin.toString()) : "Never"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {!hideBackButton && onBack && (
        <div className="mt-6">
          <Button variant="outline" onClick={onBack}>
            Back to Users
          </Button>
        </div>
      )}
    </div>
  )
}

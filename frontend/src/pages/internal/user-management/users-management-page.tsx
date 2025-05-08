import { useState } from "react"
import { useUserManagement } from "@/contexts/user-management-context"
import { User, UserFormData } from "@/types/user-types"
import RouteGuard from "@/components/route-guard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserList } from "@/components/users/user-list"
import { UserForm } from "@/components/users/user-form"
import { UserDetails } from "@/components/users/user-details"
import { DeleteUserDialog } from "@/components/users/delete-user-dialog"
import { PasswordChangeForm } from "@/components/users/password-change-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Users } from "lucide-react"
import { PaginationControls } from "@/components/ui/pagination-controls"

enum UserView {
  LIST = "list",
  CREATE = "create",
  EDIT = "edit",
  DETAILS = "details",
  CHANGE_PASSWORD = "change_password",
}

export default function UsersManagementPage() {
  const {
    users,
    loading,
    selectedUser,
    setSelectedUser,
    fetchUsers,
    addUser,
    editUser,
    removeUser,
    searchForUsers,
    filterUsersList,
    changeUserPassword,
  } = useUserManagement()

  const [currentView, setCurrentView] = useState<UserView>(UserView.LIST)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState("details")

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Sorting state
  const [sortField, setSortField] = useState<string>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const handleAddUser = async (data: UserFormData) => {
    const newUser = await addUser(data)
    if (newUser) {
      setCurrentView(UserView.LIST)
    }
  }

  const handleEditUser = async (data: UserFormData) => {
    if (!selectedUser) return
    const updatedUser = await editUser(selectedUser.id, data)
    if (updatedUser) {
      setCurrentView(UserView.DETAILS)
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return
    const success = await removeUser(userToDelete.id)
    if (success) {
      setUserToDelete(null)
      if (selectedUser?.id === userToDelete.id) {
        setSelectedUser(null)
        setCurrentView(UserView.LIST)
      }
    }
  }

  const handlePasswordChange = async (userId: string, newPassword: string) => {
    const success = await changeUserPassword(userId, newPassword)
    if (success) {
      setCurrentView(UserView.DETAILS)
      setActiveTab("details")
    }
    return success
  }

  const openDeleteDialog = (user: User) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const viewUser = (user: User) => {
    setSelectedUser(user)
    setCurrentView(UserView.DETAILS)
    setActiveTab("details")
  }

  const editUserView = (user: User) => {
    setSelectedUser(user)
    setCurrentView(UserView.EDIT)
  }

  const changePasswordView = (user: User) => {
    setSelectedUser(user)
    setCurrentView(UserView.CHANGE_PASSWORD)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (count: number) => {
    setItemsPerPage(count)
    setCurrentPage(1) // Reset to first page when changing items per page
  }

  const handleSort = (field: string) => {
    // If clicking the same field, toggle direction
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      // New field, set to ascending by default
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Get view-specific content
  const renderContent = () => {
    switch (currentView) {
      case UserView.CREATE:
        return <UserForm onSubmit={handleAddUser} isLoading={loading} hideTitle />
      case UserView.EDIT:
        return <UserForm user={selectedUser || undefined} onSubmit={handleEditUser} isLoading={loading} hideTitle />
      case UserView.CHANGE_PASSWORD:
        return selectedUser ? (
          <PasswordChangeForm
            userId={selectedUser.id}
            username={selectedUser.name}
            onSubmit={handlePasswordChange}
            isLoading={loading}
            hideTitle
          />
        ) : null
      case UserView.DETAILS:
        return selectedUser ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-end mb-4">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="details">
              <UserDetails
                user={selectedUser}
                onEdit={() => setCurrentView(UserView.EDIT)}
                onDelete={() => openDeleteDialog(selectedUser)}
                onChangePassword={() => changePasswordView(selectedUser)}
                hideBackButton
              />
            </TabsContent>
            <TabsContent value="security">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium">Password Management</h3>
                      <p className="text-sm text-gray-500">Change or reset the user's password</p>
                    </div>
                    <Button onClick={() => changePasswordView(selectedUser)}>Change Password</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="activity">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-gray-500 italic">
                    User activity tracking will be implemented in a future update.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <div>User not found</div>
        )
      case UserView.LIST:
      default:
        return (
          <div className="space-y-4">
            <UserList
              users={users}
              onSearch={searchForUsers}
              onFilter={filterUsersList}
              onView={viewUser}
              onEdit={editUserView}
              onDelete={openDeleteDialog}
              onAddNew={() => setCurrentView(UserView.CREATE)}
              onChangePassword={changePasswordView}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
            />

            <PaginationControls
              currentPage={currentPage}
              totalItems={users.length}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          </div>
        )
    }
  }

  // Get view-specific title
  const getViewTitle = () => {
    switch (currentView) {
      case UserView.CREATE:
        return "Add New User"
      case UserView.EDIT:
        return `Edit User: ${selectedUser?.name || ""}`
      case UserView.DETAILS:
        return `User: ${selectedUser?.name || ""}`
      case UserView.CHANGE_PASSWORD:
        return `Change Password: ${selectedUser?.name || ""}`
      case UserView.LIST:
      default:
        return "All Users"
    }
  }

  return (
    <RouteGuard requiredRoles={["admin"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Users className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">User Management</h1>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{getViewTitle()}</CardTitle>
            </div>
            {currentView !== UserView.LIST && (
              <Button variant="outline" size="sm" onClick={() => setCurrentView(UserView.LIST)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Users List
              </Button>
            )}
          </CardHeader>
          <CardContent>{renderContent()}</CardContent>
        </Card>

        <DeleteUserDialog
          user={userToDelete}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDeleteUser}
        />
      </div>
    </RouteGuard>
  )
}

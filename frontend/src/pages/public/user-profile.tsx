import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, CheckCircle2, User, Key, Save, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import RouteGuard from "@/components/route-guard"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import axios from "axios"

const API_URL = import.meta.env.VITE_API_URL;

interface ProfileFormData {
  firstName: string
  lastName: string
  email: string
  mobile: string
}

interface PasswordFormData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
  targetUserId?: string // For admin changing other users' passwords
}

export default function UserProfile() {
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("profile")
  
  // Check if current user is admin
  const isAdmin = user?.role === 'admin'
  
  // Profile form state
  const [profileData, setProfileData] = useState<ProfileFormData>({
    firstName: "",
    lastName: "",
    email: "",
    mobile: ""
  })
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState("")
  const [profileSuccess, setProfileSuccess] = useState("")

  // Password form state
  const [passwordData, setPasswordData] = useState<PasswordFormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    targetUserId: ""
  })
  
  // State for admin password change
  const [isChangingOtherUser, setIsChangingOtherUser] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [availableUsers, setAvailableUsers] = useState<any[]>([])
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState("")

  // Initialize form data when user loads
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        mobile: user.mobile || ""
      })
    }
  }, [user])

  // Fetch users for admin password change
  useEffect(() => {
    const fetchUsers = async () => {
      if (isAdmin) {
        try {
          const response = await axios.get(`${API_URL}/users`)
          setAvailableUsers(response.data)
        } catch (error) {
          console.error('Failed to fetch users:', error)
        }
      }
    }
    
    fetchUsers()
  }, [isAdmin])

  const handleProfileChange = (field: keyof ProfileFormData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }))
    setProfileError("")
    setProfileSuccess("")
  }

  const handlePasswordChange = (field: keyof PasswordFormData, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }))
    setPasswordError("")
    setPasswordSuccess("")
  }

  const handleUserSelection = (userId: string) => {
    const user = availableUsers.find(u => u._id === userId)
    setSelectedUser(user)
    setPasswordData(prev => ({ ...prev, targetUserId: userId }))
    setIsChangingOtherUser(true)
  }

  const resetPasswordForm = () => {
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      targetUserId: ""
    })
    setSelectedUser(null)
    setIsChangingOtherUser(false)
    setPasswordError("")
    setPasswordSuccess("")
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProfileLoading(true)
    setProfileError("")
    setProfileSuccess("")

    try {
      await axios.put(`${API_URL}/users/${user?._id}`, {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        mobile: profileData.mobile
      })

      setProfileSuccess("Profile updated successfully!")
      toast({
        title: "Success",
        description: "Profile updated successfully",
      })
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Failed to update profile"
      setProfileError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsProfileLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordData.newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters")
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match")
      return
    }

    setIsPasswordLoading(true)
    setPasswordError("")
    setPasswordSuccess("")

    try {
      const targetUserId = isChangingOtherUser ? passwordData.targetUserId : user?._id
      
      if (!targetUserId) {
        throw new Error("No target user selected")
      }

      // If user is changing their own password, verify current password
      if (!isChangingOtherUser) {
        // First verify current password
        await axios.post(`${API_URL}/auth/login`, {
          username: user?.username,
          password: passwordData.currentPassword
        })
      }

      // Then update password
      await axios.patch(`${API_URL}/users/${targetUserId}/password`, {
        newPassword: passwordData.newPassword,
        ...(isChangingOtherUser ? {} : { currentPassword: passwordData.currentPassword })
      })

      const successMessage = isChangingOtherUser 
        ? `Password changed successfully for ${selectedUser?.username}!`
        : "Password changed successfully!"
      
      setPasswordSuccess(successMessage)
      resetPasswordForm()
      toast({
        title: "Success",
        description: successMessage,
      })
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Failed to change password"
      setPasswordError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsPasswordLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>Please log in to view your profile.</p>
        </div>
      </div>
    )
  }

  return (
    <RouteGuard>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">My Profile</h1>
            <p className="text-gray-600">Manage your account information and security settings</p>
          </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile" className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              Profile Information
            </TabsTrigger>
            <TabsTrigger value="password" className="flex items-center">
              <Key className="h-4 w-4 mr-2" />
              Change Password
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information. Username cannot be changed.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {profileError && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 flex items-start">
                    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                    <span>{profileError}</span>
                  </div>
                )}

                {profileSuccess && (
                  <div className="bg-green-50 text-green-600 p-3 rounded-md mb-4 flex items-start">
                    <CheckCircle2 className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                    <span>{profileSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={profileData.firstName}
                        onChange={(e) => handleProfileChange("firstName", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={profileData.lastName}
                        onChange={(e) => handleProfileChange("lastName", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={user.username}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500">Username cannot be changed</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => handleProfileChange("email", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mobile">Mobile Number</Label>
                    <Input
                      id="mobile"
                      type="tel"
                      value={profileData.mobile}
                      onChange={(e) => handleProfileChange("mobile", e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isProfileLoading}>
                      {isProfileLoading ? (
                        <>
                          <Save className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="password" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  {isAdmin 
                    ? "Update your password or change passwords for other users."
                    : "Update your password to keep your account secure."
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {passwordError && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 flex items-start">
                    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                    <span>{passwordError}</span>
                  </div>
                )}

                {passwordSuccess && (
                  <div className="bg-green-50 text-green-600 p-3 rounded-md mb-4 flex items-start">
                    <CheckCircle2 className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                {/* Admin User Selection */}
                {isAdmin && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center mb-3">
                      <Users className="h-5 w-5 mr-2 text-blue-600" />
                      <h3 className="font-medium text-blue-900">Admin Password Management</h3>
                    </div>
                    
                    {!isChangingOtherUser ? (
                      <div className="space-y-3">
                        <p className="text-sm text-blue-700">
                          Choose an action:
                        </p>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsChangingOtherUser(false)}
                            className="bg-white"
                          >
                            Change My Password
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsChangingOtherUser(true)}
                            className="bg-white"
                          >
                            Change Other User's Password
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-blue-700">
                            Select a user to change their password:
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={resetPasswordForm}
                          >
                            Cancel
                          </Button>
                        </div>
                        
                        <Select onValueChange={handleUserSelection}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a user..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableUsers.map((user) => (
                              <SelectItem key={user._id} value={user._id}>
                                {user.username} ({user.firstName} {user.lastName}) - {user.role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        {selectedUser && (
                          <div className="p-3 bg-white rounded border">
                            <p className="text-sm font-medium">Selected User:</p>
                            <p className="text-sm text-gray-600">
                              {selectedUser.username} ({selectedUser.firstName} {selectedUser.lastName})
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  {/* Current Password - Only show for own password change */}
                  {!isChangingOtherUser && (
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => handlePasswordChange("currentPassword", e.target.value)}
                        required
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">
                      {isChangingOtherUser ? "New Password for User" : "New Password"}
                    </Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
                      required
                    />
                    <p className="text-xs text-gray-500">Must be at least 8 characters</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isPasswordLoading || (isChangingOtherUser && !selectedUser)}>
                      {isPasswordLoading ? (
                        <>
                          <Key className="mr-2 h-4 w-4 animate-spin" />
                          Changing...
                        </>
                      ) : (
                        <>
                          <Key className="mr-2 h-4 w-4" />
                          {isChangingOtherUser ? "Change User Password" : "Change Password"}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </RouteGuard>
  )
} 
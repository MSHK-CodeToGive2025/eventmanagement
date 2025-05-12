/**
 * UserForm Component
 * 
 * A form component for creating and editing users. It handles:
 * - User creation with validation
 * - User editing with pre-filled data
 * - Role selection
 * - Active status toggle
 * - Form validation using Zod
 * 
 * The form includes fields for:
 * - Username (required)
 * - Password (required for new users, optional for existing)
 * - First Name (required)
 * - Last Name (required)
 * - Mobile (required)
 * - Email (optional)
 * - Role (required)
 * - Active Status (toggle)
 */

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { type User, type UserRole } from "@/types/user-types"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { 
  UsernameField, 
  PasswordField, 
  NameFields, 
  ContactFields, 
  RoleField, 
  ActiveStatusField 
} from "./form-fields"

// Form validation schema
const userFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  mobile: z.string().min(8, "Mobile number must be at least 8 digits"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  role: z.enum(["admin", "staff", "participant"]),
  isActive: z.boolean(),
})

export type UserFormValues = z.infer<typeof userFormSchema>

interface UserFormProps {
  /** Existing user data for editing mode */
  user?: User
  /** Callback function when form is submitted */
  onSubmit: (data: UserFormValues) => Promise<void>
  /** Callback function when form is canceled */
  onCancel: () => void
  /** Loading state of the form */
  isSubmitting?: boolean
  /** Error message to display */
  error?: string
  /** Whether to hide the form title card */
  hideTitle?: boolean
}

export function UserForm({ user, onSubmit, onCancel, isSubmitting, error, hideTitle = false }: UserFormProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(user?.role || "participant")

  const isEditing = !!user

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: user?.username || "",
      password: "",
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      mobile: user?.mobile || "",
      email: user?.email || "",
      role: user?.role || "participant",
      isActive: user?.isActive ?? true,
    },
  })

  // Update form when user prop changes
  useEffect(() => {
    if (user) {
      form.reset({
        username: user.username,
        password: "",
        firstName: user.firstName,
        lastName: user.lastName,
        mobile: user.mobile,
        email: user.email || "",
        role: user.role,
        isActive: user.isActive,
      })
      setSelectedRole(user.role)
    }
  }, [user, form])

  // Handle role change
  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role)
  }

  const handleSubmit = async (data: UserFormValues) => {
    try {
      await onSubmit(data)
    } catch (err) {
      // Error is handled by the parent component
      console.error("Form submission error:", err)
    }
  }

  // Form content component
  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <UsernameField control={form.control} />
          <PasswordField control={form.control} isEditing={isEditing} />
          <NameFields control={form.control} />
          <ContactFields control={form.control} />
          <RoleField control={form.control} />
          <ActiveStatusField control={form.control} />
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditing ? "Update User" : "Create User"}
          </Button>
        </div>
      </form>
    </Form>
  )

  // Return form with or without title card
  if (hideTitle) {
    return formContent
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{user ? "Edit User" : "Create New User"}</CardTitle>
        <CardDescription>
          {user
            ? "Update user information and permissions"
            : "Add a new user to the system with appropriate role and permissions"}
        </CardDescription>
      </CardHeader>
      <CardContent>{formContent}</CardContent>
    </Card>
  )
}

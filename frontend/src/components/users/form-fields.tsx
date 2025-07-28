import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { PhoneInput } from "@/components/ui/phone-input"
import { type Control } from "react-hook-form"
import { type UserFormValues } from "./user-form"

interface FormFieldProps {
  control: Control<UserFormValues>
  isEditing?: boolean
}

export function UsernameField({ control }: FormFieldProps) {
  return (
    <FormField
      control={control}
      name="username"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Username <span className="text-red-500">*</span></FormLabel>
          <FormControl>
            <Input placeholder="johndoe" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function PasswordField({ control, isEditing }: FormFieldProps) {
  return (
    <FormField
      control={control}
      name="password"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Password {!isEditing && <span className="text-red-500">*</span>}</FormLabel>
          <FormControl>
            <Input 
              type="password" 
              placeholder={isEditing ? "Leave blank to keep current" : "Enter password"} 
              {...field} 
            />
          </FormControl>
          <FormDescription>
            {isEditing ? "Leave blank to keep current password" : "Must be at least 6 characters"}
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function NameFields({ control }: FormFieldProps) {
  return (
    <>
      <FormField
        control={control}
        name="firstName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>First Name <span className="text-red-500">*</span></FormLabel>
            <FormControl>
              <Input placeholder="John" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="lastName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Last Name <span className="text-red-500">*</span></FormLabel>
            <FormControl>
              <Input placeholder="Doe" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}

export function ContactFields({ control }: FormFieldProps) {
  return (
    <>
      <FormField
        control={control}
        name="mobile"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Mobile <span className="text-red-500">*</span></FormLabel>
            <FormControl>
              <PhoneInput
                placeholder="+852 1234 5678"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input placeholder="john.doe@example.com" type="email" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}

export function RoleField({ control }: FormFieldProps) {
  return (
    <FormField
      control={control}
      name="role"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Role <span className="text-red-500">*</span></FormLabel>
          <Select
            onValueChange={field.onChange}
            defaultValue={field.value}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="participant">Participant</SelectItem>
            </SelectContent>
          </Select>
          <FormDescription>This determines what the user can access in the system.</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function ActiveStatusField({ control }: FormFieldProps) {
  return (
    <FormField
      control={control}
      name="isActive"
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <FormLabel className="text-base">Active Status</FormLabel>
            <FormDescription>
              Whether this user can access the system
            </FormDescription>
          </div>
          <FormControl>
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          </FormControl>
        </FormItem>
      )}
    />
  )
} 
import { cn } from "@/lib/utils"

// Union type to handle both auth service User and user-types User
type UserType = {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  mobile?: string;
  phoneNumber?: string;
  email?: string;
  name?: string;
}

interface AvatarProps {
  user: UserType | null | undefined
  size?: "sm" | "md" | "lg"
  className?: string
}

export function Avatar({ user, size = "md", className }: AvatarProps) {

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  }

  // Get initials based on the identifier used during login
  const getInitials = () => {
    if (!user) return "U"

    // Check for specific identifiers
    if (user.username === "admin") return "A"
    if (user.username === "staff") return "S"
    if (user.username === "nelson") return "N"

    // If we have firstName and lastName, use their initials
    if (user.firstName && user.lastName) {
      return (user.firstName.charAt(0) + user.lastName.charAt(0)).toUpperCase()
    }

    // If we have a name, use its initials
    if (user.name) {
      const names = user.name.split(" ")
      if (names.length === 1) return names[0].charAt(0).toUpperCase()
      return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase()
    }

    // Fallback to first letter of identifier or email
    if (user.username) return user.username.charAt(0).toUpperCase()
    if (user.email) return user.email.charAt(0).toUpperCase()

    return "U"
  }

  // Fallback to initials
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-yellow-100 text-yellow-800 font-medium",
        sizeClasses[size],
        className,
      )}
    >
      {getInitials()}
    </div>
  )
}

/**
 * Represents the possible roles a user can have in the system
 * - admin: Full system access and control
 * - staff: Can manage events and forms
 * - participant: Can register for events and submit forms
 */
export type UserRole = "admin" | "staff" | "participant"

/**
 * Represents the possible statuses a user account can have
 * Note: Currently using isActive boolean instead of this enum
 * @deprecated Use isActive boolean instead
 */
export type UserStatus = "active" | "inactive" | "pending" | "suspended"

/**
 * Represents a user in the system
 * @property _id - Unique identifier for the user
 * @property username - Unique username for login
 * @property passwordHash - Hashed password (never store plain text)
 * @property mobile - User's mobile number (required for contact)
 * @property email - User's email address (optional)
 * @property role - User's role in the system (admin/staff/participant)
 * @property firstName - User's first name
 * @property lastName - User's last name
 * @property createdAt - When the user account was created
 * @property updatedAt - When the user account was last updated
 * @property lastLogin - When the user last logged in (optional)
 * @property isActive - Whether the user account is active
 */
export interface User {
  _id: string;
  username: string;
  passwordHash: string;
  mobile: string;
  email?: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  isActive: boolean;
}

/**
 * Data required for creating a new user
 * Excludes system-generated fields and makes password required
 */
export interface CreateUserData {
  username: string;
  password: string;
  mobile: string;
  email?: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  isActive: boolean;
}

/**
 * Data that can be updated for an existing user
 * Makes all fields optional and excludes system-generated fields
 */
export interface UpdateUserData {
  username?: string;
  password?: string;
  mobile?: string;
  email?: string;
  role?: UserRole;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
}

/**
 * Filter criteria for searching users
 */
export interface UserFilterCriteria {
  role?: UserRole;
  isActive?: boolean;
  phone?: string;
  searchQuery?: string;
  searchFields?: Array<keyof User>;
}

/**
 * Sort criteria for user list
 */
export interface UserSortCriteria {
  field: keyof User;
  direction: "asc" | "desc";
}

/**
 * Pagination parameters for user list
 */
export interface UserPaginationParams {
  page: number;
  itemsPerPage: number;
}

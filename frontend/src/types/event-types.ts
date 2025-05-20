export interface Location {
  venue: string;
  address: string;
  district: string;
  onlineEvent: boolean;
  meetingLink?: string;
}

export interface SessionLocation {
  venue?: string;
  meetingLink?: string;
}

export interface Session {
  _id: string;
  title: string;
  description?: string; 
  date: Date;
  startTime: string;
  endTime: string;
  location?: SessionLocation;
  capacity?: number;
}

export interface ZubinEvent {
  _id: string;
  title: string;
  description: string; // Description of the event (Rich text content with formatting)
  category: string; // Category of the event
  targetGroup: string; // Target group of the event
  location: Location; // Location of the event
  startDate: Date; // Start date of the event
  endDate: Date; // End date of the event
  coverImageUrl?: string; // Cover image URL of the event
  isPrivate: boolean; // Whether the event is private
  status: 'Draft' | 'Published' | 'Cancelled' | 'Completed'; // Status of the event
  registrationFormId: string; // Reference to the RegistrationForm _id
  sessions: Session[]; // Sessions of the event
  capacity?: number; // Capacity of the event
  createdBy: string; // Created by of the event
  createdAt: Date; // Created at of the event
  updatedBy?: string; // Updated by of the event
  updatedAt?: Date; // Updated at of the event
  tags?: string[]; // Tags of the event
  registeredCount?: number; // Registered count of the event
}

// Event categories
export const eventCategories = [
  "Education & Training",
  "Cultural Exchange",
  "Health & Wellness",
  "Career Development",
  "Community Building",
  "Language Learning",
  "Social Integration",
  "Youth Programs",
  "Women's Empowerment",
  "Other",
] as const;

// Target groups
export const targetGroups = [
  "All Hong Kong Residents",
  "Ethnic Minorities",
  "South Asian Community",
  "Women",
  "Youth (13-25)",
  "Children (0-12)",
  "Seniors (65+)",
  "Professionals",
  "Newcomers to Hong Kong",
  "Other",
] as const;

// Event status options
export const eventStatuses = [
  "Draft",
  "Published",
  "Cancelled",
  "Completed",
] as const;

// Hong Kong districts
export const hongKongDistricts = [
  "Central and Western",
  "Eastern",
  "Islands",
  "Kowloon City",
  "Kwai Tsing",
  "Kwun Tong",
  "North",
  "Sai Kung",
  "Sha Tin",
  "Sham Shui Po",
  "Southern",
  "Tai Po",
  "Tsuen Wan",
  "Tuen Mun",
  "Wan Chai",
  "Wong Tai Sin",
  "Yau Tsim Mong",
  "Yuen Long",
] as const; 
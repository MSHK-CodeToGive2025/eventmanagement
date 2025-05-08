import type { ZubinEvent } from "./enhanced-event-types"

// Mock enhanced events data
export const enhancedEvents: ZubinEvent[] = [
  {
    eventId: "evt-001",
    eventTitle: "Cultural Diversity Workshop",
    location: "Wan Chai Community Center",
    date: "2025-07-15",
    startTime: "10:00",
    endTime: "16:00",
    category: "Workshop",
    targetGroup: "All community members",
    capacity: 50,
    registeredCount: 12,
    imageUrl: "/community-event.png",
    eventDetails:
      "Join us for a day of cultural exchange and learning. This workshop aims to promote understanding and appreciation of the diverse cultures within our community. Activities include cultural presentations, interactive discussions, and collaborative projects.",
    associatedRegistrationForm: {
      formId: "form-001",
      formTitle: "Cultural Diversity Workshop Registration",
      formCategory: "Workshop",
      formFields: [
        {
          fieldId: "firstName",
          fieldLabel: "First Name",
          fieldType: "text",
          isRequired: true,
          placeholder: "Enter your first name",
        },
        {
          fieldId: "lastName",
          fieldLabel: "Last Name",
          fieldType: "text",
          isRequired: true,
          placeholder: "Enter your last name",
        },
        {
          fieldId: "email",
          fieldLabel: "Email Address",
          fieldType: "email",
          isRequired: true,
          placeholder: "Enter your email address",
          validation: {
            pattern: "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$",
            message: "Please enter a valid email address",
          },
        },
        {
          fieldId: "phone",
          fieldLabel: "Phone Number",
          fieldType: "tel",
          isRequired: true,
          placeholder: "Enter your phone number",
          validation: {
            pattern: "^[0-9+\\-\\s()]{8,15}$",
            message: "Please enter a valid phone number",
          },
        },
        {
          fieldId: "culturalBackground",
          fieldLabel: "Cultural Background",
          fieldType: "text",
          isRequired: false,
          placeholder: "Optional: Share your cultural background",
        },
        {
          fieldId: "dietaryRequirements",
          fieldLabel: "Dietary Requirements",
          fieldType: "dropdown",
          isRequired: false,
          options: ["None", "Vegetarian", "Vegan", "Halal", "Kosher", "Gluten-free", "Other"],
        },
        {
          fieldId: "expectations",
          fieldLabel: "What do you hope to gain from this workshop?",
          fieldType: "textarea",
          isRequired: false,
          placeholder: "Share your expectations...",
        },
        {
          fieldId: "agreeToTerms",
          fieldLabel: "I agree to the terms and conditions",
          fieldType: "checkbox",
          isRequired: true,
        },
      ],
    },
  },
  {
    eventId: "evt-002",
    eventTitle: "Mental Health Awareness Seminar",
    location: "Tsim Sha Tsui Community Hall",
    date: "2025-08-20",
    startTime: "14:00",
    endTime: "17:00",
    category: "Seminar",
    targetGroup: "Adults and young adults",
    capacity: 100,
    registeredCount: 45,
    imageUrl: "/mental-health-abstract.png",
    eventDetails:
      "This seminar focuses on raising awareness about mental health issues affecting ethnic minority communities. Expert speakers will discuss common challenges, coping strategies, and available resources. The event aims to reduce stigma and promote mental wellbeing.",
    associatedRegistrationForm: {
      formId: "form-002",
      formTitle: "Mental Health Awareness Seminar Registration",
      formCategory: "Seminar",
      formFields: [
        {
          fieldId: "fullName",
          fieldLabel: "Full Name",
          fieldType: "text",
          isRequired: true,
          placeholder: "Enter your full name",
        },
        {
          fieldId: "email",
          fieldLabel: "Email Address",
          fieldType: "email",
          isRequired: true,
          placeholder: "Enter your email address",
          validation: {
            pattern: "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$",
            message: "Please enter a valid email address",
          },
        },
        {
          fieldId: "age",
          fieldLabel: "Age Group",
          fieldType: "dropdown",
          isRequired: true,
          options: ["Under 18", "18-24", "25-34", "35-44", "45-54", "55-64", "65+"],
        },
        {
          fieldId: "occupation",
          fieldLabel: "Occupation",
          fieldType: "text",
          isRequired: false,
          placeholder: "Optional: Your occupation",
        },
        {
          fieldId: "reasonForAttending",
          fieldLabel: "Reason for attending",
          fieldType: "dropdown",
          isRequired: true,
          options: [
            "Personal interest",
            "Professional development",
            "Supporting a family member",
            "Supporting a friend",
            "Academic research",
            "Other",
          ],
        },
        {
          fieldId: "specialAccommodations",
          fieldLabel: "Special Accommodations",
          fieldType: "textarea",
          isRequired: false,
          placeholder: "Please let us know if you require any special accommodations",
        },
        {
          fieldId: "agreeToTerms",
          fieldLabel: "I agree to the terms and conditions",
          fieldType: "checkbox",
          isRequired: true,
        },
      ],
    },
  },
  {
    eventId: "evt-003",
    eventTitle: "Youth Leadership Conference",
    location: "Hong Kong Convention Center",
    date: "2025-09-10",
    startTime: "09:00",
    endTime: "18:00",
    category: "Conference",
    targetGroup: "Youth (16-24 years)",
    capacity: 200,
    registeredCount: 87,
    imageUrl: "/diverse-community-event.png",
    eventDetails:
      "The Youth Leadership Conference brings together young leaders from diverse backgrounds to develop leadership skills, network with peers, and engage with community issues. The day includes keynote speakers, interactive workshops, and collaborative problem-solving activities.",
    associatedRegistrationForm: {
      formId: "form-003",
      formTitle: "Youth Leadership Conference Registration",
      formCategory: "Conference",
      formFields: [
        {
          fieldId: "firstName",
          fieldLabel: "First Name",
          fieldType: "text",
          isRequired: true,
          placeholder: "Enter your first name",
        },
        {
          fieldId: "lastName",
          fieldLabel: "Last Name",
          fieldType: "text",
          isRequired: true,
          placeholder: "Enter your last name",
        },
        {
          fieldId: "email",
          fieldLabel: "Email Address",
          fieldType: "email",
          isRequired: true,
          placeholder: "Enter your email address",
          validation: {
            pattern: "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$",
            message: "Please enter a valid email address",
          },
        },
        {
          fieldId: "phone",
          fieldLabel: "Phone Number",
          fieldType: "tel",
          isRequired: true,
          placeholder: "Enter your phone number",
          validation: {
            pattern: "^[0-9+\\-\\s()]{8,15}$",
            message: "Please enter a valid phone number",
          },
        },
        {
          fieldId: "dateOfBirth",
          fieldLabel: "Date of Birth",
          fieldType: "date",
          isRequired: true,
        },
        {
          fieldId: "school",
          fieldLabel: "School/College/University",
          fieldType: "text",
          isRequired: false,
          placeholder: "If applicable",
        },
        {
          fieldId: "leadershipExperience",
          fieldLabel: "Previous Leadership Experience",
          fieldType: "dropdown",
          isRequired: true,
          options: ["None", "School club/team", "Community organization", "Work environment", "Other"],
        },
        {
          fieldId: "workshopPreference",
          fieldLabel: "Workshop Preference",
          fieldType: "dropdown",
          isRequired: true,
          options: [
            "Public Speaking",
            "Project Management",
            "Community Organizing",
            "Digital Leadership",
            "Conflict Resolution",
          ],
        },
        {
          fieldId: "dietaryRequirements",
          fieldLabel: "Dietary Requirements",
          fieldType: "dropdown",
          isRequired: false,
          options: ["None", "Vegetarian", "Vegan", "Halal", "Kosher", "Gluten-free", "Other"],
        },
        {
          fieldId: "specialAccommodations",
          fieldLabel: "Special Accommodations",
          fieldType: "textarea",
          isRequired: false,
          placeholder: "Please let us know if you require any special accommodations",
        },
        {
          fieldId: "agreeToTerms",
          fieldLabel: "I agree to the terms and conditions",
          fieldType: "checkbox",
          isRequired: true,
        },
      ],
    },
  },
]

// Function to get enhanced event by ID
export const getEnhancedEventById = async (id: string): Promise<ZubinEvent | null> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  const event = enhancedEvents.find((event) => event.eventId === id)
  return event || null
}

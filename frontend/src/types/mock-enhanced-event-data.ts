import { ZubinEvent } from "./event-types"
import { RegistrationForm, FormSection, FormField } from "./form-types"
import { User } from "./user-types"
import { EventRegistration } from "./event-types"

// Helper function to create a form field
const createField = (
  label: string,
  type: FormField["type"],
  required: boolean,
  options?: string[],
  validation?: FormField["validation"]
): FormField => ({
  _id: `field-${Math.random().toString(36).substr(2, 9)}`,
  label,
  type,
  required,
  options,
  validation,
  order: 0
})

// Helper function to create a form section
const createSection = (title: string, fields: FormField[]): FormSection => ({
  _id: `section-${Math.random().toString(36).substr(2, 9)}`,
  title,
  fields,
  order: 0
})

// Helper function to create a registration form
const createRegistrationForm = (
  _id: string,
  title: string,
  description: string,
  sections: FormSection[]
): RegistrationForm => ({
  _id,
  title,
  description,
  sections,
  isActive: true,
  createdBy: "system",
  createdAt: new Date()
})

// Registration Forms
export const mockRegistrationForms: RegistrationForm[] = [
  createRegistrationForm(
    "form1",
    "English Conversation Club Registration",
    "Please fill out this form to register for the English Conversation Club sessions.",
    [
      createSection("Personal Information", [
        createField("First Name", "text", true, undefined, { minLength: 2, maxLength: 50 }),
        createField("Last Name", "text", true, undefined, { minLength: 2, maxLength: 50 }),
        createField("Email", "email", true),
        createField("Phone Number", "phone", true),
        createField("Age", "number", true, undefined, { minValue: 13, maxValue: 100 }),
        createField("Native Language", "text", true)
      ]),
      createSection("English Proficiency", [
        createField("English Level", "dropdown", true, [
          "Beginner",
          "Intermediate",
          "Advanced"
        ]),
        createField("Preferred Session", "dropdown", true, [
          "Basic Conversation Practice (14:00-15:00)",
          "Advanced Discussion Group (15:00-16:00)"
        ])
      ]),
      createSection("Additional Information", [
        createField("Learning Goals", "textarea", false),
        createField("Special Requirements", "textarea", false),
        createField("I agree to the terms and conditions", "checkbox", true)
      ])
    ]
  ),
  createRegistrationForm(
    "form2",
    "Career Development Workshop Registration",
    "Please complete this form to register for the Career Development Workshop.",
    [
      createSection("Personal Information", [
        createField("First Name", "text", true, undefined, { minLength: 2, maxLength: 50 }),
        createField("Last Name", "text", true, undefined, { minLength: 2, maxLength: 50 }),
        createField("Email", "email", true),
        createField("Phone Number", "phone", true),
        createField("Current Job Title", "text", true),
        createField("Years of Experience", "number", true, undefined, { minValue: 0, maxValue: 50 })
      ]),
      createSection("Workshop Preferences", [
        createField("Sessions to Attend", "dropdown", true, [
          "Resume Writing Workshop (10:00-12:00)",
          "Interview Skills (13:00-15:00)",
          "Networking Session (15:30-17:00)"
        ]),
        createField("Career Goals", "textarea", true),
        createField("Specific Areas for Improvement", "textarea", false)
      ]),
      createSection("Additional Information", [
        createField("Industry", "dropdown", true, [
          "Technology",
          "Finance",
          "Healthcare",
          "Education",
          "Other"
        ]),
        createField("Resume Upload", "file", false),
        createField("I agree to the terms and conditions", "checkbox", true)
      ])
    ]
  ),
  createRegistrationForm(
    "form3",
    "Cultural Exchange Festival Registration",
    "Join us for a day of cultural celebration and exchange.",
    [
      createSection("Personal Information", [
        createField("First Name", "text", true, undefined, { minLength: 2, maxLength: 50 }),
        createField("Last Name", "text", true, undefined, { minLength: 2, maxLength: 50 }),
        createField("Email", "email", true),
        createField("Phone Number", "phone", true),
        createField("Number of Attendees", "number", true, undefined, { minValue: 1, maxValue: 10 })
      ]),
      createSection("Event Preferences", [
        createField("Activities Interested In", "dropdown", true, [
          "Cultural Performances (11:00-13:00)",
          "Food Festival (13:00-16:00)",
          "Cultural Workshops (16:00-18:00)",
          "Evening Concert (18:00-20:00)"
        ]),
        createField("Cultural Background", "text", false),
        createField("Special Requirements", "textarea", false)
      ]),
      createSection("Additional Information", [
        createField("Dietary Restrictions", "textarea", false),
        createField("I agree to the terms and conditions", "checkbox", true)
      ])
    ]
  ),
  createRegistrationForm(
    "form4",
    "Women's Leadership Forum Registration",
    "Join us for an empowering virtual forum focused on women's leadership development.",
    [
      createSection("Personal Information", [
        createField("First Name", "text", true, undefined, { minLength: 2, maxLength: 50 }),
        createField("Last Name", "text", true, undefined, { minLength: 2, maxLength: 50 }),
        createField("Email", "email", true),
        createField("Phone Number", "phone", true),
        createField("Current Role", "text", true),
        createField("Organization", "text", true)
      ]),
      createSection("Forum Participation", [
        createField("Sessions to Attend", "dropdown", true, [
          "Keynote Speech (19:00-19:45)",
          "Panel Discussion (19:45-20:30)",
          "Networking Session (20:30-21:00)"
        ]),
        createField("Leadership Experience", "textarea", true),
        createField("Areas of Interest", "textarea", false)
      ]),
      createSection("Additional Information", [
        createField("Industry", "dropdown", true, [
          "Technology",
          "Finance",
          "Healthcare",
          "Education",
          "Other"
        ]),
        createField("Questions for Panelists", "textarea", false),
        createField("I agree to the terms and conditions", "checkbox", true)
      ])
    ]
  ),
  createRegistrationForm(
    "form5",
    "Youth Coding Workshop Registration",
    "Join us for an exciting introduction to programming!",
    [
      createSection("Personal Information", [
        createField("First Name", "text", true, undefined, { minLength: 2, maxLength: 50 }),
        createField("Last Name", "text", true, undefined, { minLength: 2, maxLength: 50 }),
        createField("Email", "email", true),
        createField("Phone Number", "phone", true),
        createField("Age", "number", true, undefined, { minValue: 13, maxValue: 25 }),
        createField("Parent/Guardian Name", "text", true),
        createField("Parent/Guardian Phone", "phone", true)
      ]),
      createSection("Workshop Information", [
        createField("Programming Experience", "dropdown", true, [
          "None",
          "Beginner",
          "Intermediate"
        ]),
        createField("Preferred Programming Language", "dropdown", true, [
          "Python",
          "JavaScript",
          "No Preference"
        ]),
        createField("Learning Goals", "textarea", true)
      ]),
      createSection("Additional Information", [
        createField("Laptop Required", "checkbox", true),
        createField("Special Requirements", "textarea", false),
        createField("I agree to the terms and conditions", "checkbox", true)
      ])
    ]
  )
]

export const mockZubinEvents: ZubinEvent[] = [
  {
    _id: "1",
    title: "English Conversation Club",
    description: "Join our weekly English conversation club to practice speaking English in a friendly environment. All levels welcome!",
    category: "Language Learning",
    targetGroup: "All Hong Kong Residents",
    location: {
      venue: "Central Library",
      address: "66 Causeway Road, Causeway Bay",
      district: "Wan Chai",
      onlineEvent: false
    },
    startDate: new Date("2024-04-15"),
    endDate: new Date("2024-04-15"),
    coverImageUrl: "/language-learning.png",
    isPrivate: false,
    status: "Published",
    registrationFormId: "form1",
    sessions: [
      {
        _id: "sess-1-1",
        title: "Basic Conversation Practice",
        description: "Practice everyday conversations with native English speakers",
        date: new Date("2024-04-15"),
        startTime: "14:00",
        endTime: "15:00",
        location: {
          venue: "Central Library - Room 1"
        },
        capacity: 10
      },
      {
        _id: "sess-1-2",
        title: "Advanced Discussion Group",
        description: "Engage in deeper discussions on current topics",
        date: new Date("2024-04-15"),
        startTime: "15:00",
        endTime: "16:00",
        location: {
          venue: "Central Library - Room 2"
        },
        capacity: 10
      }
    ],
    capacity: 20,
    createdBy: "janesmith",
    createdAt: new Date("2024-03-01"),
    updatedBy: "janesmith",
    updatedAt: new Date("2024-03-01"),
    registeredCount: 15
  },
  {
    _id: "2",
    title: "Career Development Workshop",
    description: "Learn essential skills for career advancement in Hong Kong. Topics include resume writing, interview preparation, and networking.",
    category: "Career Development",
    targetGroup: "Professionals",
    location: {
      venue: "Kowloon Bay Office",
      address: "123 Enterprise Square",
      district: "Kwun Tong",
      onlineEvent: false
    },
    startDate: new Date("2024-04-20"),
    endDate: new Date("2024-04-20"),
    coverImageUrl: "/career-workshop.png",
    isPrivate: false,
    status: "Published",
    registrationFormId: "form2",
    sessions: [
      {
        _id: "sess-2-1",
        title: "Resume Writing Workshop",
        description: "Learn how to create an effective resume for the Hong Kong job market",
        date: new Date("2024-04-20"),
        startTime: "10:00",
        endTime: "12:00",
        location: {
          venue: "Kowloon Bay Office - Training Room A"
        },
        capacity: 15
      },
      {
        _id: "sess-2-2",
        title: "Interview Skills",
        description: "Master the art of job interviews with practical exercises",
        date: new Date("2024-04-20"),
        startTime: "13:00",
        endTime: "15:00",
        location: {
          venue: "Kowloon Bay Office - Training Room B"
        },
        capacity: 15
      },
      {
        _id: "sess-2-3",
        title: "Networking Session",
        description: "Practice networking skills with industry professionals",
        date: new Date("2024-04-20"),
        startTime: "15:30",
        endTime: "17:00",
        location: {
          venue: "Kowloon Bay Office - Conference Hall"
        },
        capacity: 30
      }
    ],
    capacity: 30,
    createdBy: "admin",
    createdAt: new Date("2024-03-05"),
    updatedBy: "admin",
    updatedAt: new Date("2024-03-05"),
    registeredCount: 25
  },
  {
    _id: "3",
    title: "Cultural Exchange Festival",
    description: "Celebrate diversity through music, dance, and food from different cultures. A family-friendly event for everyone.",
    category: "Cultural Exchange",
    targetGroup: "All Hong Kong Residents",
    location: {
      venue: "Victoria Park",
      address: "1 Hing Fat Street, Causeway Bay",
      district: "Wan Chai",
      onlineEvent: false
    },
    startDate: new Date("2024-05-01"),
    endDate: new Date("2024-05-01"),
    coverImageUrl: "/vibrant-cultural-festival.png",
    isPrivate: false,
    status: "Published",
    registrationFormId: "form3",
    sessions: [
      {
        _id: "sess-3-1",
        title: "Cultural Performances",
        description: "Traditional music and dance performances from various cultures",
        date: new Date("2024-05-01"),
        startTime: "11:00",
        endTime: "13:00",
        location: {
          venue: "Victoria Park - Main Stage"
        },
        capacity: 200
      },
      {
        _id: "sess-3-2",
        title: "Food Festival",
        description: "Taste authentic dishes from different cultures",
        date: new Date("2024-05-01"),
        startTime: "13:00",
        endTime: "16:00",
        location: {
          venue: "Victoria Park - Food Court"
        },
        capacity: 300
      },
      {
        _id: "sess-3-3",
        title: "Cultural Workshops",
        description: "Hands-on workshops for traditional crafts and activities",
        date: new Date("2024-05-01"),
        startTime: "16:00",
        endTime: "18:00",
        location: {
          venue: "Victoria Park - Workshop Area"
        },
        capacity: 150
      },
      {
        _id: "sess-3-4",
        title: "Evening Concert",
        description: "Grand finale concert featuring multicultural performances",
        date: new Date("2024-05-01"),
        startTime: "18:00",
        endTime: "20:00",
        location: {
          venue: "Victoria Park - Main Stage"
        },
        capacity: 500
      }
    ],
    capacity: 500,
    createdBy: "admin",
    createdAt: new Date("2024-03-10"),
    updatedBy: "admin",
    updatedAt: new Date("2024-03-10"),
    registeredCount: 300
  },
  {
    _id: "4",
    title: "Women's Leadership Forum",
    description: "Empowering women through leadership development, networking, and mentorship opportunities.",
    category: "Women's Empowerment",
    targetGroup: "Women",
    location: {
      venue: "Online",
      address: "",
      district: "",
      onlineEvent: true,
      meetingLink: "https://zoom.us/j/123456789"
    },
    startDate: new Date("2024-04-25"),
    endDate: new Date("2024-04-25"),
    coverImageUrl: "/diverse-community-event.png",
    isPrivate: false,
    status: "Published",
    registrationFormId: "form4",
    sessions: [
      {
        _id: "sess-4-1",
        title: "Keynote Speech",
        description: "Inspiring keynote from successful women leaders",
        date: new Date("2024-04-25"),
        startTime: "19:00",
        endTime: "19:45",
        location: {
          meetingLink: "https://zoom.us/j/123456789"
        },
        capacity: 100
      },
      {
        _id: "sess-4-2",
        title: "Panel Discussion",
        description: "Interactive panel discussion on leadership challenges and opportunities",
        date: new Date("2024-04-25"),
        startTime: "19:45",
        endTime: "20:30",
        location: {
          meetingLink: "https://zoom.us/j/123456789"
        },
        capacity: 100
      },
      {
        _id: "sess-4-3",
        title: "Networking Session",
        description: "Virtual networking with fellow participants",
        date: new Date("2024-04-25"),
        startTime: "20:30",
        endTime: "21:00",
        location: {
          meetingLink: "https://zoom.us/j/123456789"
        },
        capacity: 100
      }
    ],
    capacity: 100,
    createdBy: "johndoe",
    createdAt: new Date("2024-03-15"),
    updatedBy: "johndoe",
    updatedAt: new Date("2024-03-15"),
    registeredCount: 75
  },
  {
    _id: "5",
    title: "Youth Coding Workshop",
    description: "Introduction to programming for young people. Learn basic coding concepts through fun projects.",
    category: "Education & Training",
    targetGroup: "Youth (13-25)",
    location: {
      venue: "Youth Center",
      address: "45 Youth Street, Mong Kok",
      district: "Yau Tsim Mong",
      onlineEvent: false
    },
    startDate: new Date("2024-04-18"),
    endDate: new Date("2024-04-18"),
    coverImageUrl: "/community-support.png",
    isPrivate: false,
    status: "Published",
    registrationFormId: "form5",
    sessions: [
      {
        _id: "sess-5-1",
        title: "Introduction to Programming",
        description: "Learn basic programming concepts and tools",
        date: new Date("2024-04-18"),
        startTime: "15:00",
        endTime: "16:00",
        location: {
          venue: "Youth Center - Computer Lab 1"
        },
        capacity: 15
      },
      {
        _id: "sess-5-2",
        title: "Hands-on Project",
        description: "Build a simple game using what you've learned",
        date: new Date("2024-04-18"),
        startTime: "16:00",
        endTime: "17:30",
        location: {
          venue: "Youth Center - Computer Lab 2"
        },
        capacity: 15
      },
      {
        _id: "sess-5-3",
        title: "Showcase and Q&A",
        description: "Present your projects and get feedback",
        date: new Date("2024-04-18"),
        startTime: "17:30",
        endTime: "18:00",
        location: {
          venue: "Youth Center - Presentation Room"
        },
        capacity: 25
      }
    ],
    capacity: 25,
    createdBy: "alicebrown",
    createdAt: new Date("2024-03-20"),
    updatedBy: "alicebrown",
    updatedAt: new Date("2024-03-20"),
    registeredCount: 20
  }
]

// Mock Users
export const mockUsers: User[] = [
  {
    _id: "1",
    username: "johndoe",
    password: "hashed_password",
    phoneNumber: "+1 (555) 123-4567",
    email: "john@example.com",
    role: "admin",
    firstName: "John",
    lastName: "Doe",
    createdAt: new Date("2023-01-15"),
    updatedAt: new Date("2023-01-15"),
    lastLogin: new Date("2023-05-10"),
    isActive: true
  },
  {
    _id: "2",
    username: "janesmith",
    password: "hashed_password",
    phoneNumber: "+1 (555) 987-6543",
    email: "jane@example.com",
    role: "staff",
    firstName: "Jane",
    lastName: "Smith",
    createdAt: new Date("2023-02-20"),
    updatedAt: new Date("2023-02-20"),
    lastLogin: new Date("2023-05-08"),
    isActive: true
  },
  {
    _id: "3",
    username: "bobjohnson",
    password: "hashed_password",
    phoneNumber: "+1 (555) 456-7890",
    email: "bob@example.com",
    role: "participant",
    firstName: "Bob",
    lastName: "Johnson",
    createdAt: new Date("2023-03-10"),
    updatedAt: new Date("2023-03-10"),
    lastLogin: new Date("2023-04-15"),
    isActive: false
  },
  {
    _id: "4",
    username: "alicebrown",
    password: "hashed_password",
    phoneNumber: "+1 (555) 234-5678",
    email: "alice@example.com",
    role: "staff",
    firstName: "Alice",
    lastName: "Brown",
    createdAt: new Date("2023-01-05"),
    updatedAt: new Date("2023-01-05"),
    lastLogin: new Date("2023-05-12"),
    isActive: true
  },
  {
    _id: "5",
    username: "charliewilson",
    password: "hashed_password",
    phoneNumber: "+1 (555) 876-5432",
    email: "charlie@example.com",
    role: "participant",
    firstName: "Charlie",
    lastName: "Wilson",
    createdAt: new Date("2023-04-01"),
    updatedAt: new Date("2023-04-01"),
    lastLogin: new Date("2023-05-01"),
    isActive: true
  },  
  {
    _id: "6",
    username: "sarah.wong",
    password: "hashed_password_1",
    phoneNumber: "91234567",
    email: "sarah.wong@example.com",
    role: "participant",
    firstName: "Sarah",
    lastName: "Wong",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    lastLogin: new Date("2024-03-15"),
    isActive: true
  },
  {
    _id: "7",
    username: "raj.patel",
    password: "hashed_password_2",
    phoneNumber: "92345678",
    email: "raj.patel@example.com",
    role: "participant",
    firstName: "Raj",
    lastName: "Patel",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
    lastLogin: new Date("2024-03-20"),
    isActive: true
  },
  {
    _id: "8",
    username: "maria.garcia",
    password: "hashed_password_3",
    phoneNumber: "93456789",
    email: "maria.garcia@example.com",
    role: "participant",
    firstName: "Maria",
    lastName: "Garcia",
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-01"),
    lastLogin: new Date("2024-03-18"),
    isActive: true
  },
  {
    _id: "9",
    username: "ali.khan",
    password: "hashed_password_4",
    phoneNumber: "94567890",
    email: "ali.khan@example.com",
    role: "participant",
    firstName: "Ali",
    lastName: "Khan",
    createdAt: new Date("2024-02-15"),
    updatedAt: new Date("2024-02-15"),
    lastLogin: new Date("2024-03-19"),
    isActive: true
  },
  {
    _id: "10",
    username: "emma.chan",
    password: "hashed_password_5",
    phoneNumber: "95678901",
    email: "emma.chan@example.com",
    role: "participant",
    firstName: "Emma",
    lastName: "Chan",
    createdAt: new Date("2024-03-01"),
    updatedAt: new Date("2024-03-01"),
    lastLogin: new Date("2024-03-21"),
    isActive: true
  }
]

// Mock Event Registrations
export const mockEventRegistrations: EventRegistration[] = [
  // English Conversation Club Registrations
  {
    _id: "reg1",
    eventId: "1",
    userId: "user1",
    attendee: {
      firstName: "Sarah",
      lastName: "Wong",
      phone: "91234567",
      email: "sarah.wong@example.com"
    },
    sessions: ["sess-1-1", "sess-1-2"],
    formResponses: [
      {
        sectionId: "section-1",
        fieldId: "field-1",
        response: "Sarah"
      },
      {
        sectionId: "section-1",
        fieldId: "field-2",
        response: "Wong"
      },
      {
        sectionId: "section-2",
        fieldId: "field-3",
        response: "intermediate"
      }
    ],
    status: "confirmed",
    registeredAt: new Date("2024-03-10"),
    notes: "Regular participant"
  },
  {
    _id: "reg2",
    eventId: "1",
    userId: "user2",
    attendee: {
      firstName: "Raj",
      lastName: "Patel",
      phone: "92345678",
      email: "raj.patel@example.com"
    },
    sessions: ["sess-1-2"],
    formResponses: [
      {
        sectionId: "section-1",
        fieldId: "field-1",
        response: "Raj"
      },
      {
        sectionId: "section-1",
        fieldId: "field-2",
        response: "Patel"
      },
      {
        sectionId: "section-2",
        fieldId: "field-3",
        response: "advanced"
      }
    ],
    status: "confirmed",
    registeredAt: new Date("2024-03-11")
  },
  // Career Development Workshop Registrations
  {
    _id: "reg3",
    eventId: "2",
    userId: "user3",
    attendee: {
      firstName: "Maria",
      lastName: "Garcia",
      phone: "93456789",
      email: "maria.garcia@example.com"
    },
    sessions: ["sess-2-1", "sess-2-2", "sess-2-3"],
    formResponses: [
      {
        sectionId: "section-1",
        fieldId: "field-1",
        response: "Maria"
      },
      {
        sectionId: "section-1",
        fieldId: "field-2",
        response: "Garcia"
      },
      {
        sectionId: "section-2",
        fieldId: "field-3",
        response: "Marketing Manager"
      }
    ],
    status: "confirmed",
    registeredAt: new Date("2024-03-12")
  },
  // Cultural Exchange Festival Registrations
  {
    _id: "reg4",
    eventId: "3",
    userId: "user4",
    attendee: {
      firstName: "Ali",
      lastName: "Khan",
      phone: "94567890",
      email: "ali.khan@example.com"
    },
    sessions: ["sess-3-1", "sess-3-2", "sess-3-3", "sess-3-4"],
    formResponses: [
      {
        sectionId: "section-1",
        fieldId: "field-1",
        response: "Ali"
      },
      {
        sectionId: "section-1",
        fieldId: "field-2",
        response: "Khan"
      },
      {
        sectionId: "section-2",
        fieldId: "field-3",
        response: "Pakistani"
      }
    ],
    status: "confirmed",
    registeredAt: new Date("2024-03-13")
  },
  // Women's Leadership Forum Registrations
  {
    _id: "reg5",
    eventId: "4",
    userId: "user5",
    attendee: {
      firstName: "Emma",
      lastName: "Chan",
      phone: "95678901",
      email: "emma.chan@example.com"
    },
    sessions: ["sess-4-1", "sess-4-2", "sess-4-3"],
    formResponses: [
      {
        sectionId: "section-1",
        fieldId: "field-1",
        response: "Emma"
      },
      {
        sectionId: "section-1",
        fieldId: "field-2",
        response: "Chan"
      },
      {
        sectionId: "section-2",
        fieldId: "field-3",
        response: "Project Manager"
      }
    ],
    status: "confirmed",
    registeredAt: new Date("2024-03-14")
  }
]

export const getEnhancedEventById = async (id: string): Promise<ZubinEvent | null> => {
  const event = mockZubinEvents.find(event => event._id === id)
  return event || null
}

export const getRegistrationFormById = async (id: string): Promise<RegistrationForm | null> => {
  const form = mockRegistrationForms.find(form => form._id === id)
  return form || null
}

export const getUserById = async (id: string): Promise<User | null> => {
  const user = mockUsers.find(user => user._id === id)
  return user || null
}

export const getEventRegistrationsByEventId = async (eventId: string): Promise<EventRegistration[]> => {
  return mockEventRegistrations.filter(registration => registration.eventId === eventId)
}

export const getEventRegistrationsByUserId = async (userId: string): Promise<EventRegistration[]> => {
  return mockEventRegistrations.filter(registration => registration.userId === userId)
}

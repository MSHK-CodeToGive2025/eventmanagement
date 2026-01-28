import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './src/models/User.js';
import Event from './src/models/Event.js';
import EventRegistration from './src/models/EventRegistration.js';
import RegistrationForm from './src/models/RegistrationForm.js';

dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');
  } catch (error) {
    console.error('✗ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Clear existing data (optional - comment out if you want to keep existing data)
const clearDatabase = async () => {
  try {
    console.log('Clearing existing data...');
    await EventRegistration.deleteMany({});
    await Event.deleteMany({});
    await RegistrationForm.deleteMany({});
    await User.deleteMany({});
    console.log('✓ Database cleared');
  } catch (error) {
    console.error('Error clearing database:', error);
  }
};

// Create sample users
const createUsers = async () => {
  const users = [
    {
      username: 'admin',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      mobile: '+85212345678',
      email: 'admin@zubinfoundation.org',
      role: 'admin'
    },
    {
      username: 'staff1',
      password: 'staff123',
      firstName: 'Sarah',
      lastName: 'Chen',
      mobile: '+85223456789',
      email: 'sarah.chen@zubinfoundation.org',
      role: 'staff'
    },
    {
      username: 'staff2',
      password: 'staff123',
      firstName: 'Michael',
      lastName: 'Wong',
      mobile: '+85234567890',
      email: 'michael.wong@zubinfoundation.org',
      role: 'staff'
    },
    {
      username: 'participant1',
      password: 'user123',
      firstName: 'Priya',
      lastName: 'Sharma',
      mobile: '+85245678901',
      email: 'priya.sharma@example.com',
      role: 'participant'
    },
    {
      username: 'participant2',
      password: 'user123',
      firstName: 'Ahmed',
      lastName: 'Khan',
      mobile: '+85256789012',
      email: 'ahmed.khan@example.com',
      role: 'participant'
    },
    {
      username: 'participant3',
      password: 'user123',
      firstName: 'Fatima',
      lastName: 'Ali',
      mobile: '+85267890123',
      email: 'fatima.ali@example.com',
      role: 'participant'
    },
    {
      username: 'participant4',
      password: 'user123',
      firstName: 'Raj',
      lastName: 'Patel',
      mobile: '+85278901234',
      email: 'raj.patel@example.com',
      role: 'participant'
    },
    {
      username: 'participant5',
      password: 'user123',
      firstName: 'Mei',
      lastName: 'Li',
      mobile: '+85289012345',
      email: 'mei.li@example.com',
      role: 'participant'
    }
  ];

  console.log('Creating users...');
  const createdUsers = [];
  for (const userData of users) {
    const user = new User(userData);
    await user.save();
    createdUsers.push(user);
    console.log(`  ✓ Created user: ${user.username} (${user.role})`);
  }
  return createdUsers;
};

// Create sample registration forms
const createRegistrationForms = async (adminUser) => {
  const forms = [
    {
      title: 'Standard Event Registration',
      description: 'Basic registration form for general events',
      sections: [
        {
          title: 'Personal Information',
          description: 'Please provide your contact details',
          order: 1,
          fields: [
            {
              label: 'Emergency Contact Name',
              type: 'text',
              required: true,
              placeholder: 'Enter emergency contact name',
              order: 1
            },
            {
              label: 'Emergency Contact Phone',
              type: 'phone',
              required: true,
              placeholder: '+85212345678',
              order: 2
            },
            {
              label: 'Dietary Requirements',
              type: 'textarea',
              required: false,
              placeholder: 'Any dietary restrictions or allergies?',
              order: 3
            }
          ]
        },
        {
          title: 'Additional Information',
          description: 'Help us understand your needs',
          order: 2,
          fields: [
            {
              label: 'How did you hear about this event?',
              type: 'dropdown',
              required: false,
              options: ['Social Media', 'Friend/Family', 'Website', 'Email', 'Other'],
              order: 1
            },
            {
              label: 'Do you need translation services?',
              type: 'radio',
              required: false,
              options: ['Yes', 'No'],
              order: 2
            }
          ]
        }
      ],
      isActive: true,
      createdBy: adminUser._id
    },
    {
      title: 'Workshop Registration Form',
      description: 'Registration form for workshops and training sessions',
      sections: [
        {
          title: 'Workshop Details',
          order: 1,
          fields: [
            {
              label: 'Previous Experience',
              type: 'textarea',
              required: false,
              placeholder: 'Describe your previous experience with this topic',
              order: 1
            },
            {
              label: 'Learning Goals',
              type: 'textarea',
              required: false,
              placeholder: 'What do you hope to learn from this workshop?',
              order: 2
            },
            {
              label: 'Accessibility Needs',
              type: 'checkbox',
              required: false,
              options: ['Wheelchair Access', 'Hearing Assistance', 'Visual Assistance', 'Other'],
              order: 3
            }
          ]
        }
      ],
      isActive: true,
      createdBy: adminUser._id
    },
    {
      title: 'Simple Registration',
      description: 'Minimal registration form',
      sections: [
        {
          title: 'Contact',
          order: 1,
          fields: [
            {
              label: 'Additional Notes',
              type: 'textarea',
              required: false,
              placeholder: 'Any additional information?',
              order: 1
            }
          ]
        }
      ],
      isActive: true,
      createdBy: adminUser._id
    }
  ];

  console.log('Creating registration forms...');
  const createdForms = [];
  for (const formData of forms) {
    const form = new RegistrationForm(formData);
    await form.save();
    createdForms.push(form);
    console.log(`  ✓ Created form: ${form.title}`);
  }
  return createdForms;
};

// Create sample events
const createEvents = async (users, forms) => {
  const adminUser = users.find(u => u.role === 'admin');
  const staffUser = users.find(u => u.role === 'staff');
  
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  
  const lastWeek = new Date(now);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const events = [
    {
      title: 'Community Cultural Festival 2024',
      description: 'Join us for a vibrant celebration of diversity with food, music, and cultural performances from various communities in Hong Kong.',
      category: 'Cultural Exchange',
      targetGroup: 'All Hong Kong Residents',
      location: {
        venue: 'Victoria Park',
        address: '1 Hing Fat Street, Causeway Bay, Hong Kong',
        district: 'Wan Chai',
        onlineEvent: false
      },
      startDate: nextWeek,
      endDate: new Date(nextWeek.getTime() + 6 * 60 * 60 * 1000), // 6 hours later
      isPrivate: false,
      status: 'Published',
      registrationFormId: forms[0]._id,
      sessions: [
        {
          title: 'Opening Ceremony',
          description: 'Welcome and opening remarks',
          date: nextWeek,
          startTime: '10:00',
          endTime: '11:00',
          location: { venue: 'Main Stage' },
          capacity: 200
        },
        {
          title: 'Cultural Performances',
          description: 'Traditional dances and music',
          date: nextWeek,
          startTime: '14:00',
          endTime: '16:00',
          location: { venue: 'Performance Area' },
          capacity: 150
        }
      ],
      capacity: 500,
      createdBy: adminUser._id,
      tags: ['festival', 'culture', 'community'],
      reminderTimes: [48, 24, 3],
      defaultReminderMode: 'custom',
      staffContact: {
        name: 'Sarah Chen',
        phone: '+85223456789'
      }
    },
    {
      title: 'Career Development Workshop',
      description: 'Learn essential skills for career advancement including resume writing, interview techniques, and networking strategies.',
      category: 'Career Development',
      targetGroup: 'Professionals',
      location: {
        venue: 'Zubin Foundation Office',
        address: '123 Main Street, Central, Hong Kong',
        district: 'Central and Western',
        onlineEvent: false
      },
      startDate: nextMonth,
      endDate: new Date(nextMonth.getTime() + 4 * 60 * 60 * 1000), // 4 hours later
      isPrivate: false,
      status: 'Published',
      registrationFormId: forms[1]._id,
      sessions: [
        {
          title: 'Resume Writing Session',
          description: 'Learn how to create an effective resume',
          date: nextMonth,
          startTime: '09:00',
          endTime: '11:00',
          location: { venue: 'Training Room A' },
          capacity: 30
        },
        {
          title: 'Interview Skills Workshop',
          description: 'Practice interview techniques',
          date: nextMonth,
          startTime: '13:00',
          endTime: '15:00',
          location: { venue: 'Training Room A' },
          capacity: 30
        }
      ],
      capacity: 30,
      createdBy: staffUser._id,
      tags: ['career', 'workshop', 'professional'],
      reminderTimes: [24],
      defaultReminderMode: 'template'
    },
    {
      title: 'Language Learning Circle - Cantonese',
      description: 'Practice Cantonese in a friendly, supportive environment. All levels welcome!',
      category: 'Language Learning',
      targetGroup: 'Ethnic Minorities',
      location: {
        venue: 'Community Center',
        address: '456 Community Road, Kowloon',
        district: 'Yau Tsim Mong',
        onlineEvent: false
      },
      startDate: tomorrow,
      endDate: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000), // 2 hours later
      isPrivate: false,
      status: 'Published',
      registrationFormId: forms[2]._id,
      capacity: 20,
      createdBy: staffUser._id,
      tags: ['language', 'cantonese', 'learning'],
      reminderTimes: [24, 3]
    },
    {
      title: 'Health & Wellness Seminar',
      description: 'Learn about maintaining good health and wellness practices. Topics include nutrition, exercise, and mental health.',
      category: 'Health & Wellness',
      targetGroup: 'All Hong Kong Residents',
      location: {
        venue: 'Online',
        address: 'Virtual Event',
        district: 'Central and Western',
        onlineEvent: true,
        meetingLink: 'https://zoom.us/j/123456789'
      },
      startDate: new Date(nextWeek.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days after next week
      endDate: new Date(nextWeek.getTime() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3 hours later
      isPrivate: false,
      status: 'Published',
      registrationFormId: forms[0]._id,
      capacity: 100,
      createdBy: adminUser._id,
      tags: ['health', 'wellness', 'seminar'],
      reminderTimes: [24]
    },
    {
      title: 'Youth Leadership Program',
      description: 'A comprehensive program designed to develop leadership skills in young people aged 13-25.',
      category: 'Youth Programs',
      targetGroup: 'Youth (13-25)',
      location: {
        venue: 'Youth Center',
        address: '789 Youth Avenue, New Territories',
        district: 'Sha Tin',
        onlineEvent: false
      },
      startDate: new Date(nextMonth.getTime() + 7 * 24 * 60 * 60 * 1000), // 1 week after next month
      endDate: new Date(nextMonth.getTime() + 7 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000), // 5 hours later
      isPrivate: true,
      status: 'Published',
      registrationFormId: forms[1]._id,
      participants: [users.find(u => u.role === 'participant')._id], // Only specific participants can see
      capacity: 25,
      createdBy: staffUser._id,
      tags: ['youth', 'leadership', 'program'],
      reminderTimes: [48, 24]
    },
    {
      title: 'Completed Event - Past Workshop',
      description: 'This is a past event that has been completed.',
      category: 'Education & Training',
      targetGroup: 'All Hong Kong Residents',
      location: {
        venue: 'Training Center',
        address: '321 Training Street, Hong Kong',
        district: 'Kwun Tong',
        onlineEvent: false
      },
      startDate: lastWeek,
      endDate: new Date(lastWeek.getTime() + 3 * 60 * 60 * 1000),
      isPrivate: false,
      status: 'Completed',
      registrationFormId: forms[0]._id,
      capacity: 50,
      registeredCount: 45,
      createdBy: adminUser._id,
      tags: ['completed', 'workshop']
    },
    {
      title: 'Draft Event - Not Published',
      description: 'This event is still in draft mode and not yet published.',
      category: 'Community Building',
      targetGroup: 'Ethnic Minorities',
      location: {
        venue: 'TBD',
        address: 'To be determined',
        district: 'Central and Western',
        onlineEvent: false
      },
      startDate: new Date(nextMonth.getTime() + 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(nextMonth.getTime() + 14 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      isPrivate: false,
      status: 'Draft',
      registrationFormId: forms[2]._id,
      capacity: 40,
      createdBy: staffUser._id,
      tags: ['draft']
    }
  ];

  console.log('Creating events...');
  const createdEvents = [];
  for (const eventData of events) {
    const event = new Event(eventData);
    await event.save();
    createdEvents.push(event);
    console.log(`  ✓ Created event: ${event.title} (${event.status})`);
  }
  return createdEvents;
};

// Create sample event registrations
const createEventRegistrations = async (users, events) => {
  const participants = users.filter(u => u.role === 'participant');
  const publishedEvents = events.filter(e => e.status === 'Published' && !e.isPrivate);

  console.log('Creating event registrations...');
  const registrations = [];

  // Register participants for various events
  if (publishedEvents.length > 0 && participants.length > 0) {
    // Event 1: Community Cultural Festival - multiple registrations
    const event1 = publishedEvents[0];
    for (let i = 0; i < Math.min(3, participants.length); i++) {
      const participant = participants[i];
      const registration = new EventRegistration({
        eventId: event1._id,
        userId: participant._id,
        attendee: {
          firstName: participant.firstName,
          lastName: participant.lastName,
          phone: participant.mobile,
          email: participant.email
        },
        sessions: event1.sessions ? event1.sessions.map(s => s._id.toString()) : [],
        formResponses: [
          {
            sectionId: 'section1',
            fieldId: 'emergency_contact',
            response: 'John Doe'
          },
          {
            sectionId: 'section1',
            fieldId: 'emergency_phone',
            response: '+85298765432'
          }
        ],
        status: 'registered',
        registeredAt: new Date()
      });
      await registration.save();
      registrations.push(registration);
      
      // Update event registered count
      await Event.findByIdAndUpdate(event1._id, { $inc: { registeredCount: 1 } });
    }
    console.log(`  ✓ Created ${Math.min(3, participants.length)} registrations for: ${event1.title}`);

    // Event 2: Career Development Workshop
    if (publishedEvents.length > 1) {
      const event2 = publishedEvents[1];
      const participant = participants[0];
      const registration = new EventRegistration({
        eventId: event2._id,
        userId: participant._id,
        attendee: {
          firstName: participant.firstName,
          lastName: participant.lastName,
          phone: participant.mobile,
          email: participant.email
        },
        sessions: event2.sessions ? [event2.sessions[0]._id.toString()] : [],
        formResponses: [
          {
            sectionId: 'section1',
            fieldId: 'previous_experience',
            response: 'Some experience in the field'
          }
        ],
        status: 'registered',
        registeredAt: new Date()
      });
      await registration.save();
      registrations.push(registration);
      await Event.findByIdAndUpdate(event2._id, { $inc: { registeredCount: 1 } });
      console.log(`  ✓ Created registration for: ${event2.title}`);
    }

    // Event 3: Language Learning Circle
    if (publishedEvents.length > 2) {
      const event3 = publishedEvents[2];
      for (let i = 0; i < Math.min(2, participants.length); i++) {
        const participant = participants[i];
        const registration = new EventRegistration({
          eventId: event3._id,
          userId: participant._id,
          attendee: {
            firstName: participant.firstName,
            lastName: participant.lastName,
            phone: participant.mobile,
            email: participant.email
          },
          status: 'registered',
          registeredAt: new Date()
        });
        await registration.save();
        registrations.push(registration);
        await Event.findByIdAndUpdate(event3._id, { $inc: { registeredCount: 1 } });
      }
      console.log(`  ✓ Created ${Math.min(2, participants.length)} registrations for: ${event3.title}`);
    }
  }

  return registrations;
};

// Main function
const seedDatabase = async () => {
  try {
    await connectDB();
    
    // Uncomment the line below if you want to clear existing data first
    // await clearDatabase();
    
    console.log('\n=== Seeding Database ===\n');
    
    const users = await createUsers();
    console.log('');
    
    const adminUser = users.find(u => u.role === 'admin');
    const forms = await createRegistrationForms(adminUser);
    console.log('');
    
    const events = await createEvents(users, forms);
    console.log('');
    
    const registrations = await createEventRegistrations(users, events);
    console.log('');
    
    console.log('=== Seeding Complete ===\n');
    console.log(`✓ Created ${users.length} users`);
    console.log(`✓ Created ${forms.length} registration forms`);
    console.log(`✓ Created ${events.length} events`);
    console.log(`✓ Created ${registrations.length} event registrations`);
    console.log('\n=== Sample Login Credentials ===');
    console.log('Admin:');
    console.log('  Username: admin');
    console.log('  Password: admin123');
    console.log('\nStaff:');
    console.log('  Username: staff1');
    console.log('  Password: staff123');
    console.log('\nParticipant:');
    console.log('  Username: participant1');
    console.log('  Password: user123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();



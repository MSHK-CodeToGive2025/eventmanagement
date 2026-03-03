import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  // We don't need to explicitly define _id in the eventSchema. 
  // In Mongoose, the _id field is automatically added to all schemas by default. 
  // When you create a new document using this schema, Mongoose will automatically generate a unique _id field using MongoDB's ObjectId.
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      "Education & Training",
      "Cultural Exchange",
      "Health & Wellness",
      "Career Development",
      "Community Building",
      "Language Learning",
      "Social Integration",
      "Youth Programs",
      "Women's Empowerment",
      "Other"
    ]
  },
  targetGroup: {
    type: String,
    required: true,
    enum: [
      "All Hong Kong Residents",
      "Ethnic Minorities",
      "South Asian Community",
      "Women",
      "Youth (13-25)",
      "Children (0-12)",
      "Seniors (65+)",
      "Professionals",
      "Newcomers to Hong Kong",
      "Other"
    ]
  },
  location: {
    venue: { type: String, required: false },
    address: { type: String, required: false },
    district: {
      type: String,
      required: false,
      enum: [
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
        "Yuen Long"
      ]
    },
    onlineEvent: { type: Boolean, required: true },
    meetingLink: { type: String, required: false }
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  coverImage: {
    data: {
      type: Buffer,
      required: false
    },
    contentType: {
      type: String,
      required: false
    },
    size: {
      type: Number,
      required: false,
      max: 500 * 1024 // 500KB limit
    }
  },
  isPrivate: {
    type: Boolean,
    required: true,
    default: false
  },
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Cancelled', 'Completed'],
    default: 'Draft'
  },
  registrationFormId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RegistrationForm',
    required: true
  },
  sessions: [{
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId()
    },
    title: {
      type: String,
      required: true
    },
    description: String,
    date: {
      type: Date,
      required: true
    },
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    },
    location: {
      venue: String,
      meetingLink: String
    },
    capacity: Number
  }],
  capacity: {
    type: Number,
    required: false,
    min: 1
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedAt: {
    type: Date
  },
  tags: [{
    type: String
  }],
  registeredCount: {
    type: Number,
    default: 0
  },
  // Reminder configuration
  reminderTimes: {
    type: [Number], // Array of hours before event start (e.g., [48, 24, 3])
    default: [24], // Default to 24 hours before
    validate: {
      validator: function(value) {
        // Ensure all values are positive numbers
        return value.every(hours => typeof hours === 'number' && hours > 0);
      },
      message: 'Reminder times must be positive numbers (hours before event)'
    }
  },
  defaultReminderMode: {
    type: String,
    enum: ['template', 'custom'],
    default: 'custom',
    required: true
  },
  remindersSent: {
    type: [String], // Array of reminder keys (e.g., "main_24", "session_Session 1_24")
    default: []
  },
  // Staff contact information for notifications
  staffContact: {
    name: {
      type: String,
      required: false,
      trim: true
    },
    phone: {
      type: String,
      required: false,
      trim: true
    }
  },
  // New fields added to Event schema
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }], // Users authorized to view this private event
});

// Validate location: online events need meetingLink; in-person need venue, address, district
eventSchema.pre('validate', function(next) {
  if (!this.location) return next();
  const loc = this.location;
  const hasMeetingLink = loc.meetingLink && String(loc.meetingLink).trim();
  const isOnline = loc.onlineEvent === true || !!hasMeetingLink;
  if (isOnline) {
    if (!hasMeetingLink) {
      next(new Error('Meeting link is required for online events'));
      return;
    }
  } else {
    if (!loc.venue || !String(loc.venue).trim()) {
      next(new Error('Venue is required for in-person events'));
      return;
    }
    if (!loc.address || !String(loc.address).trim()) {
      next(new Error('Address is required for in-person events'));
      return;
    }
    if (!loc.district || !String(loc.district).trim()) {
      next(new Error('District is required for in-person events'));
      return;
    }
  }
  next();
});

// Virtual field for available spots
eventSchema.virtual('availableSpots').get(function() {
  return this.capacity ? this.capacity - this.registeredCount : null;
});

// Virtual field for whether the event is full
eventSchema.virtual('isFull').get(function() {
  return this.capacity ? this.registeredCount >= this.capacity : false;
});

// Ensure virtuals are included in JSON output
eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

const Event = mongoose.model('Event', eventSchema);

export default Event; 
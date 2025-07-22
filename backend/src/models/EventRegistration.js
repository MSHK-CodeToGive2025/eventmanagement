import mongoose from 'mongoose';

const eventRegistrationSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  attendee: {
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: false
    }
  },
  sessions: [{
    type: String // Session IDs as strings (matching frontend interface)
  }],
  formResponses: [{
    sectionId: {
      type: String,
      required: true
    },
    fieldId: {
      type: String,
      required: true
    },
    response: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    }
  }],
  status: {
    type: String,
    enum: ['registered', 'cancelled', 'rejected'],
    default: 'registered'
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  cancelledAt: {
    type: Date
  },
  notes: {
    type: String
  }
});

// Ensure virtuals are included in JSON output
eventRegistrationSchema.set('toJSON', { virtuals: true });
eventRegistrationSchema.set('toObject', { virtuals: true });

const EventRegistration = mongoose.model('EventRegistration', eventRegistrationSchema);

export default EventRegistration;

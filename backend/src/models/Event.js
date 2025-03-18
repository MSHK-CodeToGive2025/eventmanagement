import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  image: {
    data: {
      type: Buffer,
      required: false
    },
    contentType: {
      type: String,
      required: false
    }
  },
  category: {
    type: String,
    required: true,
    enum: ['educational', 'career', 'support']
  },
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
    type: String,
    required: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  registeredParticipants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  waitlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual field for available spots
eventSchema.virtual('availableSpots').get(function() {
  return this.capacity - this.registeredParticipants.length;
});

// Virtual field for whether the event is full
eventSchema.virtual('isFull').get(function() {
  return this.registeredParticipants.length >= this.capacity;
});

// Ensure virtuals are included in JSON output
eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

const Event = mongoose.model('Event', eventSchema);

export default Event; 
import mongoose from 'mongoose';

const registrationFormSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  sections: [{
    title: {
      type: String,
      required: true
    },
    description: String,
    fields: [{
      label: {
        type: String,
        required: true
      },
      type: {
        type: String,
        enum: ['text', 'email', 'phone', 'date', 'dropdown', 'checkbox', 'radio', 'number', 'textarea', 'file'],
        required: true
      },
      required: {
        type: Boolean,
        default: false
      },
      placeholder: String,
      helpText: String,
      defaultValue: mongoose.Schema.Types.Mixed,
      options: [String],
      validation: {
        pattern: String,
        minLength: Number,
        maxLength: Number,
        minValue: Number,
        maxValue: Number,
        message: String
      },
      order: {
        type: Number,
        required: true
      }
    }],
    order: {
      type: Number,
      required: true
    }
  }],
  isActive: {
    type: Boolean,
    default: true
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
  }
});

// Update the updatedAt timestamp before saving
registrationFormSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Ensure virtuals are included in JSON output
registrationFormSchema.set('toJSON', { virtuals: true });
registrationFormSchema.set('toObject', { virtuals: true });

const RegistrationForm = mongoose.model('RegistrationForm', registrationFormSchema);

export default RegistrationForm;

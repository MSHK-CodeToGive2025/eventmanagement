import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Event from './src/models/Event.js';
import EventRegistration from './src/models/EventRegistration.js';
import User from './src/models/User.js';
import reminderService from './src/services/reminderService.js';

dotenv.config();

/**
 * Test Script for WhatsApp Reminder Flow
 * 
 * This script helps test the WhatsApp reminder sending functionality by:
 * 1. Creating a test event with a near-future date
 * 2. Registering a test participant
 * 3. Triggering the reminder service
 * 
 * Usage:
 *   node test-whatsapp-reminder.js
 */

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');
  } catch (error) {
    console.error('✗ MongoDB connection error:', error);
    process.exit(1);
  }
};

const checkTwilioConfig = () => {
  console.log('\n=== Checking Twilio Configuration ===');
  const required = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_WHATSAPP_NUMBER'];
  const optional = ['TWILIO_WHATSAPP_TEMPLATE_SID'];
  
  let allConfigured = true;
  
  for (const key of required) {
    const value = process.env[key];
    if (value && value.length > 0 && !value.includes('your_') && !value.includes('xxxxxxxx')) {
      console.log(`✓ ${key}: [CONFIGURED]`);
    } else {
      console.log(`✗ ${key}: [NOT CONFIGURED]`);
      allConfigured = false;
    }
  }
  
  for (const key of optional) {
    const value = process.env[key];
    if (value && value.length > 0 && !value.includes('your_') && !value.includes('xxxxxxxx')) {
      console.log(`✓ ${key}: [CONFIGURED] (Optional)`);
    } else {
      console.log(`- ${key}: [NOT CONFIGURED] (Optional)`);
    }
  }
  
  if (!allConfigured) {
    console.log('\n⚠️  WARNING: Twilio credentials not fully configured!');
    console.log('   Please add Twilio credentials to backend/.env file');
    console.log('   See TWILIO_SETUP_AND_TESTING.md for details');
    return false;
  }
  
  console.log('\n✓ All required Twilio credentials are configured');
  return true;
};

const createTestEvent = async (adminUser) => {
  console.log('\n=== Creating Test Event ===');
  
  // Create event 1 hour from now
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
  const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
  
  // Get a registration form (or create a simple one)
  const RegistrationForm = mongoose.model('RegistrationForm');
  let form = await RegistrationForm.findOne();
  
  if (!form) {
    console.log('⚠️  No registration form found. Creating a simple one...');
    form = new RegistrationForm({
      title: 'Test Registration Form',
      description: 'Simple form for testing',
      sections: [{
        title: 'Contact',
        order: 1,
        fields: [{
          label: 'Notes',
          type: 'textarea',
          required: false,
          order: 1
        }]
      }],
      isActive: true,
      createdBy: adminUser._id
    });
    await form.save();
  }
  
  const testEvent = new Event({
    title: '🧪 TEST: WhatsApp Reminder Test Event',
    description: 'This is a test event created to verify WhatsApp reminder functionality. You can delete this after testing.',
    category: 'Other',
    targetGroup: 'All Hong Kong Residents',
    location: {
      venue: 'Test Venue',
      address: '123 Test Street, Hong Kong',
      district: 'Central and Western',
      onlineEvent: false
    },
    startDate: oneHourLater,
    endDate: twoHoursLater,
    isPrivate: false,
    status: 'Published',
    registrationFormId: form._id,
    capacity: 10,
    createdBy: adminUser._id,
    reminderTimes: [1], // 1 hour before (should trigger immediately if we're close enough)
    defaultReminderMode: 'template', // Use template mode
    tags: ['test', 'whatsapp-reminder']
  });
  
  await testEvent.save();
  console.log(`✓ Created test event: ${testEvent.title}`);
  console.log(`  Event ID: ${testEvent._id}`);
  console.log(`  Start Date: ${testEvent.startDate.toISOString()}`);
  console.log(`  Reminder Times: ${testEvent.reminderTimes.join(', ')} hours before`);
  
  return testEvent;
};

const createTestRegistration = async (event, participant) => {
  console.log('\n=== Creating Test Registration ===');
  
  // Use the specified test phone number
  const testPhone = process.env.TEST_PHONE_NUMBER || '+85260517938';
  
  console.log(`Using test phone number: ${testPhone}`);
  console.log('⚠️  NOTE: Make sure this number is registered in Twilio Sandbox if using sandbox mode');
  
  const registration = new EventRegistration({
    eventId: event._id,
    userId: participant._id,
    attendee: {
      firstName: participant.firstName,
      lastName: participant.lastName,
      phone: testPhone, // Use test phone number
      email: participant.email
    },
    status: 'registered',
    registeredAt: new Date()
  });
  
  await registration.save();
  
  // Update event registered count
  await Event.findByIdAndUpdate(event._id, { $inc: { registeredCount: 1 } });
  
  console.log(`✓ Created registration for: ${participant.firstName} ${participant.lastName}`);
  console.log(`  Phone: ${testPhone}`);
  console.log(`  Registration ID: ${registration._id}`);
  
  return registration;
};

const triggerReminders = async () => {
  console.log('\n=== Triggering Reminder Service ===');
  console.log('This will process all events and send reminders if conditions are met...\n');
  
  try {
    await reminderService.triggerReminders();
    console.log('\n✓ Reminder processing completed');
    console.log('Check the logs above for detailed information about what was processed');
  } catch (error) {
    console.error('✗ Error triggering reminders:', error);
  }
};

const cleanup = async (eventId) => {
  console.log('\n=== Cleanup ===');
  const shouldCleanup = process.env.CLEANUP_TEST_DATA !== 'false';
  
  if (shouldCleanup) {
    try {
      // Delete test registrations
      await EventRegistration.deleteMany({ eventId });
      console.log('✓ Deleted test registrations');
      
      // Delete test event
      await Event.findByIdAndDelete(eventId);
      console.log('✓ Deleted test event');
      
      console.log('\n💡 To keep test data, set CLEANUP_TEST_DATA=false');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  } else {
    console.log('⚠️  Cleanup skipped (CLEANUP_TEST_DATA=false)');
    console.log(`   Test event ID: ${eventId}`);
    console.log('   You can manually delete this event from the database');
  }
};

const main = async () => {
  try {
    console.log('🧪 WhatsApp Reminder Test Script');
    console.log('================================\n');
    
    // Connect to database
    await connectDB();
    
    // Check Twilio configuration
    const twilioConfigured = checkTwilioConfig();
    if (!twilioConfigured) {
      console.log('\n⚠️  Continuing anyway, but reminders may not send...\n');
    }
    
    // Get admin user
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.error('✗ No admin user found. Please run seed-data.js first.');
      process.exit(1);
    }
    
    // Get a participant user
    const participant = await User.findOne({ role: 'participant' });
    if (!participant) {
      console.error('✗ No participant user found. Please run seed-data.js first.');
      process.exit(1);
    }
    
    // Create test event
    const testEvent = await createTestEvent(adminUser);
    
    // Create test registration
    const registration = await createTestRegistration(testEvent, participant);
    
    // Wait a moment
    console.log('\n⏳ Waiting 2 seconds before triggering reminders...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Trigger reminders
    await triggerReminders();
    
    // Cleanup
    await cleanup(testEvent._id);
    
    console.log('\n✅ Test completed!');
    console.log('\nNext steps:');
    console.log('1. Check your WhatsApp for the reminder message');
    console.log('2. Check backend logs for detailed processing information');
    console.log('3. If using Twilio Sandbox, make sure your test number has joined');
    console.log('4. Verify the message format and content');
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Test script error:', error);
    process.exit(1);
  }
};

main();


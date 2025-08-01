// Simple test script to verify staff contact feature
import Event from './src/models/Event.js';
import reminderService from './src/services/reminderService.js';

// Test data
const testEvent = {
  title: "Test Event",
  description: "A test event",
  category: "Education & Training",
  targetGroup: "All Hong Kong Residents",
  location: {
    venue: "Test Venue",
    address: "Test Address",
    district: "Central and Western",
    onlineEvent: false
  },
  startDate: new Date(),
  endDate: new Date(),
  isPrivate: false,
  status: "Published",
  registrationFormId: "test-form-id",
  sessions: [],
  reminderTimes: [24],
  remindersSent: [],
  staffContact: {
    name: "John Doe",
    phone: "+852 1234 5678"
  }
};

// Test the createReminderMessage function
function testReminderMessage() {
  console.log("Testing reminder message with staff contact...");
  
  // Mock the createReminderMessage function
  const createReminderMessage = reminderService.createReminderMessage.bind(reminderService);
  
  try {
    const message = createReminderMessage(testEvent, 24, 'main event', new Date());
    console.log("Generated message:");
    console.log(message);
    
    // Check if staff contact is included
    if (message.includes("Contact John Doe on +852 1234 5678 for any issue")) {
      console.log("✅ Staff contact information correctly included in message");
    } else {
      console.log("❌ Staff contact information not found in message");
    }
    
    // Test without staff contact
    const eventWithoutStaff = { ...testEvent, staffContact: null };
    const messageWithoutStaff = createReminderMessage(eventWithoutStaff, 24, 'main event', new Date());
    console.log("\nMessage without staff contact:");
    console.log(messageWithoutStaff);
    
    if (!messageWithoutStaff.includes("Contact")) {
      console.log("✅ Message correctly excludes staff contact when not provided");
    } else {
      console.log("❌ Staff contact incorrectly included when not provided");
    }
    
  } catch (error) {
    console.error("Error testing reminder message:", error);
  }
}

// Run the test
testReminderMessage(); 
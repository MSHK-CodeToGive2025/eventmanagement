import dotenv from 'dotenv';
import twilio from 'twilio';
import { formatForWhatsApp } from './src/utils/phoneUtils.js';

dotenv.config();

/**
 * Direct WhatsApp Template Test Script
 * 
 * This script sends a direct WhatsApp message using the Twilio template
 * to test the configuration without going through the full reminder service.
 * 
 * Usage:
 *   node test-whatsapp-direct.js
 */

const sendTemplateMessage = async () => {
  console.log('🧪 Direct WhatsApp Template Test');
  console.log('==================================\n');

  // Check configuration
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;
  const templateSid = process.env.TWILIO_WHATSAPP_TEMPLATE_SID;
  const testPhone = '+85260517938';

  console.log('=== Configuration Check ===');
  console.log(`Account SID: ${accountSid ? '✓ Configured' : '✗ Missing'}`);
  console.log(`Auth Token: ${authToken ? '✓ Configured' : '✗ Missing'}`);
  console.log(`WhatsApp Number: ${whatsappNumber || '✗ Missing'}`);
  console.log(`Template SID: ${templateSid || '✗ Missing'}`);
  console.log(`Test Phone: ${testPhone}\n`);

  if (!accountSid || !authToken || !whatsappNumber || !templateSid) {
    console.error('✗ Missing required Twilio configuration!');
    console.error('Please check your backend/.env file');
    process.exit(1);
  }

  // Initialize Twilio client
  const client = twilio(accountSid, authToken);
  console.log('✓ Twilio client initialized\n');

  // Format phone number
  const formattedNumber = formatForWhatsApp(testPhone);
  console.log(`Formatted phone number: ${formattedNumber}\n`);

  // Create template variables matching the exact template structure:
  // Template: "🔔 Event Reminder: {{1}}\n📋 Session: {{2}}\n\n⏰ The session will start in {{3}}\n📅 Date: {{4}}\n🕐 Time: {{5}}\n📍 Location: {{6}}\n👤 Contact: {{7}}\n📞 Phone: {{8}}\n\nWe look forward to seeing you!"
  // Variable 1: Event title
  // Variable 2: Session title (empty for main events, or session name for sessions)
  // Variable 3: Time until event
  // Variable 4: Date
  // Variable 5: Time
  // Variable 6: Location
  // Variable 7: Contact name
  // Variable 8: Contact phone
  const now = new Date();
  const eventDate = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
  
  // Create template variables object - ensure all values are strings
  // Note: Variable 2 can be empty for main events, but template will show "📋 Session: " 
  const templateVariablesObj = {
    "1": "🧪 TEST: WhatsApp Reminder Test Event", // Event title
    "2": "", // Session title (empty for main event, or "Main Event" if you want text)
    "3": "1 hour", // Time until event
    "4": eventDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }), // Date
    "5": eventDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }), // Time
    "6": "Test Venue, Central and Western", // Location
    "7": "Sarah Chen", // Contact name
    "8": "+85223456789" // Contact phone
  };

  // Format template variables correctly for Twilio Content API
  // Twilio expects contentVariables as an OBJECT, not a JSON string
  const contentVariables = templateVariablesObj;
  
  console.log('=== Template Variables ===');
  console.log(JSON.stringify(contentVariables, null, 2));
  console.log('');

  try {
    console.log('📤 Sending WhatsApp message using template...');
    console.log(`   From: ${whatsappNumber}`);
    console.log(`   To: whatsapp:${formattedNumber}`);
    console.log(`   Template SID: ${templateSid}\n`);

    const message = await client.messages.create({
      from: whatsappNumber,
      contentSid: templateSid,
      contentVariables: contentVariables, // Object directly
      to: `whatsapp:${formattedNumber}`
    });

    console.log('✅ Message sent successfully!');
    console.log(`   Message SID: ${message.sid}`);
    console.log(`   Status: ${message.status}`);
    console.log(`   Date Created: ${message.dateCreated}`);
    console.log('\n📱 Check your WhatsApp (+85260517938) for the message!');
    
    return message;
  } catch (error) {
    console.error('✗ Error sending message:');
    console.error(`   Code: ${error.code}`);
    console.error(`   Message: ${error.message}`);
    console.error(`   More Info: ${error.moreInfo || 'N/A'}`);
    
    if (error.code === 21608) {
      console.error('\n⚠️  This error usually means:');
      console.error('   - The recipient number has not joined the Twilio Sandbox');
      console.error('   - Or the number is not approved for WhatsApp messaging');
    } else if (error.code === 21211) {
      console.error('\n⚠️  Invalid phone number format');
      console.error('   Make sure the number is in E.164 format: +[country code][number]');
    }
    
    throw error;
  }
};

// Also test custom message mode for comparison
const sendCustomMessage = async () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;
  const testPhone = '+85260517938';

  if (!accountSid || !authToken || !whatsappNumber) {
    return;
  }

  const client = twilio(accountSid, authToken);
  const formattedNumber = formatForWhatsApp(testPhone);

  const customMessage = `🔔 Event Reminder: "🧪 TEST: WhatsApp Reminder Test Event"

⏰ The event will start in 1 hour
📅 Date: ${new Date(Date.now() + 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
🕐 Time: ${new Date(Date.now() + 60 * 60 * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
📍 Location: Test Venue, Central and Western
👤 Contact: Sarah Chen
📞 Phone: +85223456789

We look forward to seeing you!`;

  try {
    console.log('\n📤 Sending custom WhatsApp message (for comparison)...');
    const message = await client.messages.create({
      body: customMessage,
      from: whatsappNumber,
      to: `whatsapp:${formattedNumber}`
    });

    console.log('✅ Custom message sent successfully!');
    console.log(`   Message SID: ${message.sid}`);
  } catch (error) {
    console.error('✗ Error sending custom message:', error.message);
  }
};

const checkTemplate = async () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const templateSid = process.env.TWILIO_WHATSAPP_TEMPLATE_SID;

  if (!accountSid || !authToken || !templateSid) {
    return;
  }

  const client = twilio(accountSid, authToken);

  try {
    console.log('\n=== Checking Template Structure ===');
    // Try to fetch template content (if API supports it)
    // Note: This might not work depending on Twilio API version
    console.log('Template SID:', templateSid);
    console.log('Note: Template structure verification may require Twilio Console access');
  } catch (error) {
    console.log('Could not verify template structure:', error.message);
  }
};

const main = async () => {
  try {
    // First, try sending a custom message to verify basic setup
    console.log('=== Step 1: Testing Custom Message (Basic Setup) ===\n');
    await sendCustomMessage();
    
    console.log('\n=== Step 2: Checking Template ===\n');
    await checkTemplate();
    
    console.log('\n=== Step 3: Testing Template Message ===\n');
    // Try template message
    try {
      await sendTemplateMessage();
    } catch (error) {
      console.log('\n⚠️  Template message failed. This might be due to:');
      console.log('   1. Template structure mismatch (wrong number of variables)');
      console.log('   2. Template not approved/active');
      console.log('   3. Template variable format issue');
      console.log('\n💡 Custom message worked, so basic Twilio setup is correct.');
      console.log('   Please check the template structure in Twilio Console.');
    }
    
    console.log('\n✅ Test completed!');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Test failed');
    process.exit(1);
  }
};

main();


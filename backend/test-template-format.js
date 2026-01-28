import dotenv from 'dotenv';
import twilio from 'twilio';
import { formatForWhatsApp } from './src/utils/phoneUtils.js';

dotenv.config();

/**
 * Test different contentVariables formats to find the correct one
 */

const testFormats = async () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;
  const templateSid = process.env.TWILIO_WHATSAPP_TEMPLATE_SID;
  const testPhone = '+85260517938';

  const client = twilio(accountSid, authToken);
  const formattedNumber = formatForWhatsApp(testPhone);

  const now = new Date();
  const eventDate = new Date(now.getTime() + 60 * 60 * 1000);

  const vars = {
    "1": "🧪 TEST: WhatsApp Reminder Test Event",
    "2": "",
    "3": "1 hour",
    "4": eventDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    "5": eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    "6": "Test Venue, Central and Western",
    "7": "Sarah Chen",
    "8": "+85223456789"
  };

  console.log('Testing different contentVariables formats...\n');

  // Format 1: JSON string
  console.log('Format 1: JSON string');
  try {
    const msg1 = await client.messages.create({
      from: whatsappNumber,
      contentSid: templateSid,
      contentVariables: JSON.stringify(vars),
      to: `whatsapp:${formattedNumber}`
    });
    console.log('✅ SUCCESS with JSON string format!');
    console.log(`   Message SID: ${msg1.sid}`);
    return;
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
  }

  // Format 2: Object directly
  console.log('\nFormat 2: Object directly');
  try {
    const msg2 = await client.messages.create({
      from: whatsappNumber,
      contentSid: templateSid,
      contentVariables: vars,
      to: `whatsapp:${formattedNumber}`
    });
    console.log('✅ SUCCESS with object format!');
    console.log(`   Message SID: ${msg2.sid}`);
    return;
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
  }

  // Format 3: Different JSON structure
  console.log('\nFormat 3: Different JSON structure');
  try {
    const vars3 = {
      "variables": vars
    };
    const msg3 = await client.messages.create({
      from: whatsappNumber,
      contentSid: templateSid,
      contentVariables: JSON.stringify(vars3),
      to: `whatsapp:${formattedNumber}`
    });
    console.log('✅ SUCCESS with nested structure!');
    console.log(`   Message SID: ${msg3.sid}`);
    return;
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
  }

  console.log('\n⚠️  All formats failed. The issue might be:');
  console.log('   1. Template not approved/active in Twilio');
  console.log('   2. Template structure mismatch');
  console.log('   3. Account permissions issue');
};

testFormats().catch(console.error);



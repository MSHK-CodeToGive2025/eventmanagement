import express from 'express';
import User from '../models/User.js';
import { formatPhoneNumberForTwilio } from '../utils/phoneUtils.js';

const router = express.Router();

// Twilio sends incoming WhatsApp messages here via webhook.
// Handles STOP/START opt-out commands and responds with TwiML.
router.post('/incoming', async (req, res) => {
  try {
    const { From, Body } = req.body;

    if (!From || !Body) {
      return res.type('text/xml').send('<Response></Response>');
    }

    // Strip the 'whatsapp:' prefix to get the raw phone number
    const rawNumber = From.replace(/^whatsapp:/, '');
    const command = Body.trim().toUpperCase();

    console.log(`[WhatsApp Webhook] Incoming from ${rawNumber}: "${Body.trim()}"`);

    if (command === 'STOP') {
      // Look up user by mobile number (try exact match, then normalized)
      let user = await User.findOne({ mobile: rawNumber });
      if (!user) {
        const formatted = formatPhoneNumberForTwilio(rawNumber);
        if (formatted.isValid) {
          user = await User.findOne({ mobile: formatted.formatted });
        }
      }

      if (user) {
        user.whatsappOptOut = true;
        await user.save();
        console.log(`[WhatsApp Webhook] User ${user.firstName} ${user.lastName} (${rawNumber}) opted out`);
      } else {
        console.log(`[WhatsApp Webhook] STOP received from unknown number ${rawNumber}`);
      }

      res.type('text/xml').send(
        '<Response><Message>You have been unsubscribed from Zubin Foundation WhatsApp messages. Reply START to re-subscribe.</Message></Response>'
      );
    } else if (command === 'START') {
      let user = await User.findOne({ mobile: rawNumber });
      if (!user) {
        const formatted = formatPhoneNumberForTwilio(rawNumber);
        if (formatted.isValid) {
          user = await User.findOne({ mobile: formatted.formatted });
        }
      }

      if (user) {
        user.whatsappOptOut = false;
        await user.save();
        console.log(`[WhatsApp Webhook] User ${user.firstName} ${user.lastName} (${rawNumber}) opted back in`);
      } else {
        console.log(`[WhatsApp Webhook] START received from unknown number ${rawNumber}`);
      }

      res.type('text/xml').send(
        '<Response><Message>You have been re-subscribed to Zubin Foundation WhatsApp messages.</Message></Response>'
      );
    } else {
      // Not a command — acknowledge with empty TwiML
      res.type('text/xml').send('<Response></Response>');
    }
  } catch (error) {
    console.error('[WhatsApp Webhook] Error:', error.message);
    res.type('text/xml').send('<Response></Response>');
  }
});

export default router;

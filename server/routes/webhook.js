const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

router.post('/', async (req, res) => {
  const payload = req.body;
  const io = req.app.get('io');

  try {
    const entries = payload.metaData?.entry || [];
    let savedCount = 0;

    for (const entry of entries) {
      for (const change of entry.changes) {
        if (change.field === 'messages') {
          const contacts = change.value.contacts || [];
          const messages = change.value.messages || [];

          if (contacts.length && messages.length) {
            const contact = contacts[0];
            const wa_id = contact.wa_id || 'unknown';
            const name = contact.profile?.name || 'Unknown';
            const number = change.value.metadata?.display_phone_number || '';

            for (const m of messages) {
              const text = m.text?.body || '';
              const timestamp = m.timestamp
                ? new Date(parseInt(m.timestamp, 10) * 1000)
                : new Date();

              const doc = {
                id: m.id || null,
                meta_msg_id: m.meta_msg_id || null,
                wa_id,
                name,
                number,
                text,
                media: m.media || null,
                status: 'sent',
                raw_payload: m,
                createdAt: timestamp,
                updatedAt: timestamp,
              };

              const savedMsg = await Message.create(doc);
              savedCount++;

              // Emit new message event for realtime frontend update
              if (io) io.emit('message:new', savedMsg);
            }
          }
        } else if (change.field === 'statuses' || payload.type === 'status') {
          // Optional: handle status updates here in future
          // Example:
          // const statusPayload = change.value || payload;
          // Implement update logic if required
        }
      }
    }

    return res.status(201).json({ ok: true, inserted: savedCount });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ ok: false, err: error.message });
  }
});

module.exports = router;

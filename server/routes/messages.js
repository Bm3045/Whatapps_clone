const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// GET /conversations
// Returns latest message summary per wa_id (conversation list)
router.get('/conversations', async (req, res) => {
  try {
    const convs = await Message.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$wa_id",
          lastMessage: { $first: "$text" },
          lastAt: { $first: "$createdAt" },
          name: { $first: "$name" },
          number: { $first: "$number" },
          lastStatus: { $first: "$status" }
        }
      },
      { $sort: { lastAt: -1 } }
    ]);
    res.json(convs);
  } catch (err) {
    console.error('Error fetching conversations:', err);
    res.status(500).json({ ok: false, err: err.message });
  }
});

// GET /messages/:wa_id
// Returns all messages for a specific wa_id, sorted ascending by createdAt
router.get('/messages/:wa_id', async (req, res) => {
  try {
    const { wa_id } = req.params;
    if (!wa_id) return res.status(400).json({ ok: false, msg: 'wa_id param is required' });

    const msgs = await Message.find({ wa_id }).sort({ createdAt: 1 }).lean();
    res.json(msgs);
  } catch (err) {
    console.error(`Error fetching messages for ${req.params.wa_id}:`, err);
    res.status(500).json({ ok: false, err: err.message });
  }
});

// POST /messages/send
// Demo endpoint to create/send a new message (stored locally)
router.post('/messages/send', async (req, res) => {
  try {
    const { wa_id, text, name, number } = req.body;
    if (!wa_id || !text) return res.status(400).json({ ok: false, msg: 'wa_id and text are required' });

    const message = await Message.create({
      wa_id,
      name: name || null,
      number: number || null,
      text,
      status: 'sent',
      createdAt: new Date(),
      updatedAt: new Date(),
      raw_payload: { origin: 'manual-send' }
    });

    const io = req.app.get('io');
    if (io) io.emit('message:new', message);

    return res.status(201).json(message);
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ ok: false, err: err.message });
  }
});

// POST /webhook
// Process WhatsApp webhook payload and store messages properly
router.post('/webhook', async (req, res) => {
  const payload = req.body;
  const io = req.app.get('io');

  try {
    if (payload.metaData && Array.isArray(payload.metaData.entry)) {
      const savedMessages = [];

      for (const entry of payload.metaData.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages' && change.value?.messages?.length) {
            const value = change.value;
            const contacts = value.contacts || [];
            const wa_id = contacts[0]?.wa_id || 'unknown';
            const name = contacts[0]?.profile?.name || 'unknown';

            for (const msg of value.messages) {
              const doc = {
                id: msg.id || null,
                meta_msg_id: null,
                wa_id,
                name,
                number: null,
                text: msg.text?.body || '',
                media: null,
                status: 'sent',
                raw_payload: msg,
                createdAt: new Date(parseInt(msg.timestamp, 10) * 1000),
                updatedAt: new Date(),
              };

              const savedMsg = await Message.create(doc);
              savedMessages.push(savedMsg);

              if (io) io.emit('message:new', savedMsg);
            }
          }
        }
      }

      return res.status(201).json({ ok: true, inserted: savedMessages.length });
    }

    // If payload structure is unknown, fallback or reject
    return res.status(400).json({ ok: false, msg: 'Invalid webhook payload structure' });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ ok: false, err: error.message });
  }
});

module.exports = router;

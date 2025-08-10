const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();
const Message = require('../models/Message');

const MONGO = process.env.MONGO_URI;

function extractWaId(m) {
  if (!m) return 'unknown';
  if (m.contacts?.[0]?.wa_id) return m.contacts[0].wa_id;
  if (m.from) return m.from;
  if (m.wa_id) return m.wa_id;
  if (m.contact?.wa_id) return m.contact.wa_id;
  if (m.profile?.wa_id) return m.profile.wa_id;
  return 'unknown';
}

async function main() {
  if (!MONGO) {
    console.error('Please set MONGO_URI in .env');
    process.exit(1);
  }

  await mongoose.connect(MONGO, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log('Connected to MongoDB');

  const dir = path.join(__dirname, '..', 'payloads');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  console.log('Found', files.length, 'files');

  for (const f of files) {
    let raw;
    try {
      raw = fs.readFileSync(path.join(dir, f), 'utf8');
    } catch (e) {
      console.error('Failed to read file:', f, e.message);
      continue;
    }

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch (e) {
      console.error('Invalid JSON in file:', f);
      continue;
    }

    try {
      const now = new Date();

      if (payload.messages || payload.type === 'message') {
        const msgs = payload.messages || [payload];
        for (const m of msgs) {
          await Message.create({
            id: m.id || m.message_id,
            meta_msg_id: m.meta_msg_id || null,
            wa_id: extractWaId(m),
            name: m.name || m.profile?.name || (m.contacts?.[0]?.profile?.name) || null,
            number: m.number || null,
            text: m.text?.body || m.body || '',
            media: m.media || null,
            status: 'sent',
            raw_payload: m,
            createdAt: now,
            updatedAt: now,
          });
        }
      } else if (payload.status || payload.type === 'status') {
        const st = payload.status || payload;
        const orConditions = [];
        if (st.id) orConditions.push({ id: st.id });
        if (st.meta_msg_id) orConditions.push({ meta_msg_id: st.meta_msg_id });
        if (orConditions.length) {
          await Message.updateMany(
            { $or: orConditions },
            { status: st.status, updatedAt: now, raw_payload: st }
          );
        }
      } else {
        await Message.create({
          wa_id: extractWaId(payload),
          text: JSON.stringify(payload).slice(0, 2000),
          raw_payload: payload,
          status: 'created',
          createdAt: now,
          updatedAt: now,
        });
      }
    } catch (e) {
      console.error('Error inserting/updating document from file', f, e.message);
    }
  }

  console.log('Done importing all payload files.');
  process.exit(0);
}

main().catch((e) => {
  console.error('Unexpected error:', e);
  process.exit(1);
});

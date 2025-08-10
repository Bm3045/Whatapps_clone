const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const API_BASE = `${BASE_URL}/api`;

// ✅ GET: Fetch all messages (usually not used directly in this app, but kept for completeness)
export async function getMessages() {
  const res = await fetch(`${API_BASE}/messages`);
  if (!res.ok) throw new Error("Failed to fetch messages");
  return res.json();
}

// ✅ GET: Fetch all conversations (chat list with latest message summary)
export async function fetchConversations() {
  const res = await fetch(`${API_BASE}/conversations`);
  if (!res.ok) throw new Error("Failed to fetch conversations");
  return res.json();
}

// ✅ GET: Fetch all messages for a specific WhatsApp user ID (wa_id)
export async function fetchMessages(wa_id) {
  if (!wa_id) return [];
  const res = await fetch(`${API_BASE}/messages/${encodeURIComponent(wa_id)}`);
  if (!res.ok) throw new Error("Failed to fetch messages for " + wa_id);
  return res.json();
}

// ✅ POST: Send a new message (stored locally in DB, no actual WhatsApp send)
export async function sendMessage(payload) {
  const res = await fetch(`${API_BASE}/messages/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.msg || "Failed to send message");
  }
  return res.json();
}

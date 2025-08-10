import React, { useEffect, useState, useRef, useCallback } from 'react';
import { fetchMessages, sendMessage } from '../services/api';

export default function ChatWindow({ wa_id, socket }) {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const [info, setInfo] = useState({ name: '', number: '' });
  const boxRef = useRef();

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      boxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 50);
  }, []);

  // Load messages for selected wa_id
  const load = useCallback(async () => {
    if (!wa_id) {
      setMsgs([]);
      setInfo({ name: '', number: '' });
      return;
    }
    try {
      const data = await fetchMessages(wa_id);
      setMsgs(data);
      if (data.length > 0) {
        setInfo({
          name: data[0].name || wa_id,
          number: data[0].number || '',
        });
      } else {
        setInfo({ name: wa_id, number: '' });
      }
      scrollToBottom();
    } catch (e) {
      console.error('Failed to load messages:', e);
    }
  }, [wa_id, scrollToBottom]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      if (msg.wa_id === wa_id) {
        setMsgs((prev) => [...prev, msg]);
        scrollToBottom();
      }
    };

    const handleStatusUpdate = () => {
      load();
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:status', handleStatusUpdate);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:status', handleStatusUpdate);
    };
  }, [socket, wa_id, load, scrollToBottom]);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim() || !wa_id) return;

    const payload = { wa_id, text: text.trim(), name: info.name, number: info.number };
    try {
      const saved = await sendMessage(payload);
      setMsgs((prev) => [...prev, saved]);
      setText('');
      scrollToBottom();
    } catch (e) {
      console.error('Failed to send message:', e);
    }
  }

  function formatDate(timestamp) {
    if (!timestamp) return 'Invalid Date';

    let dateObj;
    if (typeof timestamp === 'number') {
      // Convert unix timestamp in seconds or milliseconds
      dateObj = new Date(timestamp < 1e12 ? timestamp * 1000 : timestamp);
    } else {
      dateObj = new Date(timestamp);
    }

    if (isNaN(dateObj.getTime())) return 'Invalid Date';

    return dateObj.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  return (
    <div className="chat-window">
      {!wa_id ? (
        <div className="empty">Select a chat to start</div>
      ) : (
        <>
          <div className="chat-header">
            <div className="name">{info.name}</div>
            <div className="number">{info.number}</div>
          </div>

          <div className="messages">
            {msgs.map((m, idx) => {
              const isOutgoing = m.raw_payload?.origin === 'manual-send';
              return (
                <div key={m._id || idx} className={`bubble ${isOutgoing ? 'out' : 'in'}`}>
                  <div className="text">{m.text || '[No Text]'}</div>
                  <div className="meta">
                    <small>{formatDate(m.createdAt)}</small>
                    {isOutgoing && <small className="status"> · {m.status}</small>}
                  </div>
                </div>
              );
            })}
            <div ref={boxRef}></div>
          </div>

          <form className="composer" onSubmit={handleSend}>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message"
              autoComplete="off"
            />
            <button type="submit" disabled={!text.trim()}>
              Send
            </button>
          </form>
        </>
      )}
    </div>
  );
}

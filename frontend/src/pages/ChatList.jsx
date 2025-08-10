import React, { useEffect, useState, useCallback } from 'react';
import { fetchConversations } from '../services/api';

export default function ChatList({ onSelect, socket, selectedWaId }) {
  const [convs, setConvs] = useState([]);

  const load = useCallback(async () => {
    try {
      const data = await fetchConversations();
      setConvs(data);
    } catch (e) {
      console.error('Failed to load conversations:', e);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = () => load();
    const handleStatusUpdate = () => load();

    socket.on('message:new', handleNewMessage);
    socket.on('message:status', handleStatusUpdate);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:status', handleStatusUpdate);
    };
  }, [socket, load]);

  if (convs.length === 0) {
    return <div className="chat-list empty">No conversations yet</div>;
  }

  function getLastMessageText(lastMessage) {
    if (!lastMessage) return 'No message';

    if (typeof lastMessage === 'string') return lastMessage;

    if (typeof lastMessage === 'object') {
      if ('body' in lastMessage) return lastMessage.body;
      if ('text' in lastMessage) return lastMessage.text;
      return JSON.stringify(lastMessage);
    }

    return 'No message';
  }

  return (
    <div className="chat-list">
      {convs.map((c) => {
        const isSelected = selectedWaId === c._id;
        const lastMessageText = getLastMessageText(c.lastMessage);

        return (
          <div
            key={c._id}
            className={`chat-item${isSelected ? ' selected' : ''}`}
            onClick={() => onSelect(c._id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onSelect(c._id);
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            <div className="chat-title">{c.name || c._id}</div>
            <div className="chat-sub">
              {lastMessageText.length > 40
                ? lastMessageText.slice(0, 37) + '...'
                : lastMessageText}
            </div>
          </div>
        );
      })}
    </div>
  );
}

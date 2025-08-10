import React, { useEffect, useState } from 'react';
import ChatList from './pages/ChatList';
import ChatWindow from './pages/ChatWindow';
import { io } from 'socket.io-client';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function App() {
  const [selected, setSelected] = useState(null);
  const [socket, setSocket] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);

  // Detect if screen is mobile sized
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 720);

  useEffect(() => {
    // Socket.io init
    const s = io(import.meta.env.VITE_WS_URL || BACKEND);
    setSocket(s);
    return () => s.disconnect();
  }, []);

  // Handle window resize to toggle mobile state
  useEffect(() => {
    function handleResize() {
      const mobile = window.innerWidth <= 720;
      setIsMobile(mobile);
      if (!mobile) setShowSidebar(true); // Always show sidebar on desktop
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // When user selects a chat on mobile, hide sidebar
  function handleSelect(wa_id) {
    setSelected(wa_id);
    if (isMobile) setShowSidebar(false);
  }

  // Back button handler to show sidebar again and deselect chat
  function handleBack() {
    setShowSidebar(true);
    setSelected(null);
  }

  return (
    <div className="app">
      <div className={`sidebar ${!showSidebar ? 'hidden' : ''}`}>
        <h2 className="brand">WhatsApp Clone</h2>
        <ChatList onSelect={handleSelect} socket={socket} selectedWaId={selected} />
      </div>

      <div className="chat-area">
        {isMobile && selected && (
          <button className="back-btn" onClick={handleBack} style={{
            margin: '8px',
            padding: '6px 12px',
            borderRadius: '8px',
            backgroundColor: 'var(--accent)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            userSelect: 'none',
          }}>
            ← Back
          </button>
        )}
        <ChatWindow wa_id={selected} socket={socket} />
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import cellMessageService from '../services/cellMessageService';
import { useAuth } from '../context/AuthContext';

const CellDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cell, setCell] = useState(null);
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCell();
  }, [id]);

  const loadCell = async () => {
    try {
      const response = await cellMessageService.getCellDetail(id);
      setCell(response.data?.cell);
      setMembers(response.data?.members || []);
      setMessages(response.data?.messages || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load cell');
      console.error('Error loading cell:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    try {
      const response = await cellMessageService.sendMessage(id, { text: messageText });
      setMessages([...messages, response.data?.message]);
      setMessageText('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message');
    }
  };

  if (loading) return <div className="loading">Loading cell details...</div>;
  if (error) return <div className="error-container"><p className="error-message">{error}</p></div>;
  if (!cell) return <div className="error-container"><p className="error-message">Cell not found</p></div>;

  const isMember = members.some(m => m._id === user?._id);

  return (
    <div className="cell-detail-page">
      <section className="cell-detail-header">
        <button type="button" className="back-btn" onClick={() => navigate('/cells')}>← Back to Cells</button>
        <h1>{cell.name}</h1>
        <p>{cell.description}</p>
        <div className="cell-meta">
          <span><strong>Zone:</strong> {cell.zone}</span>
          <span><strong>Meeting:</strong> {cell.meetingDay} at {cell.meetingTime}</span>
          <span><strong>Location:</strong> {cell.location}</span>
          <span><strong>Leader:</strong> {`${cell.leader?.firstName || ''} ${cell.leader?.lastName || ''}`.trim()}</span>
          <span><strong>Members:</strong> {members.length}/{cell.maxCapacity}</span>
        </div>
      </section>

      <div className="cell-detail-grid">
        {isMember && (
          <section className="members-section">
            <h2>Cell Members</h2>
            <div className="members-grid">
              {members.map((member) => (
                <div key={member._id} className="member-card">
                  <div className="member-avatar">
                    {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
                  </div>
                  <div className="member-info">
                    <h4>{`${member.firstName || ''} ${member.lastName || ''}`.trim()}</h4>
                    <p className="member-contact">📧 {member.email}</p>
                    <p className="member-contact">📱 {member.phoneNumber || 'No phone'}</p>
                    {member._id === user?._id && <span className="you-badge">You</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {isMember && (
          <section className="chat-section">
            <h2>Cell Chat</h2>
            <div className="messages-container">
              {messages.length === 0 ? (
                <p className="no-messages">No messages yet. Start the conversation!</p>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className={`message ${msg.sender?._id === user?._id ? 'sent' : 'received'}`}>
                    <div className="message-header">
                      <strong>{`${msg.sender?.firstName || ''} ${msg.sender?.lastName || ''}`.trim()}</strong>
                      <span className="message-time">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="message-text">{msg.text}</p>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleSendMessage} className="message-form">
              <input
                type="text"
                placeholder="Type a message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                required
              />
              <button type="submit">Send</button>
            </form>
          </section>
        )}

        {!isMember && (
          <section className="not-member-section">
            <p>Join this cell to view members and chat</p>
          </section>
        )}
      </div>

      <style>{`
        .cell-detail-page {
          width: min(1200px, calc(100% - 48px));
          margin: 0 auto;
          padding: 2rem 0 3rem;
          color: white;
        }
        .cell-detail-header {
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: var(--glass-panel);
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.2);
        }
        .back-btn {
          background: none;
          border: none;
          color: var(--brand-soft);
          cursor: pointer;
          font-size: 0.95rem;
          margin-bottom: 1rem;
          padding: 0;
          font-weight: 700;
        }
        .back-btn:hover {
          color: white;
        }
        .cell-detail-header h1 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }
        .cell-detail-header p {
          color: rgba(255,255,255,0.76);
          margin-bottom: 1rem;
          max-width: 620px;
        }
        .cell-meta {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }
        .cell-meta span {
          padding: 0.75rem;
          background: rgba(255,255,255,0.08);
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.12);
          font-size: 0.95rem;
          color: rgba(255,255,255,0.8);
        }
        .cell-meta strong {
          color: var(--brand-soft);
          font-weight: 700;
        }
        .cell-detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        .members-section,
        .chat-section {
          background: var(--glass-panel);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 8px;
          padding: 1.5rem;
        }
        .members-section h2,
        .chat-section h2 {
          margin-bottom: 1rem;
          font-size: 1.35rem;
        }
        .members-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }
        .member-card {
          display: grid;
          grid-template-columns: 60px 1fr;
          gap: 1rem;
          align-items: start;
          padding: 1rem;
          background: rgba(255,255,255,0.08);
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.12);
        }
        .member-avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--brand-soft), var(--accent-warm));
          display: grid;
          place-items: center;
          font-weight: 700;
          font-size: 1.1rem;
          color: #1f2933;
        }
        .member-info {
          min-width: 0;
        }
        .member-info h4 {
          margin-bottom: 0.4rem;
          font-size: 1rem;
        }
        .member-contact {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.72);
          margin-bottom: 0.3rem;
          word-break: break-all;
        }
        .you-badge {
          display: inline-block;
          background: var(--brand);
          color: white;
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          margin-top: 0.4rem;
          font-weight: 700;
        }
        .messages-container {
          min-height: 300px;
          max-height: 400px;
          overflow-y: auto;
          margin-bottom: 1rem;
          padding: 1rem;
          background: rgba(255,255,255,0.04);
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .no-messages {
          text-align: center;
          color: rgba(255,255,255,0.5);
          padding: 2rem;
        }
        .message {
          margin-bottom: 1rem;
          padding: 0.8rem;
          border-radius: 8px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
        }
        .message.sent {
          background: rgba(47,125,70,0.2);
          border-color: rgba(155,216,170,0.3);
          margin-left: auto;
          max-width: 85%;
        }
        .message.received {
          background: rgba(49,95,114,0.2);
          border-color: rgba(155,180,210,0.3);
          margin-right: auto;
          max-width: 85%;
        }
        .message-header {
          display: flex;
          justify-content: space-between;
          gap: 0.5rem;
          margin-bottom: 0.4rem;
          font-size: 0.85rem;
        }
        .message-header strong {
          color: white;
        }
        .message-time {
          color: rgba(255,255,255,0.5);
          font-size: 0.75rem;
        }
        .message-text {
          margin: 0;
          color: rgba(255,255,255,0.9);
          word-break: break-word;
        }
        .message-form {
          display: flex;
          gap: 0.5rem;
        }
        .message-form input {
          flex: 1;
          min-height: 42px;
          padding: 0.8rem;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.22);
          background: rgba(255,255,255,0.08);
          color: white;
          font-size: 0.95rem;
        }
        .message-form input:focus {
          outline: none;
          border-color: rgba(155,216,170,0.72);
          background: rgba(255,255,255,0.12);
        }
        .message-form input::placeholder {
          color: rgba(255,255,255,0.5);
        }
        .message-form button {
          min-height: 42px;
          padding: 0.8rem 1.5rem;
          border-radius: 8px;
          border: none;
          background: linear-gradient(135deg, var(--brand), var(--brand-strong));
          color: white;
          cursor: pointer;
          font-weight: 700;
        }
        .message-form button:hover {
          filter: brightness(1.05);
        }
        .not-member-section {
          grid-column: 1 / -1;
          text-align: center;
          padding: 3rem;
          background: var(--glass-panel);
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.2);
        }
        .not-member-section p {
          color: rgba(255,255,255,0.72);
          font-size: 1.1rem;
        }
        @media (max-width: 968px) {
          .cell-detail-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 620px) {
          .cell-detail-page {
            width: min(100% - 32px, 1200px);
            padding: 1rem 0 2rem;
          }
          .cell-detail-header h1 {
            font-size: 1.8rem;
          }
          .cell-meta {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default CellDetailPage;

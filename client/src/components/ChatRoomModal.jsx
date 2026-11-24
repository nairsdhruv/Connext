import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Users,
  Clock,
  AlertCircle,
  ShieldCheck,
  LogOut,
  RotateCw,
  Sparkles
} from 'lucide-react';
import { getSocket, connectSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../services/api';

export const ChatRoomModal = ({ hotspot, onClose }) => {
  const { user, isAuthenticated } = useAuth();
  const { notifyError, notifyInfo } = useNotification();

  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);
  const [isConnected, setIsConnected] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch Room Info and Persisted History
  useEffect(() => {
    let isMounted = true;
    const fetchRoomAndHistory = async () => {
      setLoading(true);
      try {
        const spotId = hotspot._id || hotspot.id;
        const res = await api.get(`/rooms/${spotId}`);
        if (!isMounted) return;

        if (res.data?.success && res.data.room) {
          const roomData = res.data.room;
          setRoom(roomData);
          setParticipantCount(roomData.participants?.length || 1);

          // Fetch persisted message history
          const msgRes = await api.get(`/rooms/${roomData._id || roomData.id}/messages`);
          if (msgRes.data?.success && msgRes.data.messages) {
            setMessages(msgRes.data.messages);
            setTimeout(scrollToBottom, 100);
          }
        }
      } catch (err) {
        console.error('[Chat Room Fetch Error]', err);
        notifyError(err.response?.data?.message || 'Could not load chat room.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRoomAndHistory();

    return () => {
      isMounted = false;
    };
  }, [hotspot, notifyError]);

  // Socket.IO Events Lifecycle
  useEffect(() => {
    if (!room || !isAuthenticated) return;

    const socket = connectSocket();

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    setIsConnected(socket.connected);
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Join room
    socket.emit(
      'join_room',
      { roomId: room._id || room.id, hotspotId: hotspot._id || hotspot.id },
      (ack) => {
        if (ack?.error) {
          notifyError(ack.error);
        } else if (ack?.participantCount) {
          setParticipantCount(ack.participantCount);
        }
      }
    );

    // Listen for incoming messages
    const handleNewMessage = (msg) => {
      setMessages((prev) => {
        // Prevent duplicate messages if already present
        if (prev.some((m) => (m._id || m.id) === (msg._id || msg.id))) return prev;
        return [...prev, msg];
      });
      setTimeout(scrollToBottom, 50);
    };

    // User presence events
    const handleUserJoined = (data) => {
      if (data.participantCount) setParticipantCount(data.participantCount);
    };

    const handleUserLeft = (data) => {
      if (data.participantCount) setParticipantCount(data.participantCount);
    };

    const handleUserTyping = (data) => {
      if (data.userId !== user?.id) {
        setTypingUsers((prev) => {
          if (data.isTyping && !prev.includes(data.displayName)) {
            return [...prev, data.displayName];
          }
          if (!data.isTyping) {
            return prev.filter((name) => name !== data.displayName);
          }
          return prev;
        });
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_joined', handleUserJoined);
    socket.on('user_left', handleUserLeft);
    socket.on('user_typing', handleUserTyping);

    return () => {
      socket.emit('leave_room', { roomId: room._id || room.id });
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('new_message', handleNewMessage);
      socket.off('user_joined', handleUserJoined);
      socket.off('user_left', handleUserLeft);
      socket.off('user_typing', handleUserTyping);
    };
  }, [room, hotspot, isAuthenticated, user, notifyError]);

  // Expiry Countdown Clock
  useEffect(() => {
    if (!room?.expiresAt) return;

    const updateCountdown = () => {
      const now = new Date();
      const expires = new Date(room.expiresAt);
      const diffMs = expires - now;

      if (diffMs <= 0) {
        setTimeRemaining('Room expired');
        return;
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setTimeRemaining(`${hours}h ${mins}m remaining`);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 60000);
    return () => clearInterval(timer);
  }, [room]);

  // Typing event emission with debouncing
  const handleInputChange = (e) => {
    setInputText(e.target.value);
    const socket = getSocket();
    if (socket && room) {
      socket.emit('typing', { roomId: room._id || room.id, isTyping: true });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', { roomId: room._id || room.id, isTyping: false });
      }, 1500);
    }
  };

  // Send Message
  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!inputText.trim() || sending) return;

    const socket = getSocket();
    if (!socket || !socket.connected) {
      notifyError('Chat disconnected. Please wait for reconnection.');
      return;
    }

    setSending(true);
    socket.emit(
      'send_message',
      { roomId: room._id || room.id, content: inputText.trim() },
      (ack) => {
        setSending(false);
        if (ack?.error) {
          notifyError(ack.error);
        } else {
          setInputText('');
          // Clear typing
          socket.emit('typing', { roomId: room._id || room.id, isTyping: false });
        }
      }
    );
  };

  const isRoomClosed = room?.status !== 'active' || timeRemaining === 'Room expired';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-2xl bg-dark-900 border border-dark-700/80 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden h-[90vh] sm:h-[80vh] flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Chat Room Header */}
        <div className="px-5 py-4 bg-dark-950/90 border-b border-dark-700/80 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-brand-primary/20 border border-brand-primary/40 flex items-center justify-center text-lg">
                💬
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-dark-950 ${
                  isConnected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                }`}
                title={isConnected ? 'Connected' : 'Reconnecting...'}
              />
            </div>

            <div className="min-w-0">
              <h3 className="text-base font-bold text-white truncate leading-tight">
                {hotspot.name}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span className="flex items-center gap-1 text-slate-300">
                  <Users className="w-3.5 h-3.5 text-brand-primary" />
                  <span>{participantCount} active</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-amber-400 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{timeRemaining || 'Temporary room'}</span>
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-dark-800 text-slate-400 hover:text-white transition-colors"
            aria-label="Close chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Temporary Room Notice Banner */}
        <div className="bg-dark-950/40 border-b border-dark-800 px-5 py-2 text-[11px] text-slate-400 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-primary flex-shrink-0" />
            <span>Messages are automatically cleaned after the meetup ends. Be kind and respectful.</span>
          </div>
          {isRoomClosed && (
            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold uppercase tracking-wider text-[10px]">
              Closed
            </span>
          )}
        </div>

        {/* Message Stream */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {loading ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm gap-2">
              <RotateCw className="w-5 h-5 animate-spin text-brand-primary" />
              <span>Loading messages...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-14 h-14 rounded-2xl bg-dark-800 border border-dark-700 flex items-center justify-center text-2xl mb-3">
                👋
              </div>
              <h4 className="text-white font-bold text-base mb-1">No messages yet</h4>
              <p className="text-xs max-w-xs text-slate-400 leading-relaxed">
                Be the first to say hello, coordinate arrival times, or ask about meeting spots!
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const senderId = msg.sender?.id || msg.sender?._id || msg.sender;
              const isMe = senderId === user?.id;
              const senderName = isMe ? 'You' : msg.sender?.displayName || 'Participant';

              return (
                <div
                  key={msg._id || msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-300">{senderName}</span>
                    <span>•</span>
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-md ${
                      isMe
                        ? 'bg-brand-primary text-black font-medium rounded-tr-none'
                        : 'bg-dark-800 text-slate-100 border border-dark-700/80 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="px-5 py-1 text-xs text-slate-400 italic">
            {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </div>
        )}

        {/* Composer */}
        <div className="p-4 bg-dark-950/90 border-t border-dark-700/80 flex-shrink-0">
          {isRoomClosed ? (
            <div className="p-3 text-center text-xs text-slate-400 bg-dark-800 rounded-xl border border-dark-700">
              This temporary chat room is now closed or expired. Thank you for connecting!
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={handleInputChange}
                placeholder="Type a friendly message... (Enter to send)"
                maxLength={1000}
                className="flex-1 bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary transition-colors"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || sending}
                className="p-3 rounded-xl bg-brand-primary hover:bg-cyan-400 disabled:opacity-40 text-black font-bold shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
                aria-label="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

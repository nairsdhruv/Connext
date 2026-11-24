import { ChatRoom } from '../models/ChatRoom.js';
import { Message } from '../models/Message.js';
import { socketAuth } from '../middleware/auth.js';

// Simple in-memory rate limiter per socket: min 400ms between messages
const lastMessageTimes = new Map();

export const initChatSockets = (io) => {
  // Apply socket authentication
  io.use(socketAuth);

  io.on('connection', (socket) => {
    const user = socket.user;
    console.log(`[Socket] User connected: ${user.displayName} (${socket.id})`);

    // Join room
    socket.on('join_room', async ({ roomId, hotspotId }, callback) => {
      try {
        let room;
        if (roomId) {
          room = await ChatRoom.findById(roomId);
        } else if (hotspotId) {
          room = await ChatRoom.findOne({ hotspot: hotspotId });
        }

        if (!room) {
          if (callback) callback({ error: 'Room not found.' });
          return;
        }

        if (room.status !== 'active' || new Date() > new Date(room.expiresAt)) {
          if (callback) callback({ error: 'This temporary room has expired or is closed.' });
          return;
        }

        const roomKey = room._id.toString();
        socket.join(roomKey);

        // Ensure user is recorded in participants list
        const alreadyParticipant = room.participants.some(
          (p) => p.user.toString() === user._id.toString()
        );

        if (!alreadyParticipant) {
          if (room.participants.length >= room.maxParticipants) {
            if (callback) callback({ error: 'Room is at capacity.' });
            return;
          }
          room.participants.push({ user: user._id, joinedAt: new Date() });
          await room.save();
        }

        // Notify other participants in the room
        socket.to(roomKey).emit('user_joined', {
          user: {
            id: user._id,
            displayName: user.displayName,
            avatar: user.avatar
          },
          participantCount: room.participants.length,
          timestamp: new Date()
        });

        if (callback) {
          callback({
            success: true,
            roomId: roomKey,
            expiresAt: room.expiresAt,
            participantCount: room.participants.length
          });
        }
      } catch (err) {
        console.error('[Socket Join Error]', err.message);
        if (callback) callback({ error: 'Could not join room.' });
      }
    });

    // Send message
    socket.on('send_message', async ({ roomId, content }, callback) => {
      try {
        if (!roomId || !content || typeof content !== 'string') {
          if (callback) callback({ error: 'Message content is required.' });
          return;
        }

        const sanitized = content.trim();
        if (sanitized.length === 0 || sanitized.length > 1000) {
          if (callback) callback({ error: 'Message must be between 1 and 1000 characters.' });
          return;
        }

        // Rate limiting check: 1 message per 400ms
        const now = Date.now();
        const lastTime = lastMessageTimes.get(socket.id) || 0;
        if (now - lastTime < 400) {
          if (callback) callback({ error: 'You are sending messages too quickly. Please slow down.' });
          return;
        }
        lastMessageTimes.set(socket.id, now);

        const room = await ChatRoom.findById(roomId);
        if (!room) {
          if (callback) callback({ error: 'Room not found.' });
          return;
        }

        if (room.status !== 'active' || new Date() > new Date(room.expiresAt)) {
          if (callback) callback({ error: 'Room is closed or expired.' });
          return;
        }

        // Persist message to database
        const message = await Message.create({
          room: room._id,
          sender: user._id,
          content: sanitized
        });

        const populatedMessage = {
          id: message._id,
          room: message.room,
          sender: {
            id: user._id,
            displayName: user.displayName,
            avatar: user.avatar
          },
          content: message.content,
          createdAt: message.createdAt
        };

        // Broadcast to everyone in the room (including sender)
        io.to(roomId).emit('new_message', populatedMessage);

        if (callback) callback({ success: true, messageId: message._id });
      } catch (err) {
        console.error('[Socket Message Error]', err.message);
        if (callback) callback({ error: 'Failed to send message.' });
      }
    });

    // Leave room
    socket.on('leave_room', async ({ roomId }, callback) => {
      try {
        socket.leave(roomId);
        const room = await ChatRoom.findById(roomId);
        if (room) {
          room.participants = room.participants.filter(
            (p) => p.user.toString() !== user._id.toString()
          );
          await room.save();

          socket.to(roomId).emit('user_left', {
            user: { id: user._id, displayName: user.displayName },
            participantCount: room.participants.length
          });
        }
        if (callback) callback({ success: true });
      } catch (err) {
        if (callback) callback({ error: err.message });
      }
    });

    // Typing indicator
    socket.on('typing', ({ roomId, isTyping }) => {
      socket.to(roomId).emit('user_typing', {
        userId: user._id,
        displayName: user.displayName,
        isTyping: !!isTyping
      });
    });

    // Disconnect cleanup
    socket.on('disconnect', () => {
      lastMessageTimes.delete(socket.id);
      console.log(`[Socket] User disconnected: ${user.displayName}`);
    });
  });
};

import { ChatRoom } from '../models/ChatRoom.js';
import { Message } from '../models/Message.js';
import { Hotspot } from '../models/Hotspot.js';

export const getRoom = async (req, res, next) => {
  try {
    const { id } = req.params; // Hotspot ID or ChatRoom ID

    let room = await ChatRoom.findById(id)
      .populate('hotspot', 'name category type location address status startDateTime endDateTime creator')
      .populate('participants.user', 'displayName avatar');

    if (!room) {
      room = await ChatRoom.findOne({ hotspot: id })
        .populate('hotspot', 'name category type location address status startDateTime endDateTime creator')
        .populate('participants.user', 'displayName avatar');
    }

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found for this hotspot.'
      });
    }

    // Auto check expiry
    if (room.status === 'active' && new Date() > new Date(room.expiresAt)) {
      room.status = 'expired';
      await room.save();
    }

    res.json({
      success: true,
      room
    });
  } catch (error) {
    next(error);
  }
};

export const joinRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    let room = await ChatRoom.findById(id);
    if (!room) {
      room = await ChatRoom.findOne({ hotspot: id });
    }

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found.'
      });
    }

    if (room.status !== 'active' || new Date() > new Date(room.expiresAt)) {
      room.status = 'expired';
      await room.save();
      return res.status(403).json({
        success: false,
        message: 'This temporary chat room has expired or been closed.'
      });
    }

    const alreadyJoined = room.participants.some(
      (p) => p.user.toString() === req.user._id.toString()
    );

    if (!alreadyJoined) {
      if (room.participants.length >= room.maxParticipants) {
        return res.status(400).json({
          success: false,
          message: 'This room has reached its maximum participant limit.'
        });
      }

      room.participants.push({ user: req.user._id, joinedAt: new Date() });
      await room.save();
    }

    const updatedRoom = await ChatRoom.findById(room._id)
      .populate('participants.user', 'displayName avatar')
      .populate('hotspot', 'name category type');

    res.json({
      success: true,
      room: updatedRoom
    });
  } catch (error) {
    next(error);
  }
};

export const leaveRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    let room = await ChatRoom.findById(id);
    if (!room) {
      room = await ChatRoom.findOne({ hotspot: id });
    }

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found.'
      });
    }

    room.participants = room.participants.filter(
      (p) => p.user.toString() !== req.user._id.toString()
    );
    await room.save();

    res.json({
      success: true,
      message: 'You have left the chat room.',
      participantCount: room.participants.length
    });
  } catch (error) {
    next(error);
  }
};

export const getRoomMessages = async (req, res, next) => {
  try {
    const { id } = req.params;
    let room = await ChatRoom.findById(id);
    if (!room) {
      room = await ChatRoom.findOne({ hotspot: id });
    }

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found.'
      });
    }

    const { limit = 50, before } = req.query;
    const query = {
      room: room._id,
      isModerated: false
    };

    // Filter messages from blocked users if user is authenticated
    if (req.user?.blockedUsers?.length) {
      query.sender = { $nin: req.user.blockedUsers };
    }

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .populate('sender', 'displayName avatar')
      .sort({ createdAt: 1 }) // Chronological order
      .limit(Number(limit));

    res.json({
      success: true,
      count: messages.length,
      messages,
      roomStatus: room.status,
      expiresAt: room.expiresAt
    });
  } catch (error) {
    next(error);
  }
};

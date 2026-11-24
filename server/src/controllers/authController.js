import { User } from '../models/User.js';
import { generateToken } from '../middleware/auth.js';
import { Hotspot } from '../models/Hotspot.js';
import { ChatRoom } from '../models/ChatRoom.js';
import { Message } from '../models/Message.js';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

export const register = async (req, res, next) => {
  try {
    const { displayName, email, password, bio } = req.body;

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    const user = await User.create({
      displayName: displayName.trim(),
      email: normalizedEmail,
      passwordHash: password,
      bio: bio ? bio.trim() : ''
    });

    const token = generateToken(user._id);
    res.cookie('connext_token', token, cookieOptions);

    res.status(201).json({
      success: true,
      token,
      user
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your account is suspended. Please contact support.'
      });
    }

    const token = generateToken(user._id);
    res.cookie('connext_token', token, cookieOptions);

    res.json({
      success: true,
      token,
      user
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res) => {
  res.clearCookie('connext_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  res.json({
    success: true,
    message: 'Logged out successfully.'
  });
};

export const getMe = async (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
};

export const updateProfile = async (req, res, next) => {
  try {
    const { displayName, bio, avatar } = req.body;
    const user = await User.findById(req.user._id);

    if (displayName) user.displayName = displayName.trim();
    if (typeof bio === 'string') user.bio = bio.trim();
    if (typeof avatar === 'string') user.avatar = avatar.trim();

    await user.save();

    res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

export const blockUser = async (req, res, next) => {
  try {
    const { targetUserId } = req.body;
    if (targetUserId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot block yourself.'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user.blockedUsers.includes(targetUserId)) {
      user.blockedUsers.push(targetUserId);
      await user.save();
    }

    res.json({
      success: true,
      message: 'User blocked successfully.',
      blockedUsers: user.blockedUsers
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Delete user's created hotspots and associated chat rooms and messages
    const hotspots = await Hotspot.find({ creator: userId });
    for (const spot of hotspots) {
      if (spot.chatRoom) {
        await Message.deleteMany({ room: spot.chatRoom });
        await ChatRoom.findByIdAndDelete(spot.chatRoom);
      }
    }
    await Hotspot.deleteMany({ creator: userId });

    // Remove user from attendee lists
    await Hotspot.updateMany(
      { 'attendees.user': userId },
      { $pull: { attendees: { user: userId } } }
    );

    // Remove user from chat room participants
    await ChatRoom.updateMany(
      { 'participants.user': userId },
      { $pull: { participants: { user: userId } } }
    );

    // Delete User
    await User.findByIdAndDelete(userId);

    res.clearCookie('connext_token');
    res.json({
      success: true,
      message: 'Your account and associated resources have been deleted.'
    });
  } catch (error) {
    next(error);
  }
};

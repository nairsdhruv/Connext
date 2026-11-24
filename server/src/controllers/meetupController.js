import { Hotspot } from '../models/Hotspot.js';
import { ChatRoom } from '../models/ChatRoom.js';

export const rsvpMeetup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const hotspot = await Hotspot.findById(id);

    if (!hotspot) {
      return res.status(404).json({
        success: false,
        message: 'Meetup not found.'
      });
    }

    if (hotspot.type !== 'meetup') {
      return res.status(400).json({
        success: false,
        message: 'This hotspot is a casual hangout, not a scheduled meetup.'
      });
    }

    if (hotspot.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Cannot join. This meetup is ${hotspot.status}.`
      });
    }

    const alreadyAttending = hotspot.attendees.some(
      (a) => a.user.toString() === req.user._id.toString()
    );

    if (alreadyAttending) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this meetup.'
      });
    }

    if (hotspot.capacity && hotspot.attendees.length >= hotspot.capacity) {
      return res.status(400).json({
        success: false,
        message: 'This meetup has reached its maximum participant limit.'
      });
    }

    hotspot.attendees.push({
      user: req.user._id,
      joinedAt: new Date()
    });
    await hotspot.save();

    // Also auto-join the chat room
    if (hotspot.chatRoom) {
      const room = await ChatRoom.findById(hotspot.chatRoom);
      if (room && !room.participants.some((p) => p.user.toString() === req.user._id.toString())) {
        room.participants.push({ user: req.user._id, joinedAt: new Date() });
        await room.save();
      }
    }

    const updated = await Hotspot.findById(hotspot._id)
      .populate('creator', 'displayName avatar')
      .populate('attendees.user', 'displayName avatar');

    res.json({
      success: true,
      message: 'Successfully joined meetup!',
      hotspot: updated
    });
  } catch (error) {
    next(error);
  }
};

export const cancelRsvpMeetup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const hotspot = await Hotspot.findById(id);

    if (!hotspot) {
      return res.status(404).json({
        success: false,
        message: 'Meetup not found.'
      });
    }

    if (hotspot.creator.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'The organizer cannot leave their own meetup. You can cancel the meetup instead.'
      });
    }

    hotspot.attendees = hotspot.attendees.filter(
      (a) => a.user.toString() !== req.user._id.toString()
    );
    await hotspot.save();

    // Also leave chat room
    if (hotspot.chatRoom) {
      await ChatRoom.findByIdAndUpdate(hotspot.chatRoom, {
        $pull: { participants: { user: req.user._id } }
      });
    }

    res.json({
      success: true,
      message: 'You have left this meetup.',
      attendeeCount: hotspot.attendees.length
    });
  } catch (error) {
    next(error);
  }
};

export const cancelMeetup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const hotspot = await Hotspot.findById(id);

    if (!hotspot) {
      return res.status(404).json({
        success: false,
        message: 'Meetup not found.'
      });
    }

    if (hotspot.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the organizer can cancel this meetup.'
      });
    }

    hotspot.status = 'cancelled';
    await hotspot.save();

    // Close chat room
    if (hotspot.chatRoom) {
      await ChatRoom.findByIdAndUpdate(hotspot.chatRoom, {
        status: 'closed',
        closedAt: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Meetup has been cancelled.'
    });
  } catch (error) {
    next(error);
  }
};

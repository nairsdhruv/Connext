import { ChatRoom } from '../models/ChatRoom.js';
import { Hotspot } from '../models/Hotspot.js';
import { Message } from '../models/Message.js';

export const startCleanupService = () => {
  const runCleanup = async () => {
    try {
      const now = new Date();

      // 1. Expire active chat rooms whose expiresAt has passed
      const expiredRoomsResult = await ChatRoom.updateMany(
        {
          status: 'active',
          expiresAt: { $lt: now }
        },
        {
          $set: { status: 'expired' }
        }
      );

      if (expiredRoomsResult.modifiedCount > 0) {
        console.log(`[Cleanup] Marked ${expiredRoomsResult.modifiedCount} chat room(s) as expired.`);
      }

      // 2. Mark active scheduled meetups whose endDateTime has passed as completed
      const completedMeetupsResult = await Hotspot.updateMany(
        {
          type: 'meetup',
          status: 'active',
          endDateTime: { $lt: now }
        },
        {
          $set: { status: 'completed' }
        }
      );

      if (completedMeetupsResult.modifiedCount > 0) {
        console.log(`[Cleanup] Marked ${completedMeetupsResult.modifiedCount} meetup(s) as completed.`);
      }

      // 3. Documented Retention Policy: Clean up messages for rooms expired > 7 days ago
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const staleRooms = await ChatRoom.find({
        status: { $in: ['expired', 'closed'] },
        expiresAt: { $lt: sevenDaysAgo }
      }).select('_id');

      if (staleRooms.length > 0) {
        const staleRoomIds = staleRooms.map((r) => r._id);
        const deletedMessages = await Message.deleteMany({ room: { $in: staleRoomIds } });
        if (deletedMessages.deletedCount > 0) {
          console.log(`[Cleanup] Retention policy purged ${deletedMessages.deletedCount} stale messages.`);
        }
      }
    } catch (err) {
      console.error('[Cleanup Error]', err.message);
    }
  };

  // Run immediately on boot
  runCleanup();

  // Run every 5 minutes
  const interval = setInterval(runCleanup, 5 * 60 * 1000);
  return interval;
};

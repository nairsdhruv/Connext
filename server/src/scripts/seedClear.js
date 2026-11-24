import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Hotspot } from '../models/Hotspot.js';
import { ChatRoom } from '../models/ChatRoom.js';
import { Message } from '../models/Message.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/connext';

export const clearSeedData = async () => {
  try {
    console.log('[SeedClear] Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('[SeedClear] Connected.');

    // Only identify demo records marked with isDemoData or matching demo email pattern
    const demoUsers = await User.find({ email: /@connext\.test$/ });
    const demoUserIds = demoUsers.map((u) => u._id);

    const demoHotspots = await Hotspot.find({ isDemoData: true });
    const demoHotspotIds = demoHotspots.map((h) => h._id);

    const demoRooms = await ChatRoom.find({ hotspot: { $in: demoHotspotIds } });
    const demoRoomIds = demoRooms.map((r) => r._id);

    const deletedMsgs = await Message.deleteMany({ room: { $in: demoRoomIds } });
    const deletedRooms = await ChatRoom.deleteMany({ _id: { $in: demoRoomIds } });
    const deletedSpots = await Hotspot.deleteMany({ _id: { $in: demoHotspotIds } });
    const deletedUsers = await User.deleteMany({ _id: { $in: demoUserIds } });

    console.log(`[SeedClear] Cleaned up demo data safely:`);
    console.log(`   - Messages removed: ${deletedMsgs.deletedCount}`);
    console.log(`   - ChatRooms removed: ${deletedRooms.deletedCount}`);
    console.log(`   - Hotspots removed: ${deletedSpots.deletedCount}`);
    console.log(`   - Demo users removed: ${deletedUsers.deletedCount}`);
    console.log('[SeedClear] Real user-generated content was preserved.');
  } catch (err) {
    console.error('[SeedClear Error]', err);
    throw err;
  } finally {
    await mongoose.disconnect();
    console.log('[SeedClear] Disconnected.');
  }
};

if (process.argv[1]?.endsWith('seedClear.js')) {
  clearSeedData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

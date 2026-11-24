import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Hotspot } from '../models/Hotspot.js';
import { ChatRoom } from '../models/ChatRoom.js';
import { Message } from '../models/Message.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/connext';

export const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('[Seed] Connected.');

    // Remove existing demo data first to ensure idempotency
    console.log('[Seed] Removing previous demo data...');
    const demoUsers = await User.find({ email: /@connext\.test$/ });
    const demoUserIds = demoUsers.map((u) => u._id);

    const demoHotspots = await Hotspot.find({ isDemoData: true });
    const demoHotspotIds = demoHotspots.map((h) => h._id);

    const demoRooms = await ChatRoom.find({ hotspot: { $in: demoHotspotIds } });
    const demoRoomIds = demoRooms.map((r) => r._id);

    await Message.deleteMany({ room: { $in: demoRoomIds } });
    await ChatRoom.deleteMany({ _id: { $in: demoRoomIds } });
    await Hotspot.deleteMany({ _id: { $in: demoHotspotIds } });
    await User.deleteMany({ _id: { $in: demoUserIds } });

    console.log('[Seed] Previous demo records cleaned.');

    // 1. Create fictional test users
    console.log('[Seed] Creating demo users...');
    const user1 = await User.create({
      displayName: 'Alex Rivers (Demo)',
      email: 'demo_alex@connext.test',
      passwordHash: 'DemoPassword123!',
      bio: 'Lifelong runner, board-gamer, and coffee enthusiast keen on meeting new friendly faces.'
    });

    const user2 = await User.create({
      displayName: 'Priya Sharma (Demo)',
      email: 'demo_priya@connext.test',
      passwordHash: 'DemoPassword123!',
      bio: 'Graduate student studying literature. Loves indie music and afternoon library study circles.'
    });

    const user3 = await User.create({
      displayName: 'Sam Chen (Demo)',
      email: 'demo_sam@connext.test',
      passwordHash: 'DemoPassword123!',
      bio: 'New in town! Looking to explore neighborhood cafes, play chess, and converse without phones.'
    });

    // 2. Realistic sample hotspots and meetups around Bengaluru Central & Indiranagar
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dayAfter = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const sampleHotspots = [
      {
        name: 'Cubbon Park Bamboo Grove Morning Walk & Chat',
        description: 'An open, welcoming morning walk beneath the bamboo groves. Perfect for anyone wanting fresh air, calm conversations, and a mindful start to the day. All paces welcome!',
        category: 'walking_running',
        type: 'meetup',
        location: {
          type: 'Point',
          coordinates: [77.5925, 12.9763] // [lng, lat]
        },
        address: 'Bamboo Grove Entrance, Cubbon Park, Bengaluru',
        creator: user1._id,
        capacity: 25,
        startDateTime: new Date(tomorrow.setHours(7, 30, 0, 0)),
        endDateTime: new Date(tomorrow.setHours(9, 30, 0, 0)),
        tags: ['morning', 'walking', 'nature', 'mindfulness'],
        imageUrl: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=800&q=80',
        isDemoData: true
      },
      {
        name: 'Third Wave Coffee - Casual Co-Working & Chat',
        description: 'A cozy spot for remote workers, students, and freelancers who want company while working or having casual 15-minute coffee breaks. Feel free to say hi!',
        category: 'cafes',
        type: 'hangout',
        location: {
          type: 'Point',
          coordinates: [77.6412, 12.9719]
        },
        address: '12th Main Rd, Indiranagar, Bengaluru',
        creator: user2._id,
        capacity: 15,
        tags: ['coffee', 'coworking', 'remote', 'casual'],
        imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80',
        isDemoData: true
      },
      {
        name: 'State Central Library Quiet Study & Reading Circle',
        description: 'Meet outside the iconic red brick library building, read books together or work silently, followed by brief reflections over tea outside.',
        category: 'study_groups',
        type: 'meetup',
        location: {
          type: 'Point',
          coordinates: [77.5898, 12.9754]
        },
        address: 'Kasturba Road, Sampangi Rama Nagara, Bengaluru',
        creator: user2._id,
        capacity: 20,
        startDateTime: new Date(dayAfter.setHours(15, 0, 0, 0)),
        endDateTime: new Date(dayAfter.setHours(18, 0, 0, 0)),
        tags: ['books', 'study', 'quiet', 'library'],
        imageUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&q=80',
        isDemoData: true
      },
      {
        name: 'The Board Game Haven - Catan, Wingspan & Banter',
        description: 'Weekly casual board game gathering. From easy party games like Codenames to strategy classics like Settlers of Catan. Beginners warmly guided!',
        category: 'board_games',
        type: 'meetup',
        location: {
          type: 'Point',
          coordinates: [77.6385, 12.9701]
        },
        address: '100 Feet Road, HAL 2nd Stage, Indiranagar, Bengaluru',
        creator: user3._id,
        capacity: 16,
        startDateTime: new Date(tomorrow.setHours(18, 0, 0, 0)),
        endDateTime: new Date(tomorrow.setHours(21, 0, 0, 0)),
        tags: ['games', 'strategy', 'social', 'catan'],
        imageUrl: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=800&q=80',
        isDemoData: true
      },
      {
        name: 'Corner House Ice Cream - Sweet Treats & Stories',
        description: 'An iconic neighborhood hangout spot. Drop by for Hot Chocolate Fudge or Death By Chocolate, and chat with fellow dessert lovers on the benches outside.',
        category: 'food',
        type: 'hangout',
        location: {
          type: 'Point',
          coordinates: [77.6402, 12.9735]
        },
        address: '1st Stage, Indiranagar, Bengaluru',
        creator: user1._id,
        capacity: 20,
        tags: ['dessert', 'icecream', 'casual', 'stories'],
        imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&q=80',
        isDemoData: true
      },
      {
        name: 'Kanteerava Track Sunset Joggers & Fitness Hangout',
        description: 'Join friendly neighborhood joggers for an easy 5k run or 3k brisk walk around the athletic grounds. No stopwatch stress!',
        category: 'sports',
        type: 'meetup',
        location: {
          type: 'Point',
          coordinates: [77.5929, 12.9698]
        },
        address: 'Kasturba Road, Shanthala Nagar, Bengaluru',
        creator: user3._id,
        capacity: 30,
        startDateTime: new Date(tomorrow.setHours(17, 30, 0, 0)),
        endDateTime: new Date(tomorrow.setHours(19, 0, 0, 0)),
        tags: ['running', 'jogging', 'fitness', 'sunset'],
        imageUrl: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&q=80',
        isDemoData: true
      }
    ];

    console.log('[Seed] Inserting hotspots and configuring temporary rooms...');
    for (const spotData of sampleHotspots) {
      const spot = new Hotspot(spotData);
      spot.attendees = [
        { user: spotData.creator, joinedAt: new Date() },
        { user: user1._id, joinedAt: new Date() }
      ];
      await spot.save();

      // Configure room expiry
      let expiresAt;
      if (spot.type === 'meetup' && spot.endDateTime) {
        expiresAt = new Date(spot.endDateTime.getTime() + 6 * 60 * 60 * 1000); // 6 hr grace
      } else {
        expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hr TTL
      }

      const room = await ChatRoom.create({
        hotspot: spot._id,
        expiresAt,
        maxParticipants: spot.capacity || 50,
        participants: [
          { user: spotData.creator, joinedAt: new Date() },
          { user: user1._id, joinedAt: new Date() }
        ]
      });

      spot.chatRoom = room._id;
      await spot.save();

      // Add a welcoming introductory message to the temporary room
      await Message.create({
        room: room._id,
        sender: spotData.creator,
        content: `Welcome to the temporary chat for "${spot.name}"! Say hello, ask questions about meeting points, or coordinate arrivals.`
      });
    }

    console.log(`[Seed] Successfully created ${sampleHotspots.length} demo hotspots with temporary chat rooms.`);
    console.log('[Seed] Demo accounts created:');
    console.log('   - demo_alex@connext.test  / DemoPassword123!');
    console.log('   - demo_priya@connext.test / DemoPassword123!');
    console.log('   - demo_sam@connext.test   / DemoPassword123!');
  } catch (err) {
    console.error('[Seed Error]', err);
    throw err;
  } finally {
    await mongoose.disconnect();
    console.log('[Seed] Disconnected from MongoDB.');
  }
};

// Execute if run directly
if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

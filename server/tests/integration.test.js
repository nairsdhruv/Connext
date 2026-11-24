import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';
import { Hotspot } from '../src/models/Hotspot.js';
import { ChatRoom } from '../src/models/ChatRoom.js';
import { Message } from '../src/models/Message.js';

const TEST_DB_URI = process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/connext_test';
let app;
let authToken = '';
let userId = '';
let createdHotspotId = '';
let createdRoomId = '';

beforeAll(async () => {
  await mongoose.connect(TEST_DB_URI);
  app = createApp();
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('End-to-End Workflow Integration Test', () => {
  it('1. Registers an end-to-end test user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        displayName: 'E2E Runner',
        email: `e2e_${Date.now()}@connext.test`,
        password: 'Password123!',
        bio: 'Automated E2E Integration test profile'
      });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    authToken = res.body.token;
    userId = res.body.user.id;
  });

  it('2. Creates a real meetup hotspot with coordinates and verified room', async () => {
    const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
    const tomorrowEnd = new Date(Date.now() + 26 * 3600 * 1000);

    const res = await request(app)
      .post('/api/hotspots')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Indiranagar Sunday Board Game Brunch',
        description: 'Testing end to end full stack creation flow with temporary room.',
        category: 'board_games',
        type: 'meetup',
        coordinates: [77.6412, 12.9719], // [lng, lat]
        address: '100ft Road, Indiranagar, Bengaluru',
        capacity: 15,
        startDateTime: tomorrow.toISOString(),
        endDateTime: tomorrowEnd.toISOString()
      });

    expect(res.status).toBe(201);
    expect(res.body.hotspot.name).toBe('Indiranagar Sunday Board Game Brunch');
    expect(res.body.hotspot.chatRoom).toBeDefined();

    createdHotspotId = res.body.hotspot.id || res.body.hotspot._id;
    createdRoomId = res.body.hotspot.chatRoom.id || res.body.hotspot.chatRoom._id;
  });

  it('3. Searches and queries nearby hotspots', async () => {
    const res = await request(app)
      .get('/api/hotspots/nearby')
      .query({
        lng: 77.64,
        lat: 12.97,
        maxDistance: 10000
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.hotspots.length).toBeGreaterThan(0);
  });

  it('4. Posts and retrieves messages in the temporary room', async () => {
    // Send message
    await Message.create({
      room: createdRoomId,
      sender: userId,
      content: 'Hello everyone! I am bringing Settlers of Catan.'
    });

    const res = await request(app)
      .get(`/api/rooms/${createdRoomId}/messages`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.messages.some((m) => m.content.includes('Catan'))).toBe(true);
  });

  it('5. Queries OSRM routing endpoint for route geometry & steps', async () => {
    // Bengaluru Cubbon Park to Indiranagar
    const res = await request(app)
      .get('/api/map/route')
      .query({
        profile: 'driving',
        startLng: 77.5925,
        startLat: 12.9763,
        endLng: 77.6412,
        endLat: 12.9719
      });

    // If external public OSRM network service is reachable in this environment, verify route
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
      expect(res.body.route.distanceMeters).toBeGreaterThan(0);
      expect(res.body.route.geometry).toBeDefined();
      expect(res.body.route.steps).toBeDefined();
    } else {
      // If community endpoint is blocked/offline, verify structured error
      expect(res.status).toBe(400);
      expect(res.body.message).toBeDefined();
    }
  });

  it('6. Cleans up test records', async () => {
    await Message.deleteMany({ room: createdRoomId });
    await ChatRoom.findByIdAndDelete(createdRoomId);
    await Hotspot.findByIdAndDelete(createdHotspotId);
    await User.findByIdAndDelete(userId);
  });
});

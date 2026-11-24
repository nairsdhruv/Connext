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
let testUserId = '';
let testHotspotId = '';
let testRoomId = '';

beforeAll(async () => {
  await mongoose.connect(TEST_DB_URI);
  app = createApp();

  // Clear test DB collections
  await User.deleteMany({});
  await Hotspot.deleteMany({});
  await ChatRoom.deleteMany({});
  await Message.deleteMany({});
});

afterAll(async () => {
  await User.deleteMany({});
  await Hotspot.deleteMany({});
  await ChatRoom.deleteMany({});
  await Message.deleteMany({});
  await mongoose.disconnect();
});

describe('1. Authentication & Security', () => {
  it('registers a new user successfully and hashes the password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        displayName: 'Test User',
        email: 'testuser@connext.test',
        password: 'SecurePassword123!',
        bio: 'Testing full stack Connext app'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.displayName).toBe('Test User');
    expect(res.body.user.passwordHash).toBeUndefined(); // Should never expose password hash

    // Verify password is encrypted in database
    const dbUser = await User.findById(res.body.user.id);
    expect(dbUser.passwordHash).not.toBe('SecurePassword123!');
    expect(dbUser.passwordHash).toMatch(/^\$2[aby]\$/);

    authToken = res.body.token;
    testUserId = res.body.user.id;
  });

  it('rejects registration with duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        displayName: 'Test User 2',
        email: 'testuser@connext.test',
        password: 'AnotherPassword123!'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it('authenticates user on login and returns a token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'testuser@connext.test',
        password: 'SecurePassword123!'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.displayName).toBe('Test User');
  });

  it('rejects invalid password on login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'testuser@connext.test',
        password: 'WrongPassword!'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('protects /api/auth/me against unauthenticated access', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns current user with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('testuser@connext.test');
  });
});

describe('2. Hotspots & Geospatial Discovery', () => {
  it('creates a new hangout hotspot with valid coordinates and provisions a chat room', async () => {
    const res = await request(app)
      .post('/api/hotspots')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Cubbon Park Reading Circle',
        description: 'An open reading group beneath the shaded trees of Cubbon Park.',
        category: 'parks',
        type: 'hangout',
        coordinates: [77.5925, 12.9763], // [lng, lat]
        address: 'Cubbon Park Central Gate, Bengaluru',
        capacity: 30
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.hotspot.name).toBe('Cubbon Park Reading Circle');
    expect(res.body.hotspot.location.coordinates).toEqual([77.5925, 12.9763]);
    expect(res.body.hotspot.chatRoom).toBeDefined();

    testHotspotId = res.body.hotspot.id || res.body.hotspot._id;
    testRoomId = res.body.hotspot.chatRoom.id || res.body.hotspot.chatRoom._id;
  });

  it('validates coordinates bounds', async () => {
    const res = await request(app)
      .post('/api/hotspots')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Invalid Coordinates Spot',
        description: 'Testing coordinate validation bounds on server.',
        category: 'cafes',
        coordinates: [200, 95], // Invalid lng > 180, lat > 90
        address: 'Nowhere Street'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('validates meetup dates (end time must be after start time)', async () => {
    const now = new Date();
    const earlier = new Date(now.getTime() - 3600000);

    const res = await request(app)
      .post('/api/hotspots')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Invalid Meetup Times',
        description: 'Meetup where end time is before start time.',
        category: 'board_games',
        type: 'meetup',
        coordinates: [77.6, 12.9],
        address: 'Indiranagar Game Cafe',
        startDateTime: now.toISOString(),
        endDateTime: earlier.toISOString()
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('retrieves nearby hotspots via geospatial query', async () => {
    const res = await request(app)
      .get('/api/hotspots/nearby')
      .query({
        lng: 77.592,
        lat: 12.976,
        maxDistance: 5000
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.hotspots.length).toBeGreaterThan(0);
    expect(res.body.hotspots[0].distanceMeters).toBeDefined();
  });
});

describe('3. Temporary Real-Time Chat Rooms & Persistence', () => {
  it('retrieves the provisioned chat room and participants', async () => {
    const res = await request(app)
      .get(`/api/rooms/${testRoomId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.room.status).toBe('active');
    expect(res.body.room.participants.length).toBeGreaterThan(0);
  });

  it('persists and retrieves messages within the temporary room', async () => {
    // Manually persist a message to test DB retrieval & serialization
    await Message.create({
      room: testRoomId,
      sender: testUserId,
      content: 'Hello everyone! Excited for our meetup.'
    });

    const res = await request(app)
      .get(`/api/rooms/${testRoomId}/messages`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.messages.length).toBe(1);
    expect(res.body.messages[0].content).toBe('Hello everyone! Excited for our meetup.');
  });

  it('rejects joining a closed or expired room', async () => {
    // Mark room as closed
    await ChatRoom.findByIdAndUpdate(testRoomId, { status: 'closed' });

    const res = await request(app)
      .post(`/api/rooms/${testRoomId}/join`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/expired or been closed/i);

    // Restore room status for other tests
    await ChatRoom.findByIdAndUpdate(testRoomId, { status: 'active' });
  });
});

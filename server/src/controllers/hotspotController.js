import { Hotspot } from '../models/Hotspot.js';
import { ChatRoom } from '../models/ChatRoom.js';
import { Message } from '../models/Message.js';

export const createHotspot = async (req, res, next) => {
  try {
    const {
      name,
      description,
      category,
      type = 'hangout',
      coordinates, // [lng, lat]
      address,
      capacity,
      startDateTime,
      endDateTime,
      imageUrl,
      tags
    } = req.body;

    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return res.status(400).json({
        success: false,
        message: 'Valid coordinates [longitude, latitude] are required.'
      });
    }

    const [lng, lat] = coordinates.map(Number);
    if (isNaN(lng) || isNaN(lat) || lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      return res.status(400).json({
        success: false,
        message: 'Coordinates must be valid numbers: longitude between -180 and 180, latitude between -90 and 90.'
      });
    }

    if (type === 'meetup') {
      if (!startDateTime || !endDateTime) {
        return res.status(400).json({
          success: false,
          message: 'Meetups require both startDateTime and endDateTime.'
        });
      }
      const start = new Date(startDateTime);
      const end = new Date(endDateTime);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid startDateTime or endDateTime format.'
        });
      }
      if (end <= start) {
        return res.status(400).json({
          success: false,
          message: 'Meetup end time must be after the start time.'
        });
      }
    }

    // Create hotspot document
    const hotspot = new Hotspot({
      name: name.trim(),
      description: description.trim(),
      category,
      type,
      location: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      address: address.trim(),
      creator: req.user._id,
      capacity: capacity ? Number(capacity) : undefined,
      startDateTime: type === 'meetup' ? new Date(startDateTime) : undefined,
      endDateTime: type === 'meetup' ? new Date(endDateTime) : undefined,
      imageUrl: imageUrl?.trim(),
      tags: Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map((t) => t.trim().toLowerCase()) : [],
      attendees: [{ user: req.user._id, joinedAt: new Date() }]
    });

    await hotspot.save();

    // Automatically provision temporary chat room
    const ttlHours = Number(process.env.HANGOUT_ROOM_TTL_HOURS) || 24;
    const graceHours = Number(process.env.MEETUP_ROOM_GRACE_HOURS) || 6;

    let expiresAt;
    if (type === 'meetup') {
      expiresAt = new Date(new Date(endDateTime).getTime() + graceHours * 60 * 60 * 1000);
    } else {
      expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
    }

    const chatRoom = await ChatRoom.create({
      hotspot: hotspot._id,
      expiresAt,
      maxParticipants: capacity ? Number(capacity) : 50,
      participants: [{ user: req.user._id, joinedAt: new Date() }]
    });

    hotspot.chatRoom = chatRoom._id;
    await hotspot.save();

    const populatedHotspot = await Hotspot.findById(hotspot._id)
      .populate('creator', 'displayName avatar')
      .populate('chatRoom');

    res.status(201).json({
      success: true,
      hotspot: populatedHotspot
    });
  } catch (error) {
    next(error);
  }
};

export const getHotspots = async (req, res, next) => {
  try {
    const {
      category,
      type,
      status = 'active',
      search,
      bbox, // minLng,minLat,maxLng,maxLat
      page = 1,
      limit = 100,
      sort = 'newest'
    } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (type && type !== 'all') {
      query.type = type;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { address: searchRegex },
        { tags: searchRegex }
      ];
    }

    if (bbox) {
      const parts = bbox.split(',').map(Number);
      if (parts.length === 4 && parts.every((n) => !isNaN(n))) {
        const [minLng, minLat, maxLng, maxLat] = parts;
        query.location = {
          $geoWithin: {
            $box: [
              [minLng, minLat],
              [maxLng, maxLat]
            ]
          }
        };
      }
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'upcoming') {
      sortOption = { startDateTime: 1 };
    } else if (sort === 'popular') {
      sortOption = { 'attendees.length': -1 };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [hotspots, total] = await Promise.all([
      Hotspot.find(query)
        .populate('creator', 'displayName avatar')
        .populate('chatRoom', 'status expiresAt participants')
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit)),
      Hotspot.countDocuments(query)
    ]);

    res.json({
      success: true,
      count: hotspots.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      hotspots
    });
  } catch (error) {
    next(error);
  }
};

export const getNearbyHotspots = async (req, res, next) => {
  try {
    const { lng, lat, maxDistance = 15000, category, type } = req.query;

    if (!lng || !lat || isNaN(Number(lng)) || isNaN(Number(lat))) {
      return res.status(400).json({
        success: false,
        message: 'Valid lng and lat query parameters are required for nearby lookup.'
      });
    }

    const longitude = Number(lng);
    const latitude = Number(lat);
    const maxDist = Math.min(Number(maxDistance), 100000); // limit to 100km max

    const matchStage = { status: 'active' };
    if (category && category !== 'all') matchStage.category = category;
    if (type && type !== 'all') matchStage.type = type;

    const nearby = await Hotspot.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          distanceField: 'distanceMeters',
          maxDistance: maxDist,
          spherical: true,
          query: matchStage
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'creator',
          foreignField: '_id',
          as: 'creatorDetails'
        }
      },
      {
        $lookup: {
          from: 'chatrooms',
          localField: 'chatRoom',
          foreignField: '_id',
          as: 'chatRoomDetails'
        }
      },
      {
        $addFields: {
          creator: { $arrayElemAt: ['$creatorDetails', 0] },
          chatRoom: { $arrayElemAt: ['$chatRoomDetails', 0] },
          distanceKm: { $round: [{ $divide: ['$distanceMeters', 1000] }, 2] }
        }
      },
      {
        $project: {
          creatorDetails: 0,
          chatRoomDetails: 0,
          'creator.passwordHash': 0,
          'creator.email': 0
        }
      },
      { $limit: 100 }
    ]);

    res.json({
      success: true,
      count: nearby.length,
      hotspots: nearby
    });
  } catch (error) {
    next(error);
  }
};

export const getHotspotById = async (req, res, next) => {
  try {
    const hotspot = await Hotspot.findById(req.params.id)
      .populate('creator', 'displayName avatar bio')
      .populate('attendees.user', 'displayName avatar')
      .populate('chatRoom');

    if (!hotspot) {
      return res.status(404).json({
        success: false,
        message: 'Hotspot not found.'
      });
    }

    res.json({
      success: true,
      hotspot
    });
  } catch (error) {
    next(error);
  }
};

export const updateHotspot = async (req, res, next) => {
  try {
    const hotspot = await Hotspot.findById(req.params.id);

    if (!hotspot) {
      return res.status(404).json({
        success: false,
        message: 'Hotspot not found.'
      });
    }

    // Only creator can edit
    if (hotspot.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. You can only edit hotspots you created.'
      });
    }

    const { name, description, category, address, capacity, imageUrl, tags, status } = req.body;

    if (name) hotspot.name = name.trim();
    if (description) hotspot.description = description.trim();
    if (category) hotspot.category = category;
    if (address) hotspot.address = address.trim();
    if (capacity) hotspot.capacity = Number(capacity);
    if (typeof imageUrl === 'string') hotspot.imageUrl = imageUrl.trim();
    if (status && ['active', 'cancelled', 'completed'].includes(status)) hotspot.status = status;
    if (tags) {
      hotspot.tags = Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim().toLowerCase());
    }

    await hotspot.save();

    res.json({
      success: true,
      hotspot
    });
  } catch (error) {
    next(error);
  }
};

export const deleteHotspot = async (req, res, next) => {
  try {
    const hotspot = await Hotspot.findById(req.params.id);

    if (!hotspot) {
      return res.status(404).json({
        success: false,
        message: 'Hotspot not found.'
      });
    }

    if (hotspot.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. You can only delete hotspots you created.'
      });
    }

    // Cleanup associated ChatRoom and Messages
    if (hotspot.chatRoom) {
      await Message.deleteMany({ room: hotspot.chatRoom });
      await ChatRoom.findByIdAndDelete(hotspot.chatRoom);
    }

    await Hotspot.findByIdAndDelete(hotspot._id);

    res.json({
      success: true,
      message: 'Hotspot and its associated temporary room were removed.'
    });
  } catch (error) {
    next(error);
  }
};

export const getMyHotspots = async (req, res, next) => {
  try {
    const created = await Hotspot.find({ creator: req.user._id })
      .populate('chatRoom', 'status expiresAt participants')
      .sort({ createdAt: -1 });

    const attending = await Hotspot.find({
      'attendees.user': req.user._id,
      creator: { $ne: req.user._id }
    })
      .populate('creator', 'displayName avatar')
      .populate('chatRoom', 'status expiresAt participants')
      .sort({ startDateTime: 1, createdAt: -1 });

    res.json({
      success: true,
      created,
      attending
    });
  } catch (error) {
    next(error);
  }
};

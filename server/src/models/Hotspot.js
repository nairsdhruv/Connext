import mongoose from 'mongoose';

const attendeeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const hotspotSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Hotspot name is required'],
      trim: true,
      minlength: [3, 'Name must be at least 3 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [1500, 'Description cannot exceed 1500 characters']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'cafes',
        'parks',
        'college',
        'libraries',
        'walking_running',
        'study_groups',
        'board_games',
        'music',
        'food',
        'casual_chat',
        'sports',
        'other'
      ],
      index: true
    },
    type: {
      type: String,
      enum: ['hangout', 'meetup'],
      default: 'hangout',
      index: true
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        validate: {
          validator: function (coords) {
            return (
              Array.isArray(coords) &&
              coords.length === 2 &&
              coords[0] >= -180 &&
              coords[0] <= 180 && // longitude
              coords[1] >= -90 &&
              coords[1] <= 90 // latitude
            );
          },
          message: 'Coordinates must be valid [longitude, latitude] array'
        }
      }
    },
    address: {
      type: String,
      required: [true, 'Address / location description is required'],
      trim: true,
      maxlength: [300, 'Address cannot exceed 300 characters']
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'completed'],
      default: 'active',
      index: true
    },
    capacity: {
      type: Number,
      min: [2, 'Capacity must be at least 2'],
      max: [500, 'Capacity cannot exceed 500']
    },
    startDateTime: {
      type: Date,
      index: true
    },
    endDateTime: {
      type: Date
    },
    attendees: [attendeeSchema],
    chatRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatRoom'
    },
    imageUrl: {
      type: String,
      trim: true
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true
      }
    ],
    isDemoData: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// 2dsphere index for geographic queries
hotspotSchema.index({ location: '2dsphere' });
hotspotSchema.index({ status: 1, type: 1, category: 1 });

export const Hotspot = mongoose.model('Hotspot', hotspotSchema);

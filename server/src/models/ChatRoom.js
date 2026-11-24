import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema(
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

const chatRoomSchema = new mongoose.Schema(
  {
    hotspot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotspot',
      required: true,
      unique: true
    },
    status: {
      type: String,
      enum: ['active', 'closed', 'expired'],
      default: 'active',
      index: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    closedAt: {
      type: Date
    },
    maxParticipants: {
      type: Number,
      default: 50,
      min: 2,
      max: 500
    },
    participants: [participantSchema]
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

chatRoomSchema.index({ status: 1, expiresAt: 1 });

export const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);

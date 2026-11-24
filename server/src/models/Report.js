import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    targetType: {
      type: String,
      enum: ['hotspot', 'message', 'user'],
      required: true
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    reason: {
      type: String,
      enum: ['spam', 'harassment', 'inappropriate', 'safety_concern', 'other'],
      required: true
    },
    details: {
      type: String,
      trim: true,
      maxlength: [500, 'Details cannot exceed 500 characters']
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'dismissed'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

export const Report = mongoose.model('Report', reportSchema);

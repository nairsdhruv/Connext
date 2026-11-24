import mongoose from 'mongoose';

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/connext';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true
    });
    console.log(`[MongoDB] Connected to database: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    // If local fails and user supplied Atlas, or vice-versa, log helpful advice
    console.error(`[MongoDB] Please verify that MongoDB is running locally (e.g., net start MongoDB) or check your MONGODB_URI in .env`);
    throw error;
  }
};

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dashboard_manager';

let isConnected = false;

export async function connectToMongoDB() {
  if (isConnected) {
    console.log('[MongoDB] Using existing connection');
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      // Mongoose 6+ doesn't need these options, but kept for compatibility
      serverSelectionTimeoutMS: 10000, // Increased timeout
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    console.log('[MongoDB] Connected successfully');
    console.log(`📦 Database: ${mongoose.connection.name}`);
    
    mongoose.connection.on('error', (err) => {
      console.error('[MongoDB] Connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('[MongoDB] Disconnected');
      isConnected = false;
    });

  } catch (error: any) {
    console.log('[MongoDB] Not connected (optional)');
    console.log('   Using file-based storage instead.');
    console.log('   To enable MongoDB: Configure MONGODB_URI in .env');
    
    isConnected = false;
    // MongoDB is optional - continue without it
  }
}

export async function disconnectFromMongoDB() {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log('[MongoDB] Disconnected successfully');
  } catch (error) {
    console.error('[MongoDB] Error disconnecting:', error);
    throw error;
  }
}

// Get connection status
export function isMongoDBConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

export { mongoose };

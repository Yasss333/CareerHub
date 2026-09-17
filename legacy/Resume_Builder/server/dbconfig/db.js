import mongoose from "mongoose";

const dbConnect = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    // Validate that connection string is provided
    if (!mongoUri) {
      throw new Error(
        "MONGODB_URI environment variable is not defined. Please check your .env file"
      );
    }

    // Connect with optimized pool settings
    const connection = await mongoose.connect(mongoUri, {
      maxPoolSize: 10, // Maximum number of connections in the pool
      minPoolSize: 2, // Minimum number of connections to keep open
      socketTimeoutMS: 45000, // Timeout for socket operations
      serverSelectionTimeoutMS: 10000, // Timeout for server selection
      family: 4, // Use IPv4
      retryWrites: true, // Enable automatic retries
    });

    console.log("✅ MongoDB Connected Successfully");
    // console.log(`Connected to: ${mongoUri.split("@")[1] || mongoUri}`);

    // Handle connection events
    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected");
    });

    mongoose.connection.on("error", (error) => {
      console.error("❌ MongoDB Connection Error:", error.message);
    });

    return connection;
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:");
    console.error(`Error: ${error.message}`);
    console.error("Please ensure:");
    console.error("  1. MongoDB is running");
    console.error("  2. MONGODB_URI is set in your .env file");
    console.error("  3. Your connection string is correct");
    console.error("  4. Your IP is whitelisted (for MongoDB Atlas)");
    
    // Re-throw the error so the app doesn't start without DB
    throw error;
  }
};

export default dbConnect;
import express from "express";
import "dotenv/config";
import cors from "cors"
import dbConnect from "./dbconfig/db.js";
import router from "./Routes/userRoutes.js";
import resumeRouter from "./Routes/resume.router.js";
import AIRouter from "./Routes/aiRoutes.js";

const app = express();
const PORT = process.env.PORT ?? 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use("/api/user", router);
app.use("/api/resume", resumeRouter); 
app.use("/api/ai", AIRouter);

app.get("/", (req, res) => {
  return res.send("Hello from Resume Builder Server! 🚀");
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// Initialize server with database connection
const startServer = async () => {
  try {
    // Connect to database first
    console.log("🔌 Connecting to MongoDB...");
    await dbConnect();

    // Start listening only after DB connection is successful
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT} 💘`);
      console.log(`   Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1); // Exit with error code
  }
};

startServer();

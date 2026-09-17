//.md preview ctr+shift+v

import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRouter from "../src/Routes/auth.routes.js";
import probRouter from "../src/Routes/problemManagement.route.js"
import executionRouter from "../src/Routes/execute_coderoutes.js"
import submissionRoute from "../src/Routes/submission_route.js";
import playlistRoute from "../src/Routes/playlistRoute.js"
import rankingRouter from "../src/Routes/ranking.routes.js"
dotenv.config();
const app = express();


const allowedOrigins = [
  "http://localhost:5173",
  "https://algo-rank-333.vercel.app",
    "https://algo-rank.vercel.app/"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith(".vercel.app")
    ) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  credentials: true,
}));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});


// IMPORTANT: handle preflight explicitly

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT || 5000;

if (!process.env.SECRET) {
  throw new Error("JWT SECRET IS MISSING");
}

app.get("/",(req,res)=>{
  console.log("Hello from AlgoRank ✅ " );
  res.send("Hello from AlgoRank ✅");
 });

 app.use("/api/v1/auth",authRouter);
 app.use("/api/v1/problems",probRouter);
 app.use("/api/v1/execute-route",executionRouter);
 app.use("/api/v1/submission",submissionRoute);
 app.use("/api/v1/playlist",playlistRoute);
 app.use("/api/v1/ranking",rankingRouter);

app.listen(PORT, () => {
  console.log(`Server started on ${PORT}`);
});

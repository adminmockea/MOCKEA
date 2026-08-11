import express from "express"
import path from "path"
import "dotenv/config"
import cors from "cors"
import userRouter from "./routes/user.route.js";
import { connectDb } from "./lib/connectDB.js";
import qRouter from "./routes/questions.route.js";
import analyticsRouter from "./routes/analytics.route.js";
import errorLogRouter from "./routes/errorLog.route.js";
import errorHandler from "./middlewares/errorHandler.js";
import mockTestRouter from "./routes/mockTest.route.js";
import publicMockTestRouter from "./routes/publicMockTest.route.js";
import sRouter from "./routes/submissions.route.js";
import pricingRouter from "./routes/pricing.route.js";
import resourceRouter from "./routes/resource.route.js";
import trainersRouter from "./routes/trainer.route.js";
import apiRateLimiter from "./middlewares/apiRateLimiter.js";
import chatbotRouter from "./routes/chatbot.route.js";
import { sanitizeMiddleware } from "./middlewares/sanitize.js";
import superAdminRouter from "./routes/superAdmin.route.js";
import settingsRouter from "./routes/settings.route.js";
import ipBlocker from "./middlewares/ipBlocker.js";
import bookingRouter from "./routes/booking.route.js";
import institutionRouter from "./routes/institution.route.js";

const Port = process.env.PORT || 3000;


const app = express();

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));



const rawOrigins = [
  process.env.CLIENT_URL,
  process.env.CLIENT_URL2,
  process.env.DEV_URL,
  process.env.DEV_URL2,
  "https://mockea.web.app",
  "https://eco-stream-90d55.web.app",
];

const allowedOrigins = rawOrigins
  .filter(Boolean)
  .map((url) => url.trim().replace(/\/$/, ""));

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.trim().replace(/\/$/, "");
      if (allowedOrigins.includes(cleanOrigin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    optionsSuccessStatus: 200,
  })
);

app.use(express.json());
app.use(ipBlocker);
app.use(sanitizeMiddleware);
// app.use(express.urlencoded({ extended: true }));

// Apply global rate limiting to all public and private API routes (120 requests per minute per IP)
// Skip rate limiting for upload-signature — it is a lightweight signing-key fetch
// that is called once per recording (up to 11× in a speaking test).
app.use("/api", (req, res, next) => {
  if (req.path === "/submissions/upload-signature") return next();
  return apiRateLimiter("globalLimit", 60 * 1000)(req, res, next);
});


app.use("/api/user", userRouter);
app.use("/api/questions", qRouter);
app.use('/api/mock-tests', mockTestRouter);
app.use('/api/public-mock-tests', publicMockTestRouter);
app.use('/api/submissions', sRouter);
app.use('/api/error-logs', errorLogRouter);

app.use("/api/analytics", analyticsRouter);
import { getPublicSystemConfig } from "./controllers/superAdmin.controller.js";

app.use("/api/settings/logs", errorLogRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/pricing", pricingRouter);
app.use("/api/resources", resourceRouter);
app.use("/api/trainers", trainersRouter);
app.use("/api/chatbot", chatbotRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/institutions", institutionRouter);
app.use("/api/superadmin", superAdminRouter);
app.get("/api/settings/public", getPublicSystemConfig);


app.get("/", (req, res) => {
    res.send("MOCKEA Server is running");
})

// Error handling middleware (must be last)
app.use(errorHandler);

const startServer = async ()=>{
    try {
        await connectDb();
        app.listen(Port, () => {
            console.log(`MOCKEA Server is running on port ${Port}`);
        })
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1);
    }
}

startServer()
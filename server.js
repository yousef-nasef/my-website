import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet"; 
import { rateLimit } from "express-rate-limit"; 
import { connectDB } from "./db.js";

// Routes Imports
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js"; 
import courseRoutes from "./routes/course.routes.js";
import lessonRoutes from "./routes/lesson.routes.js";
import subscriptionRoutes from "./routes/subscription.routes.js";
import codeRoutes from "./routes/code.routes.js"; // تم تعديل مسارها بالأسفل
import analyticsRoutes from "./routes/analytics.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Security Rate Limiter ────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  limit: 150, 
  standardHeaders: "draft-7", 
  legacyHeaders: false, 
  message: {
    success: false,
    message: "كثرة الطلبات من هذا الجهاز، برجاء المحاولة لاحقاً بعد 15 دقيقة.",
  },
});

// ─── Middleware ───────────────────────────────────────────
app.use(helmet()); 
app.use("/api/auth", limiter); 

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── DB Connection ────────────────────────────────────────
connectDB();

/// ─── Routes Linking ───────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// 🎫 تعديل مسار شحن الستائر لمنع التضارب مع الكورسات
app.use("/api/codes", codeRoutes); 

// 📚 مسار الكورسات الأساسي شغال الآن بحرية 100%
app.use("/api/courses", courseRoutes); 

app.use("/api/lessons", lessonRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/analytics", analyticsRoutes);

// ─── Health Check ─────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running 🚀" });
});

// ─── 404 Handler ──────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ─── Global Error Handler ─────────────────────────────────
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ─── Start Server ─────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

export default app;
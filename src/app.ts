import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import { NotFound } from "./middleware/NotFound";
import errorHandler from "./middleware/GlobalErrorHandeler";
import { tutorsRouter } from "./modules/tutors/tutors.route";
import { CategoryRoutes } from "./modules/Categories/category.route";
import { TutorCategoryRoutes } from "./modules/tutors/tutorCategory.route";
import { AvailabilityRoutes } from "./modules/availability/availability.route";
import { BookingRoutes } from "./modules/bookings/booking.route";
import { ReviewRoutes } from "./modules/reviews/review.route";
import { UserRoutes } from "./modules/users/user.route";
import { AdminRoutes } from "./modules/admin/admin.route";
const app = express();
app.use(express.json());
const allowedOrigins = [
  process.env.APP_URL || "http://localhost:3000",
  process.env.PROD_APP_URL,
].filter(Boolean);


app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isAllowed =
        allowedOrigins.includes(origin) ||
        /^https:\/\/next-blog-client.*\.vercel\.app$/.test(origin) ||
        /^https:\/\/.*\.vercel\.app$/.test(origin); 

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposedHeaders: ["Set-Cookie"],
  }),
);


app.all("/api/auth/*splat", toNodeHandler(auth));
app.use("/api/user", UserRoutes);
app.use("/api/admin", AdminRoutes);
app.use("/api/tutor", tutorsRouter);
app.use("/api/categories", CategoryRoutes);
app.use("/api/tutorCategories", TutorCategoryRoutes);
app.use("/api", AvailabilityRoutes);
app.use("/api/bookings", BookingRoutes);
app.use("/api/reviews", ReviewRoutes);
app.get("/", (req, res) => {
  res.send("SkillBridge");
});
app.use(NotFound);
app.use(errorHandler);

export default app;

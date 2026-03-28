import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import { NotFound } from "./middleware/NotFound";
import { tutorsRouter } from "./modules/tutors/tutors.route";
import { CategoryRoutes } from "./modules/Categories/category.route";
import { TutorCategoryRoutes } from "./modules/tutors/tutorCategory.route";
import { AvailabilityRoutes } from "./modules/availability/availability.route";
import { BookingRoutes } from "./modules/bookings/booking.route";
import { ReviewRoutes } from "./modules/reviews/review.route";
import { UserRoutes } from "./modules/users/user.route";
import { AdminRoutes } from "./modules/admin/admin.route";
import { globalErrorHandler } from "./middleware/GlobalErrorHandeler";
import qs from "qs";
import path from "path";
import { IndexRoute } from "./routers";
const app = express();
app.set("query parser", (str: string) => qs.parse(str));
app.set("view engine", "ejs");
app.set("views", path.resolve(process.cwd(), `src/app/templates`));

// Stripe Webhook bypasses standard global JSON parsing preserving signature buffers
app.use("/api/v1/payments/webhook", express.raw({ type: "application/json" }));
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

// Enable Better Auth routes for OAuth handling (use regex pattern)
app.all(/^\/api\/auth\/.*$/, toNodeHandler(auth));

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// app.use("/api/v1/user", UserRoutes);
// app.use("/api/v1/admin", AdminRoutes);
// app.use("/api/v1/tutor", tutorsRouter);
// app.use("/api/v1/categories", CategoryRoutes);
// app.use("/api/v1/tutorCategories", TutorCategoryRoutes);
// app.use("/api/v1", AvailabilityRoutes);
// app.use("/api/v1/bookings", BookingRoutes);
// app.use("/api/v1/reviews", ReviewRoutes);

app.use("/api/v1", IndexRoute);

app.get("/", (req, res) => {
  res.send("SkillBridge");
});
app.use(NotFound);
app.use(globalErrorHandler);

export default app;

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
const app = express();
app.use(express.json());
app.use(
  cors({
    origin: process.env.app_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.all("/api/auth/*splat", toNodeHandler(auth));
app.use("/api/tutor", tutorsRouter);
app.use("/api/categories", CategoryRoutes);
app.use("/api/tutorCategories", TutorCategoryRoutes);
app.use("/api", AvailabilityRoutes);
app.get("/", (req, res) => {
  res.send("SkillBridge");
});
app.use(NotFound);
app.use(errorHandler);

export default app;

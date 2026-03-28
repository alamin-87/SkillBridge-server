import { Router } from "express";
import { AuthRoute } from "../modules/auth/auth.routes";
import { UserRoutes } from "../modules/users/user.route";
import { TutorRequestRoutes } from "../modules/tutors/tutorRequest.route";
import { StatsRoutes } from "../modules/stats/stats.route";
import { AdminRoutes } from "../modules/admin/admin.route";
import { CategoryRoutes } from "../modules/Categories/category.route";
import { TutorCategoryRoutes } from "../modules/tutors/tutorCategory.route";
import { AvailabilityRoutes } from "../modules/availability/availability.route";
import { BookingRoutes } from "../modules/bookings/booking.route";
import { ReviewRoutes } from "../modules/reviews/review.route";
import { PaymentRoutes } from "../modules/payment/payment.route";
import { tutorsRouter } from "../modules/tutors/tutors.route";
import { AssignmentRoutes } from "../modules/assignment/assignment.route";
import { NotificationRoutes } from "../modules/notification/notification.route";

const router = Router();

router.use("/auth", AuthRoute);
router.use("/user", UserRoutes);

// Core Modules
router.use("/admin", AdminRoutes);
router.use("/tutors", TutorRequestRoutes);
router.use("/tutor", tutorsRouter);
router.use("/categories", CategoryRoutes);
router.use("/tutorCategories", TutorCategoryRoutes);

// Activity Modules
router.use("/stats", StatsRoutes);
router.use("/bookings", BookingRoutes);
router.use("/reviews", ReviewRoutes);
router.use("/assignments", AssignmentRoutes);

// System Alerts
router.use("/notifications", NotificationRoutes);

// Availability natively deployed (removed prefix to standardise path correctly)
router.use("/", AvailabilityRoutes);

// Payment System internally
router.use("/payments", PaymentRoutes);

export const IndexRoute = router;
/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";

// ─────────────────────────────────────────────
// STUDENT STATS
// ─────────────────────────────────────────────
const getStudentStats = async (userId: string) => {
  // ── Summary counts ──
  const [
    totalBookings,
    confirmedBookings,
    completedBookings,
    cancelledBookings,
    pendingBookings,
    totalReviewsGiven,
    totalAssignments,
    totalSubmissions,
  ] = await Promise.all([
    prisma.booking.count({ where: { studentId: userId } }),
    prisma.booking.count({ where: { studentId: userId, status: "CONFIRMED" } }),
    prisma.booking.count({ where: { studentId: userId, status: "COMPLETED" } }),
    prisma.booking.count({ where: { studentId: userId, status: "CANCELLED" } }),
    prisma.booking.count({ where: { studentId: userId, status: "PENDING" } }),
    prisma.review.count({ where: { studentId: userId } }),
    prisma.assignment.count({ where: { createdById: userId } }),
    prisma.assignmentSubmission.count({ where: { studentId: userId } }),
  ]);

  // ── Total spent (successful payments) ──
  const spendingAgg = await prisma.payment.aggregate({
    where: { userId, status: "SUCCESS" },
    _sum: { amount: true },
  });
  const totalSpent = spendingAgg._sum.amount ?? 0;

  // ── Booking status pie chart ──
  const bookingStatusDistribution = [
    { name: "Pending", value: pendingBookings },
    { name: "Confirmed", value: confirmedBookings },
    { name: "Completed", value: completedBookings },
    { name: "Cancelled", value: cancelledBookings },
  ];

  // ── Assignment submission status pie chart ──
  const [pendingSubs, submittedSubs, gradedSubs] = await Promise.all([
    prisma.assignmentSubmission.count({
      where: { studentId: userId, status: "PENDING" },
    }),
    prisma.assignmentSubmission.count({
      where: { studentId: userId, status: "SUBMITTED" },
    }),
    prisma.assignmentSubmission.count({
      where: { studentId: userId, status: "GRADED" },
    }),
  ]);

  const assignmentStatusDistribution = [
    { name: "Pending", value: pendingSubs },
    { name: "Submitted", value: submittedSubs },
    { name: "Graded", value: gradedSubs },
  ];

  // ── Average grade ──
  const gradeAgg = await prisma.assignmentSubmission.aggregate({
    where: { studentId: userId, status: "GRADED" },
    _avg: { grade: true },
  });
  const averageGrade = gradeAgg._avg.grade ?? 0;

  // ── Monthly bookings bar chart (last 12 months) ──
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const bookingsLast12 = await prisma.booking.findMany({
    where: {
      studentId: userId,
      createdAt: { gte: twelveMonthsAgo },
    },
    select: { createdAt: true },
  });

  const monthlyBookings = buildMonthlyData(bookingsLast12);

  // ── Monthly spending bar chart (last 12 months) ──
  const paymentsLast12 = await prisma.payment.findMany({
    where: {
      userId,
      status: "SUCCESS",
      createdAt: { gte: twelveMonthsAgo },
    },
    select: { createdAt: true, amount: true },
  });

  const monthlySpending = buildMonthlyAmountData(paymentsLast12);

  // ── Recent bookings ──
  const recentBookings = await prisma.booking.findMany({
    where: { studentId: userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      tutor: { select: { id: true, name: true, image: true } },
      tutorProfile: { select: { id: true, bio: true, hourlyRate: true } },
      review: true,
    },
  });

  // ── Recent reviews ──
  const recentReviews = await prisma.review.findMany({
    where: { studentId: userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      tutor: { select: { id: true, name: true, image: true } },
      booking: {
        select: { id: true, scheduledStart: true, scheduledEnd: true },
      },
    },
  });

  // ── Upcoming bookings ──
  const upcomingBookings = await prisma.booking.findMany({
    where: { 
      studentId: userId, 
      status: "CONFIRMED", 
      scheduledStart: { gt: new Date() } 
    },
    orderBy: { scheduledStart: "asc" },
    take: 5,
    include: {
      tutor: { select: { id: true, name: true, image: true, email: true } },
    },
  });

  // ── Recent Assignments ──
  const recentAssignments = await prisma.assignmentSubmission.findMany({
    where: { studentId: userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      assignment: { select: { id: true, title: true } },
      gradedBy: { select: { id: true, name: true } }
    }
  });

  return {
    summary: {
      totalBookings,
      completedBookings,
      totalReviewsGiven,
      totalAssignments,
      totalSubmissions,
      totalSpent,
      averageGrade: Number(averageGrade.toFixed(2)),
    },
    charts: {
      bookingStatusDistribution,
      assignmentStatusDistribution,
      monthlyBookings,
      monthlySpending,
    },
    upcomingBookings,
    recentBookings,
    recentReviews,
    recentAssignments,
  };
};

// ─────────────────────────────────────────────
// TUTOR STATS
// ─────────────────────────────────────────────
const getTutorStats = async (userId: string) => {
  // Verify tutor profile exists
  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      totalEarnings: true,
      avgRating: true,
      totalReviews: true,
      hourlyRate: true,
    },
  });

  if (!tutorProfile) {
    throw new AppError(
      status.NOT_FOUND as number,
      "Tutor profile not found"
    );
  }

  // ── Summary counts ──
  const [
    totalBookings,
    confirmedBookings,
    completedBookings,
    cancelledBookings,
    pendingBookings,
    totalReviewsReceived,
  ] = await Promise.all([
    prisma.booking.count({ where: { tutorId: userId } }),
    prisma.booking.count({
      where: { tutorId: userId, status: "CONFIRMED" },
    }),
    prisma.booking.count({
      where: { tutorId: userId, status: "COMPLETED" },
    }),
    prisma.booking.count({
      where: { tutorId: userId, status: "CANCELLED" },
    }),
    prisma.booking.count({ where: { tutorId: userId, status: "PENDING" } }),
    prisma.review.count({ where: { tutorId: userId } }),
  ]);

  // ── Unique students count ──
  const uniqueStudentGroups = await prisma.booking.groupBy({
    by: ["studentId"],
    where: { tutorId: userId },
  });
  const totalStudents = uniqueStudentGroups.length;

  // ── Total revenue (from successful payments on their bookings) ──
  const bookingIds = await prisma.booking.findMany({
    where: { tutorId: userId },
    select: { id: true },
  });
  const bookingIdList = bookingIds.map((b) => b.id);

  const revenueAgg = await prisma.payment.aggregate({
    where: {
      bookingId: { in: bookingIdList },
      status: "SUCCESS",
    },
    _sum: { amount: true },
  });
  const totalRevenue =
    revenueAgg._sum.amount ?? tutorProfile.totalEarnings;

  // ── Booking status pie chart ──
  const bookingStatusDistribution = [
    { name: "Pending", value: pendingBookings },
    { name: "Confirmed", value: confirmedBookings },
    { name: "Completed", value: completedBookings },
    { name: "Cancelled", value: cancelledBookings },
  ];

  // ── Rating distribution pie chart ──
  const [rating1, rating2, rating3, rating4, rating5] = await Promise.all(
    [
      prisma.review.count({ where: { tutorId: userId, rating: 1 } }),
      prisma.review.count({ where: { tutorId: userId, rating: 2 } }),
      prisma.review.count({ where: { tutorId: userId, rating: 3 } }),
      prisma.review.count({ where: { tutorId: userId, rating: 4 } }),
      prisma.review.count({ where: { tutorId: userId, rating: 5 } }),
    ]
  );

  const ratingDistribution = [
    { name: "1 Star", value: rating1 },
    { name: "2 Stars", value: rating2 },
    { name: "3 Stars", value: rating3 },
    { name: "4 Stars", value: rating4 },
    { name: "5 Stars", value: rating5 },
  ];

  // ── Monthly revenue bar chart (last 12 months) ──
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const paymentsLast12 = await prisma.payment.findMany({
    where: {
      bookingId: { in: bookingIdList },
      status: "SUCCESS",
      createdAt: { gte: twelveMonthsAgo },
    },
    select: { createdAt: true, amount: true },
  });

  const monthlyRevenue = buildMonthlyAmountData(paymentsLast12);

  // ── Monthly bookings bar chart (last 12 months) ──
  const bookingsLast12 = await prisma.booking.findMany({
    where: {
      tutorId: userId,
      createdAt: { gte: twelveMonthsAgo },
    },
    select: { createdAt: true },
  });

  const monthlyBookings = buildMonthlyData(bookingsLast12);

  // ── Monthly new students bar chart ──
  const studentBookingsLast12 = await prisma.booking.findMany({
    where: {
      tutorId: userId,
      createdAt: { gte: twelveMonthsAgo },
    },
    select: { studentId: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const monthlyNewStudents = buildMonthlyUniqueData(
    studentBookingsLast12
  );

  // ── Recent bookings ──
  const recentBookings = await prisma.booking.findMany({
    where: { tutorId: userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      student: {
        select: { id: true, name: true, image: true, email: true },
      },
      review: true,
      payment: { select: { status: true, amount: true } },
    },
  });

  // ── Recent reviews received ──
  const recentReviews = await prisma.review.findMany({
    where: { tutorId: userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      student: { select: { id: true, name: true, image: true } },
    },
  });

  // ── Graded assignments count ──
  const totalGradedAssignments =
    await prisma.assignmentSubmission.count({
      where: { gradedById: userId },
    });

  // ── Upcoming bookings ──
  const upcomingBookings = await prisma.booking.findMany({
    where: { 
      tutorId: userId, 
      status: "CONFIRMED", 
      scheduledStart: { gt: new Date() } 
    },
    orderBy: { scheduledStart: "asc" },
    take: 5,
    include: {
      student: { select: { id: true, name: true, image: true, email: true } },
    },
  });

  // ── Pending Assignments to grade ──
  const pendingAssignments = await prisma.assignmentSubmission.findMany({
    where: { 
      assignment: { createdById: userId }, 
      status: "SUBMITTED" 
    },
    orderBy: { createdAt: "asc" },
    take: 5,
    include: {
      assignment: { select: { id: true, title: true } },
      student: { select: { id: true, name: true, image: true, email: true } }
    }
  });

  return {
    summary: {
      totalBookings,
      completedBookings,
      totalStudents,
      totalRevenue,
      totalReviewsReceived,
      avgRating: tutorProfile.avgRating,
      hourlyRate: tutorProfile.hourlyRate,
      totalGradedAssignments,
    },
    charts: {
      bookingStatusDistribution,
      ratingDistribution,
      monthlyRevenue,
      monthlyBookings,
      monthlyNewStudents,
    },
    upcomingBookings,
    recentBookings,
    recentReviews,
    pendingAssignments,
  };
};

// ─────────────────────────────────────────────
// ADMIN STATS
// ─────────────────────────────────────────────
const getAdminStats = async () => {
  // ── Platform overview ──
  const [
    totalUsers,
    totalStudents,
    totalTutors,
    totalAdmins,
    activeUsers,
    bannedUsers,
    suspendedUsers,
    totalBookings,
    pendingBookings,
    confirmedBookings,
    completedBookings,
    cancelledBookings,
    totalCategories,
    totalReviews,
    totalAssignments,
    totalSubmissions,
    pendingTutorRequests,
    totalTutorProfiles,
  ] = await Promise.all([
    prisma.user.count({ where: { isDeleted: false } }),
    prisma.user.count({ where: { role: "STUDENT", isDeleted: false } }),
    prisma.user.count({ where: { role: "TUTOR", isDeleted: false } }),
    prisma.user.count({ where: { role: "ADMIN", isDeleted: false } }),
    prisma.user.count({ where: { status: "ACTIVE", isDeleted: false } }),
    prisma.user.count({ where: { status: "BANNED", isDeleted: false } }),
    prisma.user.count({
      where: { status: "SUSPENDED", isDeleted: false },
    }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: "PENDING" } }),
    prisma.booking.count({ where: { status: "CONFIRMED" } }),
    prisma.booking.count({ where: { status: "COMPLETED" } }),
    prisma.booking.count({ where: { status: "CANCELLED" } }),
    prisma.category.count(),
    prisma.review.count(),
    prisma.assignment.count(),
    prisma.assignmentSubmission.count(),
    prisma.tutorRequest.count({ where: { status: "PENDING" } }),
    prisma.tutorProfile.count(),
  ]);

  // ── Total platform revenue ──
  const revenueAgg = await prisma.payment.aggregate({
    where: { status: "SUCCESS" },
    _sum: { amount: true },
  });
  const totalRevenue = revenueAgg._sum.amount ?? 0;

  // ── Total successful payment count ──
  const totalSuccessfulPayments = await prisma.payment.count({
    where: { status: "SUCCESS" },
  });

  // ── Average rating across platform ──
  const avgRatingAgg = await prisma.review.aggregate({
    _avg: { rating: true },
  });
  const platformAvgRating = Number(
    (avgRatingAgg._avg.rating ?? 0).toFixed(2)
  );

  // ── User role distribution pie chart ──
  const userRoleDistribution = [
    { name: "Students", value: totalStudents },
    { name: "Tutors", value: totalTutors },
    { name: "Admins", value: totalAdmins },
  ];

  // ── User status distribution pie chart ──
  const userStatusDistribution = [
    { name: "Active", value: activeUsers },
    { name: "Banned", value: bannedUsers },
    { name: "Suspended", value: suspendedUsers },
  ];

  // ── Booking status pie chart ──
  const bookingStatusDistribution = [
    { name: "Pending", value: pendingBookings },
    { name: "Confirmed", value: confirmedBookings },
    { name: "Completed", value: completedBookings },
    { name: "Cancelled", value: cancelledBookings },
  ];

  // ── Payment status pie chart ──
  const [
    initiatedPayments,
    successPayments,
    failedPayments,
    refundedPayments,
  ] = await Promise.all([
    prisma.payment.count({ where: { status: "INITIATED" } }),
    prisma.payment.count({ where: { status: "SUCCESS" } }),
    prisma.payment.count({ where: { status: "FAILED" } }),
    prisma.payment.count({ where: { status: "REFUNDED" } }),
  ]);

  const paymentStatusDistribution = [
    { name: "Initiated", value: initiatedPayments },
    { name: "Success", value: successPayments },
    { name: "Failed", value: failedPayments },
    { name: "Refunded", value: refundedPayments },
  ];

  // ── Monthly data (last 12 months) ──
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  // Monthly user registrations
  const usersLast12 = await prisma.user.findMany({
    where: { createdAt: { gte: twelveMonthsAgo }, isDeleted: false },
    select: { createdAt: true },
  });
  const monthlyUserRegistrations = buildMonthlyData(usersLast12);

  // Monthly bookings
  const bookingsLast12 = await prisma.booking.findMany({
    where: { createdAt: { gte: twelveMonthsAgo } },
    select: { createdAt: true },
  });
  const monthlyBookings = buildMonthlyData(bookingsLast12);

  // Monthly revenue
  const paymentsLast12 = await prisma.payment.findMany({
    where: { status: "SUCCESS", createdAt: { gte: twelveMonthsAgo } },
    select: { createdAt: true, amount: true },
  });
  const monthlyRevenue = buildMonthlyAmountData(paymentsLast12);

  // Monthly reviews
  const reviewsLast12 = await prisma.review.findMany({
    where: { createdAt: { gte: twelveMonthsAgo } },
    select: { createdAt: true },
  });
  const monthlyReviews = buildMonthlyData(reviewsLast12);

  // ── Top 5 tutors by rating ──
  const topTutors = await prisma.tutorProfile.findMany({
    orderBy: { avgRating: "desc" },
    take: 5,
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  // ── Top 5 tutors by earnings ──
  const topEarners = await prisma.tutorProfile.findMany({
    orderBy: { totalEarnings: "desc" },
    take: 5,
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  // ── Top categories by tutor count ──
  const categoryStats = await prisma.category.findMany({
    include: {
      _count: { select: { tutorLinks: true } },
    },
    orderBy: { tutorLinks: { _count: "desc" } },
    take: 10,
  });

  const topCategories = categoryStats.map((c) => ({
    id: c.id,
    name: c.name,
    tutorCount: c._count.tutorLinks,
  }));

  // ── Rating distribution for platform ──
  const [r1, r2, r3, r4, r5] = await Promise.all([
    prisma.review.count({ where: { rating: 1 } }),
    prisma.review.count({ where: { rating: 2 } }),
    prisma.review.count({ where: { rating: 3 } }),
    prisma.review.count({ where: { rating: 4 } }),
    prisma.review.count({ where: { rating: 5 } }),
  ]);

  const platformRatingDistribution = [
    { name: "1 Star", value: r1 },
    { name: "2 Stars", value: r2 },
    { name: "3 Stars", value: r3 },
    { name: "4 Stars", value: r4 },
    { name: "5 Stars", value: r5 },
  ];

  // ── Recent activity ──
  const recentBookings = await prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      student: { select: { id: true, name: true, image: true } },
      tutor: { select: { id: true, name: true, image: true } },
    },
  });

  const recentPayments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
  });

  const recentTutorRequests = await prisma.tutorRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
  });

  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, name: true, email: true, role: true, status: true, image: true, createdAt: true },
  });

  const recentReviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      student: { select: { id: true, name: true, image: true } },
      tutor: { select: { id: true, name: true, image: true } },
    },
  });

  // ── All Tutors Stats for Admin ──
  const tutors = await prisma.user.findMany({
    where: { role: "TUTOR", isDeleted: false },
    include: {
      tutorProfile: { include: { availability: true } },
      tutorBookings: { include: { payment: true } },
    }
  });

  const allTutorsStats = tutors.map(tutor => {
    const totalBookings = tutor.tutorBookings.length;
    const completedBookings = tutor.tutorBookings.filter(b => b.status === "COMPLETED").length;
    const earnings = tutor.tutorProfile?.totalEarnings || 0;
    
    // Calculate total successful payments correctly
    const totalPaymentsReceived = tutor.tutorBookings.reduce((sum, booking) => {
       if (booking.payment && booking.payment.status === "SUCCESS") {
         return sum + booking.payment.amount;
       }
       return sum;
    }, 0);

    return {
      id: tutor.id,
      name: tutor.name,
      email: tutor.email,
      image: tutor.image,
      status: tutor.status,
      avgRating: tutor.tutorProfile?.avgRating || 0,
      hourlyRate: tutor.tutorProfile?.hourlyRate || 0,
      availabilityCount: tutor.tutorProfile?.availability?.length || 0,
      totalBookings,
      completedBookings,
      earnings: earnings > 0 ? earnings : totalPaymentsReceived
    };
  });

  // ── All Students Stats for Admin ──
  const students = await prisma.user.findMany({
    where: { role: "STUDENT", isDeleted: false },
    include: {
      studentBookings: { include: { payment: true } }
    }
  });

  const allStudentsStats = students.map(student => {
    const totalBookings = student.studentBookings.length;
    const completedBookings = student.studentBookings.filter(b => b.status === "COMPLETED").length;
    
    const spendMoney = student.studentBookings.reduce((sum, booking) => {
       if (booking.payment && booking.payment.status === "SUCCESS") {
         return sum + booking.payment.amount;
       }
       return sum;
    }, 0);

    return {
      id: student.id,
      name: student.name,
      email: student.email,
      image: student.image,
      status: student.status,
      totalBookings,
      completedBookings,
      spendMoney
    };
  });

  return {
    summary: {
      totalUsers,
      totalStudents,
      totalTutors,
      totalAdmins,
      totalBookings,
      completedBookings,
      totalRevenue,
      totalSuccessfulPayments,
      totalCategories,
      totalReviews,
      totalAssignments,
      totalSubmissions,
      pendingTutorRequests,
      totalTutorProfiles,
      platformAvgRating,
    },
    charts: {
      userRoleDistribution,
      userStatusDistribution,
      bookingStatusDistribution,
      paymentStatusDistribution,
      platformRatingDistribution,
      monthlyUserRegistrations,
      monthlyBookings,
      monthlyRevenue,
      monthlyReviews,
      topCategories,
    },
    topTutors: topTutors.map((t) => ({
      id: t.id,
      userId: t.userId,
      name: t.user.name,
      email: t.user.email,
      image: t.user.image,
      avgRating: t.avgRating,
      totalReviews: t.totalReviews,
      totalEarnings: t.totalEarnings,
    })),
    topEarners: topEarners.map((t) => ({
      id: t.id,
      userId: t.userId,
      name: t.user.name,
      email: t.user.email,
      image: t.user.image,
      totalEarnings: t.totalEarnings,
      avgRating: t.avgRating,
    })),
    recentBookings,
    recentPayments,
    recentTutorRequests,
    recentUsers,
    recentReviews,
    allTutorsStats,
    allStudentsStats,
  };
};

// ─────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────

/**
 * Build monthly count data for bar charts (last 12 months)
 */
function buildMonthlyData(
  records: Array<{ createdAt: Date }>
): Array<{ month: string; count: number }> {
  const now = new Date();
  const months: Array<{ month: string; count: number }> = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString("en-US", {
      month: "short",
      year: "numeric",
    });
    months.push({ month: label, count: 0 });
  }

  for (const record of records) {
    const date = new Date(record.createdAt);
    const monthIndex =
      (now.getFullYear() - date.getFullYear()) * 12 +
      (now.getMonth() - date.getMonth());
    const arrIndex = 11 - monthIndex;
    const entry = months[arrIndex];
    if (arrIndex >= 0 && arrIndex < 12 && entry) {
      entry.count++;
    }
  }

  return months;
}

/**
 * Build monthly amount data for bar charts (last 12 months)
 */
function buildMonthlyAmountData(
  records: Array<{ createdAt: Date; amount: number }>
): Array<{ month: string; amount: number }> {
  const now = new Date();
  const months: Array<{ month: string; amount: number }> = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString("en-US", {
      month: "short",
      year: "numeric",
    });
    months.push({ month: label, amount: 0 });
  }

  for (const record of records) {
    const date = new Date(record.createdAt);
    const monthIndex =
      (now.getFullYear() - date.getFullYear()) * 12 +
      (now.getMonth() - date.getMonth());
    const arrIndex = 11 - monthIndex;
    const entry = months[arrIndex];
    if (arrIndex >= 0 && arrIndex < 12 && entry) {
      entry.amount += Number(record.amount) || 0;
    }
  }

  // Round amounts to 2 decimal places
  for (const m of months) {
    m.amount = Number(m.amount.toFixed(2));
  }

  return months;
}

/**
 * Build monthly unique count data (e.g. unique students per month)
 */
function buildMonthlyUniqueData(
  records: Array<{ createdAt: Date; studentId: string }>
): Array<{ month: string; count: number }> {
  const now = new Date();
  const months: Array<{ month: string; count: number }> = [];
  const seenSets: Array<Set<string>> = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString("en-US", {
      month: "short",
      year: "numeric",
    });
    months.push({ month: label, count: 0 });
    seenSets.push(new Set<string>());
  }

  for (const record of records) {
    const date = new Date(record.createdAt);
    const monthIndex =
      (now.getFullYear() - date.getFullYear()) * 12 +
      (now.getMonth() - date.getMonth());
    const arrIndex = 11 - monthIndex;
    const entry = months[arrIndex];
    const seen = seenSets[arrIndex];
    if (arrIndex >= 0 && arrIndex < 12 && entry && seen) {
      const val = record.studentId;
      if (!seen.has(val)) {
        seen.add(val);
        entry.count++;
      }
    }
  }

  return months;
}

export const StatsService = {
  getStudentStats,
  getTutorStats,
  getAdminStats,
};

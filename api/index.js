var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/app.ts
import express2 from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";

// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

// src/lib/prisma.ts
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";

// generated/prisma/client.ts
import "process";
import * as path from "path";
import { fileURLToPath } from "url";
import "@prisma/client/runtime/client";

// generated/prisma/enums.ts
var UserRole = {
  STUDENT: "STUDENT",
  TUTOR: "TUTOR",
  ADMIN: "ADMIN"
};
var UserStatus = {
  ACTIVE: "ACTIVE",
  BANNED: "BANNED",
  SUSPENDED: "SUSPENDED"
};

// generated/prisma/internal/class.ts
import * as runtime from "@prisma/client/runtime/client";
var config = {
  "previewFeatures": [],
  "clientVersion": "7.3.0",
  "engineVersion": "9d6ad21cbbceab97458517b147a6a09ff43aa735",
  "activeProvider": "postgresql",
  "inlineSchema": 'model ActivityLog {\n  id String @id @default(cuid())\n\n  userId   String?\n  action   String\n  entity   String\n  entityId String?\n\n  metadata Json?\n\n  createdAt DateTime @default(now())\n\n  @@index([userId])\n  @@index([entity])\n}\n\nmodel Admin {\n  id String @id @default(uuid())\n\n  name     String\n  email    String  @unique\n  username String? @unique // \u{1F525} optional login alternative\n\n  profilePhoto  String?\n  contactNumber String?\n\n  isDeleted Boolean   @default(false)\n  deletedAt DateTime?\n\n  isActive    Boolean   @default(true) // \u{1F525} account status\n  lastLoginAt DateTime? // \u{1F525} activity tracking\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  // \u{1F539} Relation\n  userId String @unique\n  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  // \u{1F539} Audit (optional but powerful)\n  createdBy String?\n  updatedBy String?\n\n  // \u{1F539} Indexing\n  @@index([email])\n  @@index([isDeleted])\n  @@index([isActive])\n  @@index([createdAt])\n  @@map("admins")\n}\n\nmodel Assignment {\n  id          String           @id @default(cuid())\n  title       String\n  description String?\n  status      AssignmentStatus @default(PENDING)\n\n  // Student who created/submitted the assignment\n  submissions AssignmentSubmission[]\n  createdBy   User                   @relation(fields: [createdById], references: [id], onDelete: Cascade)\n  createdById String\n\n  // Optional linked booking (if assignment is tied to a tutoring session)\n  booking   Booking? @relation(fields: [bookingId], references: [id], onDelete: SetNull)\n  bookingId String?\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  @@index([createdById])\n  @@index([status])\n}\n\nmodel AssignmentSubmission {\n  id           String     @id @default(cuid())\n  assignment   Assignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)\n  assignmentId String\n\n  student   User   @relation("StudentSubmissions", fields: [studentId], references: [id], onDelete: Cascade)\n  studentId String\n\n  files Json // Array of {url, publicId, type}\n\n  status     AssignmentStatus @default(PENDING)\n  grade      Float?\n  gradedBy   User?            @relation("GradedAssignments", fields: [gradedById], references: [id])\n  gradedById String?\n\n  feedback String?\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  @@index([studentId])\n  @@index([assignmentId])\n}\n\nmodel User {\n  id            String  @id\n  name          String\n  email         String\n  emailVerified Boolean @default(false)\n  image         String?\n\n  role   UserRole   @default(STUDENT)\n  phone  String?    @unique\n  status UserStatus @default(ACTIVE)\n  // tutorStatus TutorStatus @default(NONE)\n\n  // \u{1F525} NEW\n  lastLoginAt DateTime?\n  isDeleted   Boolean   @default(false)\n  deletedAt   DateTime?\n\n  createdAt         DateTime               @default(now())\n  updatedAt         DateTime               @updatedAt\n  submissions       AssignmentSubmission[] @relation("StudentSubmissions")\n  gradedAssignments AssignmentSubmission[] @relation("GradedAssignments")\n\n  sessions Session[]\n  accounts Account[]\n\n  tutorProfile    TutorProfile?\n  tutorRequests   TutorRequest[] @relation("tutorRequests")\n  admin           Admin?\n  studentBookings Booking[]      @relation("StudentBookings")\n  tutorBookings   Booking[]      @relation("TutorBookings")\n  reviewsGiven    Review[]       @relation("StudentReviews")\n  reviewsReceived Review[]       @relation("TutorReviews")\n\n  notifications Notification[]\n  payments      Payment[]\n  assignments   Assignment[]\n\n  @@unique([email])\n  @@index([role])\n  @@index([status])\n  @@map("user")\n}\n\nmodel Session {\n  id        String   @id\n  expiresAt DateTime\n  token     String\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n  ipAddress String?\n  userAgent String?\n  userId    String\n  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@unique([token])\n  @@index([userId])\n  @@map("session")\n}\n\nmodel Account {\n  id                    String    @id\n  accountId             String\n  providerId            String\n  userId                String\n  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)\n  accessToken           String?\n  refreshToken          String?\n  idToken               String?\n  accessTokenExpiresAt  DateTime?\n  refreshTokenExpiresAt DateTime?\n  scope                 String?\n  password              String?\n  createdAt             DateTime  @default(now())\n  updatedAt             DateTime  @updatedAt\n\n  @@index([userId])\n  @@map("account")\n}\n\nmodel Verification {\n  id         String   @id\n  identifier String\n  value      String\n  expiresAt  DateTime\n  createdAt  DateTime @default(now())\n  updatedAt  DateTime @updatedAt\n\n  @@index([identifier])\n  @@map("verification")\n}\n\nmodel Booking {\n  id String @id @default(cuid())\n\n  student   User   @relation("StudentBookings", fields: [studentId], references: [id], onDelete: Cascade)\n  studentId String\n\n  tutor   User   @relation("TutorBookings", fields: [tutorId], references: [id], onDelete: Cascade)\n  tutorId String\n\n  tutorProfile   TutorProfile @relation(fields: [tutorProfileId], references: [id], onDelete: Cascade)\n  tutorProfileId String\n\n  availability   TutorAvailability? @relation(fields: [availabilityId], references: [id], onDelete: SetNull)\n  availabilityId String?\n\n  scheduledStart DateTime\n  scheduledEnd   DateTime\n\n  price Float\n\n  // \u{1F525} UPGRADE\n  status        BookingStatus\n  paymentStatus PaymentStatus @default(UNPAID)\n\n  meetingLink String?\n  notes       String?\n\n  cancelledById String?\n  cancelReason  String?\n\n  review      Review?\n  payment     Payment?\n  assignments Assignment[] // Link assignments created during this booking\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  @@index([studentId])\n  @@index([tutorId])\n  @@index([status])\n  @@index([scheduledStart])\n}\n\nmodel Category {\n  id   String @id @default(cuid())\n  name String @unique\n\n  // many-to-many with tutor profiles via join table\n  tutorLinks TutorCategory[]\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n}\n\nenum UserRole {\n  STUDENT\n  TUTOR\n  ADMIN\n}\n\nenum UserStatus {\n  ACTIVE\n  BANNED\n  SUSPENDED\n}\n\nenum TutorStatus {\n  NONE\n  PENDING\n  APPROVED\n  REJECTED\n}\n\nenum PaymentProvider {\n  STRIPE\n}\n\nenum PaymentTransactionStatus {\n  INITIATED\n  SUCCESS\n  FAILED\n  REFUNDED\n}\n\nenum NotificationType {\n  BOOKING\n  PAYMENT\n  SYSTEM\n}\n\nenum BookingStatus {\n  PENDING\n  CONFIRMED\n  COMPLETED\n  CANCELLED\n}\n\nenum PaymentStatus {\n  UNPAID\n  PAID\n  REFUNDED\n}\n\nenum AssignmentStatus {\n  PENDING\n  SUBMITTED\n  GRADED\n}\n\nmodel Notification {\n  id String @id @default(cuid())\n\n  userId String\n  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  title   String\n  message String\n  type    NotificationType\n\n  isRead Boolean @default(false)\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  @@index([userId])\n  @@index([isRead])\n}\n\nmodel Payment {\n  id String @id @default(cuid())\n\n  userId String\n  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  bookingId String  @unique\n  booking   Booking @relation(fields: [bookingId], references: [id], onDelete: Cascade)\n\n  amount   Float\n  provider PaymentProvider\n  status   PaymentTransactionStatus\n\n  transactionId String?\n  paymentUrl    String?\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  @@index([userId])\n  @@index([status])\n}\n\nmodel Review {\n  id String @id @default(cuid())\n\n  booking   Booking @relation(fields: [bookingId], references: [id], onDelete: Cascade)\n  bookingId String  @unique\n\n  student   User   @relation("StudentReviews", fields: [studentId], references: [id], onDelete: Cascade)\n  studentId String\n\n  tutor   User   @relation("TutorReviews", fields: [tutorId], references: [id], onDelete: Cascade)\n  tutorId String\n\n  rating  Int\n  comment String?\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  @@index([tutorId])\n  @@index([rating])\n}\n\n// This is your Prisma schema file,\n// learn more about it in the docs: https://pris.ly/d/prisma-schema\n\n// Looking for ways to speed up your queries, or scale easily with your serverless or edge functions?\n// Try Prisma Accelerate: https://pris.ly/cli/accelerate-init\n\ngenerator client {\n  provider = "prisma-client"\n  output   = "../../generated/prisma"\n}\n\ndatasource db {\n  provider = "postgresql"\n}\n\nmodel TutorProfile {\n  id     String @id @default(cuid())\n  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)\n  userId String @unique\n\n  bio           String\n  hourlyRate    Float   @default(0)\n  experienceYrs Int     @default(0)\n  location      String?\n  languages     String?\n  profileImage  String?\n\n  avgRating    Float @default(0)\n  totalReviews Int   @default(0)\n\n  // \u{1F525} NEW\n  totalEarnings Float   @default(0)\n  isApproved    Boolean @default(false)\n\n  categories   TutorCategory[]\n  availability TutorAvailability[]\n  bookings     Booking[]\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  @@index([hourlyRate])\n  @@index([avgRating])\n}\n\nmodel TutorAvailability {\n  id             String       @id @default(cuid())\n  tutorProfile   TutorProfile @relation(fields: [tutorProfileId], references: [id], onDelete: Cascade)\n  tutorProfileId String\n\n  startTime DateTime\n  endTime   DateTime\n  isBooked  Boolean  @default(false)\n\n  // \u2705 Opposite relation (add this)\n  bookings Booking[] // one slot can be linked to many bookings (or 1, depending on your rules)\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  @@index([tutorProfileId])\n  @@index([startTime, endTime])\n}\n\nmodel TutorRequest {\n  id     String @id @default(cuid())\n  user   User   @relation("tutorRequests", fields: [userId], references: [id], onDelete: Cascade)\n  userId String\n\n  bio           String\n  hourlyRate    Float\n  experienceYrs Int\n  location      String?\n  languages     String?\n\n  status          String  @default("PENDING") // PENDING, APPROVED, REJECTED\n  rejectionReason String?\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  @@index([userId])\n  @@index([status])\n}\n\nmodel TutorCategory {\n  id             String       @id @default(cuid())\n  tutorProfile   TutorProfile @relation(fields: [tutorProfileId], references: [id], onDelete: Cascade)\n  tutorProfileId String\n  category       Category     @relation(fields: [categoryId], references: [id], onDelete: Cascade)\n  categoryId     String\n\n  @@unique([tutorProfileId, categoryId])\n  @@index([categoryId])\n}\n',
  "runtimeDataModel": {
    "models": {},
    "enums": {},
    "types": {}
  }
};
config.runtimeDataModel = JSON.parse('{"models":{"ActivityLog":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"action","kind":"scalar","type":"String"},{"name":"entity","kind":"scalar","type":"String"},{"name":"entityId","kind":"scalar","type":"String"},{"name":"metadata","kind":"scalar","type":"Json"},{"name":"createdAt","kind":"scalar","type":"DateTime"}],"dbName":null},"Admin":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"username","kind":"scalar","type":"String"},{"name":"profilePhoto","kind":"scalar","type":"String"},{"name":"contactNumber","kind":"scalar","type":"String"},{"name":"isDeleted","kind":"scalar","type":"Boolean"},{"name":"deletedAt","kind":"scalar","type":"DateTime"},{"name":"isActive","kind":"scalar","type":"Boolean"},{"name":"lastLoginAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"AdminToUser"},{"name":"createdBy","kind":"scalar","type":"String"},{"name":"updatedBy","kind":"scalar","type":"String"}],"dbName":"admins"},"Assignment":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"AssignmentStatus"},{"name":"submissions","kind":"object","type":"AssignmentSubmission","relationName":"AssignmentToAssignmentSubmission"},{"name":"createdBy","kind":"object","type":"User","relationName":"AssignmentToUser"},{"name":"createdById","kind":"scalar","type":"String"},{"name":"booking","kind":"object","type":"Booking","relationName":"AssignmentToBooking"},{"name":"bookingId","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":null},"AssignmentSubmission":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"assignment","kind":"object","type":"Assignment","relationName":"AssignmentToAssignmentSubmission"},{"name":"assignmentId","kind":"scalar","type":"String"},{"name":"student","kind":"object","type":"User","relationName":"StudentSubmissions"},{"name":"studentId","kind":"scalar","type":"String"},{"name":"files","kind":"scalar","type":"Json"},{"name":"status","kind":"enum","type":"AssignmentStatus"},{"name":"grade","kind":"scalar","type":"Float"},{"name":"gradedBy","kind":"object","type":"User","relationName":"GradedAssignments"},{"name":"gradedById","kind":"scalar","type":"String"},{"name":"feedback","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":null},"User":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"emailVerified","kind":"scalar","type":"Boolean"},{"name":"image","kind":"scalar","type":"String"},{"name":"role","kind":"enum","type":"UserRole"},{"name":"phone","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"UserStatus"},{"name":"lastLoginAt","kind":"scalar","type":"DateTime"},{"name":"isDeleted","kind":"scalar","type":"Boolean"},{"name":"deletedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"submissions","kind":"object","type":"AssignmentSubmission","relationName":"StudentSubmissions"},{"name":"gradedAssignments","kind":"object","type":"AssignmentSubmission","relationName":"GradedAssignments"},{"name":"sessions","kind":"object","type":"Session","relationName":"SessionToUser"},{"name":"accounts","kind":"object","type":"Account","relationName":"AccountToUser"},{"name":"tutorProfile","kind":"object","type":"TutorProfile","relationName":"TutorProfileToUser"},{"name":"tutorRequests","kind":"object","type":"TutorRequest","relationName":"tutorRequests"},{"name":"admin","kind":"object","type":"Admin","relationName":"AdminToUser"},{"name":"studentBookings","kind":"object","type":"Booking","relationName":"StudentBookings"},{"name":"tutorBookings","kind":"object","type":"Booking","relationName":"TutorBookings"},{"name":"reviewsGiven","kind":"object","type":"Review","relationName":"StudentReviews"},{"name":"reviewsReceived","kind":"object","type":"Review","relationName":"TutorReviews"},{"name":"notifications","kind":"object","type":"Notification","relationName":"NotificationToUser"},{"name":"payments","kind":"object","type":"Payment","relationName":"PaymentToUser"},{"name":"assignments","kind":"object","type":"Assignment","relationName":"AssignmentToUser"}],"dbName":"user"},"Session":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"token","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"ipAddress","kind":"scalar","type":"String"},{"name":"userAgent","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"SessionToUser"}],"dbName":"session"},"Account":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"accountId","kind":"scalar","type":"String"},{"name":"providerId","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"AccountToUser"},{"name":"accessToken","kind":"scalar","type":"String"},{"name":"refreshToken","kind":"scalar","type":"String"},{"name":"idToken","kind":"scalar","type":"String"},{"name":"accessTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"refreshTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"scope","kind":"scalar","type":"String"},{"name":"password","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"account"},"Verification":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"identifier","kind":"scalar","type":"String"},{"name":"value","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"verification"},"Booking":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"student","kind":"object","type":"User","relationName":"StudentBookings"},{"name":"studentId","kind":"scalar","type":"String"},{"name":"tutor","kind":"object","type":"User","relationName":"TutorBookings"},{"name":"tutorId","kind":"scalar","type":"String"},{"name":"tutorProfile","kind":"object","type":"TutorProfile","relationName":"BookingToTutorProfile"},{"name":"tutorProfileId","kind":"scalar","type":"String"},{"name":"availability","kind":"object","type":"TutorAvailability","relationName":"BookingToTutorAvailability"},{"name":"availabilityId","kind":"scalar","type":"String"},{"name":"scheduledStart","kind":"scalar","type":"DateTime"},{"name":"scheduledEnd","kind":"scalar","type":"DateTime"},{"name":"price","kind":"scalar","type":"Float"},{"name":"status","kind":"enum","type":"BookingStatus"},{"name":"paymentStatus","kind":"enum","type":"PaymentStatus"},{"name":"meetingLink","kind":"scalar","type":"String"},{"name":"notes","kind":"scalar","type":"String"},{"name":"cancelledById","kind":"scalar","type":"String"},{"name":"cancelReason","kind":"scalar","type":"String"},{"name":"review","kind":"object","type":"Review","relationName":"BookingToReview"},{"name":"payment","kind":"object","type":"Payment","relationName":"BookingToPayment"},{"name":"assignments","kind":"object","type":"Assignment","relationName":"AssignmentToBooking"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":null},"Category":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"tutorLinks","kind":"object","type":"TutorCategory","relationName":"CategoryToTutorCategory"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":null},"Notification":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"NotificationToUser"},{"name":"title","kind":"scalar","type":"String"},{"name":"message","kind":"scalar","type":"String"},{"name":"type","kind":"enum","type":"NotificationType"},{"name":"isRead","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":null},"Payment":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"PaymentToUser"},{"name":"bookingId","kind":"scalar","type":"String"},{"name":"booking","kind":"object","type":"Booking","relationName":"BookingToPayment"},{"name":"amount","kind":"scalar","type":"Float"},{"name":"provider","kind":"enum","type":"PaymentProvider"},{"name":"status","kind":"enum","type":"PaymentTransactionStatus"},{"name":"transactionId","kind":"scalar","type":"String"},{"name":"paymentUrl","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":null},"Review":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"booking","kind":"object","type":"Booking","relationName":"BookingToReview"},{"name":"bookingId","kind":"scalar","type":"String"},{"name":"student","kind":"object","type":"User","relationName":"StudentReviews"},{"name":"studentId","kind":"scalar","type":"String"},{"name":"tutor","kind":"object","type":"User","relationName":"TutorReviews"},{"name":"tutorId","kind":"scalar","type":"String"},{"name":"rating","kind":"scalar","type":"Int"},{"name":"comment","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":null},"TutorProfile":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"TutorProfileToUser"},{"name":"userId","kind":"scalar","type":"String"},{"name":"bio","kind":"scalar","type":"String"},{"name":"hourlyRate","kind":"scalar","type":"Float"},{"name":"experienceYrs","kind":"scalar","type":"Int"},{"name":"location","kind":"scalar","type":"String"},{"name":"languages","kind":"scalar","type":"String"},{"name":"profileImage","kind":"scalar","type":"String"},{"name":"avgRating","kind":"scalar","type":"Float"},{"name":"totalReviews","kind":"scalar","type":"Int"},{"name":"totalEarnings","kind":"scalar","type":"Float"},{"name":"isApproved","kind":"scalar","type":"Boolean"},{"name":"categories","kind":"object","type":"TutorCategory","relationName":"TutorCategoryToTutorProfile"},{"name":"availability","kind":"object","type":"TutorAvailability","relationName":"TutorAvailabilityToTutorProfile"},{"name":"bookings","kind":"object","type":"Booking","relationName":"BookingToTutorProfile"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":null},"TutorAvailability":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"tutorProfile","kind":"object","type":"TutorProfile","relationName":"TutorAvailabilityToTutorProfile"},{"name":"tutorProfileId","kind":"scalar","type":"String"},{"name":"startTime","kind":"scalar","type":"DateTime"},{"name":"endTime","kind":"scalar","type":"DateTime"},{"name":"isBooked","kind":"scalar","type":"Boolean"},{"name":"bookings","kind":"object","type":"Booking","relationName":"BookingToTutorAvailability"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":null},"TutorRequest":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"tutorRequests"},{"name":"userId","kind":"scalar","type":"String"},{"name":"bio","kind":"scalar","type":"String"},{"name":"hourlyRate","kind":"scalar","type":"Float"},{"name":"experienceYrs","kind":"scalar","type":"Int"},{"name":"location","kind":"scalar","type":"String"},{"name":"languages","kind":"scalar","type":"String"},{"name":"status","kind":"scalar","type":"String"},{"name":"rejectionReason","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":null},"TutorCategory":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"tutorProfile","kind":"object","type":"TutorProfile","relationName":"TutorCategoryToTutorProfile"},{"name":"tutorProfileId","kind":"scalar","type":"String"},{"name":"category","kind":"object","type":"Category","relationName":"CategoryToTutorCategory"},{"name":"categoryId","kind":"scalar","type":"String"}],"dbName":null}},"enums":{},"types":{}}');
async function decodeBase64AsWasm(wasmBase64) {
  const { Buffer: Buffer2 } = await import("buffer");
  const wasmArray = Buffer2.from(wasmBase64, "base64");
  return new WebAssembly.Module(wasmArray);
}
config.compilerWasm = {
  getRuntime: async () => await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.mjs"),
  getQueryCompilerWasmModule: async () => {
    const { wasm } = await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.wasm-base64.mjs");
    return await decodeBase64AsWasm(wasm);
  },
  importName: "./query_compiler_fast_bg.js"
};
function getPrismaClientClass() {
  return runtime.getPrismaClient(config);
}

// generated/prisma/internal/prismaNamespace.ts
var prismaNamespace_exports = {};
__export(prismaNamespace_exports, {
  AccountScalarFieldEnum: () => AccountScalarFieldEnum,
  ActivityLogScalarFieldEnum: () => ActivityLogScalarFieldEnum,
  AdminScalarFieldEnum: () => AdminScalarFieldEnum,
  AnyNull: () => AnyNull2,
  AssignmentScalarFieldEnum: () => AssignmentScalarFieldEnum,
  AssignmentSubmissionScalarFieldEnum: () => AssignmentSubmissionScalarFieldEnum,
  BookingScalarFieldEnum: () => BookingScalarFieldEnum,
  CategoryScalarFieldEnum: () => CategoryScalarFieldEnum,
  DbNull: () => DbNull2,
  Decimal: () => Decimal2,
  JsonNull: () => JsonNull2,
  JsonNullValueFilter: () => JsonNullValueFilter,
  JsonNullValueInput: () => JsonNullValueInput,
  ModelName: () => ModelName,
  NotificationScalarFieldEnum: () => NotificationScalarFieldEnum,
  NullTypes: () => NullTypes2,
  NullableJsonNullValueInput: () => NullableJsonNullValueInput,
  NullsOrder: () => NullsOrder,
  PaymentScalarFieldEnum: () => PaymentScalarFieldEnum,
  PrismaClientInitializationError: () => PrismaClientInitializationError2,
  PrismaClientKnownRequestError: () => PrismaClientKnownRequestError2,
  PrismaClientRustPanicError: () => PrismaClientRustPanicError2,
  PrismaClientUnknownRequestError: () => PrismaClientUnknownRequestError2,
  PrismaClientValidationError: () => PrismaClientValidationError2,
  QueryMode: () => QueryMode,
  ReviewScalarFieldEnum: () => ReviewScalarFieldEnum,
  SessionScalarFieldEnum: () => SessionScalarFieldEnum,
  SortOrder: () => SortOrder,
  Sql: () => Sql2,
  TransactionIsolationLevel: () => TransactionIsolationLevel,
  TutorAvailabilityScalarFieldEnum: () => TutorAvailabilityScalarFieldEnum,
  TutorCategoryScalarFieldEnum: () => TutorCategoryScalarFieldEnum,
  TutorProfileScalarFieldEnum: () => TutorProfileScalarFieldEnum,
  TutorRequestScalarFieldEnum: () => TutorRequestScalarFieldEnum,
  UserScalarFieldEnum: () => UserScalarFieldEnum,
  VerificationScalarFieldEnum: () => VerificationScalarFieldEnum,
  defineExtension: () => defineExtension,
  empty: () => empty2,
  getExtensionContext: () => getExtensionContext,
  join: () => join2,
  prismaVersion: () => prismaVersion,
  raw: () => raw2,
  sql: () => sql
});
import * as runtime2 from "@prisma/client/runtime/client";
var PrismaClientKnownRequestError2 = runtime2.PrismaClientKnownRequestError;
var PrismaClientUnknownRequestError2 = runtime2.PrismaClientUnknownRequestError;
var PrismaClientRustPanicError2 = runtime2.PrismaClientRustPanicError;
var PrismaClientInitializationError2 = runtime2.PrismaClientInitializationError;
var PrismaClientValidationError2 = runtime2.PrismaClientValidationError;
var sql = runtime2.sqltag;
var empty2 = runtime2.empty;
var join2 = runtime2.join;
var raw2 = runtime2.raw;
var Sql2 = runtime2.Sql;
var Decimal2 = runtime2.Decimal;
var getExtensionContext = runtime2.Extensions.getExtensionContext;
var prismaVersion = {
  client: "7.3.0",
  engine: "9d6ad21cbbceab97458517b147a6a09ff43aa735"
};
var NullTypes2 = {
  DbNull: runtime2.NullTypes.DbNull,
  JsonNull: runtime2.NullTypes.JsonNull,
  AnyNull: runtime2.NullTypes.AnyNull
};
var DbNull2 = runtime2.DbNull;
var JsonNull2 = runtime2.JsonNull;
var AnyNull2 = runtime2.AnyNull;
var ModelName = {
  ActivityLog: "ActivityLog",
  Admin: "Admin",
  Assignment: "Assignment",
  AssignmentSubmission: "AssignmentSubmission",
  User: "User",
  Session: "Session",
  Account: "Account",
  Verification: "Verification",
  Booking: "Booking",
  Category: "Category",
  Notification: "Notification",
  Payment: "Payment",
  Review: "Review",
  TutorProfile: "TutorProfile",
  TutorAvailability: "TutorAvailability",
  TutorRequest: "TutorRequest",
  TutorCategory: "TutorCategory"
};
var TransactionIsolationLevel = runtime2.makeStrictEnum({
  ReadUncommitted: "ReadUncommitted",
  ReadCommitted: "ReadCommitted",
  RepeatableRead: "RepeatableRead",
  Serializable: "Serializable"
});
var ActivityLogScalarFieldEnum = {
  id: "id",
  userId: "userId",
  action: "action",
  entity: "entity",
  entityId: "entityId",
  metadata: "metadata",
  createdAt: "createdAt"
};
var AdminScalarFieldEnum = {
  id: "id",
  name: "name",
  email: "email",
  username: "username",
  profilePhoto: "profilePhoto",
  contactNumber: "contactNumber",
  isDeleted: "isDeleted",
  deletedAt: "deletedAt",
  isActive: "isActive",
  lastLoginAt: "lastLoginAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  userId: "userId",
  createdBy: "createdBy",
  updatedBy: "updatedBy"
};
var AssignmentScalarFieldEnum = {
  id: "id",
  title: "title",
  description: "description",
  status: "status",
  createdById: "createdById",
  bookingId: "bookingId",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var AssignmentSubmissionScalarFieldEnum = {
  id: "id",
  assignmentId: "assignmentId",
  studentId: "studentId",
  files: "files",
  status: "status",
  grade: "grade",
  gradedById: "gradedById",
  feedback: "feedback",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var UserScalarFieldEnum = {
  id: "id",
  name: "name",
  email: "email",
  emailVerified: "emailVerified",
  image: "image",
  role: "role",
  phone: "phone",
  status: "status",
  lastLoginAt: "lastLoginAt",
  isDeleted: "isDeleted",
  deletedAt: "deletedAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var SessionScalarFieldEnum = {
  id: "id",
  expiresAt: "expiresAt",
  token: "token",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  ipAddress: "ipAddress",
  userAgent: "userAgent",
  userId: "userId"
};
var AccountScalarFieldEnum = {
  id: "id",
  accountId: "accountId",
  providerId: "providerId",
  userId: "userId",
  accessToken: "accessToken",
  refreshToken: "refreshToken",
  idToken: "idToken",
  accessTokenExpiresAt: "accessTokenExpiresAt",
  refreshTokenExpiresAt: "refreshTokenExpiresAt",
  scope: "scope",
  password: "password",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var VerificationScalarFieldEnum = {
  id: "id",
  identifier: "identifier",
  value: "value",
  expiresAt: "expiresAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var BookingScalarFieldEnum = {
  id: "id",
  studentId: "studentId",
  tutorId: "tutorId",
  tutorProfileId: "tutorProfileId",
  availabilityId: "availabilityId",
  scheduledStart: "scheduledStart",
  scheduledEnd: "scheduledEnd",
  price: "price",
  status: "status",
  paymentStatus: "paymentStatus",
  meetingLink: "meetingLink",
  notes: "notes",
  cancelledById: "cancelledById",
  cancelReason: "cancelReason",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var CategoryScalarFieldEnum = {
  id: "id",
  name: "name",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var NotificationScalarFieldEnum = {
  id: "id",
  userId: "userId",
  title: "title",
  message: "message",
  type: "type",
  isRead: "isRead",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var PaymentScalarFieldEnum = {
  id: "id",
  userId: "userId",
  bookingId: "bookingId",
  amount: "amount",
  provider: "provider",
  status: "status",
  transactionId: "transactionId",
  paymentUrl: "paymentUrl",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var ReviewScalarFieldEnum = {
  id: "id",
  bookingId: "bookingId",
  studentId: "studentId",
  tutorId: "tutorId",
  rating: "rating",
  comment: "comment",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var TutorProfileScalarFieldEnum = {
  id: "id",
  userId: "userId",
  bio: "bio",
  hourlyRate: "hourlyRate",
  experienceYrs: "experienceYrs",
  location: "location",
  languages: "languages",
  profileImage: "profileImage",
  avgRating: "avgRating",
  totalReviews: "totalReviews",
  totalEarnings: "totalEarnings",
  isApproved: "isApproved",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var TutorAvailabilityScalarFieldEnum = {
  id: "id",
  tutorProfileId: "tutorProfileId",
  startTime: "startTime",
  endTime: "endTime",
  isBooked: "isBooked",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var TutorRequestScalarFieldEnum = {
  id: "id",
  userId: "userId",
  bio: "bio",
  hourlyRate: "hourlyRate",
  experienceYrs: "experienceYrs",
  location: "location",
  languages: "languages",
  status: "status",
  rejectionReason: "rejectionReason",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
var TutorCategoryScalarFieldEnum = {
  id: "id",
  tutorProfileId: "tutorProfileId",
  categoryId: "categoryId"
};
var SortOrder = {
  asc: "asc",
  desc: "desc"
};
var NullableJsonNullValueInput = {
  DbNull: DbNull2,
  JsonNull: JsonNull2
};
var JsonNullValueInput = {
  JsonNull: JsonNull2
};
var QueryMode = {
  default: "default",
  insensitive: "insensitive"
};
var JsonNullValueFilter = {
  DbNull: DbNull2,
  JsonNull: JsonNull2,
  AnyNull: AnyNull2
};
var NullsOrder = {
  first: "first",
  last: "last"
};
var defineExtension = runtime2.Extensions.defineExtension;

// generated/prisma/client.ts
globalThis["__dirname"] = path.dirname(fileURLToPath(import.meta.url));
var PrismaClient = getPrismaClientClass();

// src/lib/prisma.ts
var connectionString = `${process.env.DATABASE_URL}`;
var adapter = new PrismaPg({ connectionString });
var prisma = new PrismaClient({ adapter });

// src/lib/auth.ts
import { bearer, emailOTP } from "better-auth/plugins";

// src/utils/email.ts
import ejs from "ejs";
import status2 from "http-status";
import nodemailer from "nodemailer";
import path2 from "path";
import fs from "fs";

// src/config/env.ts
import dotenv from "dotenv";
import status from "http-status";

// src/errorHelpers/AppError.ts
var AppError = class extends Error {
  statusCode;
  status;
  isOperational;
  metadata;
  statusMessage;
  constructor(statusCode, message, metadata) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    if (metadata) {
      this.metadata = metadata;
    }
    Error.captureStackTrace(this, this.constructor);
  }
};
var AppError_default = AppError;

// src/config/env.ts
dotenv.config();
var envConfig = () => {
  const requiredVars = [
    "PORT",
    "DATABASE_URL",
    "BETTER_AUTH_SECRET",
    "BETTER_AUTH_URL",
    "APP_URL",
    "NODE_ENV",
    "PROD_APP_URL",
    "ACCESS_TOKEN_SECRET",
    "ACCESS_TOKEN_EXPIRES_IN",
    "REFRESH_TOKEN_SECRET",
    "REFRESH_TOKEN_EXPIRES_IN",
    "BETTER_AUTH_SESSION_TOKEN_EXPIRE",
    "BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE",
    "EMAIL_SENDER_SMTP_USER",
    "EMAIL_SENDER_SMTP_PASS",
    "EMAIL_SENDER_SMTP_HOST",
    "EMAIL_SENDER_SMTP_PORT",
    "EMAIL_SENDER_SMTP_FROM",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    // "GOOGLE_CALLBACK_URL",
    "FRONTEND_URL",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "SUPER_ADMIN_EMAIL",
    "SUPER_ADMIN_PASSWORD"
  ];
  requiredVars.forEach((varName) => {
    if (!process.env[varName]) {
      throw new AppError_default(
        status.INTERNAL_SERVER_ERROR,
        `Environment variable ${varName} is required but not set.`
      );
    }
  });
  return {
    PORT: process.env.PORT,
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    APP_URL: process.env.APP_URL,
    NODE_ENV: process.env.NODE_ENV,
    PROD_APP_URL: process.env.PROD_APP_URL,
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
    ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
    REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN,
    BETTER_AUTH_SESSION_TOKEN_EXPIRE: process.env.BETTER_AUTH_SESSION_TOKEN_EXPIRE,
    BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE: process.env.BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE,
    EMAIL_SENDER: {
      SMTP_USER: process.env.EMAIL_SENDER_SMTP_USER,
      SMTP_PASS: process.env.EMAIL_SENDER_SMTP_PASS,
      SMTP_HOST: process.env.EMAIL_SENDER_SMTP_HOST,
      SMTP_PORT: process.env.EMAIL_SENDER_SMTP_PORT,
      SMTP_FROM: process.env.EMAIL_SENDER_SMTP_FROM
    },
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    // GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL!,
    FRONTEND_URL: process.env.FRONTEND_URL,
    CLOUDINARY: {
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET
    },
    STRIPE: {
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET
    },
    SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL,
    SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD
  };
};
var envVars = envConfig();

// src/utils/email.ts
var transporter = nodemailer.createTransport({
  host: envVars.EMAIL_SENDER.SMTP_HOST,
  port: Number(envVars.EMAIL_SENDER.SMTP_PORT),
  secure: Number(envVars.EMAIL_SENDER.SMTP_PORT) === 465,
  // auto detect
  auth: {
    user: envVars.EMAIL_SENDER.SMTP_USER,
    pass: envVars.EMAIL_SENDER.SMTP_PASS
  }
});
transporter.verify((error, success) => {
  if (error) {
    console.error("\u274C Email transporter error:", error);
  } else {
    console.log("\u2705 Email server is ready to send messages");
  }
});
var sendEmail = async ({
  subject,
  templateData,
  templateName,
  to,
  attachments
}) => {
  try {
    const templatePath = path2.resolve(
      process.cwd(),
      `src/templates/${templateName}.ejs`
    );
    if (!fs.existsSync(templatePath)) {
      throw new AppError_default(
        status2.NOT_FOUND,
        `Email template "${templateName}" not found`
      );
    }
    const html = await ejs.renderFile(templatePath, templateData);
    const info = await transporter.sendMail({
      from: `"SkillBridge" <${envVars.EMAIL_SENDER.SMTP_FROM}>`,
      to,
      subject,
      html,
      attachments: attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType
      }))
    });
    console.log(`\u{1F4E8} Email sent to ${to} | ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("\u274C Email Sending Error:", error);
    throw new AppError_default(
      status2.INTERNAL_SERVER_ERROR,
      "Failed to send email"
    );
  }
};

// src/lib/auth.ts
var isProd = process.env.NODE_ENV === "production";
var auth = betterAuth({
  baseURL: envVars.BETTER_AUTH_URL,
  secret: envVars.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql"
  }),
  // Email/Password auth
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: true
  },
  // Social login (Google)
  socialProviders: {
    google: {
      prompt: "select_account consent",
      accessType: "offline",
      clientId: envVars.GOOGLE_CLIENT_ID,
      clientSecret: envVars.GOOGLE_CLIENT_SECRET,
      mapProfileToUser: () => ({
        role: UserRole.STUDENT,
        // Default role for Google users
        status: UserStatus.ACTIVE,
        emailVerified: true,
        isDeleted: false
      })
    }
  },
  // Email verification settings
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: false,
    autoSignInAfterVerification: true
  },
  // User fields
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: UserRole.STUDENT
      },
      status: {
        type: "string",
        required: true,
        defaultValue: UserStatus.ACTIVE
      },
      phone: {
        type: "string",
        required: false,
        defaultValue: null
      },
      emailVerified: {
        type: "boolean",
        required: true,
        defaultValue: false
      },
      isDeleted: {
        type: "boolean",
        required: true,
        defaultValue: false
      },
      deletedAt: {
        type: "date",
        required: false,
        defaultValue: null
      }
    }
  },
  // Plugins
  plugins: [
    bearer(),
    emailOTP({
      overrideDefaultEmailVerification: true,
      async sendVerificationOTP({ email, otp, type }) {
        console.log(`[AUTH] Sending OTP for ${email}, type: ${type}`);
        const user = await prisma.user.findUnique({ where: { email } });
        if (user && user.role === UserRole.ADMIN) {
          console.log(
            `User with email ${email} is a super admin. Skipping sending verification OTP.`
          );
          return;
        }
        if (type === "email-verification") {
          await sendEmail({
            to: email,
            subject: "SkillBridge Email Verification",
            templateName: "otp",
            templateData: { name: user?.name || "Welcome", otp }
          });
        }
        if (type === "forget-password") {
          if (!user) return;
          await sendEmail({
            to: email,
            subject: "SkillBridge Password Reset OTP",
            templateName: "otp",
            templateData: { name: user?.name || "User", otp }
          });
        }
      },
      expiresIn: 2 * 60,
      // 2 minutes
      otpLength: 6
    })
  ],
  // Session settings
  session: {
    expiresIn: 24 * 60 * 60,
    // 1 day
    updateAge: 24 * 60 * 60,
    cookieCache: {
      enabled: true,
      maxAge: 24 * 60 * 60
    }
  },
  // Redirect after social login
  redirectURLs: {
    signIn: `${envVars.FRONTEND_URL}/auth/success`
  },
  // Trusted origins for CORS / cookies
  trustedOrigins: [
    "http://localhost:3000",
    envVars.APP_URL,
    "https://skillbridge-client-delta.vercel.app"
  ].filter(Boolean),
  // Advanced cookie settings
  advanced: {
    useSecureCookies: isProd,
    cookiePrefix: "skillbridge-auth",
    crossSubDomainCookies: {
      enabled: false
    },
    cookies: {
      state: {
        attributes: {
          sameSite: "none",
          secure: isProd,
          httpOnly: true,
          path: "/"
        }
      },
      sessionToken: {
        attributes: {
          sameSite: "none",
          secure: isProd,
          httpOnly: true,
          path: "/"
        }
      }
    },
    disableCSRFCheck: true
    // optional, can enable later
  }
});

// src/middleware/NotFound.ts
function NotFound(req, res) {
  res.status(404).json({
    message: "Resource not found",
    status: 404,
    path: req.originalUrl,
    date: (/* @__PURE__ */ new Date()).toISOString()
  });
}

// src/modules/tutors/tutors.route.ts
import express from "express";

// src/utils/QueryBuilder.ts
var QueryBuilder = class {
  constructor(model, queryParams, config2 = {}) {
    this.model = model;
    this.queryParams = queryParams;
    this.config = config2;
    const defaultWhere = this.config.applySoftDeleteDefault === false ? {} : { isDeleted: false };
    this.query = {
      where: defaultWhere,
      include: {},
      orderBy: {},
      skip: 0,
      take: 10
    };
    this.countQuery = {
      where: defaultWhere
    };
  }
  query;
  countQuery;
  page = 1;
  limit = 10;
  skip = 0;
  selectFields;
  // 🔍 SEARCH
  search() {
    const { searchTerm } = this.queryParams;
    const { searchableFields } = this.config;
    if (searchTerm && searchableFields?.length) {
      const conditions = searchableFields.map((field) => {
        const stringFilter = {
          contains: searchTerm,
          mode: "insensitive"
        };
        if (field.includes(".")) {
          const parts = field.split(".");
          if (parts.length === 2) {
            const [rel, key] = parts;
            return { [rel]: { [key]: stringFilter } };
          }
          if (parts.length === 3) {
            const [rel, nested, key] = parts;
            return {
              [rel]: {
                some: {
                  [nested]: { [key]: stringFilter }
                }
              }
            };
          }
        }
        return { [field]: stringFilter };
      });
      this.query.where.OR = conditions;
      this.countQuery.where.OR = conditions;
    }
    return this;
  }
  // 🎯 FILTER
  filter() {
    const { filterableFields } = this.config;
    const excluded = [
      "searchTerm",
      "page",
      "limit",
      "sortBy",
      "sortOrder",
      "fields",
      "include"
    ];
    const filters = {};
    Object.keys(this.queryParams).forEach((key) => {
      if (!excluded.includes(key)) {
        filters[key] = this.queryParams[key];
      }
    });
    const queryWhere = this.query.where;
    const countWhere = this.countQuery.where;
    Object.entries(filters).forEach(([key, value]) => {
      if (value === void 0 || value === "") return;
      const isAllowed = !filterableFields || filterableFields.length === 0 || filterableFields.includes(key);
      if (!isAllowed) return;
      if (key.includes(".")) {
        const [rel, nested] = key.split(".");
        queryWhere[rel] = { [nested]: this.parseFilterValue(value) };
        countWhere[rel] = { [nested]: this.parseFilterValue(value) };
        return;
      }
      if (typeof value === "object" && !Array.isArray(value)) {
        queryWhere[key] = this.parseRangeFilter(value);
        countWhere[key] = this.parseRangeFilter(value);
        return;
      }
      queryWhere[key] = this.parseFilterValue(value);
      countWhere[key] = this.parseFilterValue(value);
    });
    return this;
  }
  // 📄 PAGINATION
  paginate() {
    this.page = Number(this.queryParams.page) || 1;
    this.limit = Number(this.queryParams.limit) || 10;
    this.skip = (this.page - 1) * this.limit;
    this.query.skip = this.skip;
    this.query.take = this.limit;
    return this;
  }
  // ⚡ MULTI SORT
  sort() {
    const sortParam = this.queryParams.sortBy;
    if (!sortParam) {
      this.query.orderBy = { createdAt: "desc" };
      return this;
    }
    const fields = sortParam.split(",");
    this.query.orderBy = fields.map((field) => {
      const order = field.startsWith("-") ? "desc" : "asc";
      const clean = field.replace("-", "");
      if (clean.includes(".")) {
        const [rel, key] = clean.split(".");
        return { [rel]: { [key]: order } };
      }
      return { [clean]: order };
    });
    return this;
  }
  // 🧬 FIELD SELECTION (NESTED)
  fields() {
    const param = this.queryParams.fields;
    if (!param || typeof param !== "string") return this;
    const select = {};
    param.split(",").forEach((field) => {
      if (field.includes(".")) {
        const [rel, key] = field.split(".");
        if (!select[rel]) select[rel] = { select: {} };
        select[rel].select[key] = true;
      } else {
        select[field] = true;
      }
    });
    this.query.select = select;
    delete this.query.include;
    return this;
  }
  // 🔗 INCLUDE
  include(rel) {
    if (this.selectFields) return this;
    this.query.include = {
      ...this.query.include,
      ...rel
    };
    return this;
  }
  // 🔥 DYNAMIC INCLUDE
  dynamicInclude(includeConfig, defaultInclude) {
    if (this.selectFields) return this;
    if (this.queryParams.include === "all") {
      this.query.include = includeConfig;
      return this;
    }
    const result = {};
    defaultInclude?.forEach((key) => {
      if (includeConfig[key]) result[key] = includeConfig[key];
    });
    const param = this.queryParams.include;
    if (param) {
      param.split(",").forEach((key) => {
        if (includeConfig[key]) result[key] = includeConfig[key];
      });
    }
    this.query.include = {
      ...this.query.include,
      ...result
    };
    return this;
  }
  // 🧩 WHERE MERGE
  where(condition) {
    this.query.where = this.deepMerge(this.query.where, condition);
    this.countQuery.where = this.deepMerge(this.countQuery.where, condition);
    return this;
  }
  // 🚀 EXECUTE
  async execute() {
    const [total, data] = await Promise.all([
      this.model.count(this.countQuery),
      this.model.findMany(this.query)
    ]);
    return {
      data,
      meta: {
        page: this.page,
        limit: this.limit,
        total,
        totalPages: Math.ceil(total / this.limit)
      }
    };
  }
  async count() {
    return this.model.count(this.countQuery);
  }
  async findFirst() {
    if (!this.model.findFirst) {
      throw new Error("Model delegate does not implement findFirst");
    }
    return this.model.findFirst({
      where: this.query.where,
      include: this.query.include,
      select: this.query.select
    });
  }
  getQuery() {
    return this.query;
  }
  // 🛠️ HELPERS
  deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
      if (typeof source[key] === "object" && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }
  parseFilterValue(value) {
    if (value === "true") return true;
    if (value === "false") return false;
    if (!isNaN(Number(value))) return Number(value);
    if (Array.isArray(value)) {
      return { in: value.map((v) => this.parseFilterValue(v)) };
    }
    return value;
  }
  parseRangeFilter(value) {
    const result = {};
    Object.entries(value).forEach(([op, val]) => {
      const parsed = !isNaN(Number(val)) ? Number(val) : val;
      result[op] = parsed;
      if (op === "contains" || op === "startsWith" || op === "endsWith") {
        result.mode = "insensitive";
      }
    });
    return result;
  }
};

// src/modules/tutors/tutors.service.ts
var getAllTutors = async (query) => {
  const searchTerm = query.search ?? query.searchTerm;
  const trimmedSearch = typeof searchTerm === "string" ? searchTerm.trim() : "";
  const queryParams = {
    page: query.page ?? 1,
    limit: query.limit ?? 10,
    sortBy: query.sortBy ?? "-avgRating,hourlyRate",
    ...trimmedSearch ? { searchTerm: trimmedSearch } : {}
  };
  const qb = new QueryBuilder(prisma.tutorProfile, queryParams, {
    applySoftDeleteDefault: false,
    searchableFields: ["bio", "user.name", "categories.category.name"]
  });
  qb.search().where({ user: { role: "TUTOR", status: "ACTIVE" } });
  if (query.minRating !== void 0) {
    qb.where({ avgRating: { gte: query.minRating } });
  }
  if (query.maxPrice !== void 0) {
    qb.where({ hourlyRate: { lte: query.maxPrice } });
  }
  if (query.categoryId) {
    qb.where({ categories: { some: { categoryId: query.categoryId } } });
  }
  qb.include({
    user: { select: { id: true, name: true, image: true } },
    categories: { include: { category: true } },
    availability: true
  }).paginate().sort();
  const result = await qb.execute();
  return {
    meta: {
      page: result.meta.page,
      limit: result.meta.limit,
      total: result.meta.total
    },
    data: result.data
  };
};
var getTutorById = async (id) => {
  const qb = new QueryBuilder(
    prisma.tutorProfile,
    {},
    { applySoftDeleteDefault: false }
  );
  qb.where({ id }).include({
    user: { select: { id: true, name: true, email: true, image: true } },
    categories: { include: { category: true } },
    availability: {
      where: { isBooked: false },
      orderBy: { startTime: "asc" }
    }
  });
  return qb.findFirst();
};
var getMyTutorProfile = async (userId) => {
  const qb = new QueryBuilder(
    prisma.tutorProfile,
    {},
    { applySoftDeleteDefault: false }
  );
  qb.where({ userId }).include({
    user: {
      select: { id: true, name: true, email: true, image: true, role: true }
    },
    categories: { include: { category: true } },
    availability: true
  });
  const result = await qb.findFirst();
  if (!result) {
    const err = new Error("Tutor profile not found");
    err.code = "P2025";
    throw err;
  }
  return result;
};
var TutorsService = {
  getTutorById,
  getAllTutors,
  getMyTutorProfile
};

// src/modules/tutors/tutors.controller.ts
var getAll = async (req, res) => {
  const { search, searchTerm, categoryId, minRating, maxPrice, page, limit, sortBy } = req.query;
  const q = {};
  if (typeof search === "string") q.search = search;
  if (typeof searchTerm === "string") q.searchTerm = searchTerm;
  if (typeof categoryId === "string") q.categoryId = categoryId;
  if (minRating !== void 0 && minRating !== "") {
    q.minRating = Number(minRating);
  }
  if (maxPrice !== void 0 && maxPrice !== "") {
    q.maxPrice = Number(maxPrice);
  }
  if (page !== void 0 && page !== "") q.page = Number(page);
  if (limit !== void 0 && limit !== "") q.limit = Number(limit);
  if (typeof sortBy === "string") q.sortBy = sortBy;
  const data = await TutorsService.getAllTutors(q);
  res.json({ success: true, ...data });
};
var getTutorById2 = async (req, res) => {
  const { id } = req.params;
  const data = await TutorsService.getTutorById(id);
  res.json({ success: true, data });
};
var getMyTutorProfile2 = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const data = await TutorsService.getMyTutorProfile(userId);
    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(404).json({ success: false, message: "Tutor profile not found" });
  }
};
var TutorsController = {
  getTutorById: getTutorById2,
  getAll,
  getMyTutorProfile: getMyTutorProfile2
};

// src/middleware/checkAuth.ts
import status3 from "http-status";
var authMiddleware = (...roles) => {
  return async (req, res, next) => {
    try {
      const session = await auth.api.getSession({
        headers: {
          cookie: req.headers.cookie || "",
          authorization: req.headers.authorization || ""
        }
      });
      if (!session?.user?.id) {
        throw new AppError_default(status3.UNAUTHORIZED, "Unauthorized access");
      }
      let dbUser = await prisma.user.findUnique({
        where: { id: session.user.id }
      });
      if (!dbUser) {
        if (session.user.email) {
          dbUser = await prisma.user.findUnique({
            where: { email: session.user.email }
          });
        }
        if (!dbUser) {
          throw new AppError_default(
            status3.NOT_FOUND,
            "User not found. Please complete registration."
          );
        }
      }
      if (session.user.emailVerified && !dbUser.emailVerified) {
        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: { emailVerified: true }
        });
      }
      if (dbUser.isDeleted) {
        throw new AppError_default(status3.FORBIDDEN, "User account has been deleted");
      }
      if (dbUser.status !== "ACTIVE") {
        throw new AppError_default(status3.FORBIDDEN, "Account is inactive");
      }
      const user = {
        userId: dbUser.id,
        email: dbUser.email,
        role: dbUser.role,
        emailVerified: dbUser.emailVerified || session.user.emailVerified || false
      };
      req.user = user;
      if (!user.emailVerified) {
        throw new AppError_default(status3.FORBIDDEN, "Email not verified");
      }
      if (roles.length && !roles.includes(user.role)) {
        throw new AppError_default(
          status3.FORBIDDEN,
          "You are not authorized to access this resource"
        );
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
var checkAuth_default = authMiddleware;

// src/modules/tutors/tutors.route.ts
var router = express.Router();
router.get("/", TutorsController.getAll);
router.get(
  "/profile",
  checkAuth_default("TUTOR" /* TUTOR */),
  TutorsController.getMyTutorProfile
);
router.get("/:id", TutorsController.getTutorById);
var tutorsRouter = router;

// src/modules/Categories/category.route.ts
import { Router } from "express";

// src/modules/Categories/category.service.ts
import status4 from "http-status";
var createCategory = async (name) => {
  const existingCategory = await prisma.category.findUnique({
    where: { name }
  });
  if (existingCategory) {
    throw new AppError_default(status4.CONFLICT, "Category already exists");
  }
  return prisma.category.create({
    data: { name }
  });
};
var getAllCategories = async (query) => {
  const categoryQuery = new QueryBuilder(
    prisma.category,
    query,
    {
      searchableFields: ["name"],
      filterableFields: ["name"],
      applySoftDeleteDefault: false
    }
  ).search().filter().sort().paginate().include({
    tutorLinks: true
  });
  const result = await categoryQuery.execute();
  const mappedData = result.data.map((cat) => ({
    ...cat,
    _count: { tutorLinks: cat.tutorLinks?.length || 0 }
  }));
  return {
    meta: result.meta,
    data: mappedData
  };
};
var linkTutorCategories = async (userId, categoryIds) => {
  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId }
  });
  if (!tutorProfile) {
    throw new AppError_default(
      status4.NOT_FOUND,
      "Tutor profile not found. Please create one first."
    );
  }
  const existingCategories = await prisma.category.findMany({
    where: {
      id: { in: categoryIds }
    },
    select: { id: true }
  });
  if (existingCategories.length !== categoryIds.length) {
    throw new AppError_default(
      status4.BAD_REQUEST,
      "One or more provided categories do not exist"
    );
  }
  await prisma.$transaction(async (tx) => {
    await tx.tutorCategory.deleteMany({
      where: { tutorProfileId: tutorProfile.id }
    });
    if (categoryIds.length > 0) {
      const mappings = categoryIds.map((categoryId) => ({
        tutorProfileId: tutorProfile.id,
        categoryId
      }));
      await tx.tutorCategory.createMany({
        data: mappings
      });
    }
  });
  const updatedTutorCategories = await prisma.tutorCategory.findMany({
    where: { tutorProfileId: tutorProfile.id },
    include: {
      category: {
        select: { id: true, name: true }
      }
    }
  });
  return updatedTutorCategories.map((tc) => tc.category);
};
var CategoryService = {
  createCategory,
  getAllCategories,
  linkTutorCategories
};

// src/shared/catchAsync.ts
var catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch((error) => {
      console.error("Async route error:", error);
      if (!(error instanceof Error)) {
        error = new Error(typeof error === "string" ? error : "Unknown error");
      }
      next(error);
    });
  };
};
var catchAsync_default = catchAsync;

// src/shared/sendResponse.ts
var sendResponse = (res, response) => {
  const { httpStatusCode, success, message, data, meta } = response;
  const responseBody = {
    success: success ?? (httpStatusCode >= 200 && httpStatusCode < 300),
    message
  };
  if (data !== void 0) responseBody.data = data;
  if (meta !== void 0) responseBody.meta = meta;
  res.status(httpStatusCode).json(responseBody);
};

// src/modules/Categories/category.controller.ts
import status5 from "http-status";
var CategoryController = {
  create: catchAsync_default(async (req, res) => {
    const { name } = req.body;
    if (typeof name !== "string") {
      return res.status(status5.BAD_REQUEST).json({
        success: false,
        message: "Category name must be a string"
      });
    }
    const trimmedName = name.trim();
    if (!trimmedName) {
      return res.status(status5.BAD_REQUEST).json({
        success: false,
        message: "Category name is required"
      });
    }
    const data = await CategoryService.createCategory(trimmedName);
    sendResponse(res, {
      httpStatusCode: status5.CREATED,
      success: true,
      message: "Category created successfully by Admin",
      data
    });
  }),
  getAll: catchAsync_default(async (req, res) => {
    const data = await CategoryService.getAllCategories(req.query);
    sendResponse(res, {
      httpStatusCode: status5.OK,
      success: true,
      message: "Categories retrieved successfully",
      meta: data.meta,
      data: data.data
    });
  }),
  linkCategories: catchAsync_default(async (req, res) => {
    const { categoryIds } = req.body;
    if (!Array.isArray(categoryIds)) {
      return res.status(status5.BAD_REQUEST).json({
        success: false,
        message: "categoryIds must be an array of strings"
      });
    }
    if (categoryIds.length > 3) {
      return res.status(status5.BAD_REQUEST).json({
        success: false,
        message: "A tutor can choose a maximum of 3 categories"
      });
    }
    const uniqueCategoryIds = Array.from(new Set(categoryIds));
    const areAllStrings = uniqueCategoryIds.every((id) => typeof id === "string");
    if (!areAllStrings) {
      return res.status(status5.BAD_REQUEST).json({
        success: false,
        message: "All category IDs must be valid strings"
      });
    }
    const data = await CategoryService.linkTutorCategories(
      req.user.userId,
      uniqueCategoryIds
    );
    sendResponse(res, {
      httpStatusCode: status5.OK,
      success: true,
      message: "Categories linked to your tutor profile successfully",
      data
    });
  })
};

// src/modules/Categories/category.route.ts
var router2 = Router();
router2.get("/", CategoryController.getAll);
router2.post("/", checkAuth_default("ADMIN" /* ADMIN */), CategoryController.create);
router2.post("/link", checkAuth_default("TUTOR" /* TUTOR */), CategoryController.linkCategories);
var CategoryRoutes = router2;

// src/modules/tutors/tutorCategory.route.ts
import { Router as Router2 } from "express";

// src/middleware/validateRequest.ts
var validateRequest = (zodSchema) => {
  return (req, res, next) => {
    try {
      if (req.body?.data && typeof req.body.data === "string") {
        try {
          req.body = JSON.parse(req.body.data);
        } catch (err) {
          throw new AppError_default(400, "Invalid JSON in request data field");
        }
      }
      const parsedResult = zodSchema.safeParse({
        body: req.body,
        params: req.params,
        query: req.query
      });
      if (!parsedResult.success) {
        const errorMessages = parsedResult.error.issues.map(
          (e) => `${e.path.join(".")}: ${e.message}`
        );
        throw new AppError_default(400, "Validation Error", errorMessages);
      }
      const data = parsedResult.data;
      req.body = data.body;
      if (data.params) {
        req.params = data.params;
      }
      if (data.query) {
        req.query = data.query;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

// src/modules/tutors/tutorCategory.service.ts
var assertTutorProfileOwnedByUser = async (tutorProfileId, userId) => {
  const profile = await prisma.tutorProfile.findFirst({
    where: { id: tutorProfileId, userId },
    select: { id: true }
  });
  if (!profile) {
    throw new AppError_default(403, "You can only manage categories on your own tutor profile");
  }
};
var assertTutorCategoryLinkExists = async (tutorProfileId, categoryId) => {
  const link = await prisma.tutorCategory.findUnique({
    where: {
      tutorProfileId_categoryId: { tutorProfileId, categoryId }
    },
    select: { id: true }
  });
  if (!link) {
    throw new AppError_default(404, "This category is not linked to this tutor profile");
  }
};
var getAllTutorCategories = async (tutorProfileId, query = {}) => {
  const queryParams = {
    page: query.page ?? 1,
    limit: query.limit ?? 10,
    sortBy: query.sortBy ?? "category.name",
    ...query.searchTerm !== void 0 && query.searchTerm !== "" ? { searchTerm: query.searchTerm } : {}
  };
  const qb = new QueryBuilder(prisma.tutorCategory, queryParams, {
    applySoftDeleteDefault: false,
    searchableFields: ["category.name"]
  });
  qb.where({ tutorProfileId }).search().include({ category: true }).paginate().sort();
  const result = await qb.execute();
  return {
    meta: {
      page: result.meta.page,
      limit: result.meta.limit,
      total: result.meta.total
    },
    data: result.data
  };
};
var createTutorCategory = async (tutorProfileId, categoryId, userId) => {
  await assertTutorProfileOwnedByUser(tutorProfileId, userId);
  try {
    return await prisma.tutorCategory.create({
      data: { tutorProfileId, categoryId },
      include: { category: true }
    });
  } catch (e) {
    const code = e?.code;
    if (code === "P2002") {
      throw new AppError_default(409, "This category is already assigned to this tutor profile");
    }
    throw e;
  }
};
var updateCategoryNameForTutor = async (tutorProfileId, categoryId, name, userId) => {
  await assertTutorProfileOwnedByUser(tutorProfileId, userId);
  await assertTutorCategoryLinkExists(tutorProfileId, categoryId);
  return prisma.category.update({
    where: { id: categoryId },
    data: { name: name.trim() }
  });
};
var deleteTutorCategory = async (tutorProfileId, categoryId, userId) => {
  await assertTutorProfileOwnedByUser(tutorProfileId, userId);
  try {
    return await prisma.tutorCategory.delete({
      where: {
        tutorProfileId_categoryId: { tutorProfileId, categoryId }
      },
      include: { category: true }
    });
  } catch (e) {
    const code = e?.code;
    if (code === "P2025") {
      throw new AppError_default(404, "Tutor category link not found");
    }
    throw e;
  }
};
var TutorCategoryService = {
  createTutorCategory,
  getAllTutorCategories,
  updateCategoryNameForTutor,
  deleteTutorCategory
};

// src/modules/tutors/tutorCategory.controller.ts
var create = catchAsync_default(async (req, res) => {
  const { tutorProfileId, categoryId } = req.body;
  const userId = req.user.userId;
  const data = await TutorCategoryService.createTutorCategory(
    tutorProfileId,
    categoryId,
    userId
  );
  return res.status(201).json({
    success: true,
    message: "Category assigned to tutor",
    data
  });
});
var getAll2 = catchAsync_default(async (req, res) => {
  const tutorProfileId = req.params.tutorProfileId;
  const { page, limit, sortBy, searchTerm } = req.query;
  const q = {};
  if (typeof page === "number") q.page = page;
  if (typeof limit === "number") q.limit = limit;
  if (typeof sortBy === "string") q.sortBy = sortBy;
  if (typeof searchTerm === "string") q.searchTerm = searchTerm;
  const result = await TutorCategoryService.getAllTutorCategories(
    tutorProfileId,
    q
  );
  res.status(200).json({
    success: true,
    ...result
  });
});
var update = catchAsync_default(async (req, res) => {
  const tutorProfileId = req.params.tutorProfileId;
  const categoryId = req.params.categoryId;
  const { name } = req.body;
  const userId = req.user.userId;
  const data = await TutorCategoryService.updateCategoryNameForTutor(
    tutorProfileId,
    categoryId,
    name,
    userId
  );
  res.json({ success: true, message: "Category updated", data });
});
var deleteOne = catchAsync_default(async (req, res) => {
  const tutorProfileId = req.params.tutorProfileId;
  const categoryId = req.params.categoryId;
  const userId = req.user.userId;
  const data = await TutorCategoryService.deleteTutorCategory(
    tutorProfileId,
    categoryId,
    userId
  );
  return res.status(200).json({
    success: true,
    message: "Category removed from tutor successfully",
    data
  });
});
var TutorCategoryController = {
  create,
  getAll: getAll2,
  update,
  deleteOne
};

// src/modules/tutors/tutorCategory.validation.ts
import { z } from "zod";
var listQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  sortBy: z.string().optional(),
  searchTerm: z.string().optional()
});
var listTutorCategoriesValidation = z.object({
  params: z.object({
    tutorProfileId: z.string().min(1, "tutorProfileId is required")
  }),
  query: listQuery
});
var createTutorCategoryValidation = z.object({
  body: z.object({
    tutorProfileId: z.string().min(1, "tutorProfileId is required"),
    categoryId: z.string().min(1, "categoryId is required")
  })
});
var updateTutorCategoryValidation = z.object({
  params: z.object({
    tutorProfileId: z.string().min(1, "tutorProfileId is required"),
    categoryId: z.string().min(1, "categoryId is required")
  }),
  body: z.object({
    name: z.string().min(1, "Name is required").max(120)
  })
});
var deleteTutorCategoryValidation = z.object({
  params: z.object({
    tutorProfileId: z.string().min(1, "tutorProfileId is required"),
    categoryId: z.string().min(1, "categoryId is required")
  })
});

// src/modules/tutors/tutorCategory.route.ts
var router3 = Router2();
router3.get(
  "/:tutorProfileId",
  validateRequest(listTutorCategoriesValidation),
  TutorCategoryController.getAll
);
router3.post(
  "/",
  checkAuth_default("TUTOR" /* TUTOR */),
  validateRequest(createTutorCategoryValidation),
  TutorCategoryController.create
);
router3.patch(
  "/:tutorProfileId/:categoryId",
  checkAuth_default("TUTOR" /* TUTOR */),
  validateRequest(updateTutorCategoryValidation),
  TutorCategoryController.update
);
router3.delete(
  "/:tutorProfileId/:categoryId",
  checkAuth_default("TUTOR" /* TUTOR */),
  validateRequest(deleteTutorCategoryValidation),
  TutorCategoryController.deleteOne
);
var TutorCategoryRoutes = router3;

// src/modules/availability/availability.route.ts
import { Router as Router3 } from "express";

// src/modules/availability/availability.service.ts
import status6 from "http-status";
var augmentSlotWith30DayPricing = (slot, hourlyRate) => {
  const durationHours = (slot.endTime.getTime() - slot.startTime.getTime()) / (1e3 * 60 * 60);
  const thirtyDaysPrice = hourlyRate * durationHours * 30;
  return {
    ...slot,
    durationHours,
    thirtyDaysPrice,
    packageType: "30-Day Contract",
    notes: `Available for a fixed daily time from ${slot.startTime.toLocaleTimeString()} to ${slot.endTime.toLocaleTimeString()} matching exactly 30 days total calculated.`
  };
};
var createAvailability = async (tutorProfileId, slots) => {
  const profile = await prisma.tutorProfile.findUnique({
    where: { id: tutorProfileId },
    select: { id: true, hourlyRate: true }
  });
  if (!profile) {
    throw new AppError_default(status6.NOT_FOUND, "Tutor profile not found");
  }
  const data = slots.map((s) => ({
    tutorProfileId,
    startTime: new Date(s.startTime),
    endTime: new Date(s.endTime)
  }));
  await prisma.tutorAvailability.createMany({ data });
  const createdSlots = await prisma.tutorAvailability.findMany({
    where: { tutorProfileId },
    orderBy: { startTime: "asc" }
  });
  return createdSlots.map(
    (slot) => augmentSlotWith30DayPricing(slot, profile.hourlyRate)
  );
};
var getAllAvailability = async (tutorProfileId) => {
  const profile = await prisma.tutorProfile.findUnique({
    where: { id: tutorProfileId },
    select: { id: true, hourlyRate: true }
  });
  if (!profile) {
    throw new AppError_default(status6.NOT_FOUND, "Tutor profile not found");
  }
  const slots = await prisma.tutorAvailability.findMany({
    where: { tutorProfileId },
    orderBy: { startTime: "asc" }
  });
  return slots.map(
    (slot) => augmentSlotWith30DayPricing(slot, profile.hourlyRate)
  );
};
var updateAvailability = async (availabilityId, startTime, endTime) => {
  const slot = await prisma.tutorAvailability.findUnique({
    where: { id: availabilityId },
    include: {
      tutorProfile: { select: { hourlyRate: true } }
    }
  });
  if (!slot) {
    throw new AppError_default(status6.NOT_FOUND, "Availability not found");
  }
  if (slot.isBooked) {
    throw new AppError_default(
      status6.CONFLICT,
      "Already booked availability slots cannot be updated"
    );
  }
  const updatedSlot = await prisma.tutorAvailability.update({
    where: { id: availabilityId },
    data: {
      startTime,
      endTime
    }
  });
  return augmentSlotWith30DayPricing(updatedSlot, slot.tutorProfile.hourlyRate);
};
var deleteAvailability = async (availabilityId) => {
  const slot = await prisma.tutorAvailability.findUnique({
    where: { id: availabilityId }
  });
  if (!slot) throw new AppError_default(status6.NOT_FOUND, "Availability not found");
  if (slot.isBooked) {
    throw new AppError_default(
      status6.CONFLICT,
      "A booked 30-day package slot cannot be securely deleted"
    );
  }
  return prisma.tutorAvailability.delete({
    where: { id: availabilityId }
  });
};
var AvailabilityService = {
  createAvailability,
  getAllAvailability,
  updateAvailability,
  deleteAvailability
};

// src/modules/availability/availability.controller.ts
import status7 from "http-status";
var AvailabilityController = {
  create: catchAsync_default(async (req, res) => {
    const { tutorProfileId, slots } = req.body;
    if (typeof tutorProfileId !== "string") {
      return res.status(status7.BAD_REQUEST).json({
        success: false,
        message: "tutorProfileId must be a string"
      });
    }
    if (!Array.isArray(slots) || slots.length === 0) {
      return res.status(status7.BAD_REQUEST).json({
        success: false,
        message: "slots must be a non-empty array"
      });
    }
    for (const slot of slots) {
      if (typeof slot.startTime !== "string" || typeof slot.endTime !== "string") {
        return res.status(status7.BAD_REQUEST).json({
          success: false,
          message: "Each slot must contain startTime and endTime as strings"
        });
      }
      const start = new Date(slot.startTime);
      const end = new Date(slot.endTime);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return res.status(status7.BAD_REQUEST).json({
          success: false,
          message: "Invalid date format. Use ISO string (e.g. 2026-04-09T23:49:00Z)"
        });
      }
      if (end <= start) {
        return res.status(status7.BAD_REQUEST).json({
          success: false,
          message: "endTime must be strictly greater than startTime"
        });
      }
    }
    const data = await AvailabilityService.createAvailability(
      tutorProfileId,
      slots
    );
    sendResponse(res, {
      httpStatusCode: status7.CREATED,
      success: true,
      message: "Availability 30-day package created successfully",
      data
    });
  }),
  getAll: catchAsync_default(async (req, res) => {
    const { tutorProfileId } = req.params;
    if (typeof tutorProfileId !== "string") {
      return res.status(status7.BAD_REQUEST).json({
        success: false,
        message: "tutorProfileId must be a valid string"
      });
    }
    const data = await AvailabilityService.getAllAvailability(tutorProfileId);
    sendResponse(res, {
      httpStatusCode: status7.OK,
      success: true,
      message: "Availability slots retrieved successfully",
      data
    });
  }),
  update: catchAsync_default(async (req, res) => {
    const availabilityId = req.params.id;
    const { startTime, endTime } = req.body;
    if (typeof availabilityId !== "string") {
      return res.status(status7.BAD_REQUEST).json({
        success: false,
        message: "availabilityId must be a string"
      });
    }
    if (typeof startTime !== "string" || typeof endTime !== "string") {
      return res.status(status7.BAD_REQUEST).json({
        success: false,
        message: "startTime and endTime must be strings"
      });
    }
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(status7.BAD_REQUEST).json({
        success: false,
        message: "Invalid date format. Use ISO string"
      });
    }
    if (end <= start) {
      return res.status(status7.BAD_REQUEST).json({
        success: false,
        message: "endTime must be greater than startTime"
      });
    }
    const data = await AvailabilityService.updateAvailability(
      availabilityId,
      start,
      end
    );
    sendResponse(res, {
      httpStatusCode: status7.OK,
      success: true,
      message: "Availability 30-day package updated successfully",
      data
    });
  }),
  remove: catchAsync_default(async (req, res) => {
    const { id } = req.params;
    const data = await AvailabilityService.deleteAvailability(id);
    sendResponse(res, {
      httpStatusCode: status7.OK,
      success: true,
      message: "Availability slot deleted successfully",
      data
    });
  })
};

// src/modules/availability/availability.route.ts
var router4 = Router3();
router4.post(
  "/availability",
  checkAuth_default("TUTOR" /* TUTOR */),
  AvailabilityController.create
);
router4.get(
  "/availability/:tutorProfileId",
  checkAuth_default("TUTOR" /* TUTOR */, "STUDENT" /* STUDENT */, "ADMIN" /* ADMIN */),
  AvailabilityController.getAll
);
router4.patch(
  "/tutor/availability/:id",
  checkAuth_default("TUTOR" /* TUTOR */),
  AvailabilityController.update
);
router4.delete(
  "/availability/:id",
  checkAuth_default("TUTOR" /* TUTOR */),
  AvailabilityController.remove
);
var AvailabilityRoutes = router4;

// src/modules/bookings/booking.route.ts
import { Router as Router4 } from "express";

// src/modules/bookings/booking.service.ts
import status8 from "http-status";
var createBooking = async (studentId, payload) => {
  const { tutorProfileId, tutorId, availabilityId, scheduledStart, scheduledEnd } = payload;
  const start = new Date(scheduledStart);
  const end = new Date(scheduledEnd);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new AppError_default(status8.BAD_REQUEST, "Invalid date format for scheduledStart/scheduledEnd");
  }
  if (end <= start) {
    throw new AppError_default(status8.BAD_REQUEST, "scheduledEnd must be after scheduledStart");
  }
  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { id: tutorProfileId }
  });
  if (!tutorProfile) {
    throw new AppError_default(status8.NOT_FOUND, "Tutor profile not found");
  }
  const durationHours = (end.getTime() - start.getTime()) / (1e3 * 60 * 60);
  const thirtyDaysPrice = tutorProfile.hourlyRate * durationHours * 30;
  const thirtyDaysNotes = `30-Day Contract: Standard fixed recurring schedule from ${start.toLocaleTimeString()} to ${end.toLocaleTimeString()} matching exactly 30 days total calculated.`;
  return prisma.$transaction(async (tx) => {
    if (availabilityId) {
      const slot = await tx.tutorAvailability.findUnique({ where: { id: availabilityId } });
      if (!slot) throw new AppError_default(status8.NOT_FOUND, "Availability record not found");
      if (slot.isBooked) throw new AppError_default(status8.CONFLICT, "This availability slot is already fully booked");
      if (slot.tutorProfileId !== tutorProfileId) {
        throw new AppError_default(status8.FORBIDDEN, "Availability identifier does not logically match the provided tutor profile");
      }
      await tx.tutorAvailability.update({
        where: { id: availabilityId },
        data: { isBooked: true }
      });
      const slotDurationHours = (slot.endTime.getTime() - slot.startTime.getTime()) / (1e3 * 60 * 60);
      const slotPackagePrice = tutorProfile.hourlyRate * slotDurationHours * 30;
      const newBooking = await tx.booking.create({
        data: {
          studentId,
          tutorId,
          tutorProfileId,
          availabilityId,
          scheduledStart: slot.startTime,
          scheduledEnd: slot.endTime,
          price: slotPackagePrice,
          status: "CONFIRMED",
          notes: thirtyDaysNotes
        }
      });
      await tx.notification.create({
        data: {
          userId: tutorId,
          title: "New Booking Received",
          message: `A student explicitly established a 30-day package structurally tying a fixed availability slot.`,
          type: "BOOKING"
        }
      });
      return newBooking;
    }
    const manualBooking = await tx.booking.create({
      data: {
        studentId,
        tutorId,
        tutorProfileId,
        scheduledStart: start,
        scheduledEnd: end,
        price: thirtyDaysPrice,
        status: "CONFIRMED",
        notes: thirtyDaysNotes
      }
    });
    await tx.notification.create({
      data: {
        userId: tutorId,
        title: "New Booking Received",
        message: `A student manually established a 30-day package structure outside generic slots.`,
        type: "BOOKING"
      }
    });
    return manualBooking;
  });
};
var getAllBookings = async (userId, role) => {
  if (role === "ADMIN") {
    return prisma.booking.findMany({
      include: {
        tutor: { select: { id: true, name: true, email: true, image: true } },
        student: { select: { id: true, name: true, email: true, image: true } },
        tutorProfile: true,
        review: true
      },
      orderBy: { scheduledStart: "desc" }
    });
  }
  if (role === "TUTOR") {
    return prisma.booking.findMany({
      where: { tutorId: userId },
      include: {
        tutor: { select: { id: true, name: true, email: true, image: true } },
        student: { select: { id: true, name: true, email: true, image: true } },
        tutorProfile: true,
        review: true
      },
      orderBy: { scheduledStart: "desc" }
    });
  }
  return prisma.booking.findMany({
    where: { studentId: userId },
    include: {
      tutor: { select: { id: true, name: true, email: true, image: true } },
      student: { select: { id: true, name: true, email: true, image: true } },
      tutorProfile: true,
      review: true
    },
    orderBy: { scheduledStart: "desc" }
  });
};
var getBooking = async (bookingId, userId, role) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      tutor: { select: { id: true, name: true, email: true, image: true } },
      student: { select: { id: true, name: true, email: true, image: true } },
      tutorProfile: true,
      availability: true,
      review: true
    }
  });
  if (!booking) throw new AppError_default(status8.NOT_FOUND, "Booking could not be found");
  if (role !== "ADMIN" && booking.studentId !== userId && booking.tutorId !== userId) {
    throw new AppError_default(status8.FORBIDDEN, "Not allowed to view this booking structure");
  }
  return booking;
};
var cancelBooking = async (bookingId, userId, role, reason) => {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId }
    });
    if (!booking) throw new AppError_default(status8.NOT_FOUND, "Target booking could not be located");
    if (role !== "ADMIN" && booking.studentId !== userId && booking.tutorId !== userId) {
      throw new AppError_default(status8.FORBIDDEN, "Not allowed to alter this booking state");
    }
    if (booking.status === "CANCELLED") return booking;
    if (booking.availabilityId) {
      await tx.tutorAvailability.update({
        where: { id: booking.availabilityId },
        data: { isBooked: false }
      });
    }
    const cancelledBooking = await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELLED",
        cancelledById: userId,
        cancelReason: reason ?? null
      }
    });
    const targetUserId = userId === booking.studentId ? booking.tutorId : booking.studentId;
    await tx.notification.create({
      data: {
        userId: targetUserId,
        title: "Booking Cancelled",
        message: `An upcoming reserved booking block was cancelled securely.`,
        type: "BOOKING"
      }
    });
    return cancelledBooking;
  });
};
var completeBooking = async (bookingId, tutorId) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId }
  });
  if (!booking) throw new AppError_default(status8.NOT_FOUND, "Booking data not found or removed");
  if (booking.tutorId !== tutorId) {
    throw new AppError_default(status8.FORBIDDEN, "Completion restricted strictly to standard assigned tutor");
  }
  if (booking.status !== "CONFIRMED") {
    throw new AppError_default(status8.BAD_REQUEST, "Booking item requires CONFIRMED status before completion trigger applicable");
  }
  const completed = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "COMPLETED" }
  });
  await prisma.notification.create({
    data: {
      userId: booking.studentId,
      title: "Booking Finalized",
      message: "Your session block has fully concluded! Please leave a review for this tutor.",
      type: "BOOKING"
    }
  });
  return completed;
};
var BookingService = {
  createBooking,
  getAllBookings,
  getBooking,
  cancelBooking,
  completeBooking
};

// src/modules/bookings/booking.controller.ts
import status9 from "http-status";
var BookingController = {
  create: catchAsync_default(async (req, res) => {
    const {
      tutorProfileId,
      tutorId,
      availabilityId,
      scheduledStart,
      scheduledEnd
    } = req.body;
    if (typeof tutorProfileId !== "string" || typeof tutorId !== "string") {
      return res.status(status9.BAD_REQUEST).json({
        success: false,
        message: "tutorProfileId and tutorId must be valid strings"
      });
    }
    if (availabilityId !== void 0 && typeof availabilityId !== "string") {
      return res.status(status9.BAD_REQUEST).json({
        success: false,
        message: "availabilityId must be a string (if provided)"
      });
    }
    if (typeof scheduledStart !== "string" || typeof scheduledEnd !== "string") {
      return res.status(status9.BAD_REQUEST).json({
        success: false,
        message: "scheduledStart and scheduledEnd must be strings"
      });
    }
    const data = await BookingService.createBooking(req.user.userId, {
      tutorProfileId,
      tutorId,
      availabilityId,
      scheduledStart,
      scheduledEnd
    });
    sendResponse(res, {
      httpStatusCode: status9.CREATED,
      success: true,
      message: "30-day recurring booking package created successfully",
      data
    });
  }),
  getAll: catchAsync_default(async (req, res) => {
    const role = req.user?.role;
    const data = await BookingService.getAllBookings(req.user.userId, role);
    sendResponse(res, {
      httpStatusCode: status9.OK,
      success: true,
      message: "Bookings retrieved successfully",
      data
    });
  }),
  get: catchAsync_default(async (req, res) => {
    const { id } = req.params;
    const role = req.user?.role;
    const data = await BookingService.getBooking(
      id,
      req.user.userId,
      role
    );
    sendResponse(res, {
      httpStatusCode: status9.OK,
      success: true,
      message: "Booking retrieved successfully",
      data
    });
  }),
  cancel: catchAsync_default(async (req, res) => {
    const { reason } = req.body;
    if (reason !== void 0 && typeof reason !== "string") {
      return res.status(status9.BAD_REQUEST).json({
        success: false,
        message: "reason must be a string (if provided)"
      });
    }
    const { id } = req.params;
    const data = await BookingService.cancelBooking(
      id,
      req.user.userId,
      req.user.role,
      reason
    );
    sendResponse(res, {
      httpStatusCode: status9.OK,
      success: true,
      message: "Booking cancelled successfully",
      data
    });
  }),
  complete: catchAsync_default(async (req, res) => {
    const { id } = req.params;
    const data = await BookingService.completeBooking(
      id,
      req.user.userId
    );
    sendResponse(res, {
      httpStatusCode: status9.OK,
      success: true,
      message: "Booking marked as completed",
      data
    });
  })
};

// src/modules/bookings/booking.route.ts
var router5 = Router4();
router5.post(
  "/",
  checkAuth_default("TUTOR" /* TUTOR */, "STUDENT" /* STUDENT */, "ADMIN" /* ADMIN */),
  BookingController.create
);
router5.get(
  "/",
  checkAuth_default("TUTOR" /* TUTOR */, "STUDENT" /* STUDENT */),
  BookingController.getAll
);
router5.get(
  "/:id",
  checkAuth_default("TUTOR" /* TUTOR */, "STUDENT" /* STUDENT */),
  BookingController.get
);
router5.patch(
  "/:id/cancel",
  checkAuth_default("TUTOR" /* TUTOR */, "STUDENT" /* STUDENT */),
  // upgraded to allow student
  BookingController.cancel
);
router5.patch(
  "/:id/complete",
  checkAuth_default("TUTOR" /* TUTOR */),
  BookingController.complete
);
var BookingRoutes = router5;

// src/modules/reviews/review.route.ts
import { Router as Router5 } from "express";

// src/modules/reviews/review.service.ts
import status10 from "http-status";
var createReview = async (studentId, payload) => {
  const { bookingId, rating, comment } = payload;
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId }
  });
  if (!booking) {
    throw new AppError_default(status10.NOT_FOUND, "Booking not found");
  }
  if (booking.studentId !== studentId) {
    throw new AppError_default(
      status10.FORBIDDEN,
      "You are not authorized to review this booking"
    );
  }
  if (booking.status !== "COMPLETED") {
    throw new AppError_default(
      status10.BAD_REQUEST,
      "You can review only after the consultation booking is COMPLETED"
    );
  }
  const existingReview = await prisma.review.findUnique({
    where: { bookingId }
  });
  if (existingReview) {
    throw new AppError_default(
      status10.BAD_REQUEST,
      "Review already submitted for this booking"
    );
  }
  return await prisma.$transaction(async (tx) => {
    const review = await tx.review.create({
      data: {
        bookingId,
        studentId,
        tutorId: booking.tutorId,
        rating,
        comment: comment ?? null
      },
      include: {
        tutor: { select: { id: true, name: true, image: true } }
      }
    });
    const stats = await tx.review.aggregate({
      where: { tutorId: booking.tutorId },
      _avg: { rating: true },
      _count: { rating: true }
    });
    await tx.tutorProfile.update({
      where: { userId: booking.tutorId },
      data: {
        avgRating: Number(stats._avg.rating ?? 0),
        totalReviews: stats._count.rating
      }
    });
    await tx.notification.create({
      data: {
        userId: booking.tutorId,
        title: "New Student Review",
        message: `A student has provided a new review dropping ${rating} stars.`,
        type: "SYSTEM"
      }
    });
    return review;
  });
};
var getTutorReviews = async (tutorId) => {
  return prisma.review.findMany({
    where: { tutorId },
    include: {
      student: { select: { id: true, name: true, image: true } },
      booking: {
        select: { id: true, scheduledStart: true, scheduledEnd: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });
};
var getMyReviews = async (studentId) => {
  return prisma.review.findMany({
    where: { studentId },
    include: {
      tutor: { select: { id: true, name: true, image: true } },
      booking: {
        select: {
          id: true,
          scheduledStart: true,
          scheduledEnd: true,
          status: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });
};
var ReviewService = {
  createReview,
  getTutorReviews,
  getMyReviews
};

// src/modules/reviews/review.controller.ts
import status11 from "http-status";
var ReviewController = {
  create: catchAsync_default(async (req, res) => {
    const { bookingId, rating, comment } = req.body;
    if (typeof bookingId !== "string") {
      return res.status(status11.BAD_REQUEST).json({
        success: false,
        message: "bookingId must be a string"
      });
    }
    if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(status11.BAD_REQUEST).json({
        success: false,
        message: "rating must be an integer between 1 and 5"
      });
    }
    if (comment !== void 0 && typeof comment !== "string") {
      return res.status(status11.BAD_REQUEST).json({
        success: false,
        message: "comment must be a string (if provided)"
      });
    }
    const data = await ReviewService.createReview(req.user.userId, {
      bookingId,
      rating,
      comment
    });
    sendResponse(res, {
      httpStatusCode: status11.CREATED,
      success: true,
      message: "Review created successfully",
      data
    });
  }),
  getAllByTutor: catchAsync_default(async (req, res) => {
    const { tutorId } = req.params;
    if (typeof tutorId !== "string") {
      return res.status(status11.BAD_REQUEST).json({
        success: false,
        message: "tutorId must be a string"
      });
    }
    const data = await ReviewService.getTutorReviews(tutorId);
    sendResponse(res, {
      httpStatusCode: status11.OK,
      success: true,
      message: "Tutor reviews retrieved successfully",
      data
    });
  }),
  // student only
  getAllMine: catchAsync_default(async (req, res) => {
    const data = await ReviewService.getMyReviews(req.user.userId);
    sendResponse(res, {
      httpStatusCode: status11.OK,
      success: true,
      message: "Your reviews retrieved successfully",
      data
    });
  })
};

// src/modules/reviews/review.route.ts
var router6 = Router5();
router6.post("/", checkAuth_default("STUDENT" /* STUDENT */), ReviewController.create);
router6.get("/tutor/:tutorId", ReviewController.getAllByTutor);
router6.get("/me", checkAuth_default("STUDENT" /* STUDENT */), ReviewController.getAllMine);
var ReviewRoutes = router6;

// src/modules/users/user.route.ts
import { Router as Router6 } from "express";

// src/modules/users/user.controller.ts
import status14 from "http-status";

// src/config/cloudinary.config.ts
import { v2 as cloudinary } from "cloudinary";
import status12 from "http-status";
cloudinary.config({
  cloud_name: envVars.CLOUDINARY.CLOUDINARY_CLOUD_NAME,
  api_key: envVars.CLOUDINARY.CLOUDINARY_API_KEY,
  api_secret: envVars.CLOUDINARY.CLOUDINARY_API_SECRET
});
var uploadFileToCloudinary = async (buffer, fileName, folderPrefix = "SkillBridge") => {
  if (!buffer || !fileName) {
    throw new AppError_default(status12.BAD_REQUEST, "File buffer and file name required");
  }
  const extension = fileName.split(".").pop()?.toLowerCase();
  const fileNameWithoutExtension = fileName.split(".").slice(0, -1).join(".").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");
  const uniqueName = Math.random().toString(36).substring(2) + "-" + Date.now() + "-" + fileNameWithoutExtension;
  const folder = extension === "pdf" ? "assignments" : "images";
  const result = await new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: extension === "pdf" ? "raw" : "auto",
        public_id: uniqueName,
        folder: `${folderPrefix}/${folder}`
      },
      (error, result2) => {
        if (error) return reject(error);
        resolve(result2);
      }
    ).end(buffer);
  });
  return { url: result.secure_url, publicId: result.public_id, type: extension || "file" };
};
var deleteFileFromCloudinary = async (publicId, type) => {
  const resource_type = type === "pdf" ? "raw" : "image";
  await cloudinary.uploader.destroy(publicId, { resource_type });
};

// src/modules/users/user.service.ts
import status13 from "http-status";
var updateUser = async (userId, payload, file) => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  if (!user || user.isDeleted) {
    throw new AppError_default(status13.NOT_FOUND, "User not found");
  }
  let profilePhotoData = {};
  if (file) {
    const uploaded = await uploadFileToCloudinary(
      file.buffer,
      file.originalname,
      "SkillBridge"
    );
    if (user.image && user.image.includes("cloudinary.com")) {
      try {
        const urlParts = user.image.split("/");
        const fileName = urlParts[urlParts.length - 1];
        if (fileName) {
          const publicId = fileName.split(".")[0];
          if (publicId) {
            await deleteFileFromCloudinary(`SkillBridge/images/${publicId}`, "image");
          }
        }
      } catch (err) {
      }
    }
    profilePhotoData = {
      image: uploaded.url
    };
  }
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...payload,
      ...profilePhotoData
    }
  });
  return updatedUser;
};
var getById = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  if (!user || user.isDeleted) {
    throw new AppError_default(status13.NOT_FOUND, "User not found");
  }
  return user;
};
var deleteUser = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  if (!user || user.isDeleted) {
    throw new AppError_default(status13.NOT_FOUND, "User not found");
  }
  const result = await prisma.user.update({
    where: { id: userId },
    data: {
      isDeleted: true,
      deletedAt: /* @__PURE__ */ new Date()
    }
  });
  return result;
};
var UserService = {
  getById,
  updateUser,
  deleteUser
};

// src/modules/users/user.controller.ts
var getMe = catchAsync_default(async (req, res) => {
  const result = await UserService.getById(req.user.userId);
  sendResponse(res, {
    httpStatusCode: status14.OK,
    success: true,
    message: "User retrieved successfully",
    data: result
  });
});
var getById2 = catchAsync_default(async (req, res) => {
  const result = await UserService.getById(req.params.id);
  sendResponse(res, {
    httpStatusCode: status14.OK,
    success: true,
    message: "User retrieved successfully",
    data: result
  });
});
var updateUser2 = catchAsync_default(async (req, res) => {
  const result = await UserService.updateUser(
    req.user.userId,
    req.body,
    req.files?.profilePhoto?.[0]
    // 👈 file comes from multer .fields()
  );
  sendResponse(res, {
    httpStatusCode: status14.OK,
    success: true,
    message: "User updated successfully",
    data: result
  });
});
var deleteUser2 = catchAsync_default(async (req, res) => {
  const result = await UserService.deleteUser(
    req.user.userId
  );
  sendResponse(res, {
    httpStatusCode: status14.OK,
    success: true,
    message: "User deleted successfully",
    data: result
  });
});
var UserController = {
  getMe,
  getById: getById2,
  updateUser: updateUser2,
  deleteUser: deleteUser2
};

// src/modules/users/user.validation.ts
import { z as z2 } from "zod";
var updateUserSchema = z2.object({
  body: z2.object({
    name: z2.string().optional(),
    email: z2.string().email().optional(),
    phone: z2.string().nullable().optional(),
    /** URL-based image update */
    image: z2.string().url().nullable().optional(),
    /** Legacy fields kept for compatibility */
    contactNumber: z2.string().nullable().optional(),
    address: z2.string().nullable().optional()
  })
});

// src/config/multer.config.ts
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
var storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const extension = file.originalname.split(".").pop()?.toLowerCase();
    const folder = extension === "pdf" ? "assignments" : "images";
    return {
      folder: `SkillBridge/${folder}`,
      resource_type: extension === "pdf" ? "raw" : "auto",
      public_id: `${Date.now()}-${file.originalname}`
    };
  }
});
var multerUpload = multer({ storage });
var memoryStorage = multer.memoryStorage();
var multerMemoryUpload = multer({ storage: memoryStorage });

// src/modules/users/user.route.ts
var router7 = Router6();
router7.get(
  "/me",
  checkAuth_default(),
  UserController.getMe
);
router7.get(
  "/:id",
  checkAuth_default(),
  UserController.getById
);
router7.patch(
  "/me",
  checkAuth_default(),
  multerMemoryUpload.fields([
    { name: "profilePhoto", maxCount: 1 }
  ]),
  validateRequest(updateUserSchema),
  UserController.updateUser
);
router7.delete("/me", checkAuth_default(), UserController.deleteUser);
var UserRoutes = router7;

// src/modules/admin/admin.route.ts
import { Router as Router7 } from "express";

// src/modules/admin/admin.service.ts
import status15 from "http-status";
var getAllUsers = async () => {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true
    },
    orderBy: { createdAt: "desc" }
  });
};
var getUserDetails = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      tutorProfile: true,
      // will be null if user is not a tutor
      studentBookings: {
        take: 5,
        orderBy: { scheduledStart: "desc" }
      },
      tutorBookings: {
        take: 5,
        orderBy: { scheduledStart: "desc" }
      }
    }
  });
  if (!user) {
    throw new AppError_default(status15.NOT_FOUND, "Associated User not found");
  }
  return user;
};
var updateUser3 = async (id, payload) => {
  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser) {
    throw new AppError_default(status15.NOT_FOUND, "User targeted for update not found");
  }
  const updatedUser = await prisma.user.update({
    where: { id },
    data: payload,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      updatedAt: true
    }
  });
  if (payload.status) {
    await prisma.notification.create({
      data: {
        userId: id,
        title: "Account Status Update",
        message: `Your account status was updated by an administrator to: ${payload.status}`,
        type: "SYSTEM"
      }
    });
  }
  if (payload.role) {
    await prisma.notification.create({
      data: {
        userId: id,
        title: "Account Role Upgrade",
        message: `Your account role was inherently modified by an administrator to: ${payload.role}`,
        type: "SYSTEM"
      }
    });
  }
  return updatedUser;
};
var deleteUser3 = async (id) => {
  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser) {
    throw new AppError_default(status15.NOT_FOUND, "Cannot locate user to definitively delete");
  }
  return prisma.user.delete({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true
    }
  });
};
var getAllBookings2 = async () => {
  return prisma.booking.findMany({
    include: {
      tutor: { select: { id: true, name: true, email: true } },
      student: { select: { id: true, name: true, email: true } },
      tutorProfile: true,
      review: true,
      availability: true
    },
    orderBy: { scheduledStart: "desc" }
  });
};
var deleteBooking = async (id) => {
  const existingBooking = await prisma.booking.findUnique({ where: { id } });
  if (!existingBooking) {
    throw new AppError_default(status15.NOT_FOUND, "Target 30-day package booking not located");
  }
  return prisma.$transaction(async (tx) => {
    if (existingBooking.availabilityId) {
      await tx.tutorAvailability.update({
        where: { id: existingBooking.availabilityId },
        data: { isBooked: false }
      });
    }
    return tx.booking.delete({
      where: { id }
    });
  });
};
var getAllCategories2 = async () => {
  return prisma.category.findMany({ orderBy: { createdAt: "desc" } });
};
var createCategory2 = async (name) => {
  const exists = await prisma.category.findUnique({ where: { name } });
  if (exists) {
    throw new AppError_default(status15.CONFLICT, "Category already rigorously defined in schema");
  }
  return prisma.category.create({ data: { name } });
};
var updateCategory = async (id, name) => {
  const exists = await prisma.category.findUnique({ where: { id } });
  if (!exists) {
    throw new AppError_default(status15.NOT_FOUND, "Category not found natively internally");
  }
  return prisma.category.update({
    where: { id },
    data: { name }
  });
};
var deleteCategory = async (id) => {
  const exists = await prisma.category.findUnique({ where: { id } });
  if (!exists) {
    throw new AppError_default(status15.NOT_FOUND, "Category removal aborted due to undefined identification");
  }
  return prisma.category.delete({ where: { id } });
};
var getAllPayments = async () => {
  return prisma.payment.findMany({
    include: {
      booking: {
        include: {
          tutor: { select: { name: true, email: true } },
          student: { select: { name: true, email: true } }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });
};
var getAllReviews = async () => {
  return prisma.review.findMany({
    include: {
      tutor: { select: { name: true, email: true } },
      student: { select: { name: true, email: true } },
      booking: { select: { scheduledStart: true, scheduledEnd: true } }
    },
    orderBy: { createdAt: "desc" }
  });
};
var deleteReview = async (id) => {
  const existingReview = await prisma.review.findUnique({ where: { id } });
  if (!existingReview) {
    throw new AppError_default(status15.NOT_FOUND, "Review inherently not found");
  }
  return prisma.$transaction(async (tx) => {
    const deleted = await tx.review.delete({ where: { id } });
    const stats = await tx.review.aggregate({
      where: { tutorId: existingReview.tutorId },
      _avg: { rating: true },
      _count: { rating: true }
    });
    await tx.tutorProfile.update({
      where: { userId: existingReview.tutorId },
      data: {
        avgRating: Number(stats._avg.rating ?? 0),
        totalReviews: stats._count.rating
      }
    });
    return deleted;
  });
};
var deleteAssignment = async (id) => {
  const assignment = await prisma.assignment.findUnique({ where: { id } });
  if (!assignment) throw new AppError_default(status15.NOT_FOUND, "Assignment entirely missing");
  return prisma.assignment.delete({ where: { id } });
};
var AdminService = {
  getAllUsers,
  getUserDetails,
  updateUser: updateUser3,
  deleteUser: deleteUser3,
  getAllBookings: getAllBookings2,
  deleteBooking,
  getAllCategories: getAllCategories2,
  createCategory: createCategory2,
  updateCategory,
  deleteCategory,
  getAllPayments,
  getAllReviews,
  deleteReview,
  deleteAssignment
};

// src/modules/admin/admin.controller.ts
import status16 from "http-status";
var AdminController = {
  getAllUsers: catchAsync_default(async (_req, res) => {
    const data = await AdminService.getAllUsers();
    sendResponse(res, {
      httpStatusCode: status16.OK,
      success: true,
      message: "Users retrieved successfully",
      data
    });
  }),
  getUserDetails: catchAsync_default(async (req, res) => {
    const data = await AdminService.getUserDetails(req.params.id);
    sendResponse(res, {
      httpStatusCode: status16.OK,
      success: true,
      message: "User details retrieved successfully",
      data
    });
  }),
  updateUserStatusOrRole: catchAsync_default(async (req, res) => {
    const { status: userStatus, role } = req.body;
    if (userStatus && userStatus !== "ACTIVE" && userStatus !== "BANNED") {
      return res.status(status16.BAD_REQUEST).json({
        success: false,
        message: "status must be ACTIVE or BANNED"
      });
    }
    if (role && role !== "STUDENT" && role !== "TUTOR" && role !== "ADMIN") {
      return res.status(status16.BAD_REQUEST).json({
        success: false,
        message: "role must be STUDENT, TUTOR or ADMIN"
      });
    }
    const data = await AdminService.updateUser(req.params.id, { status: userStatus, role });
    sendResponse(res, {
      httpStatusCode: status16.OK,
      success: true,
      message: "User updated successfully",
      data
    });
  }),
  updateUserStatus: catchAsync_default(async (req, res) => {
    const { status: userStatus } = req.body;
    if (userStatus !== "ACTIVE" && userStatus !== "BANNED") {
      return res.status(status16.BAD_REQUEST).json({
        success: false,
        message: "status must be ACTIVE or BANNED"
      });
    }
    const data = await AdminService.updateUser(req.params.id, { status: userStatus });
    sendResponse(res, {
      httpStatusCode: status16.OK,
      success: true,
      message: "User status updated successfully",
      data
    });
  }),
  updateUserRole: catchAsync_default(async (req, res) => {
    const { role } = req.body;
    if (role !== "STUDENT" && role !== "TUTOR" && role !== "ADMIN") {
      return res.status(status16.BAD_REQUEST).json({
        success: false,
        message: "role must be STUDENT, TUTOR or ADMIN"
      });
    }
    const data = await AdminService.updateUser(req.params.id, { role });
    sendResponse(res, {
      httpStatusCode: status16.OK,
      success: true,
      message: "User role updated successfully",
      data
    });
  }),
  deleteUser: catchAsync_default(async (req, res) => {
    const data = await AdminService.deleteUser(req.params.id);
    sendResponse(res, {
      httpStatusCode: status16.OK,
      success: true,
      message: "User permanently deleted",
      data
    });
  }),
  getAllBookings: catchAsync_default(async (_req, res) => {
    const data = await AdminService.getAllBookings();
    sendResponse(res, {
      httpStatusCode: status16.OK,
      success: true,
      message: "Bookings retrieved successfully",
      data
    });
  }),
  deleteBooking: catchAsync_default(async (req, res) => {
    const data = await AdminService.deleteBooking(req.params.id);
    sendResponse(res, {
      httpStatusCode: status16.OK,
      success: true,
      message: "Booking thoroughly deleted",
      data
    });
  }),
  getAllCategories: catchAsync_default(async (_req, res) => {
    const data = await AdminService.getAllCategories();
    sendResponse(res, {
      httpStatusCode: status16.OK,
      success: true,
      message: "Categories retrieved successfully",
      data
    });
  }),
  createCategory: catchAsync_default(async (req, res) => {
    const { name } = req.body;
    if (typeof name !== "string" || !name.trim()) {
      return res.status(status16.BAD_REQUEST).json({
        success: false,
        message: "Category name must be a non-empty string"
      });
    }
    const data = await AdminService.createCategory(name.trim());
    sendResponse(res, {
      httpStatusCode: status16.CREATED,
      success: true,
      message: "Category created successfully",
      data
    });
  }),
  updateCategory: catchAsync_default(async (req, res) => {
    const { name } = req.body;
    if (typeof name !== "string" || !name.trim()) {
      return res.status(status16.BAD_REQUEST).json({
        success: false,
        message: "Category name must be a non-empty string"
      });
    }
    const data = await AdminService.updateCategory(req.params.id, name.trim());
    sendResponse(res, {
      httpStatusCode: status16.OK,
      success: true,
      message: "Category updated successfully",
      data
    });
  }),
  deleteCategory: catchAsync_default(async (req, res) => {
    const data = await AdminService.deleteCategory(req.params.id);
    sendResponse(res, {
      httpStatusCode: status16.OK,
      success: true,
      message: "Category deleted securely",
      data
    });
  }),
  getAllPayments: catchAsync_default(async (_req, res) => {
    const data = await AdminService.getAllPayments();
    sendResponse(res, {
      httpStatusCode: status16.OK,
      success: true,
      message: "Comprehensive payments log retrieved",
      data
    });
  }),
  getAllReviews: catchAsync_default(async (_req, res) => {
    const data = await AdminService.getAllReviews();
    sendResponse(res, {
      httpStatusCode: status16.OK,
      success: true,
      message: "Comprehensive reviews retrieved securely",
      data
    });
  }),
  deleteReview: catchAsync_default(async (req, res) => {
    const data = await AdminService.deleteReview(req.params.id);
    sendResponse(res, {
      httpStatusCode: status16.OK,
      success: true,
      message: "Inappropriate review deleted successfully resolving global ranks",
      data
    });
  }),
  deleteAssignment: catchAsync_default(async (req, res) => {
    const data = await AdminService.deleteAssignment(req.params.id);
    sendResponse(res, {
      httpStatusCode: status16.OK,
      success: true,
      message: "Assignment strictly terminated from database",
      data
    });
  })
};

// src/modules/admin/admin.route.ts
var router8 = Router7();
router8.use(checkAuth_default("ADMIN" /* ADMIN */));
router8.get("/users", AdminController.getAllUsers);
router8.get("/users/:id", AdminController.getUserDetails);
router8.patch("/users/:id", AdminController.updateUserStatusOrRole);
router8.patch("/users/:id/status", AdminController.updateUserStatus);
router8.patch("/users/:id/role", AdminController.updateUserRole);
router8.delete("/users/:id", AdminController.deleteUser);
router8.get("/bookings", AdminController.getAllBookings);
router8.delete("/bookings/:id", AdminController.deleteBooking);
router8.get("/categories", AdminController.getAllCategories);
router8.post("/categories", AdminController.createCategory);
router8.patch("/categories/:id", AdminController.updateCategory);
router8.delete("/categories/:id", AdminController.deleteCategory);
var AdminRoutes = router8;

// src/middleware/GlobalErrorHandeler.ts
import status19 from "http-status";
import z4 from "zod";

// src/errorHelpers/HandelPrismaError.ts
import status17 from "http-status";
var getStatusCodeFromPrismaError = (errorCode) => {
  if (errorCode === "P2002") {
    return status17.CONFLICT;
  }
  if (["P2025", "P2001", "P2015", "P2018"].includes(errorCode)) {
    return status17.NOT_FOUND;
  }
  if (["P1000", "P6002"].includes(errorCode)) {
    return status17.UNAUTHORIZED;
  }
  if (["P1010", "P6010"].includes(errorCode)) {
    return status17.FORBIDDEN;
  }
  if (errorCode === "P6003") {
    return status17.PAYMENT_REQUIRED;
  }
  if (["P1008", "P2004", "P6004"].includes(errorCode)) {
    return status17.GATEWAY_TIMEOUT;
  }
  if (errorCode === "P5011") {
    return status17.TOO_MANY_REQUESTS;
  }
  if (errorCode === "P6009") {
    return 413;
  }
  if (errorCode.startsWith("P1") || ["P2024", "P2037", "P6008"].includes(errorCode)) {
    return status17.SERVICE_UNAVAILABLE;
  }
  if (errorCode.startsWith("P2")) {
    return status17.BAD_REQUEST;
  }
  if (errorCode.startsWith("P3") || errorCode.startsWith("P4")) {
    return status17.INTERNAL_SERVER_ERROR;
  }
  return status17.INTERNAL_SERVER_ERROR;
};
var formatErrorMeta = (meta) => {
  if (!meta) return "";
  const parts = [];
  if (meta.target) {
    parts.push(`Field(s): ${String(meta.target)}`);
  }
  if (meta.field_name) {
    parts.push(`Field: ${String(meta.field_name)}`);
  }
  if (meta.column_name) {
    parts.push(`Column: ${String(meta.column_name)}`);
  }
  if (meta.table) {
    parts.push(`Table: ${String(meta.table)}`);
  }
  if (meta.model_name) {
    parts.push(`Model: ${String(meta.model_name)}`);
  }
  if (meta.relation_name) {
    parts.push(`Relation: ${String(meta.relation_name)}`);
  }
  if (meta.constraint) {
    parts.push(`Constraint: ${String(meta.constraint)}`);
  }
  if (meta.database_error) {
    parts.push(`Database Error: ${String(meta.database_error)}`);
  }
  return parts.length > 0 ? parts.join(" |") : "";
};
var handlePrismaClientKnownRequestError = (error) => {
  const statusCode = getStatusCodeFromPrismaError(error.code);
  const metaInfo = formatErrorMeta(error.meta);
  let cleanMessage = error.message;
  cleanMessage = cleanMessage.replace(/Invalid `.*?` invocation:?\s*/i, "");
  const lines = cleanMessage.split("\n").filter((line) => line.trim());
  const mainMessage = lines[0] || "An error occurred with the database operation.";
  const errorSources = [
    {
      path: error.code,
      message: metaInfo ? `${mainMessage} | ${metaInfo}` : mainMessage
    }
  ];
  if (error.meta?.cause) {
    errorSources.push({
      path: "cause",
      message: String(error.meta.cause)
    });
  }
  return {
    success: false,
    statusCode,
    message: `Prisma Client Known Request Error: ${mainMessage}`,
    errorSources
  };
};
var handlePrismaClientUnknownError = (error) => {
  let cleanMessage = error.message;
  cleanMessage = cleanMessage.replace(/Invalid `.*?` invocation:?\s*/i, "");
  const lines = cleanMessage.split("\n").filter((line) => line.trim());
  const mainMessage = lines[0] || "An unknown error occurred with the database operation.";
  const errorSources = [
    {
      path: "Unknown Prisma Error",
      message: mainMessage
    }
  ];
  return {
    success: false,
    statusCode: status17.INTERNAL_SERVER_ERROR,
    message: `Prisma Client Unknown Request Error: ${mainMessage}`,
    errorSources
  };
};
var handlePrismaClientValidationError = (error) => {
  let cleanMessage = error.message;
  cleanMessage = cleanMessage.replace(/Invalid `.*?` invocation:?\s*/i, "");
  const lines = cleanMessage.split("\n").filter((line) => line.trim());
  const errorSources = [];
  const fieldMatch = cleanMessage.match(/Argument `(\w+)`/i);
  const fieldName = fieldMatch?.[1] ?? "Unknown Field";
  const mainMessage = lines.find(
    (line) => !line.includes("Argument") && !line.includes("\u2192") && line.length > 10
  ) || lines[0] || "Invalid query parameters provided to the database operation.";
  errorSources.push({
    path: fieldName,
    message: mainMessage
  });
  return {
    success: false,
    statusCode: status17.BAD_REQUEST,
    message: `Prisma Client Validation Error: ${mainMessage}`,
    errorSources
  };
};
var handlerPrismaClientInitializationError = (error) => {
  const statusCode = error.errorCode ? getStatusCodeFromPrismaError(error.errorCode) : status17.SERVICE_UNAVAILABLE;
  const cleanMessage = error.message;
  cleanMessage.replace(/Invalid `.*?` invocation:?\s*/i, "");
  const lines = cleanMessage.split("\n").filter((line) => line.trim());
  const mainMessage = lines[0] || "An error occurred while initializing the Prisma Client.";
  const errorSources = [
    {
      path: error.errorCode || "Initialization Error",
      message: mainMessage
    }
  ];
  return {
    success: false,
    statusCode,
    message: `Prisma Client Initialization Error: ${mainMessage}`,
    errorSources
  };
};
var handlerPrismaClientRustPanicError = () => {
  const errorSources = [
    {
      path: "Rust Engine Crashed",
      message: "The database engine encountered a fatal error and crashed. This is usually due to an internal bug in the Prisma engine or an unexpected edge case in the database operation. Please check the Prisma logs for more details and consider reporting this issue to the Prisma team if it persists."
    }
  ];
  return {
    success: false,
    statusCode: status17.INTERNAL_SERVER_ERROR,
    message: "Prisma Client Rust Panic Error: The database engine crashed due to a fatal error.",
    errorSources
  };
};

// src/utils/deleteUploadedFilesFromGlobalErrorHandler.ts
var deleteUploadedFilesFromGlobalErrorHandler = async (req) => {
  try {
    const filesToDelete = [];
    if (req.file && req.file?.public_id) {
      const extension = req.file.originalname.split(".").pop()?.toLowerCase();
      filesToDelete.push({
        publicId: req.file.public_id,
        type: extension || "image"
      });
    } else if (req.files && typeof req.files === "object" && !Array.isArray(req.files)) {
      Object.values(req.files).forEach((fileArray) => {
        if (Array.isArray(fileArray)) {
          fileArray.forEach((file) => {
            if (file.public_id) {
              const extension = file.originalname.split(".").pop()?.toLowerCase();
              filesToDelete.push({
                publicId: file.public_id,
                type: extension || "image"
              });
            }
          });
        }
      });
    } else if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      req.files.forEach((file) => {
        if (file.public_id) {
          const extension = file.originalname.split(".").pop()?.toLowerCase();
          filesToDelete.push({
            publicId: file.public_id,
            type: extension || "image"
          });
        }
      });
    }
    if (filesToDelete.length > 0) {
      await Promise.all(
        filesToDelete.map(
          ({ publicId, type }) => deleteFileFromCloudinary(publicId, type)
        )
      );
      console.log(
        `
Deleted ${filesToDelete.length} uploaded file(s) from Cloudinary due to an error during request processing.
`
      );
    }
  } catch (error) {
    console.error(
      "Error deleting uploaded files from Global Error Handler",
      error
    );
  }
};

// src/errorHelpers/HandelZodError.ts
import "zod";
import status18 from "http-status";
var handleZodError = (err) => {
  const statusCode = status18.BAD_REQUEST;
  const message = "Validation Error";
  const errorSources = [];
  err.issues.forEach((issue) => {
    errorSources.push({
      path: issue.path.join(" => "),
      message: issue.message
    });
  });
  return {
    success: false,
    message,
    errorSources,
    statusCode,
    ...err.stack && { stack: err.stack }
  };
};

// src/middleware/GlobalErrorHandeler.ts
var globalErrorHandler = async (err, req, res, next) => {
  if (envVars.NODE_ENV === "development") {
    console.log("Error from Global Error Handler", err);
  }
  await deleteUploadedFilesFromGlobalErrorHandler(req);
  let errorSources = [];
  let statusCode = status19.INTERNAL_SERVER_ERROR;
  let message = "Internal Server Error";
  let stack = void 0;
  if (err instanceof prismaNamespace_exports.PrismaClientKnownRequestError) {
    const simplifiedError = handlePrismaClientKnownRequestError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = [...simplifiedError.errorSources];
    stack = err.stack;
  } else if (err instanceof prismaNamespace_exports.PrismaClientUnknownRequestError) {
    const simplifiedError = handlePrismaClientUnknownError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = [...simplifiedError.errorSources];
    stack = err.stack;
  } else if (err instanceof prismaNamespace_exports.PrismaClientValidationError) {
    const simplifiedError = handlePrismaClientValidationError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = [...simplifiedError.errorSources];
    stack = err.stack;
  } else if (err instanceof prismaNamespace_exports.PrismaClientRustPanicError) {
    const simplifiedError = handlerPrismaClientRustPanicError();
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = [...simplifiedError.errorSources];
    stack = err.stack;
  } else if (err instanceof prismaNamespace_exports.PrismaClientInitializationError) {
    const simplifiedError = handlerPrismaClientInitializationError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = [...simplifiedError.errorSources];
    stack = err.stack;
  } else if (err instanceof z4.ZodError) {
    const simplifiedError = handleZodError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = [...simplifiedError.errorSources];
    stack = err.stack;
  } else if (err instanceof AppError_default) {
    statusCode = err.statusCode;
    message = err.message;
    stack = err.stack;
    errorSources = [
      {
        path: "",
        message: err.message
      }
    ];
  } else if (err instanceof Error) {
    statusCode = status19.INTERNAL_SERVER_ERROR;
    message = err.message;
    stack = err.stack;
    errorSources = [
      {
        path: "",
        message: err.message
      }
    ];
  }
  const errorResponse = {
    success: false,
    message,
    errorSources,
    ...envVars.NODE_ENV === "development" && { error: err },
    ...envVars.NODE_ENV === "development" && stack && { stack }
  };
  res.status(statusCode).json(errorResponse);
};

// src/app.ts
import qs from "qs";
import path3 from "path";

// src/routers/index.ts
import { Router as Router14 } from "express";

// src/modules/auth/auth.routes.ts
import { Router as Router8 } from "express";

// src/modules/auth/auth.service.ts
import status20 from "http-status";
import { hashPassword } from "better-auth/crypto";
var registerUser = async (payload) => {
  const { name, email, password } = payload;
  const data = await auth.api.signUpEmail({
    body: { name, email, password }
  });
  if (!data.user) {
    throw new AppError_default(status20.BAD_REQUEST, "Registration failed");
  }
  try {
    const user = await prisma.user.upsert({
      where: { id: data.user.id },
      create: {
        id: data.user.id,
        name: name || "User",
        email,
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
        emailVerified: false,
        isDeleted: false
      },
      update: {
        name,
        email
      }
    });
    return { user };
  } catch (err) {
    try {
      await prisma.user.delete({ where: { id: data.user.id } });
    } catch {
    }
    throw err;
  }
};
var loginUser = async (payload) => {
  const { email, password } = payload;
  const data = await auth.api.signInEmail({
    body: { email, password }
  });
  if (!data.user) {
    throw new AppError_default(status20.UNAUTHORIZED, "Invalid credentials");
  }
  if (data.user.status === UserStatus.BANNED) {
    throw new AppError_default(status20.FORBIDDEN, "User is blocked");
  }
  if (data.user.isDeleted) {
    throw new AppError_default(status20.NOT_FOUND, "User not found");
  }
  const dbUser = await prisma.user.upsert({
    where: { id: data.user.id },
    create: {
      id: data.user.id,
      name: data.user.name || "User",
      email: data.user.email,
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      emailVerified: data.user.emailVerified || false,
      isDeleted: false
    },
    update: {
      lastLoginAt: /* @__PURE__ */ new Date(),
      ...data.user.emailVerified && { emailVerified: true }
    }
  });
  const userSessions = await prisma.session.findMany({
    where: { userId: dbUser.id },
    orderBy: { createdAt: "desc" }
  });
  if (userSessions.length > 1) {
    const sessionsToDelete = userSessions.slice(1);
    await prisma.session.deleteMany({
      where: { id: { in: sessionsToDelete.map((s) => s.id) } }
    });
  }
  console.log("[LOGIN] User logged in successfully:", dbUser.email);
  return {
    ...data,
    user: dbUser
    // Return the synced database user
  };
};
var getMe2 = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  if (!user || user.isDeleted) {
    throw new AppError_default(status20.NOT_FOUND, "User not found");
  }
  return user;
};
var logoutUser = async (headers) => {
  try {
    const session = await auth.api.getSession({ headers });
    if (!session?.session?.id) {
      return { message: "Already logged out" };
    }
    try {
      await auth.api.signOut({ headers });
    } catch (error) {
      if (error?.code === "P2025") {
        return { message: "Logged out successfully" };
      }
      throw error;
    }
    return { message: "Logged out successfully" };
  } catch (error) {
    return { message: "Logged out successfully" };
  }
};
var verifyEmail = async (email, otp) => {
  const verification = await prisma.verification.findFirst({
    where: {
      OR: [
        { identifier: `email:${email}` },
        { identifier: email },
        { identifier: `email-verification-otp-${email}` }
      ],
      expiresAt: { gt: /* @__PURE__ */ new Date() }
    },
    orderBy: { createdAt: "desc" }
  });
  if (!verification) {
    throw new AppError_default(status20.BAD_REQUEST, "Invalid or expired OTP");
  }
  const storedOtp = verification.value.includes(":") ? verification.value.split(":")[0] : verification.value;
  if (storedOtp !== otp) {
    throw new AppError_default(status20.BAD_REQUEST, "Invalid or expired OTP");
  }
  const user = await prisma.user.update({
    where: { email },
    data: { emailVerified: true }
  });
  await prisma.verification.delete({
    where: { id: verification.id }
  });
  return user;
};
var resendOtp = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError_default(status20.NOT_FOUND, "User not found");
  }
  const activeVerification = await prisma.verification.findFirst({
    where: {
      OR: [
        { identifier: `email:${email}` },
        { identifier: email },
        { identifier: `email-verification-otp-${email}` }
      ],
      expiresAt: { gt: /* @__PURE__ */ new Date() }
    },
    orderBy: { createdAt: "desc" }
  });
  if (activeVerification) {
    const storedOtp = activeVerification.value.includes(":") ? activeVerification.value.split(":")[0] : activeVerification.value;
    await sendEmail({
      to: email,
      subject: "SkillBridge Email Verification OTP",
      templateName: "otp",
      templateData: { name: user.name, otp: storedOtp }
    });
    return { message: "OTP has been resent. Check your email." };
  }
  const otp = Math.floor(1e5 + Math.random() * 9e5).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1e3);
  await prisma.verification.deleteMany({
    where: {
      OR: [
        { identifier: `email:${email}` },
        { identifier: email },
        { identifier: `email-verification-otp-${email}` }
      ]
    }
  });
  await prisma.verification.create({
    data: {
      id: `verify_${Date.now()}_${Math.random()}`,
      identifier: `email:${email}`,
      value: otp,
      expiresAt
    }
  });
  await sendEmail({
    to: email,
    subject: "SkillBridge Email Verification OTP",
    templateName: "otp",
    templateData: { name: user.name, otp }
  });
  return { message: "New OTP has been sent. Check your email." };
};
var forgetPassword = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.isDeleted) {
    throw new AppError_default(status20.NOT_FOUND, "User not found");
  }
  const otp = Math.floor(1e5 + Math.random() * 9e5).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1e3);
  await prisma.verification.deleteMany({
    where: { identifier: `reset:${email}` }
  });
  await prisma.verification.create({
    data: {
      id: `reset_${Date.now()}_${Math.random()}`,
      identifier: `reset:${email}`,
      value: otp,
      expiresAt
    }
  });
  await sendEmail({
    to: email,
    subject: "SkillBridge Password Reset OTP",
    templateName: "otp",
    templateData: { name: user.name, otp }
  });
  return { message: "Password reset OTP sent to your email" };
};
var resetPassword = async (email, otp, newPassword) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.isDeleted) {
    throw new AppError_default(status20.NOT_FOUND, "User not found");
  }
  const verification = await prisma.verification.findFirst({
    where: {
      identifier: `reset:${email}`,
      value: otp,
      expiresAt: { gt: /* @__PURE__ */ new Date() }
    }
  });
  if (!verification) {
    throw new AppError_default(status20.BAD_REQUEST, "Invalid or expired OTP");
  }
  const hashedPassword = await hashPassword(newPassword);
  await prisma.account.updateMany({
    where: { userId: user.id },
    data: { password: hashedPassword }
  });
  await prisma.verification.delete({
    where: { id: verification.id }
  });
  await prisma.session.deleteMany({
    where: { userId: user.id }
  });
  await prisma.notification.create({
    data: {
      userId: user.id,
      title: "Password Reset Successful",
      message: "Your password has been securely reset. If you did not authorize this, please contact support immediately.",
      type: "SYSTEM"
    }
  });
};
var googleLoginSuccess = async (session) => {
  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });
  if (!user) {
    await prisma.user.create({
      data: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name
      }
    });
  }
  return session;
};
var AuthService = {
  registerUser,
  loginUser,
  getMe: getMe2,
  logoutUser,
  verifyEmail,
  resendOtp,
  forgetPassword,
  resetPassword,
  googleLoginSuccess
};

// src/modules/auth/auth.controller.ts
import status21 from "http-status";
var registerUser2 = catchAsync_default(async (req, res) => {
  const result = await AuthService.registerUser(req.body);
  sendResponse(res, {
    httpStatusCode: status21.CREATED,
    success: true,
    message: "User registered successfully",
    data: result
  });
});
var loginUser2 = catchAsync_default(async (req, res) => {
  const result = await AuthService.loginUser(req.body);
  sendResponse(res, {
    httpStatusCode: status21.OK,
    success: true,
    message: "Login successful",
    data: result
  });
});
var getMe3 = catchAsync_default(async (req, res) => {
  const result = await AuthService.getMe(req.user.userId);
  sendResponse(res, {
    httpStatusCode: status21.OK,
    success: true,
    message: "User fetched",
    data: result
  });
});
var logoutUser2 = catchAsync_default(async (req, res) => {
  const result = await AuthService.logoutUser(
    req.headers
  );
  sendResponse(res, {
    httpStatusCode: status21.OK,
    success: true,
    message: "Logged out",
    data: result
  });
});
var verifyEmail2 = catchAsync_default(async (req, res) => {
  const { email, otp } = req.body;
  await AuthService.verifyEmail(email, otp);
  sendResponse(res, {
    httpStatusCode: status21.OK,
    success: true,
    message: "Email verified"
  });
});
var resendOtp2 = catchAsync_default(async (req, res) => {
  const { email } = req.body;
  await AuthService.resendOtp(email);
  sendResponse(res, {
    httpStatusCode: status21.OK,
    success: true,
    message: "OTP resent"
  });
});
var forgetPassword2 = catchAsync_default(async (req, res) => {
  const { email } = req.body;
  await AuthService.forgetPassword(email);
  sendResponse(res, {
    httpStatusCode: status21.OK,
    success: true,
    message: "OTP sent"
  });
});
var resetPassword2 = catchAsync_default(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  await AuthService.resetPassword(email, otp, newPassword);
  sendResponse(res, {
    httpStatusCode: status21.OK,
    success: true,
    message: "Password reset successful"
  });
});
var googleLogin = catchAsync_default(async (req, res) => {
  const googleAuthUrl = `${envVars.BETTER_AUTH_URL}/api/auth/sign-in/google`;
  res.redirect(googleAuthUrl);
});
var googleLoginSuccess2 = catchAsync_default(async (req, res) => {
  const redirect = req.query.redirect || "/dashboard";
  const session = await auth.api.getSession({
    headers: req.headers
  });
  if (!session) {
    return res.redirect(`/login?error=session_failed`);
  }
  await AuthService.googleLoginSuccess(session);
  res.redirect(`${envVars.FRONTEND_URL}${redirect}`);
});
var handleOAuthError = catchAsync_default(async (req, res) => {
  const error = req.query.error || "oauth_failed";
  res.redirect(`/login?error=${error}`);
});
var AuthController = {
  registerUser: registerUser2,
  loginUser: loginUser2,
  getMe: getMe3,
  logoutUser: logoutUser2,
  verifyEmail: verifyEmail2,
  resendOtp: resendOtp2,
  forgetPassword: forgetPassword2,
  resetPassword: resetPassword2,
  googleLogin,
  googleLoginSuccess: googleLoginSuccess2,
  handleOAuthError
};

// src/modules/auth/auth.validation.ts
import { z as z5 } from "zod";
var passwordSchema = z5.string().min(6, "Password must be at least 6 characters");
var registerUserValidation = z5.object({
  body: z5.object({
    name: z5.string().min(2, "Name is too short"),
    email: z5.string().email("Invalid email"),
    password: passwordSchema
  })
});
var loginUserValidation = z5.object({
  body: z5.object({
    email: z5.string().email("Invalid email"),
    password: z5.string().min(1, "Password is required")
  })
});
var verifyEmailValidation = z5.object({
  body: z5.object({
    email: z5.string().email("Invalid email"),
    otp: z5.string().length(6, "OTP must be 6 digits")
  })
});
var resendOtpValidation = z5.object({
  body: z5.object({
    email: z5.string().email("Invalid email")
  })
});
var forgotPasswordValidation = z5.object({
  body: z5.object({
    email: z5.string().email("Invalid email")
  })
});
var resetPasswordValidation = z5.object({
  body: z5.object({
    email: z5.string().email("Invalid email"),
    otp: z5.string().length(6, "OTP must be 6 digits"),
    newPassword: passwordSchema
  })
});

// src/modules/auth/auth.routes.ts
var router9 = Router8();
router9.post("/register", validateRequest(registerUserValidation), AuthController.registerUser);
router9.post("/login", validateRequest(loginUserValidation), AuthController.loginUser);
router9.get("/me", checkAuth_default(), AuthController.getMe);
router9.post("/logout", AuthController.logoutUser);
router9.post("/verify-email", AuthController.verifyEmail);
router9.post("/resend-otp", AuthController.resendOtp);
router9.post("/forgot-password", AuthController.forgetPassword);
router9.post("/reset-password", AuthController.resetPassword);
router9.get("/login/google", AuthController.googleLogin);
router9.get("/google/success", AuthController.googleLoginSuccess);
router9.get("/oauth/error", AuthController.handleOAuthError);
var AuthRoute = router9;

// src/modules/tutors/tutorRequest.route.ts
import { Router as Router9 } from "express";

// src/modules/tutors/tutorRequest.controller.ts
import status23 from "http-status";

// src/modules/tutors/tutorRequest.service.ts
import status22 from "http-status";
var tutorProfileSelect = {
  id: true,
  userId: true,
  bio: true,
  hourlyRate: true,
  experienceYrs: true,
  location: true,
  languages: true,
  profileImage: true,
  avgRating: true,
  totalReviews: true,
  totalEarnings: true,
  isApproved: true,
  createdAt: true,
  updatedAt: true,
  categories: {
    include: {
      category: true
    }
  },
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      emailVerified: true,
      image: true,
      isDeleted: true,
      createdAt: true,
      updatedAt: true
    }
  }
};
var createTutor = async (payload) => {
  const userExists = await prisma.user.findUnique({
    where: { email: payload.email }
  });
  if (userExists) {
    throw new AppError_default(status22.CONFLICT, "A user with this email already exists");
  }
  const userData = await auth.api.signUpEmail({
    body: {
      email: payload.email,
      password: payload.password,
      name: payload.name
    }
  });
  try {
    const result = await prisma.$transaction(async (tx) => {
      const tutorProfile = await tx.tutorProfile.create({
        data: {
          userId: userData.user.id,
          bio: payload.tutor.bio,
          hourlyRate: payload.tutor.hourlyRate,
          experienceYrs: payload.tutor.experienceYrs,
          location: payload.tutor.location ?? null,
          languages: payload.tutor.languages ?? null,
          profileImage: payload.tutor.profileImage ?? null,
          isApproved: true
        },
        select: tutorProfileSelect
      });
      await tx.user.update({
        where: { id: userData.user.id },
        data: { role: "TUTOR" }
      });
      return tutorProfile;
    });
    return result;
  } catch (error) {
    await prisma.user.delete({ where: { id: userData.user.id } }).catch(() => {
    });
    throw error;
  }
};
var requestToBecomeTutor = async (userId, payload) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError_default(status22.NOT_FOUND, "User not found");
  }
  const existingRequest = await prisma.tutorRequest.findFirst({
    where: {
      userId,
      status: "PENDING"
    }
  });
  if (existingRequest) {
    throw new AppError_default(
      status22.CONFLICT,
      "You already have a pending tutor request"
    );
  }
  const existingProfile = await prisma.tutorProfile.findUnique({
    where: { userId }
  });
  if (existingProfile) {
    throw new AppError_default(status22.CONFLICT, "You are already a tutor");
  }
  const tutorRequest = await prisma.tutorRequest.create({
    data: {
      userId,
      bio: payload.bio,
      hourlyRate: payload.hourlyRate,
      experienceYrs: payload.experienceYrs,
      location: payload.location ?? null,
      languages: payload.languages ?? null,
      status: "PENDING"
    },
    select: {
      id: true,
      userId: true,
      bio: true,
      hourlyRate: true,
      experienceYrs: true,
      location: true,
      languages: true,
      status: true,
      createdAt: true,
      user: {
        select: { id: true, name: true, email: true, role: true }
      }
    }
  });
  return tutorRequest;
};
var approveTutorRequest = async (requestId) => {
  const tutorRequest = await prisma.tutorRequest.findUnique({
    where: { id: requestId },
    include: { user: true }
  });
  if (!tutorRequest) {
    throw new AppError_default(status22.NOT_FOUND, "Tutor request not found");
  }
  if (tutorRequest.status !== "PENDING") {
    throw new AppError_default(
      status22.BAD_REQUEST,
      "Only pending requests can be approved"
    );
  }
  const result = await prisma.$transaction(async (tx) => {
    const tutorProfile = await tx.tutorProfile.create({
      data: {
        userId: tutorRequest.userId,
        bio: tutorRequest.bio,
        hourlyRate: tutorRequest.hourlyRate,
        experienceYrs: tutorRequest.experienceYrs,
        location: tutorRequest.location ?? null,
        languages: tutorRequest.languages ?? null,
        isApproved: true
      },
      select: tutorProfileSelect
    });
    await tx.user.update({
      where: { id: tutorRequest.userId },
      data: { role: "TUTOR" }
    });
    await tx.tutorRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED" }
    });
    await tx.notification.create({
      data: {
        userId: tutorRequest.userId,
        title: "Tutor Application Approved",
        message: "Congratulations! You have been officially approved as a Tutor on SkillBridge.",
        type: "SYSTEM"
      }
    });
    return tutorProfile;
  });
  await sendEmail({
    to: tutorRequest.user.email,
    subject: "Welcome to SkillBridge as a Tutor! \u{1F389}",
    templateName: "tutorApprovalEmail",
    templateData: {
      userName: tutorRequest.user.name,
      userEmail: tutorRequest.user.email,
      bio: tutorRequest.bio,
      hourlyRate: tutorRequest.hourlyRate,
      experienceYrs: tutorRequest.experienceYrs,
      location: tutorRequest.location,
      languages: tutorRequest.languages,
      dashboardUrl: `${process.env.FRONTEND_URL}/tutor/dashboard` || "https://skillbridge.com/tutor/dashboard"
    }
  });
  return result;
};
var rejectTutorRequest = async (requestId, rejectionReason) => {
  const tutorRequest = await prisma.tutorRequest.findUnique({
    where: { id: requestId },
    include: { user: true }
  });
  if (!tutorRequest) {
    throw new AppError_default(status22.NOT_FOUND, "Tutor request not found");
  }
  if (tutorRequest.status !== "PENDING") {
    throw new AppError_default(
      status22.BAD_REQUEST,
      "Only pending requests can be rejected"
    );
  }
  const updatedRequest = await prisma.tutorRequest.update({
    where: { id: requestId },
    data: {
      status: "REJECTED",
      rejectionReason
    }
  });
  await prisma.notification.create({
    data: {
      userId: tutorRequest.userId,
      title: "Tutor Application Rejected",
      message: `Your tutor application was declined. Reason: ${rejectionReason}`,
      type: "SYSTEM"
    }
  });
  await sendEmail({
    to: tutorRequest.user.email,
    subject: "Tutor Profile Application Status - SkillBridge",
    templateName: "tutorRejectionEmail",
    templateData: {
      userName: tutorRequest.user.name,
      rejectionReason
    }
  });
  return updatedRequest;
};
var getMyTutorRequest = async (userId) => {
  const request = await prisma.tutorRequest.findFirst({
    where: { userId },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true }
      }
    }
  });
  return request;
};
var getAllTutorRequests = async () => {
  return prisma.tutorRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true }
      }
    }
  });
};
var getPendingTutorRequests = async () => {
  return prisma.tutorRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true }
      }
    }
  });
};
var updateTutorProfile = async (userId, payload, file) => {
  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId }
  });
  if (!tutorProfile) {
    throw new AppError_default(status22.NOT_FOUND, "Tutor profile not found");
  }
  const { categories: categoryNames, ...otherPayload } = payload;
  let profileImageData = {};
  if (file) {
    const uploaded = await uploadFileToCloudinary(
      file.buffer,
      file.originalname,
      "SkillBridge"
    );
    if (tutorProfile.profileImage && tutorProfile.profileImage.includes("cloudinary.com")) {
      try {
        const urlParts = tutorProfile.profileImage.split("/");
        const fileName = urlParts[urlParts.length - 1];
        if (fileName) {
          const publicId = fileName.split(".")[0];
          if (publicId) {
            await deleteFileFromCloudinary(`SkillBridge/images/${publicId}`, "image");
          }
        }
      } catch (err) {
      }
    }
    profileImageData = {
      profileImage: uploaded.url
    };
  }
  const result = await prisma.$transaction(async (tx) => {
    await tx.tutorProfile.update({
      where: { userId },
      data: {
        ...otherPayload,
        ...profileImageData
      }
    });
    if (categoryNames !== void 0) {
      const categories = await tx.category.findMany({
        where: {
          name: {
            in: categoryNames,
            mode: "insensitive"
          }
        }
      });
      await tx.tutorCategory.deleteMany({
        where: { tutorProfileId: tutorProfile.id }
      });
      if (categories.length > 0) {
        await tx.tutorCategory.createMany({
          data: categories.map((cat) => ({
            tutorProfileId: tutorProfile.id,
            categoryId: cat.id
          }))
        });
      }
    }
    return tx.tutorProfile.findUnique({
      where: { userId },
      select: tutorProfileSelect
    });
  });
  return result;
};
var TutorService = {
  createTutor,
  requestToBecomeTutor,
  approveTutorRequest,
  rejectTutorRequest,
  getMyTutorRequest,
  getAllTutorRequests,
  getPendingTutorRequests,
  updateTutorProfile
};

// src/modules/tutors/tutorRequest.controller.ts
var createTutor2 = catchAsync_default(async (req, res) => {
  const result = await TutorService.createTutor(req.body);
  sendResponse(res, {
    httpStatusCode: status23.CREATED,
    success: true,
    message: "Tutor created successfully",
    data: result
  });
});
var requestToBecomeTutor2 = catchAsync_default(
  async (req, res) => {
    const userId = req.user?.userId;
    const result = await TutorService.requestToBecomeTutor(userId, req.body);
    sendResponse(res, {
      httpStatusCode: status23.CREATED,
      success: true,
      message: "Tutor request submitted successfully",
      data: result
    });
  }
);
var getMyTutorRequest2 = catchAsync_default(async (req, res) => {
  const userId = req.user?.userId;
  const result = await TutorService.getMyTutorRequest(userId);
  sendResponse(res, {
    httpStatusCode: status23.OK,
    success: true,
    message: "Your tutor request fetched successfully",
    data: result
  });
});
var getAllTutorRequests2 = catchAsync_default(
  async (_req, res) => {
    const result = await TutorService.getAllTutorRequests();
    sendResponse(res, {
      httpStatusCode: status23.OK,
      success: true,
      message: "Tutor requests fetched successfully",
      data: result
    });
  }
);
var getPendingTutorRequests2 = catchAsync_default(
  async (_req, res) => {
    const result = await TutorService.getPendingTutorRequests();
    sendResponse(res, {
      httpStatusCode: status23.OK,
      success: true,
      message: "Pending tutor requests fetched successfully",
      data: result
    });
  }
);
var approveTutorRequest2 = catchAsync_default(async (req, res) => {
  const requestId = req.params.id;
  const result = await TutorService.approveTutorRequest(requestId);
  sendResponse(res, {
    httpStatusCode: status23.OK,
    success: true,
    message: "Tutor request approved successfully. Welcome email sent.",
    data: result
  });
});
var rejectTutorRequest2 = catchAsync_default(async (req, res) => {
  const requestId = req.params.id;
  const result = await TutorService.rejectTutorRequest(
    requestId,
    req.body.rejectionReason
  );
  sendResponse(res, {
    httpStatusCode: status23.OK,
    success: true,
    message: "Tutor request rejected. Notification email sent.",
    data: result
  });
});
var updateTutorProfile2 = catchAsync_default(async (req, res) => {
  const userId = req.user?.userId;
  const files = req.files;
  const profileImageFile = files?.profileImage?.[0];
  const result = await TutorService.updateTutorProfile(
    userId,
    req.body,
    profileImageFile
  );
  sendResponse(res, {
    httpStatusCode: status23.OK,
    success: true,
    message: "Tutor profile updated successfully",
    data: result
  });
});
var TutorRequestController = {
  createTutor: createTutor2,
  requestToBecomeTutor: requestToBecomeTutor2,
  getMyTutorRequest: getMyTutorRequest2,
  getAllTutorRequests: getAllTutorRequests2,
  getPendingTutorRequests: getPendingTutorRequests2,
  approveTutorRequest: approveTutorRequest2,
  rejectTutorRequest: rejectTutorRequest2,
  updateTutorProfile: updateTutorProfile2
};

// src/modules/tutors/tutorRequest.validation.ts
import { z as z6 } from "zod";
var createTutorValidation = z6.object({
  body: z6.object({
    email: z6.string().email("Invalid email"),
    password: z6.string().min(6, "Password must be at least 6 characters"),
    name: z6.string().min(2, "Name is too short"),
    tutor: z6.object({
      bio: z6.string().min(10, "Bio must be at least 10 characters").max(500),
      hourlyRate: z6.number().positive("Hourly rate must be positive"),
      experienceYrs: z6.number().int().nonnegative("Experience years must be non-negative"),
      location: z6.string().optional(),
      languages: z6.string().optional(),
      profileImage: z6.string().url("Invalid URL").optional()
    })
  })
});
var createTutorRequestValidation = z6.object({
  body: z6.object({
    bio: z6.string().min(10, "Bio must be at least 10 characters").max(500),
    hourlyRate: z6.number().positive("Hourly rate must be positive"),
    experienceYrs: z6.number().int().nonnegative("Experience years must be non-negative"),
    location: z6.string().optional(),
    languages: z6.string().optional()
  })
});
var updateTutorValidation = z6.object({
  body: z6.object({
    bio: z6.string().optional(),
    hourlyRate: z6.number().nonnegative().optional(),
    experienceYrs: z6.number().int().nonnegative().optional(),
    location: z6.string().optional(),
    languages: z6.string().optional(),
    profileImage: z6.string().nullable().optional(),
    categories: z6.array(z6.string()).optional()
  })
});
var rejectTutorRequestValidation = z6.object({
  body: z6.object({
    rejectionReason: z6.string().min(10, "Rejection reason must be at least 10 characters")
  })
});

// src/modules/tutors/tutorRequest.route.ts
var router10 = Router9();
router10.post(
  "/",
  checkAuth_default("ADMIN" /* ADMIN */),
  validateRequest(createTutorValidation),
  TutorRequestController.createTutor
);
router10.post(
  "/request",
  checkAuth_default(),
  validateRequest(createTutorRequestValidation),
  TutorRequestController.requestToBecomeTutor
);
router10.get(
  "/my-request",
  checkAuth_default(),
  TutorRequestController.getMyTutorRequest
);
router10.get(
  "/requests",
  checkAuth_default("ADMIN" /* ADMIN */),
  TutorRequestController.getAllTutorRequests
);
router10.get(
  "/requests/pending",
  checkAuth_default("ADMIN" /* ADMIN */),
  TutorRequestController.getPendingTutorRequests
);
router10.patch(
  "/requests/:id/approve",
  checkAuth_default("ADMIN" /* ADMIN */),
  TutorRequestController.approveTutorRequest
);
router10.patch(
  "/requests/:id/reject",
  checkAuth_default("ADMIN" /* ADMIN */),
  validateRequest(rejectTutorRequestValidation),
  TutorRequestController.rejectTutorRequest
);
router10.patch(
  "/profile",
  checkAuth_default("TUTOR" /* TUTOR */),
  multerMemoryUpload.fields([
    { name: "profileImage", maxCount: 1 }
  ]),
  validateRequest(updateTutorValidation),
  TutorRequestController.updateTutorProfile
);
var TutorRequestRoutes = router10;

// src/modules/stats/stats.route.ts
import { Router as Router10 } from "express";

// src/modules/stats/stats.controller.ts
import status25 from "http-status";

// src/modules/stats/stats.service.ts
import status24 from "http-status";
var getStudentStats = async (userId) => {
  const [
    totalBookings,
    confirmedBookings,
    completedBookings,
    cancelledBookings,
    pendingBookings,
    totalReviewsGiven,
    totalAssignments,
    totalSubmissions
  ] = await Promise.all([
    prisma.booking.count({ where: { studentId: userId } }),
    prisma.booking.count({ where: { studentId: userId, status: "CONFIRMED" } }),
    prisma.booking.count({ where: { studentId: userId, status: "COMPLETED" } }),
    prisma.booking.count({ where: { studentId: userId, status: "CANCELLED" } }),
    prisma.booking.count({ where: { studentId: userId, status: "PENDING" } }),
    prisma.review.count({ where: { studentId: userId } }),
    prisma.assignment.count({ where: { createdById: userId } }),
    prisma.assignmentSubmission.count({ where: { studentId: userId } })
  ]);
  const spendingAgg = await prisma.payment.aggregate({
    where: { userId, status: "SUCCESS" },
    _sum: { amount: true }
  });
  const totalSpent = spendingAgg._sum.amount ?? 0;
  const bookingStatusDistribution = [
    { name: "Pending", value: pendingBookings },
    { name: "Confirmed", value: confirmedBookings },
    { name: "Completed", value: completedBookings },
    { name: "Cancelled", value: cancelledBookings }
  ];
  const [pendingSubs, submittedSubs, gradedSubs] = await Promise.all([
    prisma.assignmentSubmission.count({
      where: { studentId: userId, status: "PENDING" }
    }),
    prisma.assignmentSubmission.count({
      where: { studentId: userId, status: "SUBMITTED" }
    }),
    prisma.assignmentSubmission.count({
      where: { studentId: userId, status: "GRADED" }
    })
  ]);
  const assignmentStatusDistribution = [
    { name: "Pending", value: pendingSubs },
    { name: "Submitted", value: submittedSubs },
    { name: "Graded", value: gradedSubs }
  ];
  const gradeAgg = await prisma.assignmentSubmission.aggregate({
    where: { studentId: userId, status: "GRADED" },
    _avg: { grade: true }
  });
  const averageGrade = gradeAgg._avg.grade ?? 0;
  const twelveMonthsAgo = /* @__PURE__ */ new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);
  const bookingsLast12 = await prisma.booking.findMany({
    where: {
      studentId: userId,
      createdAt: { gte: twelveMonthsAgo }
    },
    select: { createdAt: true }
  });
  const monthlyBookings = buildMonthlyData(bookingsLast12);
  const paymentsLast12 = await prisma.payment.findMany({
    where: {
      userId,
      status: "SUCCESS",
      createdAt: { gte: twelveMonthsAgo }
    },
    select: { createdAt: true, amount: true }
  });
  const monthlySpending = buildMonthlyAmountData(paymentsLast12);
  const recentBookings = await prisma.booking.findMany({
    where: { studentId: userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      tutor: { select: { id: true, name: true, image: true } },
      tutorProfile: { select: { id: true, bio: true, hourlyRate: true } },
      review: true
    }
  });
  const recentReviews = await prisma.review.findMany({
    where: { studentId: userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      tutor: { select: { id: true, name: true, image: true } },
      booking: {
        select: { id: true, scheduledStart: true, scheduledEnd: true }
      }
    }
  });
  const upcomingBookings = await prisma.booking.findMany({
    where: {
      studentId: userId,
      status: "CONFIRMED",
      scheduledStart: { gt: /* @__PURE__ */ new Date() }
    },
    orderBy: { scheduledStart: "asc" },
    take: 5,
    include: {
      tutor: { select: { id: true, name: true, image: true, email: true } }
    }
  });
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
      averageGrade: Number(averageGrade.toFixed(2))
    },
    charts: {
      bookingStatusDistribution,
      assignmentStatusDistribution,
      monthlyBookings,
      monthlySpending
    },
    upcomingBookings,
    recentBookings,
    recentReviews,
    recentAssignments
  };
};
var getTutorStats = async (userId) => {
  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      totalEarnings: true,
      avgRating: true,
      totalReviews: true,
      hourlyRate: true
    }
  });
  if (!tutorProfile) {
    throw new AppError_default(
      status24.NOT_FOUND,
      "Tutor profile not found"
    );
  }
  const [
    totalBookings,
    confirmedBookings,
    completedBookings,
    cancelledBookings,
    pendingBookings,
    totalReviewsReceived
  ] = await Promise.all([
    prisma.booking.count({ where: { tutorId: userId } }),
    prisma.booking.count({
      where: { tutorId: userId, status: "CONFIRMED" }
    }),
    prisma.booking.count({
      where: { tutorId: userId, status: "COMPLETED" }
    }),
    prisma.booking.count({
      where: { tutorId: userId, status: "CANCELLED" }
    }),
    prisma.booking.count({ where: { tutorId: userId, status: "PENDING" } }),
    prisma.review.count({ where: { tutorId: userId } })
  ]);
  const uniqueStudentGroups = await prisma.booking.groupBy({
    by: ["studentId"],
    where: { tutorId: userId }
  });
  const totalStudents = uniqueStudentGroups.length;
  const bookingIds = await prisma.booking.findMany({
    where: { tutorId: userId },
    select: { id: true }
  });
  const bookingIdList = bookingIds.map((b) => b.id);
  const revenueAgg = await prisma.payment.aggregate({
    where: {
      bookingId: { in: bookingIdList },
      status: "SUCCESS"
    },
    _sum: { amount: true }
  });
  const totalRevenue = revenueAgg._sum.amount ?? tutorProfile.totalEarnings;
  const bookingStatusDistribution = [
    { name: "Pending", value: pendingBookings },
    { name: "Confirmed", value: confirmedBookings },
    { name: "Completed", value: completedBookings },
    { name: "Cancelled", value: cancelledBookings }
  ];
  const [rating1, rating2, rating3, rating4, rating5] = await Promise.all(
    [
      prisma.review.count({ where: { tutorId: userId, rating: 1 } }),
      prisma.review.count({ where: { tutorId: userId, rating: 2 } }),
      prisma.review.count({ where: { tutorId: userId, rating: 3 } }),
      prisma.review.count({ where: { tutorId: userId, rating: 4 } }),
      prisma.review.count({ where: { tutorId: userId, rating: 5 } })
    ]
  );
  const ratingDistribution = [
    { name: "1 Star", value: rating1 },
    { name: "2 Stars", value: rating2 },
    { name: "3 Stars", value: rating3 },
    { name: "4 Stars", value: rating4 },
    { name: "5 Stars", value: rating5 }
  ];
  const twelveMonthsAgo = /* @__PURE__ */ new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);
  const paymentsLast12 = await prisma.payment.findMany({
    where: {
      bookingId: { in: bookingIdList },
      status: "SUCCESS",
      createdAt: { gte: twelveMonthsAgo }
    },
    select: { createdAt: true, amount: true }
  });
  const monthlyRevenue = buildMonthlyAmountData(paymentsLast12);
  const bookingsLast12 = await prisma.booking.findMany({
    where: {
      tutorId: userId,
      createdAt: { gte: twelveMonthsAgo }
    },
    select: { createdAt: true }
  });
  const monthlyBookings = buildMonthlyData(bookingsLast12);
  const studentBookingsLast12 = await prisma.booking.findMany({
    where: {
      tutorId: userId,
      createdAt: { gte: twelveMonthsAgo }
    },
    select: { studentId: true, createdAt: true },
    orderBy: { createdAt: "asc" }
  });
  const monthlyNewStudents = buildMonthlyUniqueData(
    studentBookingsLast12
  );
  const recentBookings = await prisma.booking.findMany({
    where: { tutorId: userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      student: {
        select: { id: true, name: true, image: true, email: true }
      },
      review: true,
      payment: { select: { status: true, amount: true } }
    }
  });
  const recentReviews = await prisma.review.findMany({
    where: { tutorId: userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      student: { select: { id: true, name: true, image: true } }
    }
  });
  const totalGradedAssignments = await prisma.assignmentSubmission.count({
    where: { gradedById: userId }
  });
  const upcomingBookings = await prisma.booking.findMany({
    where: {
      tutorId: userId,
      status: "CONFIRMED",
      scheduledStart: { gt: /* @__PURE__ */ new Date() }
    },
    orderBy: { scheduledStart: "asc" },
    take: 5,
    include: {
      student: { select: { id: true, name: true, image: true, email: true } }
    }
  });
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
      totalGradedAssignments
    },
    charts: {
      bookingStatusDistribution,
      ratingDistribution,
      monthlyRevenue,
      monthlyBookings,
      monthlyNewStudents
    },
    upcomingBookings,
    recentBookings,
    recentReviews,
    pendingAssignments
  };
};
var getAdminStats = async () => {
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
    totalTutorProfiles
  ] = await Promise.all([
    prisma.user.count({ where: { isDeleted: false } }),
    prisma.user.count({ where: { role: "STUDENT", isDeleted: false } }),
    prisma.user.count({ where: { role: "TUTOR", isDeleted: false } }),
    prisma.user.count({ where: { role: "ADMIN", isDeleted: false } }),
    prisma.user.count({ where: { status: "ACTIVE", isDeleted: false } }),
    prisma.user.count({ where: { status: "BANNED", isDeleted: false } }),
    prisma.user.count({
      where: { status: "SUSPENDED", isDeleted: false }
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
    prisma.tutorProfile.count()
  ]);
  const revenueAgg = await prisma.payment.aggregate({
    where: { status: "SUCCESS" },
    _sum: { amount: true }
  });
  const totalRevenue = revenueAgg._sum.amount ?? 0;
  const totalSuccessfulPayments = await prisma.payment.count({
    where: { status: "SUCCESS" }
  });
  const avgRatingAgg = await prisma.review.aggregate({
    _avg: { rating: true }
  });
  const platformAvgRating = Number(
    (avgRatingAgg._avg.rating ?? 0).toFixed(2)
  );
  const userRoleDistribution = [
    { name: "Students", value: totalStudents },
    { name: "Tutors", value: totalTutors },
    { name: "Admins", value: totalAdmins }
  ];
  const userStatusDistribution = [
    { name: "Active", value: activeUsers },
    { name: "Banned", value: bannedUsers },
    { name: "Suspended", value: suspendedUsers }
  ];
  const bookingStatusDistribution = [
    { name: "Pending", value: pendingBookings },
    { name: "Confirmed", value: confirmedBookings },
    { name: "Completed", value: completedBookings },
    { name: "Cancelled", value: cancelledBookings }
  ];
  const [
    initiatedPayments,
    successPayments,
    failedPayments,
    refundedPayments
  ] = await Promise.all([
    prisma.payment.count({ where: { status: "INITIATED" } }),
    prisma.payment.count({ where: { status: "SUCCESS" } }),
    prisma.payment.count({ where: { status: "FAILED" } }),
    prisma.payment.count({ where: { status: "REFUNDED" } })
  ]);
  const paymentStatusDistribution = [
    { name: "Initiated", value: initiatedPayments },
    { name: "Success", value: successPayments },
    { name: "Failed", value: failedPayments },
    { name: "Refunded", value: refundedPayments }
  ];
  const twelveMonthsAgo = /* @__PURE__ */ new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);
  const usersLast12 = await prisma.user.findMany({
    where: { createdAt: { gte: twelveMonthsAgo }, isDeleted: false },
    select: { createdAt: true }
  });
  const monthlyUserRegistrations = buildMonthlyData(usersLast12);
  const bookingsLast12 = await prisma.booking.findMany({
    where: { createdAt: { gte: twelveMonthsAgo } },
    select: { createdAt: true }
  });
  const monthlyBookings = buildMonthlyData(bookingsLast12);
  const paymentsLast12 = await prisma.payment.findMany({
    where: { status: "SUCCESS", createdAt: { gte: twelveMonthsAgo } },
    select: { createdAt: true, amount: true }
  });
  const monthlyRevenue = buildMonthlyAmountData(paymentsLast12);
  const reviewsLast12 = await prisma.review.findMany({
    where: { createdAt: { gte: twelveMonthsAgo } },
    select: { createdAt: true }
  });
  const monthlyReviews = buildMonthlyData(reviewsLast12);
  const topTutors = await prisma.tutorProfile.findMany({
    orderBy: { avgRating: "desc" },
    take: 5,
    include: {
      user: { select: { id: true, name: true, email: true, image: true } }
    }
  });
  const topEarners = await prisma.tutorProfile.findMany({
    orderBy: { totalEarnings: "desc" },
    take: 5,
    include: {
      user: { select: { id: true, name: true, email: true, image: true } }
    }
  });
  const categoryStats = await prisma.category.findMany({
    include: {
      _count: { select: { tutorLinks: true } }
    },
    orderBy: { tutorLinks: { _count: "desc" } },
    take: 10
  });
  const topCategories = categoryStats.map((c) => ({
    id: c.id,
    name: c.name,
    tutorCount: c._count.tutorLinks
  }));
  const [r1, r2, r3, r4, r5] = await Promise.all([
    prisma.review.count({ where: { rating: 1 } }),
    prisma.review.count({ where: { rating: 2 } }),
    prisma.review.count({ where: { rating: 3 } }),
    prisma.review.count({ where: { rating: 4 } }),
    prisma.review.count({ where: { rating: 5 } })
  ]);
  const platformRatingDistribution = [
    { name: "1 Star", value: r1 },
    { name: "2 Stars", value: r2 },
    { name: "3 Stars", value: r3 },
    { name: "4 Stars", value: r4 },
    { name: "5 Stars", value: r5 }
  ];
  const recentBookings = await prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      student: { select: { id: true, name: true, image: true } },
      tutor: { select: { id: true, name: true, image: true } }
    }
  });
  const recentPayments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      user: { select: { id: true, name: true, image: true } }
    }
  });
  const recentTutorRequests = await prisma.tutorRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true }
      }
    }
  });
  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, name: true, email: true, role: true, status: true, image: true, createdAt: true }
  });
  const recentReviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      student: { select: { id: true, name: true, image: true } },
      tutor: { select: { id: true, name: true, image: true } }
    }
  });
  const tutors = await prisma.user.findMany({
    where: { role: "TUTOR", isDeleted: false },
    include: {
      tutorProfile: { include: { availability: true } },
      tutorBookings: { include: { payment: true } }
    }
  });
  const allTutorsStats = tutors.map((tutor) => {
    const totalBookings2 = tutor.tutorBookings.length;
    const completedBookings2 = tutor.tutorBookings.filter((b) => b.status === "COMPLETED").length;
    const earnings = tutor.tutorProfile?.totalEarnings || 0;
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
      totalBookings: totalBookings2,
      completedBookings: completedBookings2,
      earnings: earnings > 0 ? earnings : totalPaymentsReceived
    };
  });
  const students = await prisma.user.findMany({
    where: { role: "STUDENT", isDeleted: false },
    include: {
      studentBookings: { include: { payment: true } }
    }
  });
  const allStudentsStats = students.map((student) => {
    const totalBookings2 = student.studentBookings.length;
    const completedBookings2 = student.studentBookings.filter((b) => b.status === "COMPLETED").length;
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
      totalBookings: totalBookings2,
      completedBookings: completedBookings2,
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
      platformAvgRating
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
      topCategories
    },
    topTutors: topTutors.map((t) => ({
      id: t.id,
      userId: t.userId,
      name: t.user.name,
      email: t.user.email,
      image: t.user.image,
      avgRating: t.avgRating,
      totalReviews: t.totalReviews,
      totalEarnings: t.totalEarnings
    })),
    topEarners: topEarners.map((t) => ({
      id: t.id,
      userId: t.userId,
      name: t.user.name,
      email: t.user.email,
      image: t.user.image,
      totalEarnings: t.totalEarnings,
      avgRating: t.avgRating
    })),
    recentBookings,
    recentPayments,
    recentTutorRequests,
    recentUsers,
    recentReviews,
    allTutorsStats,
    allStudentsStats
  };
};
function buildMonthlyData(records) {
  const now = /* @__PURE__ */ new Date();
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString("en-US", {
      month: "short",
      year: "numeric"
    });
    months.push({ month: label, count: 0 });
  }
  for (const record of records) {
    const date = new Date(record.createdAt);
    const monthIndex = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
    const arrIndex = 11 - monthIndex;
    const entry = months[arrIndex];
    if (arrIndex >= 0 && arrIndex < 12 && entry) {
      entry.count++;
    }
  }
  return months;
}
function buildMonthlyAmountData(records) {
  const now = /* @__PURE__ */ new Date();
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString("en-US", {
      month: "short",
      year: "numeric"
    });
    months.push({ month: label, amount: 0 });
  }
  for (const record of records) {
    const date = new Date(record.createdAt);
    const monthIndex = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
    const arrIndex = 11 - monthIndex;
    const entry = months[arrIndex];
    if (arrIndex >= 0 && arrIndex < 12 && entry) {
      entry.amount += Number(record.amount) || 0;
    }
  }
  for (const m of months) {
    m.amount = Number(m.amount.toFixed(2));
  }
  return months;
}
function buildMonthlyUniqueData(records) {
  const now = /* @__PURE__ */ new Date();
  const months = [];
  const seenSets = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString("en-US", {
      month: "short",
      year: "numeric"
    });
    months.push({ month: label, count: 0 });
    seenSets.push(/* @__PURE__ */ new Set());
  }
  for (const record of records) {
    const date = new Date(record.createdAt);
    const monthIndex = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
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
var StatsService = {
  getStudentStats,
  getTutorStats,
  getAdminStats
};

// src/modules/stats/stats.controller.ts
var getStudentDashboard = catchAsync_default(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError_default(status25.UNAUTHORIZED, "User not authenticated");
  }
  const data = await StatsService.getStudentStats(userId);
  sendResponse(res, {
    httpStatusCode: status25.OK,
    success: true,
    message: "Student dashboard stats retrieved successfully",
    data
  });
});
var getTutorDashboard = catchAsync_default(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError_default(status25.UNAUTHORIZED, "User not authenticated");
  }
  const data = await StatsService.getTutorStats(userId);
  sendResponse(res, {
    httpStatusCode: status25.OK,
    success: true,
    message: "Tutor dashboard stats retrieved successfully",
    data
  });
});
var getAdminDashboard = catchAsync_default(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError_default(status25.UNAUTHORIZED, "User not authenticated");
  }
  const data = await StatsService.getAdminStats();
  sendResponse(res, {
    httpStatusCode: status25.OK,
    success: true,
    message: "Admin dashboard stats retrieved successfully",
    data
  });
});
var StatsController = {
  getStudentDashboard,
  getTutorDashboard,
  getAdminDashboard
};

// src/modules/stats/stats.route.ts
var router11 = Router10();
router11.get(
  "/student",
  checkAuth_default("STUDENT" /* STUDENT */),
  StatsController.getStudentDashboard
);
router11.get(
  "/tutor",
  checkAuth_default("TUTOR" /* TUTOR */),
  StatsController.getTutorDashboard
);
router11.get(
  "/admin",
  checkAuth_default("ADMIN" /* ADMIN */),
  StatsController.getAdminDashboard
);
var StatsRoutes = router11;

// src/modules/payment/payment.route.ts
import { Router as Router11 } from "express";

// src/modules/payment/payment.service.ts
import status26 from "http-status";

// src/config/stripe.config.ts
import Stripe from "stripe";
var stripe = new Stripe(envVars.STRIPE.STRIPE_SECRET_KEY);

// src/modules/payment/payment.service.ts
var createPaymentIntent = async (bookingId, studentId) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      student: { select: { id: true, email: true, name: true } }
    }
  });
  if (!booking) {
    throw new AppError_default(status26.NOT_FOUND, "Target booking could not be tracked");
  }
  if (booking.studentId !== studentId) {
    throw new AppError_default(
      status26.FORBIDDEN,
      "Unauthorized interaction attempting payment flow outside of native account"
    );
  }
  if (booking.paymentStatus === "PAID") {
    throw new AppError_default(
      status26.BAD_REQUEST,
      "Requested booking has already achieved a fully verified payment settlement"
    );
  }
  let paymentRecord = await prisma.payment.findUnique({
    where: { bookingId }
  });
  if (!paymentRecord) {
    paymentRecord = await prisma.payment.create({
      data: {
        userId: studentId,
        bookingId,
        amount: booking.price,
        provider: "STRIPE",
        status: "INITIATED"
      }
    });
  } else if (paymentRecord.status === "SUCCESS") {
    throw new AppError_default(
      status26.BAD_REQUEST,
      "Payment record strictly listed as succeeded. Double-checkout avoided."
    );
  }
  const paymentAmountCents = Math.round(booking.price * 100);
  const paymentIntent = await stripe.paymentIntents.create({
    amount: paymentAmountCents,
    currency: "usd",
    // Modify dynamically if platform scales internationally
    payment_method_types: ["card"],
    receipt_email: booking.student.email,
    metadata: {
      bookingId: booking.id,
      studentId: booking.student.id,
      internalPaymentId: paymentRecord.id
    }
  });
  await prisma.payment.update({
    where: { id: paymentRecord.id },
    data: {
      transactionId: paymentIntent.id
    }
  });
  return {
    clientSecret: paymentIntent.client_secret,
    transactionId: paymentIntent.id,
    amount: booking.price
  };
};
var handleStripeWebhook = async (rawBody, signature) => {
  const webhookSecret = envVars.STRIPE.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new AppError_default(status26.INTERNAL_SERVER_ERROR, "Stripe Webhook config key missing");
  }
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    throw new AppError_default(status26.BAD_REQUEST, `Webhook Signature Verification Failed: ${err.message}`);
  }
  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object;
      const bookingId = paymentIntent.metadata.bookingId;
      const internalPaymentId = paymentIntent.metadata.internalPaymentId;
      if (!bookingId || !internalPaymentId) {
        console.error("Webhook lacked critical identifying booking keys", paymentIntent.id);
        break;
      }
      await prisma.$transaction(async (tx) => {
        const payment = await tx.payment.findUnique({
          where: { id: internalPaymentId },
          include: { booking: true }
        });
        if (!payment || payment.status === "SUCCESS") return;
        await tx.payment.update({
          where: { id: internalPaymentId },
          data: {
            status: "SUCCESS"
          }
        });
        await tx.booking.update({
          where: { id: bookingId },
          data: {
            paymentStatus: "PAID"
          }
        });
        await tx.tutorProfile.update({
          where: { id: payment.booking.tutorProfileId },
          data: {
            totalEarnings: {
              increment: payment.amount
            }
          }
        });
        await tx.notification.create({
          data: {
            userId: payment.userId,
            title: "Payment Processed",
            message: `Your payment was fully settled structurally matching a secured transactional record.`,
            type: "PAYMENT"
          }
        });
      });
      break;
    }
    case "payment_intent.payment_failed": {
      const failedIntent = event.data.object;
      const paymentId = failedIntent.metadata.internalPaymentId;
      const studentId = failedIntent.metadata.studentId;
      if (paymentId) {
        await prisma.payment.update({
          where: { id: paymentId },
          data: { status: "FAILED" }
        });
        if (studentId) {
          await prisma.notification.create({
            data: {
              userId: studentId,
              title: "Payment Failed",
              message: "Your recent payment attempt failed to process. Please verify your card details.",
              type: "PAYMENT"
            }
          });
        }
      }
      break;
    }
    default:
      console.log(`Unhandled Stripe generic event executed internally: ${event.type}`);
  }
};
var getPaymentDetails = async (transactionId, userId, role) => {
  const payment = await prisma.payment.findFirst({
    where: { transactionId },
    include: {
      booking: {
        include: {
          student: { select: { name: true, email: true } },
          tutor: { select: { name: true, email: true } }
        }
      }
    }
  });
  if (!payment) {
    throw new AppError_default(status26.NOT_FOUND, "Stripe transaction not tracked locally internally yet.");
  }
  if (role !== "ADMIN" && payment.booking.studentId !== userId && payment.booking.tutorId !== userId) {
    throw new AppError_default(status26.FORBIDDEN, "Unauthorized reading access.");
  }
  return payment;
};
var PaymentService = {
  createPaymentIntent,
  handleStripeWebhook,
  getPaymentDetails
};

// src/modules/payment/payment.controller.ts
import status27 from "http-status";
var PaymentController = {
  createPaymentIntent: catchAsync_default(async (req, res) => {
    const { bookingId } = req.body;
    if (typeof bookingId !== "string" || !bookingId.trim()) {
      return res.status(status27.BAD_REQUEST).json({
        success: false,
        message: "A valid bookingId must be provided as a string"
      });
    }
    const data = await PaymentService.createPaymentIntent(
      bookingId.trim(),
      req.user.userId
    );
    sendResponse(res, {
      httpStatusCode: status27.CREATED,
      success: true,
      message: "Stripe PaymentIntent generated successfully",
      data
    });
  }),
  handleWebhook: catchAsync_default(async (req, res) => {
    const signature = req.headers["stripe-signature"];
    if (!signature) {
      return res.status(status27.BAD_REQUEST).json({
        success: false,
        message: "Missing Stripe signature header"
      });
    }
    try {
      await PaymentService.handleStripeWebhook(req.body, signature);
      res.json({ received: true });
    } catch (error) {
      console.error("Stripe Webhook Error:", error.message);
      res.status(status27.BAD_REQUEST).send(`Webhook Error: ${error.message}`);
    }
  }),
  getPaymentDetails: catchAsync_default(async (req, res) => {
    const { transactionId } = req.params;
    if (!transactionId || typeof transactionId !== "string") {
      return res.status(status27.BAD_REQUEST).json({
        success: false,
        message: "transactionId is required"
      });
    }
    const data = await PaymentService.getPaymentDetails(
      transactionId.trim(),
      req.user.userId,
      req.user.role
    );
    sendResponse(res, {
      httpStatusCode: status27.OK,
      success: true,
      message: "Payment detailed successfully fetched",
      data
    });
  })
};

// src/modules/payment/payment.route.ts
var router12 = Router11();
router12.post(
  "/create-payment-intent",
  checkAuth_default("STUDENT" /* STUDENT */),
  PaymentController.createPaymentIntent
);
router12.post(
  "/webhook",
  PaymentController.handleWebhook
);
router12.get(
  "/:transactionId",
  checkAuth_default("STUDENT" /* STUDENT */, "TUTOR" /* TUTOR */, "ADMIN" /* ADMIN */),
  PaymentController.getPaymentDetails
);
var PaymentRoutes = router12;

// src/modules/assignment/assignment.route.ts
import { Router as Router12 } from "express";

// src/modules/assignment/assignment.service.ts
import status28 from "http-status";
var AssignmentService = {
  createAssignment: async (tutorId, title, description, bookingId) => {
    let studentIdToNotify = null;
    if (bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId }
      });
      if (!booking) {
        throw new AppError_default(status28.NOT_FOUND, "Associated booking not found");
      }
      if (booking.tutorId !== tutorId) {
        throw new AppError_default(
          status28.FORBIDDEN,
          "You can only assign work logically mapped to your own native bookings"
        );
      }
      studentIdToNotify = booking.studentId;
    }
    const createdAssignment = await prisma.assignment.create({
      data: {
        title,
        description: description || null,
        createdById: tutorId,
        bookingId: bookingId || null,
        status: "PENDING"
      }
    });
    if (studentIdToNotify) {
      await prisma.notification.create({
        data: {
          userId: studentIdToNotify,
          title: "New Assignment Received",
          message: `Your tutor has posted a new explicitly assigned task specifically matching your class: ${title}`,
          type: "SYSTEM"
        }
      });
    }
    return createdAssignment;
  },
  getAllAssignments: async (userId, role) => {
    if (role === "ADMIN") {
      return prisma.assignment.findMany({
        include: {
          createdBy: { select: { name: true, email: true } },
          submissions: { select: { id: true, status: true, grade: true } }
        },
        orderBy: { createdAt: "desc" }
      });
    }
    if (role === "TUTOR") {
      return prisma.assignment.findMany({
        where: { createdById: userId },
        include: {
          submissions: { select: { id: true, status: true, grade: true } },
          booking: { include: { student: { select: { name: true, email: true } } } }
        },
        orderBy: { createdAt: "desc" }
      });
    }
    return prisma.assignment.findMany({
      where: {
        OR: [
          { booking: { studentId: userId } },
          // Includes assignments without bounded booking globally distributed locally natively
          { bookingId: null }
        ]
      },
      include: {
        createdBy: { select: { name: true, email: true, image: true } },
        submissions: {
          where: { studentId: userId },
          select: { id: true, status: true, grade: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  },
  getAssignmentDetails: async (assignmentId, userId, role) => {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        createdBy: { select: { name: true, email: true, image: true } },
        booking: {
          include: { student: { select: { id: true, name: true, email: true } } }
        },
        submissions: {
          include: {
            student: { select: { id: true, name: true, email: true, image: true } },
            gradedBy: { select: { name: true } }
          },
          orderBy: { createdAt: "desc" }
        }
      }
    });
    if (!assignment) {
      throw new AppError_default(status28.NOT_FOUND, "Target assignment could not be fetched globally");
    }
    if (role === "STUDENT") {
      assignment.submissions = assignment.submissions.filter(
        (sub) => sub.studentId === userId
      );
    }
    return assignment;
  },
  submitAssignment: async (assignmentId, studentId, files) => {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { booking: true }
    });
    if (!assignment) {
      throw new AppError_default(status28.NOT_FOUND, "Assignment identifier does not natively exist");
    }
    if (assignment.booking && assignment.booking.studentId !== studentId) {
      throw new AppError_default(
        status28.FORBIDDEN,
        "Unauthorized execution. Assignment strictly linked exclusively tracking another booking dynamically."
      );
    }
    const filePayloads = files.map((file) => ({
      url: file.path || file.url,
      // Path usually bound inside Cloudinary buffers globally
      publicId: file.filename || file.public_id,
      type: file.mimetype,
      size: file.size,
      name: file.originalname
    }));
    const submission = await prisma.assignmentSubmission.create({
      data: {
        assignmentId,
        studentId,
        files: filePayloads,
        // Mapped natively to Prisma Json scalar universally
        status: "SUBMITTED"
      }
    });
    await prisma.assignment.update({
      where: { id: assignmentId },
      data: { status: "SUBMITTED" }
    });
    await prisma.notification.create({
      data: {
        userId: assignment.createdById,
        title: "Assignment Submitted",
        message: `A student has submitted an answer sheet for assignment: ${assignment.title}`,
        type: "SYSTEM"
      }
    });
    return submission;
  },
  evaluateSubmission: async (assignmentId, submissionId, tutorId, grade, feedback) => {
    return prisma.$transaction(async (tx) => {
      const assignment = await tx.assignment.findUnique({
        where: { id: assignmentId }
      });
      if (!assignment) {
        throw new AppError_default(status28.NOT_FOUND, "Parent Assignment structurally missing");
      }
      if (assignment.createdById !== tutorId) {
        throw new AppError_default(
          status28.FORBIDDEN,
          "Evaluations strictly designated exclusively matching the assigned original Tutor profile mapped."
        );
      }
      const submission = await tx.assignmentSubmission.findUnique({
        where: { id: submissionId }
      });
      if (!submission) {
        throw new AppError_default(
          status28.NOT_FOUND,
          "Target answersheet missing entirely natively evaluated."
        );
      }
      if (submission.assignmentId !== assignmentId) {
        throw new AppError_default(
          status28.BAD_REQUEST,
          "Mismatch detected mapping evaluations against disjoint sets natively."
        );
      }
      const evaluated = await tx.assignmentSubmission.update({
        where: { id: submissionId },
        data: {
          grade,
          feedback: feedback || null,
          gradedById: tutorId,
          status: "GRADED"
        }
      });
      await tx.assignment.update({
        where: { id: assignmentId },
        data: { status: "GRADED" }
      });
      await tx.notification.create({
        data: {
          userId: submission.studentId,
          title: "Assignment Evaluated",
          message: `Your assignment has been graded. You received a score of ${grade}.`,
          type: "SYSTEM"
        }
      });
      return evaluated;
    });
  }
};

// src/modules/assignment/assignment.controller.ts
import status29 from "http-status";
var AssignmentController = {
  createAssignment: catchAsync_default(async (req, res) => {
    const { title, description, bookingId } = req.body;
    if (!title || typeof title !== "string") {
      return res.status(status29.BAD_REQUEST).json({
        success: false,
        message: "Assignment title must be a valid string"
      });
    }
    const data = await AssignmentService.createAssignment(
      req.user.userId,
      title,
      description,
      bookingId
    );
    sendResponse(res, {
      httpStatusCode: status29.CREATED,
      success: true,
      message: "Assignment given successfully",
      data
    });
  }),
  getAllAssignments: catchAsync_default(async (req, res) => {
    const data = await AssignmentService.getAllAssignments(
      req.user.userId,
      req.user.role
    );
    sendResponse(res, {
      httpStatusCode: status29.OK,
      success: true,
      message: "Assignments retrieved successfully",
      data
    });
  }),
  getAssignmentDetails: catchAsync_default(async (req, res) => {
    const data = await AssignmentService.getAssignmentDetails(
      req.params.id,
      req.user.userId,
      req.user.role
    );
    sendResponse(res, {
      httpStatusCode: status29.OK,
      success: true,
      message: "Assignment details securely fetched",
      data
    });
  }),
  submitAssignment: catchAsync_default(async (req, res) => {
    const assignmentId = req.params.id;
    const uploadedFiles = req.files;
    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(status29.BAD_REQUEST).json({
        success: false,
        message: "Please upload at least one answer sheet file (PDF/Image)"
      });
    }
    const data = await AssignmentService.submitAssignment(
      assignmentId,
      req.user.userId,
      uploadedFiles
    );
    sendResponse(res, {
      httpStatusCode: status29.CREATED,
      success: true,
      message: "Student answer sheet securely submitted for evaluation",
      data
    });
  }),
  evaluateSubmission: catchAsync_default(async (req, res) => {
    const assignmentId = req.params.assignmentId;
    const submissionId = req.params.submissionId;
    const { grade, feedback } = req.body;
    if (grade === void 0 || typeof grade !== "number") {
      return res.status(status29.BAD_REQUEST).json({
        success: false,
        message: "grade must be a valid number"
      });
    }
    const data = await AssignmentService.evaluateSubmission(
      assignmentId,
      submissionId,
      req.user.userId,
      grade,
      feedback
    );
    sendResponse(res, {
      httpStatusCode: status29.OK,
      success: true,
      message: "Instant evaluation saved securely",
      data
    });
  })
};

// src/modules/assignment/assignment.route.ts
var router13 = Router12();
router13.post(
  "/",
  checkAuth_default("TUTOR" /* TUTOR */),
  AssignmentController.createAssignment
);
router13.get(
  "/",
  checkAuth_default("TUTOR" /* TUTOR */, "STUDENT" /* STUDENT */, "ADMIN" /* ADMIN */),
  AssignmentController.getAllAssignments
);
router13.get(
  "/:id",
  checkAuth_default("TUTOR" /* TUTOR */, "STUDENT" /* STUDENT */, "ADMIN" /* ADMIN */),
  AssignmentController.getAssignmentDetails
);
router13.post(
  "/:id/submit",
  checkAuth_default("STUDENT" /* STUDENT */),
  multerUpload.array("files", 5),
  AssignmentController.submitAssignment
);
router13.patch(
  "/:assignmentId/submissions/:submissionId/evaluate",
  checkAuth_default("TUTOR" /* TUTOR */),
  AssignmentController.evaluateSubmission
);
var AssignmentRoutes = router13;

// src/modules/notification/notification.route.ts
import { Router as Router13 } from "express";

// src/modules/notification/notification.service.ts
import status30 from "http-status";
var NotificationService = {
  // Utility handler that can be reused by Booking/Payment modules securely
  createNotification: async (userId, title, message, type) => {
    return prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type
      }
    });
  },
  getUserNotifications: async (userId) => {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
  },
  markNotificationAsRead: async (notificationId, userId) => {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });
    if (!notification) {
      throw new AppError_default(
        status30.NOT_FOUND,
        "System notification natively not found"
      );
    }
    if (notification.userId !== userId) {
      throw new AppError_default(
        status30.FORBIDDEN,
        "Denial: Modification attempting unauthorized access natively mapping."
      );
    }
    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });
  },
  markAllAsRead: async (userId) => {
    const { count } = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: { isRead: true }
    });
    return { markedCount: count };
  }
};

// src/modules/notification/notification.controller.ts
import status31 from "http-status";
var NotificationController = {
  getMyNotifications: catchAsync_default(async (req, res) => {
    const data = await NotificationService.getUserNotifications(req.user.userId);
    sendResponse(res, {
      httpStatusCode: status31.OK,
      success: true,
      message: "Notifications retrieved successfully",
      data
    });
  }),
  markAsRead: catchAsync_default(async (req, res) => {
    const { id } = req.params;
    const data = await NotificationService.markNotificationAsRead(
      id,
      req.user.userId
    );
    sendResponse(res, {
      httpStatusCode: status31.OK,
      success: true,
      message: "Notification marked as read",
      data
    });
  }),
  markAllAsRead: catchAsync_default(async (req, res) => {
    const data = await NotificationService.markAllAsRead(req.user.userId);
    sendResponse(res, {
      httpStatusCode: status31.OK,
      success: true,
      message: "All notifications marked as read",
      data
    });
  }),
  createSystemNotification: catchAsync_default(async (req, res) => {
    const { userId, title, message } = req.body;
    if (!userId || !title || !message) {
      return res.status(status31.BAD_REQUEST).json({
        success: false,
        message: "Required missing fields: userId, title, message"
      });
    }
    const data = await NotificationService.createNotification(
      userId,
      title,
      message,
      "SYSTEM"
    );
    sendResponse(res, {
      httpStatusCode: status31.CREATED,
      success: true,
      message: "System notification broadcasted mapping locally to specific user",
      data
    });
  })
};

// src/modules/notification/notification.route.ts
var router14 = Router13();
router14.use(checkAuth_default("STUDENT" /* STUDENT */, "TUTOR" /* TUTOR */, "ADMIN" /* ADMIN */));
router14.get(
  "/",
  NotificationController.getMyNotifications
);
router14.patch(
  "/read-all",
  NotificationController.markAllAsRead
);
router14.patch(
  "/:id/read",
  NotificationController.markAsRead
);
router14.post(
  "/",
  checkAuth_default("ADMIN" /* ADMIN */),
  NotificationController.createSystemNotification
);
var NotificationRoutes = router14;

// src/routers/index.ts
var router15 = Router14();
router15.use("/auth", AuthRoute);
router15.use("/user", UserRoutes);
router15.use("/admin", AdminRoutes);
router15.use("/tutors", TutorRequestRoutes);
router15.use("/tutor", tutorsRouter);
router15.use("/categories", CategoryRoutes);
router15.use("/tutorCategories", TutorCategoryRoutes);
router15.use("/stats", StatsRoutes);
router15.use("/bookings", BookingRoutes);
router15.use("/reviews", ReviewRoutes);
router15.use("/assignments", AssignmentRoutes);
router15.use("/notifications", NotificationRoutes);
router15.use("/", AvailabilityRoutes);
router15.use("/payments", PaymentRoutes);
var IndexRoute = router15;

// src/app.ts
var app = express2();
app.set("query parser", (str) => qs.parse(str));
app.set("view engine", "ejs");
app.set("views", path3.resolve(process.cwd(), `src/app/templates`));
app.use("/api/v1/payments/webhook", express2.raw({ type: "application/json" }));
app.use(express2.json());
var allowedOrigins = [
  process.env.APP_URL || "http://localhost:3000",
  process.env.PROD_APP_URL
].filter(Boolean);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isAllowed = allowedOrigins.includes(origin) || /^https:\/\/next-blog-client.*\.vercel\.app$/.test(origin) || /^https:\/\/.*\.vercel\.app$/.test(origin);
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposedHeaders: ["Set-Cookie"]
  })
);
app.all(/^\/api\/auth\/.*$/, toNodeHandler(auth));
app.use(express2.urlencoded({ extended: true }));
app.use("/api/v1", IndexRoute);
app.get("/", (req, res) => {
  res.send("SkillBridge");
});
app.use(NotFound);
app.use(globalErrorHandler);
var app_default = app;

// src/index.ts
var index_default = app_default;
export {
  index_default as default
};

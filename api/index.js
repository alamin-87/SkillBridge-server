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

// generated/prisma/internal/class.ts
import * as runtime from "@prisma/client/runtime/client";
var config = {
  "previewFeatures": [],
  "clientVersion": "7.3.0",
  "engineVersion": "9d6ad21cbbceab97458517b147a6a09ff43aa735",
  "activeProvider": "postgresql",
  "inlineSchema": 'enum UserRole {\n  STUDENT\n  TUTOR\n  ADMIN\n}\n\nenum UserStatus {\n  ACTIVE\n  BANNED\n}\n\nmodel User {\n  id            String  @id\n  name          String\n  email         String\n  emailVerified Boolean @default(false)\n  image         String?\n\n  // \u2705 add these\n  role  UserRole @default(STUDENT)\n  phone String?  @unique\n\n  status UserStatus @default(ACTIVE)\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  sessions Session[]\n  accounts Account[]\n\n  // \u2705 relations for your app tables\n  tutorProfile    TutorProfile?\n  studentBookings Booking[]     @relation("StudentBookings")\n  tutorBookings   Booking[]     @relation("TutorBookings")\n  reviewsGiven    Review[]      @relation("StudentReviews")\n  reviewsReceived Review[]      @relation("TutorReviews")\n\n  @@unique([email])\n  @@index([role])\n  @@index([status])\n  @@map("user")\n}\n\nmodel Session {\n  id        String   @id\n  expiresAt DateTime\n  token     String\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n  ipAddress String?\n  userAgent String?\n  userId    String\n  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@unique([token])\n  @@index([userId])\n  @@map("session")\n}\n\nmodel Account {\n  id                    String    @id\n  accountId             String\n  providerId            String\n  userId                String\n  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)\n  accessToken           String?\n  refreshToken          String?\n  idToken               String?\n  accessTokenExpiresAt  DateTime?\n  refreshTokenExpiresAt DateTime?\n  scope                 String?\n  password              String?\n  createdAt             DateTime  @default(now())\n  updatedAt             DateTime  @updatedAt\n\n  @@index([userId])\n  @@map("account")\n}\n\nmodel Verification {\n  id         String   @id\n  identifier String\n  value      String\n  expiresAt  DateTime\n  createdAt  DateTime @default(now())\n  updatedAt  DateTime @updatedAt\n\n  @@index([identifier])\n  @@map("verification")\n}\n\nenum BookingStatus {\n  CONFIRMED\n  COMPLETED\n  CANCELLED\n}\n\nmodel Booking {\n  id String @id @default(cuid())\n\n  // Student (User)\n  student   User   @relation("StudentBookings", fields: [studentId], references: [id], onDelete: Cascade)\n  studentId String\n\n  // Tutor (User)\n  tutor   User   @relation("TutorBookings", fields: [tutorId], references: [id], onDelete: Cascade)\n  tutorId String\n\n  // Tutor Profile (for pricing/category context)\n  tutorProfile   TutorProfile @relation(fields: [tutorProfileId], references: [id], onDelete: Cascade)\n  tutorProfileId String\n\n  // Optional: lock a specific slot\n  availability   TutorAvailability? @relation(fields: [availabilityId], references: [id], onDelete: SetNull)\n  availabilityId String?\n\n  scheduledStart DateTime\n  scheduledEnd   DateTime\n\n  price  Float\n  status BookingStatus @default(CONFIRMED)\n\n  cancelledById String? // store userId who cancelled (student/tutor/admin)\n  cancelReason  String?\n\n  review Review?\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  @@index([studentId])\n  @@index([tutorId])\n  @@index([status])\n  @@index([scheduledStart])\n}\n\nmodel Category {\n  id   String @id @default(cuid())\n  name String @unique\n\n  // many-to-many with tutor profiles via join table\n  tutorLinks TutorCategory[]\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n}\n\nmodel Review {\n  id String @id @default(cuid())\n\n  booking   Booking @relation(fields: [bookingId], references: [id], onDelete: Cascade)\n  bookingId String  @unique\n\n  // Student gives review\n  student   User   @relation("StudentReviews", fields: [studentId], references: [id], onDelete: Cascade)\n  studentId String\n\n  // Tutor receives review\n  tutor   User   @relation("TutorReviews", fields: [tutorId], references: [id], onDelete: Cascade)\n  tutorId String\n\n  rating  Int // 1..5 (validate in app layer)\n  comment String?\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  @@index([tutorId])\n  @@index([rating])\n}\n\n// This is your Prisma schema file,\n// learn more about it in the docs: https://pris.ly/d/prisma-schema\n\n// Looking for ways to speed up your queries, or scale easily with your serverless or edge functions?\n// Try Prisma Accelerate: https://pris.ly/cli/accelerate-init\n\ngenerator client {\n  provider = "prisma-client"\n  output   = "../../generated/prisma"\n}\n\ndatasource db {\n  provider = "postgresql"\n}\n\nmodel TutorProfile {\n  id     String @id @default(cuid())\n  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)\n  userId String @unique\n\n  bio           String?\n  hourlyRate    Float   @default(0)\n  experienceYrs Int     @default(0)\n  location      String?\n  languages     String? // store as CSV or JSON string if you want\n  profileImage  String?\n\n  // Public listing fields\n  avgRating    Float @default(0)\n  totalReviews Int   @default(0)\n\n  // Relations\n  categories   TutorCategory[]\n  availability TutorAvailability[]\n  bookings     Booking[]\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  @@index([hourlyRate])\n  @@index([avgRating])\n}\n\nmodel TutorAvailability {\n  id             String       @id @default(cuid())\n  tutorProfile   TutorProfile @relation(fields: [tutorProfileId], references: [id], onDelete: Cascade)\n  tutorProfileId String\n\n  startTime DateTime\n  endTime   DateTime\n  isBooked  Boolean  @default(false)\n\n  // \u2705 Opposite relation (add this)\n  bookings Booking[] // one slot can be linked to many bookings (or 1, depending on your rules)\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  @@index([tutorProfileId])\n  @@index([startTime, endTime])\n}\n\nmodel TutorCategory {\n  id             String       @id @default(cuid())\n  tutorProfile   TutorProfile @relation(fields: [tutorProfileId], references: [id], onDelete: Cascade)\n  tutorProfileId String\n  category       Category     @relation(fields: [categoryId], references: [id], onDelete: Cascade)\n  categoryId     String\n\n  @@unique([tutorProfileId, categoryId])\n  @@index([categoryId])\n}\n',
  "runtimeDataModel": {
    "models": {},
    "enums": {},
    "types": {}
  }
};
config.runtimeDataModel = JSON.parse('{"models":{"User":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"emailVerified","kind":"scalar","type":"Boolean"},{"name":"image","kind":"scalar","type":"String"},{"name":"role","kind":"enum","type":"UserRole"},{"name":"phone","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"UserStatus"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"sessions","kind":"object","type":"Session","relationName":"SessionToUser"},{"name":"accounts","kind":"object","type":"Account","relationName":"AccountToUser"},{"name":"tutorProfile","kind":"object","type":"TutorProfile","relationName":"TutorProfileToUser"},{"name":"studentBookings","kind":"object","type":"Booking","relationName":"StudentBookings"},{"name":"tutorBookings","kind":"object","type":"Booking","relationName":"TutorBookings"},{"name":"reviewsGiven","kind":"object","type":"Review","relationName":"StudentReviews"},{"name":"reviewsReceived","kind":"object","type":"Review","relationName":"TutorReviews"}],"dbName":"user"},"Session":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"token","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"ipAddress","kind":"scalar","type":"String"},{"name":"userAgent","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"SessionToUser"}],"dbName":"session"},"Account":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"accountId","kind":"scalar","type":"String"},{"name":"providerId","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"AccountToUser"},{"name":"accessToken","kind":"scalar","type":"String"},{"name":"refreshToken","kind":"scalar","type":"String"},{"name":"idToken","kind":"scalar","type":"String"},{"name":"accessTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"refreshTokenExpiresAt","kind":"scalar","type":"DateTime"},{"name":"scope","kind":"scalar","type":"String"},{"name":"password","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"account"},"Verification":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"identifier","kind":"scalar","type":"String"},{"name":"value","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"verification"},"Booking":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"student","kind":"object","type":"User","relationName":"StudentBookings"},{"name":"studentId","kind":"scalar","type":"String"},{"name":"tutor","kind":"object","type":"User","relationName":"TutorBookings"},{"name":"tutorId","kind":"scalar","type":"String"},{"name":"tutorProfile","kind":"object","type":"TutorProfile","relationName":"BookingToTutorProfile"},{"name":"tutorProfileId","kind":"scalar","type":"String"},{"name":"availability","kind":"object","type":"TutorAvailability","relationName":"BookingToTutorAvailability"},{"name":"availabilityId","kind":"scalar","type":"String"},{"name":"scheduledStart","kind":"scalar","type":"DateTime"},{"name":"scheduledEnd","kind":"scalar","type":"DateTime"},{"name":"price","kind":"scalar","type":"Float"},{"name":"status","kind":"enum","type":"BookingStatus"},{"name":"cancelledById","kind":"scalar","type":"String"},{"name":"cancelReason","kind":"scalar","type":"String"},{"name":"review","kind":"object","type":"Review","relationName":"BookingToReview"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":null},"Category":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"tutorLinks","kind":"object","type":"TutorCategory","relationName":"CategoryToTutorCategory"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":null},"Review":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"booking","kind":"object","type":"Booking","relationName":"BookingToReview"},{"name":"bookingId","kind":"scalar","type":"String"},{"name":"student","kind":"object","type":"User","relationName":"StudentReviews"},{"name":"studentId","kind":"scalar","type":"String"},{"name":"tutor","kind":"object","type":"User","relationName":"TutorReviews"},{"name":"tutorId","kind":"scalar","type":"String"},{"name":"rating","kind":"scalar","type":"Int"},{"name":"comment","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":null},"TutorProfile":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"user","kind":"object","type":"User","relationName":"TutorProfileToUser"},{"name":"userId","kind":"scalar","type":"String"},{"name":"bio","kind":"scalar","type":"String"},{"name":"hourlyRate","kind":"scalar","type":"Float"},{"name":"experienceYrs","kind":"scalar","type":"Int"},{"name":"location","kind":"scalar","type":"String"},{"name":"languages","kind":"scalar","type":"String"},{"name":"profileImage","kind":"scalar","type":"String"},{"name":"avgRating","kind":"scalar","type":"Float"},{"name":"totalReviews","kind":"scalar","type":"Int"},{"name":"categories","kind":"object","type":"TutorCategory","relationName":"TutorCategoryToTutorProfile"},{"name":"availability","kind":"object","type":"TutorAvailability","relationName":"TutorAvailabilityToTutorProfile"},{"name":"bookings","kind":"object","type":"Booking","relationName":"BookingToTutorProfile"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":null},"TutorAvailability":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"tutorProfile","kind":"object","type":"TutorProfile","relationName":"TutorAvailabilityToTutorProfile"},{"name":"tutorProfileId","kind":"scalar","type":"String"},{"name":"startTime","kind":"scalar","type":"DateTime"},{"name":"endTime","kind":"scalar","type":"DateTime"},{"name":"isBooked","kind":"scalar","type":"Boolean"},{"name":"bookings","kind":"object","type":"Booking","relationName":"BookingToTutorAvailability"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":null},"TutorCategory":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"tutorProfile","kind":"object","type":"TutorProfile","relationName":"TutorCategoryToTutorProfile"},{"name":"tutorProfileId","kind":"scalar","type":"String"},{"name":"category","kind":"object","type":"Category","relationName":"CategoryToTutorCategory"},{"name":"categoryId","kind":"scalar","type":"String"}],"dbName":null}},"enums":{},"types":{}}');
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
  AnyNull: () => AnyNull2,
  BookingScalarFieldEnum: () => BookingScalarFieldEnum,
  CategoryScalarFieldEnum: () => CategoryScalarFieldEnum,
  DbNull: () => DbNull2,
  Decimal: () => Decimal2,
  JsonNull: () => JsonNull2,
  ModelName: () => ModelName,
  NullTypes: () => NullTypes2,
  NullsOrder: () => NullsOrder,
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
  User: "User",
  Session: "Session",
  Account: "Account",
  Verification: "Verification",
  Booking: "Booking",
  Category: "Category",
  Review: "Review",
  TutorProfile: "TutorProfile",
  TutorAvailability: "TutorAvailability",
  TutorCategory: "TutorCategory"
};
var TransactionIsolationLevel = runtime2.makeStrictEnum({
  ReadUncommitted: "ReadUncommitted",
  ReadCommitted: "ReadCommitted",
  RepeatableRead: "RepeatableRead",
  Serializable: "Serializable"
});
var UserScalarFieldEnum = {
  id: "id",
  name: "name",
  email: "email",
  emailVerified: "emailVerified",
  image: "image",
  role: "role",
  phone: "phone",
  status: "status",
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
var TutorCategoryScalarFieldEnum = {
  id: "id",
  tutorProfileId: "tutorProfileId",
  categoryId: "categoryId"
};
var SortOrder = {
  asc: "asc",
  desc: "desc"
};
var QueryMode = {
  default: "default",
  insensitive: "insensitive"
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
var isProd = process.env.NODE_ENV === "production";
var auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql"
  }),
  trustedOrigins: [
    "http://localhost:3000",
    process.env.APP_URL,
    "https://skillbridge-client-delta.vercel.app"
  ].filter(Boolean),
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "STUDENT"
      },
      phone: {
        type: "string",
        required: false,
        defaultValue: null
      },
      status: {
        type: "string",
        required: false,
        defaultValue: "ACTIVE"
      }
    }
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: false
  },
  socialProviders: {
    google: {
      prompt: "select_account consent",
      accessType: "offline",
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    }
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60
    }
  },
  advanced: {
    cookiePrefix: "better-auth",
    useSecureCookies: process.env.NODE_ENV === "production",
    crossSubDomainCookies: {
      enabled: false
    },
    disableCSRFCheck: true
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

// src/middleware/GlobalErrorHandeler.ts
function errorHandler(err, req, res, next) {
  let statusCode = 500;
  let errorMessage = err.message || "Internal Server Error";
  let errorDetails = err;
  if (err instanceof prismaNamespace_exports.PrismaClientValidationError) {
    statusCode = 400;
    errorMessage = "You provided incorrect data types for fields.";
    errorDetails = err;
  } else if (err instanceof prismaNamespace_exports.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      statusCode = 400;
      errorMessage = "An operation failed because it depends on one or more records that were required but not found.";
      errorDetails = err;
    } else if (err.code === "P2002") {
      statusCode = 400;
      errorMessage = "Unique constraint failed on a field that is not unique.";
      errorDetails = err;
    } else if (err.code === "P2003") {
      statusCode = 400;
      errorMessage = "Foreign key constraint failed.";
      errorDetails = err;
    }
  } else if (err instanceof prismaNamespace_exports.PrismaClientUnknownRequestError) {
    statusCode = 500;
    errorMessage = "An unknown error occurred with the database client.";
    errorDetails = err;
  } else if (err instanceof prismaNamespace_exports.PrismaClientRustPanicError) {
    statusCode = 500;
    errorMessage = "A panic occurred in the Prisma Client Rust engine.";
    errorDetails = err;
  } else if (err instanceof prismaNamespace_exports.PrismaClientInitializationError) {
    if (err.errorCode === "P2001") {
      statusCode = 500;
      errorMessage = "Prisma Client failed to initialize properly.";
      errorDetails = err;
    } else if (err.errorCode === "P2002") {
      statusCode = 500;
      errorMessage = "Prisma Client could not connect to the database.";
      errorDetails = err;
    } else {
      statusCode = 500;
      errorMessage = "An initialization error occurred in Prisma Client.";
      errorDetails = err;
    }
  }
  res.status(statusCode);
  res.json({ error: errorMessage, details: errorDetails });
}
var GlobalErrorHandeler_default = errorHandler;

// src/modules/tutors/tutors.route.ts
import express from "express";

// src/middleware/auth.ts
var authMiddleWare = (...roles) => {
  return async (req, res, next) => {
    try {
      const session = await auth.api.getSession({
        headers: req.headers
      });
      if (!session || !session.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      req.user = {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
        emailVerified: session.user.emailVerified
      };
      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({ error: "Forbidden" });
      }
      console.log(session);
      next();
    } catch (error) {
      next(error);
    }
  };
};

// src/modules/tutors/tutors.service.ts
function normalizeLanguagesToString(input) {
  if (input === void 0 || input === null) return null;
  if (typeof input === "string") return input.trim() || null;
  if (Array.isArray(input)) {
    const clean = input.map(String).map((s) => s.trim()).filter(Boolean);
    return clean.length ? JSON.stringify(clean) : null;
  }
  return null;
}
function safeFloat(v, fallback = 0) {
  if (v === void 0 || v === null || v === "") return fallback;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : fallback;
}
function safeInt(v, fallback = 0) {
  if (v === void 0 || v === null || v === "") return fallback;
  const n = typeof v === "number" ? Math.trunc(v) : parseInt(String(v).replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(n) ? n : fallback;
}
var parseLanguages = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map(String).map((s) => s.trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    const s = value.trim();
    if (s.startsWith("[") && s.endsWith("]")) {
      try {
        const arr = JSON.parse(s);
        if (Array.isArray(arr)) {
          return arr.map(String).map((x) => x.trim()).filter(Boolean);
        }
      } catch {
      }
    }
    return s.split(",").map((x) => x.trim()).filter(Boolean);
  }
  return [];
};
var serializeTutorProfile = (profile) => {
  if (!profile) return profile;
  return {
    ...profile,
    languages: parseLanguages(profile.languages)
  };
};
var getAllTutors = async (query) => {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  const skip = (page - 1) * limit;
  const where = {
    user: { role: "TUTOR", status: "ACTIVE" },
    ...query.search ? {
      OR: [
        { bio: { contains: query.search, mode: "insensitive" } },
        { user: { name: { contains: query.search, mode: "insensitive" } } },
        {
          categories: {
            some: {
              category: {
                name: { contains: query.search, mode: "insensitive" }
              }
            }
          }
        }
      ]
    } : {},
    ...query.minRating ? { avgRating: { gte: query.minRating } } : {},
    ...query.maxPrice ? { hourlyRate: { lte: query.maxPrice } } : {},
    ...query.categoryId ? { categories: { some: { categoryId: query.categoryId } } } : {}
  };
  const [total, data] = await Promise.all([
    prisma.tutorProfile.count({ where }),
    prisma.tutorProfile.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ avgRating: "desc" }, { hourlyRate: "asc" }],
      include: {
        user: { select: { id: true, name: true, image: true } },
        categories: { include: { category: true } },
        availability: true
      }
    })
  ]);
  return { meta: { page, limit, total }, data };
};
var getTutorById = (id) => {
  return prisma.tutorProfile.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      categories: { include: { category: true } },
      availability: {
        where: { isBooked: false },
        orderBy: { startTime: "asc" }
      }
    }
  });
};
var createTutor = async (payload, userId) => {
  const data = {
    userId,
    bio: payload.bio?.trim() || null,
    location: payload.location?.trim() || null,
    profileImage: payload.profileImage?.trim() || null,
    languages: normalizeLanguagesToString(payload.languages),
    hourlyRate: safeFloat(payload.hourlyRate, 0),
    experienceYrs: safeInt(payload.experienceYrs, 0)
  };
  return prisma.$transaction(async (tx) => {
    const profile = await tx.tutorProfile.create({ data });
    const categoryNames = Array.isArray(payload.categories) ? payload.categories.filter((c) => typeof c === "string").map((c) => c.trim()).filter(Boolean) : [];
    for (const name of categoryNames) {
      const category = await tx.category.upsert({
        where: { name },
        update: {},
        create: { name }
      });
      await tx.tutorCategory.create({
        data: {
          tutorProfileId: profile.id,
          categoryId: category.id
        }
      });
    }
    return tx.tutorProfile.findUnique({
      where: { id: profile.id },
      include: {
        user: { select: { id: true, name: true, email: true, image: true, role: true } },
        categories: { include: { category: true } },
        availability: true
      }
    });
  });
};
var getMyTutorProfile = async (userId) => {
  const result = await prisma.tutorProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true, role: true }
      },
      categories: { include: { category: true } },
      availability: true
    }
  });
  if (!result) {
    const err = new Error("Tutor profile not found");
    err.code = "P2025";
    throw err;
  }
  return result;
};
var updateTutorProfile = async (userId, payload) => {
  const data = {};
  if (payload.bio !== void 0) data.bio = payload.bio;
  if (payload.hourlyRate !== void 0)
    data.hourlyRate = Number(payload.hourlyRate);
  if (payload.experienceYrs !== void 0)
    data.experienceYrs = Number(payload.experienceYrs);
  if (payload.location !== void 0) data.location = payload.location;
  if (payload.profileImage !== void 0)
    data.profileImage = payload.profileImage;
  const normalizeLanguages = (input) => {
    let langs = [];
    if (Array.isArray(input)) {
      langs = input;
    } else if (typeof input === "string") {
      const str = input.trim();
      if (str.startsWith("[") && str.endsWith("]")) {
        try {
          const parsed = JSON.parse(str);
          if (Array.isArray(parsed)) langs = parsed;
          else langs = [str];
        } catch {
          langs = str.split(",");
        }
      } else {
        langs = str.split(",");
      }
    }
    const seen = /* @__PURE__ */ new Set();
    return langs.filter((x) => typeof x === "string").map((x) => x.trim()).filter(Boolean).filter((x) => {
      const key = x.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };
  if (payload.languages !== void 0) {
    const clean = normalizeLanguages(payload.languages);
    data.languages = JSON.stringify(clean);
  }
  return prisma.$transaction(async (tx) => {
    const tutorProfile = await tx.tutorProfile.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data
      }
    });
    if (payload.categories !== void 0) {
      if (!Array.isArray(payload.categories)) {
        throw new Error("categories must be an array of strings");
      }
      const categoryNames = payload.categories.filter((c) => typeof c === "string").map((c) => c.trim()).filter((c) => c.length > 0);
      await tx.tutorCategory.deleteMany({
        where: { tutorProfileId: tutorProfile.id }
      });
      for (const name of categoryNames) {
        const category = await tx.category.upsert({
          where: { name },
          update: {},
          create: { name }
        });
        await tx.tutorCategory.create({
          data: {
            tutorProfileId: tutorProfile.id,
            categoryId: category.id
          }
        });
      }
    }
    const profile = await tx.tutorProfile.findUnique({
      where: { id: tutorProfile.id },
      include: {
        categories: { include: { category: true } },
        user: true
      }
    });
    return serializeTutorProfile(profile);
  });
};
var TutorsService = {
  createTutor,
  getTutorById,
  getAllTutors,
  getMyTutorProfile,
  updateTutorProfile
};

// src/modules/tutors/tutors.controller.ts
var createPost = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
    const result = await TutorsService.createTutor(req.body, req.user.id);
    res.status(201).json({ success: true, data: result, message: "Tutor profile created" });
  } catch (error) {
    next(error);
  }
};
var getAll = async (req, res) => {
  const { search, categoryId, minRating, maxPrice, page, limit } = req.query;
  const data = await TutorsService.getAllTutors({
    search,
    categoryId,
    minRating: minRating ? Number(minRating) : void 0,
    maxPrice: maxPrice ? Number(maxPrice) : void 0,
    page: page ? Number(page) : void 0,
    limit: limit ? Number(limit) : void 0
  });
  res.json({ success: true, ...data });
};
var getTutorById2 = async (req, res) => {
  const { id } = req.params;
  const data = await TutorsService.getTutorById(id);
  res.json({ success: true, data });
};
var getMyTutorProfile2 = async (req, res) => {
  try {
    const id = req.user?.id;
    if (!id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const data = await TutorsService.getMyTutorProfile(id);
    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(404).json({ success: false, message: "Tutor profile not found" });
  }
};
var updateTutorProfile2 = async (req, res) => {
  const id = req.user?.id;
  if (!id) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  const data = await TutorsService.updateTutorProfile(id, req.body);
  res.json({ success: true, message: "Tutor profile updated", data });
};
var TutorsController = {
  createPost,
  getTutorById: getTutorById2,
  getAll,
  getMyTutorProfile: getMyTutorProfile2,
  updateTutorProfile: updateTutorProfile2
};

// src/modules/tutors/tutors.route.ts
var router = express.Router();
router.get("/", TutorsController.getAll);
router.get(
  "/profile",
  authMiddleWare("TUTOR" /* TUTOR */),
  TutorsController.getMyTutorProfile
);
router.get("/:id", TutorsController.getTutorById);
router.post(
  "/",
  authMiddleWare("TUTOR" /* TUTOR */, "ADMIN" /* ADMIN */),
  TutorsController.createPost
);
router.patch(
  "/profile",
  authMiddleWare("TUTOR" /* TUTOR */),
  TutorsController.updateTutorProfile
);
var tutorsRouter = router;

// src/modules/Categories/category.route.ts
import { Router } from "express";

// src/modules/Categories/category.service.ts
var createCategory = async (name) => {
  return prisma.category.create({
    data: { name }
  });
};
var getAllCategories = async () => {
  return prisma.category.findMany({
    orderBy: { createdAt: "desc" }
  });
};
var CategoryService = { createCategory, getAllCategories };

// src/modules/Categories/category.controller.ts
var CategoryController = {
  create: async (req, res) => {
    const { name } = req.body;
    if (typeof name !== "string") {
      return res.status(400).json({
        success: false,
        message: "Category name must be a string"
      });
    }
    const trimmedName = name.trim();
    if (!trimmedName) {
      return res.status(400).json({
        success: false,
        message: "Category name is required"
      });
    }
    const data = await CategoryService.createCategory(trimmedName);
    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data
    });
  },
  getAll: async (_req, res) => {
    const data = await CategoryService.getAllCategories();
    return res.status(200).json({ success: true, data });
  }
};

// src/modules/Categories/category.route.ts
var router2 = Router();
router2.get("/", CategoryController.getAll);
router2.post("/", authMiddleWare("TUTOR" /* TUTOR */), CategoryController.create);
var CategoryRoutes = router2;

// src/modules/tutors/tutorCategory.route.ts
import { Router as Router2 } from "express";

// src/modules/tutors/tutorCategory.service.ts
var createTutorCategory = async (tutorProfileId, categoryId) => {
  return prisma.tutorCategory.create({
    data: {
      tutorProfileId,
      categoryId
    }
  });
};
var getAllTutorCategories = async (tutorProfileId) => {
  return prisma.tutorCategory.findMany({
    where: { tutorProfileId },
    include: {
      category: true
    }
  });
};
var updateCategory = (id, name) => prisma.category.update({ where: { id }, data: { name } });
var deleteTutorCategory = async (tutorProfileId, categoryId) => {
  return prisma.tutorCategory.delete({
    where: {
      tutorProfileId_categoryId: { tutorProfileId, categoryId }
    }
  });
};
var TutorCategoryService = {
  createTutorCategory,
  getAllTutorCategories,
  updateCategory,
  deleteTutorCategory
};

// src/modules/tutors/tutorCategory.controller.ts
var TutorCategoryController = {
  create: async (req, res) => {
    const { tutorProfileId, categoryId } = req.body;
    if (typeof tutorProfileId !== "string") {
      return res.status(400).json({
        success: false,
        message: "tutorProfileId must be a string"
      });
    }
    if (typeof categoryId !== "string") {
      return res.status(400).json({
        success: false,
        message: "categoryId must be a string"
      });
    }
    const data = await TutorCategoryService.createTutorCategory(
      tutorProfileId,
      categoryId
    );
    return res.status(201).json({
      success: true,
      message: "Category assigned to tutor",
      data
    });
  },
  getAll: async (req, res) => {
    const { tutorProfileId } = req.params;
    const data = await TutorCategoryService.getAllTutorCategories(
      tutorProfileId
    );
    res.status(200).json({
      success: true,
      data
    });
  },
  update: async (req, res) => {
    const data = await TutorCategoryService.updateCategory(
      req.params.id,
      req.body.name
    );
    res.json({ success: true, message: "Category updated", data });
  },
  deleteOne: async (req, res) => {
    const { tutorProfileId, categoryId } = req.params;
    if (typeof tutorProfileId !== "string" || typeof categoryId !== "string") {
      return res.status(400).json({
        success: false,
        message: "tutorProfileId and categoryId must be strings"
      });
    }
    try {
      const data = await TutorCategoryService.deleteTutorCategory(
        tutorProfileId,
        categoryId
      );
      return res.status(200).json({
        success: true,
        message: "Category removed from tutor successfully",
        data
      });
    } catch (err) {
      return res.status(404).json({
        success: false,
        message: "Tutor category link not found"
      });
    }
  }
};

// src/modules/tutors/tutorCategory.route.ts
var router3 = Router2();
router3.get(
  "/:tutorProfileId",
  TutorCategoryController.getAll
);
router3.post(
  "/",
  authMiddleWare("TUTOR" /* TUTOR */),
  TutorCategoryController.create
);
router3.patch("/:tutorProfileId", authMiddleWare("TUTOR" /* TUTOR */), TutorCategoryController.update);
router3.delete(
  "/:tutorProfileId/:categoryId",
  TutorCategoryController.deleteOne
);
var TutorCategoryRoutes = router3;

// src/modules/availability/availability.route.ts
import { Router as Router3 } from "express";

// src/modules/availability/availability.service.ts
var createAvailability = async (tutorProfileId, slots) => {
  const profile = await prisma.tutorProfile.findUnique({
    where: { id: tutorProfileId },
    select: { id: true }
  });
  if (!profile) throw new Error("Tutor profile not found");
  const data = slots.map((s) => ({
    tutorProfileId,
    startTime: new Date(s.startTime),
    endTime: new Date(s.endTime)
  }));
  await prisma.tutorAvailability.createMany({ data });
  return prisma.tutorAvailability.findMany({
    where: { tutorProfileId },
    orderBy: { startTime: "asc" }
  });
};
var getAllAvailability = async (tutorProfileId) => {
  return prisma.tutorAvailability.findMany({
    where: { tutorProfileId },
    orderBy: { startTime: "asc" }
  });
};
var updateAvailability = async (availabilityId, startTime, endTime) => {
  const slot = await prisma.tutorAvailability.findUnique({
    where: { id: availabilityId }
  });
  if (!slot) {
    throw new Error("Availability not found");
  }
  if (slot.isBooked) {
    throw new Error("Booked availability cannot be updated");
  }
  return prisma.tutorAvailability.update({
    where: { id: availabilityId },
    data: {
      startTime,
      endTime
    }
  });
};
var deleteAvailability = async (availabilityId) => {
  const slot = await prisma.tutorAvailability.findUnique({
    where: { id: availabilityId }
  });
  if (!slot) throw new Error("Availability not found");
  if (slot.isBooked) throw new Error("Booked slot cannot be deleted");
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
var AvailabilityController = {
  create: async (req, res) => {
    try {
      const { tutorProfileId, slots } = req.body;
      if (typeof tutorProfileId !== "string") {
        return res.status(400).json({
          success: false,
          message: "tutorProfileId must be a string"
        });
      }
      if (!Array.isArray(slots) || slots.length === 0) {
        return res.status(400).json({
          success: false,
          message: "slots must be a non-empty array"
        });
      }
      for (const slot of slots) {
        if (typeof slot.startTime !== "string" || typeof slot.endTime !== "string") {
          return res.status(400).json({
            success: false,
            message: "Each slot must contain startTime and endTime as strings"
          });
        }
        const start = new Date(slot.startTime);
        const end = new Date(slot.endTime);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid date format. Use ISO string (e.g. 2026-04-09T23:49:00Z)"
          });
        }
        if (end <= start) {
          return res.status(400).json({
            success: false,
            message: "endTime must be greater than startTime"
          });
        }
      }
      const data = await AvailabilityService.createAvailability(
        tutorProfileId,
        slots
      );
      return res.status(201).json({
        success: true,
        message: "Availability created successfully",
        data
      });
    } catch (error) {
      console.error("Error creating availability:", error);
      return res.status(400).json({
        success: false,
        message: error?.message || "Create failed. Check time and try again"
      });
    }
  },
  getAll: async (req, res) => {
    const { tutorProfileId } = req.params;
    if (typeof tutorProfileId !== "string") {
      return res.status(400).json({
        success: false,
        message: "tutorProfileId must be a string"
      });
    }
    const data = await AvailabilityService.getAllAvailability(tutorProfileId);
    return res.status(200).json({
      success: true,
      data
    });
  },
  update: async (req, res) => {
    const availabilityId = req.params.id;
    const { startTime, endTime } = req.body;
    if (typeof availabilityId !== "string") {
      return res.status(400).json({
        success: false,
        message: "availabilityId must be a string"
      });
    }
    if (typeof startTime !== "string" || typeof endTime !== "string") {
      return res.status(400).json({
        success: false,
        message: "startTime and endTime must be strings"
      });
    }
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Use ISO string"
      });
    }
    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: "endTime must be greater than startTime"
      });
    }
    const data = await AvailabilityService.updateAvailability(
      availabilityId,
      start,
      end
    );
    return res.status(200).json({
      success: true,
      message: "Availability updated successfully",
      data
    });
  },
  remove: async (req, res) => {
    const { id } = req.params;
    const data = await AvailabilityService.deleteAvailability(id);
    return res.status(200).json({
      success: true,
      message: "Availability deleted successfully",
      data
    });
  }
};

// src/modules/availability/availability.route.ts
var router4 = Router3();
router4.post("/availability", authMiddleWare("TUTOR" /* TUTOR */), AvailabilityController.create);
router4.get("/availability/:tutorProfileId", authMiddleWare("TUTOR" /* TUTOR */), AvailabilityController.getAll);
router4.patch("/tutor/availability/:id", authMiddleWare("TUTOR" /* TUTOR */), AvailabilityController.update);
router4.delete("/availability/:id", authMiddleWare("TUTOR" /* TUTOR */), AvailabilityController.remove);
var AvailabilityRoutes = router4;

// src/modules/bookings/booking.route.ts
import { Router as Router4 } from "express";

// src/modules/bookings/booking.service.ts
var createBooking = async (studentId, payload) => {
  const { tutorProfileId, tutorId, availabilityId, scheduledStart, scheduledEnd, price } = payload;
  const start = new Date(scheduledStart);
  const end = new Date(scheduledEnd);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Invalid date format for scheduledStart/scheduledEnd");
  }
  if (end <= start) {
    throw new Error("scheduledEnd must be greater than scheduledStart");
  }
  return prisma.$transaction(async (tx) => {
    if (availabilityId) {
      const slot = await tx.tutorAvailability.findUnique({ where: { id: availabilityId } });
      if (!slot) throw new Error("Availability not found");
      if (slot.isBooked) throw new Error("This availability slot is already booked");
      if (slot.tutorProfileId !== tutorProfileId) {
        throw new Error("Availability does not belong to this tutorProfile");
      }
      await tx.tutorAvailability.update({
        where: { id: availabilityId },
        data: { isBooked: true }
      });
      return tx.booking.create({
        data: {
          studentId,
          tutorId,
          tutorProfileId,
          availabilityId,
          scheduledStart: slot.startTime,
          scheduledEnd: slot.endTime,
          price,
          status: "CONFIRMED"
        }
      });
    }
    return tx.booking.create({
      data: {
        studentId,
        tutorId,
        tutorProfileId,
        scheduledStart: start,
        scheduledEnd: end,
        price,
        status: "CONFIRMED"
      }
    });
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
  if (!booking) throw new Error("Booking not found");
  if (role !== "ADMIN" && booking.studentId !== userId && booking.tutorId !== userId) {
    throw new Error("Not allowed");
  }
  return booking;
};
var cancelBooking = async (bookingId, userId, role, reason) => {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId }
    });
    if (!booking) throw new Error("Booking not found");
    if (role !== "ADMIN" && booking.studentId !== userId && booking.tutorId !== userId) {
      throw new Error("Not allowed");
    }
    if (booking.status === "CANCELLED") return booking;
    if (booking.availabilityId) {
      await tx.tutorAvailability.update({
        where: { id: booking.availabilityId },
        data: { isBooked: false }
      });
    }
    return tx.booking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELLED",
        cancelledById: userId,
        cancelReason: reason ?? null
      }
    });
  });
};
var completeBooking = async (bookingId, tutorId) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId }
  });
  if (!booking) throw new Error("Booking not found");
  if (booking.tutorId !== tutorId) throw new Error("Not allowed");
  if (booking.status !== "CONFIRMED") {
    throw new Error("Only CONFIRMED bookings can be completed");
  }
  return prisma.booking.update({
    where: { id: bookingId },
    data: { status: "COMPLETED" }
  });
};
var BookingService = {
  createBooking,
  getAllBookings,
  getBooking,
  cancelBooking,
  completeBooking
};

// src/modules/bookings/booking.controller.ts
var BookingController = {
  create: async (req, res) => {
    const { tutorProfileId, tutorId, availabilityId, scheduledStart, scheduledEnd, price } = req.body;
    if (typeof tutorProfileId !== "string" || typeof tutorId !== "string") {
      return res.status(400).json({
        success: false,
        message: "tutorProfileId and tutorId must be strings"
      });
    }
    if (availabilityId !== void 0 && typeof availabilityId !== "string") {
      return res.status(400).json({
        success: false,
        message: "availabilityId must be a string (if provided)"
      });
    }
    if (typeof scheduledStart !== "string" || typeof scheduledEnd !== "string") {
      return res.status(400).json({
        success: false,
        message: "scheduledStart and scheduledEnd must be strings"
      });
    }
    if (typeof price !== "number") {
      return res.status(400).json({
        success: false,
        message: "price must be a number"
      });
    }
    const data = await BookingService.createBooking(req.user.id, {
      tutorProfileId,
      tutorId,
      availabilityId,
      scheduledStart,
      scheduledEnd,
      price
    });
    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data
    });
  },
  getAll: async (req, res) => {
    const role = req.user?.role;
    const data = await BookingService.getAllBookings(req.user.id, role);
    return res.status(200).json({
      success: true,
      data
    });
  },
  get: async (req, res) => {
    const { id } = req.params;
    const role = req.user?.role;
    const data = await BookingService.getBooking(id, req.user.id, role);
    return res.status(200).json({
      success: true,
      data
    });
  },
  cancel: async (req, res) => {
    const { reason } = req.body;
    if (reason !== void 0 && typeof reason !== "string") {
      return res.status(400).json({
        success: false,
        message: "reason must be a string (if provided)"
      });
    }
    const { id } = req.params;
    const data = await BookingService.cancelBooking(
      req.params.id,
      req.user.id,
      req.user.role,
      reason
    );
    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      data
    });
  },
  complete: async (req, res) => {
    const data = await BookingService.completeBooking(req.params.id, req.user.id);
    return res.status(200).json({
      success: true,
      message: "Booking marked as completed",
      data
    });
  }
};

// src/modules/bookings/booking.route.ts
var router5 = Router4();
router5.post("/", authMiddleWare("TUTOR" /* TUTOR */, "STUDENT" /* STUDENT */, "ADMIN" /* ADMIN */), BookingController.create);
router5.get("/", authMiddleWare("TUTOR" /* TUTOR */, "STUDENT" /* STUDENT */), BookingController.getAll);
router5.get("/:id", authMiddleWare("TUTOR" /* TUTOR */, "STUDENT" /* STUDENT */), BookingController.get);
router5.patch(
  "/:id/cancel",
  authMiddleWare("TUTOR" /* TUTOR */),
  BookingController.cancel
);
router5.patch(
  "/:id/complete",
  authMiddleWare("TUTOR" /* TUTOR */),
  BookingController.complete
);
var BookingRoutes = router5;

// src/modules/reviews/review.route.ts
import { Router as Router5 } from "express";

// src/modules/reviews/review.service.ts
var createReview = async (studentId, payload) => {
  const { bookingId, rating, comment } = payload;
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId }
  });
  if (!booking) throw new Error("Booking not found");
  if (booking.studentId !== studentId) throw new Error("Not allowed");
  if (booking.status !== "COMPLETED") {
    throw new Error("You can review only after booking is COMPLETED");
  }
  const review = await prisma.review.create({
    data: {
      bookingId,
      studentId,
      tutorId: booking.tutorId,
      rating,
      comment: comment ?? null
    }
  });
  const stats = await prisma.review.aggregate({
    where: { tutorId: booking.tutorId },
    _avg: { rating: true },
    _count: { rating: true }
  });
  await prisma.tutorProfile.update({
    where: { userId: booking.tutorId },
    data: {
      avgRating: Number(stats._avg.rating ?? 0),
      totalReviews: stats._count.rating
    }
  });
  return review;
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
var ReviewController = {
  create: async (req, res) => {
    const { bookingId, rating, comment } = req.body;
    if (typeof bookingId !== "string") {
      return res.status(400).json({
        success: false,
        message: "bookingId must be a string"
      });
    }
    if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "rating must be an integer between 1 and 5"
      });
    }
    if (comment !== void 0 && typeof comment !== "string") {
      return res.status(400).json({
        success: false,
        message: "comment must be a string (if provided)"
      });
    }
    const data = await ReviewService.createReview(req.user.id, {
      bookingId,
      rating,
      comment
    });
    return res.status(201).json({
      success: true,
      message: "Review created successfully",
      data
    });
  },
  getAllByTutor: async (req, res) => {
    const { tutorId } = req.params;
    if (typeof tutorId !== "string") {
      return res.status(400).json({ success: false, message: "tutorId must be a string" });
    }
    const data = await ReviewService.getTutorReviews(tutorId);
    return res.status(200).json({ success: true, data });
  },
  //  student only
  getAllMine: async (req, res) => {
    const data = await ReviewService.getMyReviews(req.user.id);
    return res.status(200).json({ success: true, data });
  }
};

// src/modules/reviews/review.route.ts
var router6 = Router5();
router6.post("/", authMiddleWare("TUTOR" /* TUTOR */), ReviewController.create);
router6.get("/tutor/:tutorId", ReviewController.getAllByTutor);
router6.get("/me", authMiddleWare("TUTOR" /* TUTOR */), ReviewController.getAllMine);
var ReviewRoutes = router6;

// src/modules/users/user.route.ts
import { Router as Router6 } from "express";

// src/modules/users/user.service.ts
var getUser = (userId) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      image: true,
      phone: true
    }
  });
};
var getUserById = (id) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      image: true,
      phone: true,
      createdAt: true,
      updatedAt: true
    }
  });
};
var updateUser = (userId, payload) => {
  return prisma.user.update({
    where: { id: userId },
    data: payload,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      image: true,
      phone: true,
      updatedAt: true
    }
  });
};
var UserService = { getUser, updateUser, getUserById };

// src/modules/users/user.controller.ts
var UserController = {
  get: async (req, res) => {
    const data = await UserService.getUser(req.user.id);
    res.json({ success: true, data });
  },
  getById: async (req, res) => {
    const { id } = req.params;
    if (typeof id !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid user id"
      });
    }
    const data = await UserService.getUserById(id);
    if (!data) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    res.json({ success: true, data });
  },
  update: async (req, res) => {
    const data = await UserService.updateUser(req.user.id, req.body);
    res.json({ success: true, message: "User updated", data });
  }
};

// src/modules/users/user.route.ts
var router7 = Router6();
router7.get("/me", authMiddleWare("STUDENT" /* STUDENT */, "ADMIN" /* ADMIN */), UserController.get);
router7.get(
  "/:id",
  authMiddleWare("ADMIN" /* ADMIN */, "TUTOR" /* TUTOR */),
  UserController.getById
);
router7.patch("/me", authMiddleWare("STUDENT" /* STUDENT */, "ADMIN" /* ADMIN */), UserController.update);
var UserRoutes = router7;

// src/modules/admin/admin.route.ts
import { Router as Router7 } from "express";

// src/modules/admin/admin.service.ts
var getDashboardStats = async () => {
  const [totalUsers, totalTutors, totalStudents, totalBookings, totalCategories] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "TUTOR" } }),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.booking.count(),
    prisma.category.count()
  ]);
  const [confirmed, completed, cancelled] = await Promise.all([
    prisma.booking.count({ where: { status: "CONFIRMED" } }),
    prisma.booking.count({ where: { status: "COMPLETED" } }),
    prisma.booking.count({ where: { status: "CANCELLED" } })
  ]);
  return {
    totalUsers,
    totalTutors,
    totalStudents,
    totalBookings,
    totalCategories,
    bookingStatus: { confirmed, completed, cancelled }
  };
};
var getAllUsers = () => prisma.user.findMany({
  select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
  orderBy: { createdAt: "desc" }
});
var updateUser2 = (id, payload) => prisma.user.update({
  where: { id },
  data: payload,
  select: { id: true, name: true, email: true, role: true, status: true, updatedAt: true }
});
var getAllBookings2 = () => prisma.booking.findMany({
  include: {
    tutor: { select: { id: true, name: true, email: true } },
    student: { select: { id: true, name: true, email: true } },
    tutorProfile: true,
    review: true,
    availability: true
  },
  orderBy: { scheduledStart: "desc" }
});
var getAllCategories2 = () => prisma.category.findMany({ orderBy: { createdAt: "desc" } });
var createCategory2 = (name) => prisma.category.create({ data: { name } });
var updateCategory2 = (id, name) => prisma.category.update({
  where: { id },
  data: { name }
});
var deleteCategory = (id) => prisma.category.delete({ where: { id } });
var AdminService = {
  getDashboardStats,
  getAllUsers,
  updateUser: updateUser2,
  getAllBookings: getAllBookings2,
  getAllCategories: getAllCategories2,
  createCategory: createCategory2,
  updateCategory: updateCategory2,
  deleteCategory
};

// src/modules/admin/admin.controller.ts
var AdminController = {
  getDashboardStats: async (_req, res) => {
    const data = await AdminService.getDashboardStats();
    res.json({ success: true, data });
  },
  getAllUsers: async (_req, res) => {
    const data = await AdminService.getAllUsers();
    res.json({ success: true, data });
  },
  updateUserStatusOrRole: async (req, res) => {
    const { status, role } = req.body;
    if (status !== void 0 && status !== "ACTIVE" && status !== "BANNED") {
      return res.status(400).json({
        success: false,
        message: "status must be ACTIVE or BANNED"
      });
    }
    if (role !== void 0 && role !== "STUDENT" && role !== "TUTOR" && role !== "ADMIN") {
      return res.status(400).json({
        success: false,
        message: "role must be STUDENT, TUTOR or ADMIN"
      });
    }
    const data = await AdminService.updateUser(req.params.id, { status, role });
    res.json({
      success: true,
      message: "User updated",
      data
    });
  },
  getAllBookings: async (_req, res) => {
    const data = await AdminService.getAllBookings();
    res.json({ success: true, data });
  },
  getAllCategories: async (_req, res) => {
    const data = await AdminService.getAllCategories();
    res.json({ success: true, data });
  },
  createCategory: async (req, res) => {
    const { name } = req.body;
    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name must be a non-empty string"
      });
    }
    const data = await AdminService.createCategory(name.trim());
    res.status(201).json({ success: true, message: "Category created", data });
  },
  updateCategory: async (req, res) => {
    const { name } = req.body;
    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name must be a non-empty string"
      });
    }
    const data = await AdminService.updateCategory(req.params.id, name.trim());
    res.json({ success: true, message: "Category updated", data });
  },
  deleteCategory: async (req, res) => {
    const data = await AdminService.deleteCategory(req.params.id);
    res.json({ success: true, message: "Category deleted", data });
  }
};

// src/modules/admin/admin.route.ts
var router8 = Router7();
router8.get("/", authMiddleWare("ADMIN" /* ADMIN */), AdminController.getDashboardStats);
router8.get("/users", authMiddleWare("ADMIN" /* ADMIN */), AdminController.getAllUsers);
router8.get("/bookings", authMiddleWare("ADMIN" /* ADMIN */), AdminController.getAllBookings);
router8.get("/categories", authMiddleWare("ADMIN" /* ADMIN */), AdminController.getAllCategories);
router8.post("/categories", authMiddleWare("ADMIN" /* ADMIN */), AdminController.createCategory);
router8.patch("/users/:id", authMiddleWare("ADMIN" /* ADMIN */), AdminController.updateUserStatusOrRole);
router8.patch("/categories/:id", authMiddleWare("ADMIN" /* ADMIN */), AdminController.updateCategory);
router8.delete("/categories/:id", authMiddleWare("ADMIN" /* ADMIN */), AdminController.deleteCategory);
var AdminRoutes = router8;

// src/app.ts
var app = express2();
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
app.use(GlobalErrorHandeler_default);
var app_default = app;

// src/index.ts
var index_default = app_default;
export {
  index_default as default
};

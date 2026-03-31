# SkillBridge Server

A robust backend API for SkillBridge, a tutoring platform that connects students with experienced tutors. The server handles user authentication, tutor profiles, booking management, availability scheduling, and review systems.

## 🎯 Project Overview

SkillBridge Server is a Node.js/Express-based REST API built with modern technologies. It enables:

- **Student-Tutor Matchmaking**: Students can browse and book tutors based on categories and availability
- **Authentication**: Secure user authentication with email/password and Google OAuth integration
- **Booking System**: Manage tutoring sessions with scheduling and status tracking
- **Payment Processing**: Full Stripe integration supporting intent creation and webhooks in BDT
- **Assignment System**: Tutors create tasks, students upload PDF solutions (via Cloudinary), and tutors evaluate them
- **Automated Scheduling**: Cron jobs to automatically dispatch session reminders and Google Meet links 5 minutes prior to start times
- **Notification Engine**: System alerts, broadcasts, and transactional emails
- **Ratings & Reviews**: Students can rate and review their tutors
- **Admin Management**: Administrative controls for user management and moderation
- **Availability Management**: Tutors can set their availability slots
- **Category Management**: Organize tutors by expertise categories

## 🛠 Tech Stack

- **Runtime**: Node.js 20.x
- **Framework**: Express.js 5.x
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL (via Prisma ORM)
- **Authentication**: Better-Auth with OAuth support
- **Payments**: Stripe API
- **File Storage**: Cloudinary (via Multer)
- **Emails**: Nodemailer + EJS Templates
- **Task Scheduling**: Node-Cron
- **Deployment**: Vercel
- **Build Tool**: tsup

## 📋 Prerequisites

- Node.js 20.x or higher
- npm or yarn package manager
- PostgreSQL database
- Google OAuth credentials (for social login)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/alamin-87/SkillBridge-server.git
cd SkillBridge-server
```

### 2. Install Dependencies

```bash
npm install
```

This will also automatically run `prisma generate` to create Prisma client files.

### 3. Environment Setup

Create a `.env` file in the project root with the following variables:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/skillbridge

# Server Configuration
PORT=5000
NODE_ENV=development

# Client URL
APP_URL=http://localhost:3000
PROD_APP_URL=https://your-production-client.vercel.app
FRONTEND_URL=http://localhost:3000

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Better-Auth Configuration
BETTER_AUTH_SECRET=your_secret_key_here
BETTER_AUTH_URL=http://localhost:5000

# Email / SMTP Configuration
EMAIL_SENDER_SMTP_USER=your_smtp_user
EMAIL_SENDER_SMTP_PASS=your_smtp_pass
EMAIL_SENDER_SMTP_HOST=smtp.example.com
EMAIL_SENDER_SMTP_PORT=587
EMAIL_SENDER_SMTP_FROM=noreply@skillbridge.com

# Cloudinary Integration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Stripe Payments
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Admin Seeding
SUPER_ADMIN_EMAIL=admin@skillbridge.com
SUPER_ADMIN_PASSWORD=secure_admin_password
```

## 📂 Full Project Folder Structure

```
SkillBridge-server/
├── prisma/
│   ├── migrations/
│   └── schema/
│       ├── activityLog.prisma
│       ├── admin.prisma
│       ├── assignment.prisma
│       ├── assignmentSubmission.prisma
│       ├── auth.prisma
│       ├── booking.prisma
│       ├── category.prisma
│       ├── enums.prisma
│       ├── notification.prisma
│       ├── payment.prisma
│       ├── review.prisma
│       ├── schema.prisma
│       └── tutorProfile.prisma
├── src/
│   ├── config/
│   │   ├── cloudinary.config.ts
│   │   ├── env.ts
│   │   ├── multer.config.ts
│   │   └── stripe.config.ts
│   ├── errorHelpers/
│   │   ├── AppError.ts
│   │   ├── HandelPrismaError.ts
│   │   └── HandelZodError.ts
│   ├── interfaces/
│   │   ├── error.interface.ts
│   │   ├── index.d.ts
│   │   ├── query.interface.ts
│   │   └── requestUser.interface.ts
│   ├── lib/
│   │   ├── auth.ts
│   │   └── prisma.ts
│   ├── middleware/
│   │   ├── checkAuth.ts
│   │   ├── GlobalErrorHandeler.ts
│   │   ├── NotFound.ts
│   │   └── validateRequest.ts
│   ├── modules/
│   │   ├── admin/
│   │   │   ├── admin.controller.ts
│   │   │   ├── admin.route.ts
│   │   │   └── admin.service.ts
│   │   ├── assignment/
│   │   │   ├── assignment.controller.ts
│   │   │   ├── assignment.route.ts
│   │   │   └── assignment.service.ts
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.interface.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.validation.ts
│   │   ├── availability/
│   │   │   ├── availability.controller.ts
│   │   │   ├── availability.route.ts
│   │   │   └── availability.service.ts
│   │   ├── bookings/
│   │   │   ├── booking.controller.ts
│   │   │   ├── booking.route.ts
│   │   │   └── booking.service.ts
│   │   ├── Categories/
│   │   │   ├── category.controller.ts
│   │   │   ├── category.route.ts
│   │   │   └── category.service.ts
│   │   ├── notification/
│   │   │   ├── notification.controller.ts
│   │   │   ├── notification.route.ts
│   │   │   └── notification.service.ts
│   │   ├── payment/
│   │   │   ├── payment.controller.ts
│   │   │   ├── payment.route.ts
│   │   │   └── payment.service.ts
│   │   ├── reviews/
│   │   │   ├── review.controller.ts
│   │   │   ├── review.route.ts
│   │   │   └── review.service.ts
│   │   ├── scheduler/
│   │   │   └── scheduler.service.ts
│   │   ├── stats/
│   │   │   ├── stats.controller.ts
│   │   │   ├── stats.route.ts
│   │   │   └── stats.service.ts
│   │   ├── tutors/
│   │   │   ├── tutor.interface.ts
│   │   │   ├── tutorCategory.controller.ts
│   │   │   ├── tutorCategory.route.ts
│   │   │   ├── tutorCategory.service.ts
│   │   │   ├── tutorCategory.validation.ts
│   │   │   ├── tutorRequest.controller.ts
│   │   │   ├── tutorRequest.route.ts
│   │   │   ├── tutorRequest.service.ts
│   │   │   ├── tutorRequest.validation.ts
│   │   │   ├── tutors.controller.ts
│   │   │   ├── tutors.route.ts
│   │   │   └── tutors.service.ts
│   │   └── users/
│   │       ├── user.controller.ts
│   │       ├── user.interface.ts
│   │       ├── user.route.ts
│   │       ├── user.service.ts
│   │       └── user.validation.ts
│   ├── routers/
│   │   └── index.ts
│   ├── scripts/
│   │   └── seedAdmin.ts
│   ├── shared/
│   │   ├── catchAsync.ts
│   │   └── sendResponse.ts
│   ├── templates/
│   │   ├── assignment.ejs
│   │   ├── googleRedirect.ejs
│   │   ├── invoice.ejs
│   │   ├── otp.ejs
│   │   ├── sessionLink.ejs
│   │   ├── tutorApprovalEmail.ejs
│   │   └── tutorRejectionEmail.ejs
│   ├── types/
│   │   └── user/
│   │       └── userType.ts
│   ├── utils/
│   │   ├── deleteUploadedFilesFromGlobalErrorHandler.ts
│   │   ├── email.ts
│   │   └── QueryBuilder.ts
│   ├── app.ts
│   ├── index.ts
│   ├── server.ts
│   └── test-verification.ts
├── package.json
├── package-lock.json
├── tsconfig.json
└── .env
```

## 📦 Detailed Folder Descriptions

```
src/
├── app.ts                          # Express app configuration
├── index.ts                        # Entry point
├── server.ts                       # Server startup logic
├── config/                         # Env, Cloudinary, Multer, Stripe configs
├── errorHelpers/                   # custom AppError, Zod/Prisma Handlers
├── lib/
│   ├── auth.ts                     # Better-Auth configuration
│   └── prisma.ts                   # Prisma client setup
├── middleware/
│   ├── checkAuth.ts                # Authentication & Role checking
│   ├── GlobalErrorHandeler.ts      # Global error handling
│   └── NotFound.ts                 # 404 handler
├── templates/                      # EJS transactional email templates
└── modules/
    ├── admin/                      # High-level moderation & platform stats
    ├── assignment/                 # Assignment Creation, Submissions & Evaluation
    ├── auth/                       # Better-Auth integration and overrides
    ├── availability/               # Scheduling module for Tutor Slots
    ├── bookings/                   # Session matchmaking and lifecycles
    ├── Categories/                 # Expertise taxonomies
    ├── notification/               # Standardized alerts & broadcasting
    ├── payment/                    # Stripe intents and webhook synchronization
    ├── reviews/                    # Tutor rating engine
    ├── scheduler/                  # node-cron tasks (Session Reminders)
    ├── stats/                      # Aggregated analytics logic
    ├── tutors/                     # Tutor management, validations
    └── users/                      # Standard User CRUD operations

prisma/
├── schema/
│   ├── schema.prisma               # Main Prisma file aggregating sub-schemas
│   ├── activityLog.prisma          # Track activity actions
│   ├── admin.prisma                # Admin-specific constructs
│   ├── assignment.prisma           # Assignments & Submission schemas
│   ├── auth.prisma                 # Authentication models
│   ├── booking.prisma              # Booking models
│   ├── category.prisma             # Category models
│   ├── enums.prisma                # Shared enum types
│   ├── notification.prisma         # System alerts
│   ├── payment.prisma              # Stripe payment mappings
│   ├── review.prisma               # Review models
│   └── tutorProfile.prisma         # Tutor models
└── migrations/                     # Database migrations
```

## 🗄️ Database Schema

### Core Models

- **User**: Core user model with role-based access (STUDENT, TUTOR, ADMIN)
- **Session**: User session management
- **Account**: OAuth and credential storage
- **TutorProfile**: Extended tutor information
- **Booking**: Tutoring session bookings
- **TutorAvailability**: Tutor availability slots
- **Category**: Skill categories
- **TutorCategory**: Many-to-many relationship between tutors and categories
- **Review**: Student reviews and ratings for tutors
- **Verification**: Email/identity verification
- **Payment**: Financial transaction audits mapping bookings to Stripe IDs
- **Assignment**: Orchestrating task handouts
- **AssignmentSubmission**: Orchestrating student graded returns
- **Notification**: User-specific or broadcasted alert logs

### User Roles

- **STUDENT**: Can book tutors and leave reviews
- **TUTOR**: Can set availability and receive bookings
- **ADMIN**: Full system access and moderation

### User Status

- **ACTIVE**: Normal user
- **BANNED**: Restricted access

## 🔧 Development

### Run Development Server

```bash
npm run dev
```

The server will start on `http://localhost:5000` with hot-reload enabled.

### Build Production

```bash
npm run build
```

This creates a compiled version in the `api/` directory optimized for Node.js 20.

### Seed Admin User

```bash
npm run seed:admin
```

Creates an initial admin user in the database for testing.

## 📡 API Endpoints

### Authentication

- `POST /api/auth/*splat` - Better-Auth authentication endpoints (signup, signin, etc.)

### Users

- `GET /api/user/:id` - Get user profile
- `PUT /api/user/:id` - Update user profile
- `DELETE /api/user/:id` - Delete user account

### Tutors

- `GET /api/tutor` - List all tutors
- `GET /api/tutor/:id` - Get tutor profile
- `POST /api/tutor` - Create tutor profile
- `PUT /api/tutor/:id` - Update tutor profile
- `DELETE /api/tutor/:id` - Delete tutor profile

### Bookings

- `GET /api/bookings` - List bookings
- `GET /api/bookings/:id` - Get booking details
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking

### Availability

- `GET /api/availability` - List availability slots
- `POST /api/availability` - Create availability
- `PUT /api/availability/:id` - Update availability
- `DELETE /api/availability/:id` - Delete availability

### Categories

- `GET /api/categories` - List all categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Tutor Categories

- `GET /api/tutorCategories` - List tutor-category mappings
- `POST /api/tutorCategories` - Assign category to tutor
- `DELETE /api/tutorCategories/:id` - Remove category from tutor

### Reviews

- `GET /api/reviews` - List reviews
- `GET /api/reviews/:id` - Get review
- `POST /api/reviews` - Create review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

### Admin

- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/:id/status` - Update user status
- `DELETE /api/admin/users/:id` - Delete user
- Additional admin operations for system management

### Payments

- `POST /api/payments/create-payment-intent` - Provision Stripe interactions payload
- `POST /api/payments/webhook` - Stripe webhook event listener (Bypasses express JSON parsing)
- `POST /api/payments/sync` - Fallback intent syncing from Stripe APIs

### Assignments

- `POST /api/assignments` - Tutor task creations
- `POST /api/assignments/:id/submit` - Student assignment submission

### Notifications

- `GET /api/notifications` - Retrieve alerts
- `PATCH /api/notifications/:id/read` - Mark alert as read

### Stats

- `GET /api/stats/overview` - Fetch platform usage statistics

## 🔐 Authentication & CORS

The application uses:

- **CORS**: Configured to allow requests from specified origins
  - `http://localhost:3000` (development)
  - Environment variable `APP_URL`
  - All Vercel preview and production domains
  
- **Better-Auth**: Built-in authentication system with:
  - Email/password authentication
  - Google OAuth integration
  - Session management
  - Automatic token refresh

## 📝 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `APP_URL` | Client application URL | `https://app.example.com` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | `xxxxx` |
| `STRIPE_SECRET_KEY` | Stripe Payments | `sk_test_...` |
| `CLOUDINARY_CLOUD_NAME` | Media Hosting | `mycloud` |
| `EMAIL_SENDER_SMTP_HOST` | Transactional Mails | `smtp.example.com` |

## 🔄 Database Migrations

### Create Migration

```bash
npx prisma migrate dev --name your_migration_name
```

### Apply Migrations

```bash
npx prisma migrate deploy
```

### View Database UI

```bash
npx prisma studio
```

Opens an interactive database UI at `http://localhost:5555`

## 🧪 Testing & Validation

- Use Prisma Studio for database inspection
- Test API endpoints with Postman or Thunder Client
- Verify authentication flow with the frontend client

## 🚢 Deployment

### Deploy to Vercel

```bash
npm run build
vercel deploy
```

Or use production deployment:

```bash
vercel --prod
```

The application is configured to deploy as a Vercel serverless function.

### Production Checklist

- [ ] Set all environment variables in Vercel dashboard
- [ ] Configure PostgreSQL connection string
- [ ] Set up Google OAuth credentials from Google Cloud Console
- [ ] Enable HTTPS and update CORS origins
- [ ] Configure database backups
- [ ] Set up monitoring and error tracking
- [ ] Review security settings

## 📊 Monitoring & Logging

- Server logs connection status
- Error messages include request details
- Better-Auth logs authentication events
- database connection errors are caught and reported

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add your feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Submit a pull request

### Code Standards

- Use TypeScript for type safety
- Follow Express.js best practices
- Use Prisma for database operations
- Implement proper error handling
- Add meaningful commit messages

## 📄 License

ISC

## 📞 Support & Questions

For issues and questions:
- Check existing GitHub issues
- Create a new issue with detailed description
- Include error logs and environment information

## 🔗 Related Repositories

- [SkillBridge Client](https://github.com/alamin-87/SkillBridge-client)

## 🗂️ Important Files

- `package.json` - Project dependencies and scripts
- `prisma/schema/schema.prisma` - Main Prisma configuration
- `src/app.ts` - Express app setup
- `.env` - Environment variables (not committed)
- `tsconfig.json` - TypeScript configuration

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Prisma ORM Documentation](https://www.prisma.io/docs/)
- [Better-Auth Documentation](https://www.better-auth.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Last Updated**: March 31, 2026  
**Maintainer**: alamin-87  
**Repository**: https://github.com/alamin-87/SkillBridge-server

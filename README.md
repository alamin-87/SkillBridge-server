<p align="center">
  <h1 align="center">⚙️ SkillBridge — Server</h1>
  <p align="center">
    A robust REST API backend for the SkillBridge tutoring marketplace, built with <strong>Express.js 5</strong>, <strong>TypeScript</strong>, and <strong>Prisma ORM</strong>.
    <br />
    Authentication · Bookings · Payments · Assignments · Notifications · Admin
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-20.x-339933?logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-Prisma-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Stripe-BDT-635BFF?logo=stripe&logoColor=white" alt="Stripe" />
  <img src="https://img.shields.io/badge/Vercel-Deployed-000?logo=vercel" alt="Vercel" />
</p>

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Recent Updates](#-recent-updates)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Setup](#-environment-setup)
- [Full Project Folder Structure](#-full-project-folder-structure)
- [Detailed Folder Descriptions](#-detailed-folder-descriptions)
- [Database Schema](#-database-schema)
- [Development](#-development)
- [API Endpoints](#-api-endpoints)
- [Authentication & CORS](#-authentication--cors)
- [Environment Variables Reference](#-environment-variables-reference)
- [Database Migrations](#-database-migrations)
- [Testing & Validation](#-testing--validation)
- [Deployment](#-deployment)
- [Monitoring & Logging](#-monitoring--logging)
- [Contributing](#-contributing)
- [License](#-license)
- [Support & Questions](#-support--questions)
- [Related Repositories](#-related-repositories)
- [Additional Resources](#-additional-resources)

---

## 🎯 Project Overview

SkillBridge Server is a **Node.js/Express-based REST API** that powers the full-featured SkillBridge tutoring marketplace. It enables:

| Capability | Description |
|-----------|-------------|
| **Student-Tutor Matchmaking** | Students can browse and book tutors based on categories and availability |
| **Authentication** | Secure user authentication with email/password and Google OAuth integration |
| **Booking System** | Manage tutoring sessions with scheduling and status tracking |
| **Payment Processing** | Full Stripe integration supporting intent creation and webhooks in BDT |
| **Assignment System** | Tutors create tasks, students upload PDF solutions (via Cloudinary), and tutors evaluate them |
| **Automated Scheduling** | Cron jobs to automatically dispatch session reminders and Google Meet links 5 minutes prior to start times |
| **Notification Engine** | System alerts, broadcasts, and transactional emails |
| **Ratings & Reviews** | Students can rate and review their tutors |
| **Admin Management** | Administrative controls for user management and moderation |
| **Availability Management** | Tutors can set their availability slots |
| **Category Management** | Organize tutors by expertise categories |

---

## 🆕 Recent Updates

| Feature | Description |
|---------|-------------|
| **Universal Cloudinary PDF Uploads** | Integrated robust native PDF uploading with seamless auto-detection via `multer` memory storage for assignment workloads. |
| **Tutor Assignment Deletion** | Implemented secure, authorized `DELETE` endpoints preventing unauthorized resource modification. |
| **Automated Email Notifications** | Hooked EJS `assignment.ejs` transactional templates into the assignment orchestration lifecycle. |
| **Improved Global Authentication** | Overhauled UI session parsing by offloading cookie handling from the server back to client-provider checks, ensuring peak runtime stability. |
| **Optimized Platform Stability** | Fully deprecated and removed the legacy Socket/Messaging feature module and associated models to prevent build errors and memory leaks. |
| **Redesigned Tutor Application UX (Client)** | Complete frontend overhaul of the "Become a Tutor" application form with theme-aware design (light/dark), split-panel layout, step indicators, category picker cards, and additional fields (institution, location, languages) for a professional, accessible applicant experience. |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 20.x |
| Framework | Express.js 5.x |
| Language | TypeScript 5.x |
| Database | PostgreSQL (via Prisma ORM) |
| Authentication | Better-Auth with OAuth support |
| Payments | Stripe API |
| File Storage | Cloudinary (via Multer) |
| Emails | Nodemailer + EJS Templates |
| Task Scheduling | Node-Cron |
| Deployment | Vercel |
| Build Tool | tsup |

---

## 📦 Prerequisites

- **Node.js** 20.x or higher
- **npm** or yarn package manager
- **PostgreSQL** database
- **Google OAuth** credentials (for social login)

---

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

> This will also automatically run `prisma generate` to create Prisma client files.

### 3. Seed Admin User

```bash
npm run seed:admin
```

> Creates an initial admin user in the database for testing.

---

## 🔐 Environment Setup

Create a `.env` file in the project root with the following variables (**do NOT commit it**):

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

---

## 📂 Full Project Folder Structure

<details>
<summary>Click to expand full tree</summary>

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

</details>

---

## 📖 Detailed Folder Descriptions

### `src/` — Application Source

| Path | Purpose |
|------|---------|
| `app.ts` | Express app configuration |
| `index.ts` | Entry point |
| `server.ts` | Server startup logic |
| `config/` | Env, Cloudinary, Multer, Stripe configs |
| `errorHelpers/` | Custom `AppError`, Zod/Prisma error handlers |
| `lib/auth.ts` | Better-Auth configuration |
| `lib/prisma.ts` | Prisma client setup |
| `middleware/checkAuth.ts` | Authentication & role checking |
| `middleware/GlobalErrorHandeler.ts` | Global error handling |
| `middleware/NotFound.ts` | 404 handler |
| `templates/` | EJS transactional email templates |

### `src/modules/` — Feature Modules

| Module | Responsibility |
|--------|---------------|
| `admin/` | High-level moderation & platform stats |
| `assignment/` | Assignment creation, submissions & evaluation |
| `auth/` | Better-Auth integration and overrides |
| `availability/` | Scheduling module for tutor slots |
| `bookings/` | Session matchmaking and lifecycles |
| `Categories/` | Expertise taxonomies |
| `notification/` | Standardized alerts & broadcasting |
| `payment/` | Stripe intents and webhook synchronization |
| `reviews/` | Tutor rating engine |
| `scheduler/` | Node-cron tasks (session reminders) |
| `stats/` | Aggregated analytics logic |
| `tutors/` | Tutor management, validations, tutor requests |
| `users/` | Standard user CRUD operations |

### `prisma/schema/` — Database Schemas

| File | Purpose |
|------|---------|
| `schema.prisma` | Main Prisma file aggregating sub-schemas |
| `activityLog.prisma` | Track activity actions |
| `admin.prisma` | Admin-specific constructs |
| `assignment.prisma` | Assignments & submission schemas |
| `auth.prisma` | Authentication models |
| `booking.prisma` | Booking models |
| `category.prisma` | Category models |
| `enums.prisma` | Shared enum types |
| `notification.prisma` | System alerts |
| `payment.prisma` | Stripe payment mappings |
| `review.prisma` | Review models |
| `tutorProfile.prisma` | Tutor models |

---

## 🗄️ Database Schema

### Core Models

| Model | Description |
|-------|-------------|
| **User** | Core user model with role-based access (STUDENT, TUTOR, ADMIN) |
| **Session** | User session management |
| **Account** | OAuth and credential storage |
| **TutorProfile** | Extended tutor information |
| **Booking** | Tutoring session bookings |
| **TutorAvailability** | Tutor availability slots |
| **Category** | Skill categories |
| **TutorCategory** | Many-to-many relationship between tutors and categories |
| **Review** | Student reviews and ratings for tutors |
| **Verification** | Email/identity verification |
| **Payment** | Financial transaction audits mapping bookings to Stripe IDs |
| **Assignment** | Orchestrating task handouts |
| **AssignmentSubmission** | Orchestrating student graded returns |
| **Notification** | User-specific or broadcasted alert logs |

### User Roles

| Role | Permissions |
|------|------------|
| `STUDENT` | Can book tutors and leave reviews |
| `TUTOR` | Can set availability and receive bookings |
| `ADMIN` | Full system access and moderation |

### User Status

| Status | Description |
|--------|-------------|
| `ACTIVE` | Normal user |
| `BANNED` | Restricted access |

---

## 🔧 Development

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot-reload on `http://localhost:5000` |
| `npm run build` | Build for production (outputs to `api/` directory, optimized for Node.js 20) |
| `npm run seed:admin` | Create initial admin user in the database for testing |

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/*splat` | Better-Auth authentication endpoints (signup, signin, etc.) |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/user/:id` | Get user profile |
| `PUT` | `/api/user/:id` | Update user profile |
| `DELETE` | `/api/user/:id` | Delete user account |

### Tutors

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tutor` | List all tutors |
| `GET` | `/api/tutor/:id` | Get tutor profile |
| `POST` | `/api/tutor` | Create tutor profile |
| `PUT` | `/api/tutor/:id` | Update tutor profile |
| `DELETE` | `/api/tutor/:id` | Delete tutor profile |

### Bookings

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/bookings` | List bookings |
| `GET` | `/api/bookings/:id` | Get booking details |
| `POST` | `/api/bookings` | Create booking |
| `PUT` | `/api/bookings/:id` | Update booking |
| `DELETE` | `/api/bookings/:id` | Cancel booking |

### Availability

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/availability` | List availability slots |
| `POST` | `/api/availability` | Create availability |
| `PUT` | `/api/availability/:id` | Update availability |
| `DELETE` | `/api/availability/:id` | Delete availability |

### Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/categories` | List all categories |
| `POST` | `/api/categories` | Create category |
| `PUT` | `/api/categories/:id` | Update category |
| `DELETE` | `/api/categories/:id` | Delete category |

### Tutor Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tutorCategories` | List tutor-category mappings |
| `POST` | `/api/tutorCategories` | Assign category to tutor |
| `DELETE` | `/api/tutorCategories/:id` | Remove category from tutor |

### Reviews

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/reviews` | List reviews |
| `GET` | `/api/reviews/:id` | Get review |
| `POST` | `/api/reviews` | Create review |
| `PUT` | `/api/reviews/:id` | Update review |
| `DELETE` | `/api/reviews/:id` | Delete review |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/users` | List all users |
| `PUT` | `/api/admin/users/:id/status` | Update user status |
| `DELETE` | `/api/admin/users/:id` | Delete user |
| — | — | Additional admin operations for system management |

### Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/payments/create-payment-intent` | Provision Stripe interactions payload |
| `POST` | `/api/payments/webhook` | Stripe webhook event listener (bypasses Express JSON parsing) |
| `POST` | `/api/payments/sync` | Fallback intent syncing from Stripe APIs |

### Assignments

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/assignments` | Tutor task creation |
| `POST` | `/api/assignments/:id/submit` | Student assignment submission |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/notifications` | Retrieve alerts |
| `PATCH` | `/api/notifications/:id/read` | Mark alert as read |

### Stats

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/stats/overview` | Fetch platform usage statistics |

---

## 🔑 Authentication & CORS

### CORS Configuration

Configured to allow requests from:
- `http://localhost:3000` (development)
- Environment variable `APP_URL`
- All Vercel preview and production domains

### Better-Auth

| Feature | Description |
|---------|-------------|
| Email/password authentication | Standard credential-based signup and login |
| Google OAuth integration | Social sign-in via Google Cloud Console credentials |
| Session management | Server-side session tracking with automatic expiry |
| Automatic token refresh | Seamless session extension without re-authentication |

---

## 📝 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `APP_URL` | Client application URL | `https://app.example.com` |
| `PROD_APP_URL` | Production client URL | `https://your-app.vercel.app` |
| `FRONTEND_URL` | Frontend URL for redirects | `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | `xxxxx` |
| `BETTER_AUTH_SECRET` | Better-Auth encryption secret | `your_secret_key_here` |
| `BETTER_AUTH_URL` | Better-Auth server URL | `http://localhost:5000` |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `whsec_...` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `mycloud` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `your_api_key` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `your_api_secret` |
| `EMAIL_SENDER_SMTP_USER` | SMTP email user | `your_smtp_user` |
| `EMAIL_SENDER_SMTP_PASS` | SMTP email password | `your_smtp_pass` |
| `EMAIL_SENDER_SMTP_HOST` | SMTP host | `smtp.example.com` |
| `EMAIL_SENDER_SMTP_PORT` | SMTP port | `587` |
| `EMAIL_SENDER_SMTP_FROM` | Sender email address | `noreply@skillbridge.com` |
| `SUPER_ADMIN_EMAIL` | Admin seed email | `admin@skillbridge.com` |
| `SUPER_ADMIN_PASSWORD` | Admin seed password | `secure_admin_password` |

---

## 🔄 Database Migrations

| Command | Description |
|---------|-------------|
| `npx prisma migrate dev --name <name>` | Create a new migration |
| `npx prisma migrate deploy` | Apply pending migrations |
| `npx prisma studio` | Open interactive database UI at `http://localhost:5555` |

---

## 🧪 Testing & Validation

- Use **Prisma Studio** for database inspection
- Test API endpoints with **Postman** or **Thunder Client**
- Verify authentication flow with the frontend client

---

## 🚢 Deployment

### Deploy to Vercel

```bash
# Standard deployment
npm run build
vercel deploy

# Production deployment
vercel --prod
```

> The application is configured to deploy as a Vercel serverless function.

### Production Checklist

- [ ] Set all environment variables in Vercel dashboard
- [ ] Configure PostgreSQL connection string
- [ ] Set up Google OAuth credentials from Google Cloud Console
- [ ] Enable HTTPS and update CORS origins
- [ ] Configure database backups
- [ ] Set up monitoring and error tracking
- [ ] Review security settings

---

## 📊 Monitoring & Logging

- Server logs connection status
- Error messages include request details
- Better-Auth logs authentication events
- Database connection errors are caught and reported

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add your feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Submit a pull request

### Code Standards

- Use **TypeScript** for type safety
- Follow **Express.js** best practices
- Use **Prisma** for database operations
- Implement proper error handling
- Add meaningful commit messages

---

## 📄 License

ISC

---

## 📞 Support & Questions

For issues and questions:
- Check existing GitHub issues
- Create a new issue with detailed description
- Include error logs and environment information

---

## 🔗 Related Repositories

- [SkillBridge Client](https://github.com/alamin-87/SkillBridge-client)

---

## 🗂️ Important Files

| File | Purpose |
|------|---------|
| `package.json` | Project dependencies and scripts |
| `prisma/schema/schema.prisma` | Main Prisma configuration |
| `src/app.ts` | Express app setup |
| `.env` | Environment variables (not committed) |
| `tsconfig.json` | TypeScript configuration |

---

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Prisma ORM Documentation](https://www.prisma.io/docs/)
- [Better-Auth Documentation](https://www.better-auth.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

<p align="center">
  <strong>Last Updated:</strong> April 1, 2026<br />
  <strong>Maintainer:</strong> alamin-87<br />
  <strong>Repository:</strong> <a href="https://github.com/alamin-87/SkillBridge-server">github.com/alamin-87/SkillBridge-server</a>
</p>
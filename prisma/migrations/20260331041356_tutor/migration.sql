-- CreateEnum
CREATE TYPE "AvailabilityType" AS ENUM ('SINGLE', 'PACKAGE_30D');

-- AlterTable
ALTER TABLE "TutorAvailability" ADD COLUMN     "type" "AvailabilityType" NOT NULL DEFAULT 'SINGLE';

-- AlterTable
ALTER TABLE "TutorProfile" ADD COLUMN     "institution" TEXT;

-- AlterTable
ALTER TABLE "TutorRequest" ADD COLUMN     "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "institution" TEXT;

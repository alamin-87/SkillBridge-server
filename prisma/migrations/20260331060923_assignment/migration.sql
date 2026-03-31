-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "files" JSONB;

-- AlterTable
ALTER TABLE "AssignmentSubmission" ADD COLUMN     "evaluationReport" JSONB;

/*
  Warnings:

  - Made the column `bio` on table `TutorProfile` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "TutorProfile" ALTER COLUMN "bio" SET NOT NULL;

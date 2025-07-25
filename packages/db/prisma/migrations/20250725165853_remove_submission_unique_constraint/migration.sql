/*
  Warnings:

  - The `passed` column on the `submissionTestCaseResults` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropIndex
DROP INDEX "submissionTestCaseResults_submissionId_key";

-- AlterTable
ALTER TABLE "submissionTestCaseResults" DROP COLUMN "passed",
ADD COLUMN     "passed" INTEGER NOT NULL DEFAULT -1;

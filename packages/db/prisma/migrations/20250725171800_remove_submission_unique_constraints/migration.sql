-- AlterTable
ALTER TABLE "submissionTestCaseResults" ALTER COLUMN "passed" DROP DEFAULT,
ALTER COLUMN "passed" SET DATA TYPE TEXT;

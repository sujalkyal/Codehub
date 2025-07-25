/*
  Warnings:

  - You are about to drop the `submissionTestCaseResultss` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "submissionTestCaseResultss" DROP CONSTRAINT "submissionTestCaseResultss_submissionId_fkey";

-- DropTable
DROP TABLE "submissionTestCaseResultss";

-- CreateTable
CREATE TABLE "submissionTestCaseResults" (
    "id" SERIAL NOT NULL,
    "submissionId" INTEGER NOT NULL,
    "passed" INTEGER NOT NULL,

    CONSTRAINT "submissionTestCaseResults_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "submissionTestCaseResults" ADD CONSTRAINT "submissionTestCaseResults_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

/*
  Warnings:

  - You are about to drop the `submissionTestCaseResults` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "submissionTestCaseResults" DROP CONSTRAINT "submissionTestCaseResults_submissionId_fkey";

-- DropTable
DROP TABLE "submissionTestCaseResults";

-- CreateTable
CREATE TABLE "submissionTestCaseResultss" (
    "id" SERIAL NOT NULL,
    "submissionId" INTEGER NOT NULL,
    "passed" INTEGER NOT NULL,

    CONSTRAINT "submissionTestCaseResultss_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "submissionTestCaseResultss" ADD CONSTRAINT "submissionTestCaseResultss_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

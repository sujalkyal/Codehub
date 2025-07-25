/*
  Warnings:

  - You are about to drop the column `testCaseId` on the `submissionTestCaseResults` table. All the data in the column will be lost.
  - You are about to drop the `TestCase` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[title]` on the table `Problem` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[submissionId]` on the table `submissionTestCaseResults` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "submissionTestCaseResults" DROP CONSTRAINT "submissionTestCaseResults_testCaseId_fkey";

-- DropForeignKey
ALTER TABLE "TestCase" DROP CONSTRAINT "TestCase_problemId_fkey";

-- DropIndex
DROP INDEX "submissionTestCaseResults_submissionId_testCaseId_key";

-- AlterTable
ALTER TABLE "submissionTestCaseResults" DROP COLUMN "testCaseId";

-- DropTable
DROP TABLE "TestCase";

-- CreateTable
CREATE TABLE "ProblemBoilerplate" (
    "id" SERIAL NOT NULL,
    "problemId" INTEGER NOT NULL,
    "languageId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "fullcode" TEXT,

    CONSTRAINT "ProblemBoilerplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProblemBoilerplate_problemId_languageId_key" ON "ProblemBoilerplate"("problemId", "languageId");

-- CreateIndex
CREATE UNIQUE INDEX "Problem_title_key" ON "Problem"("title");

-- CreateIndex
CREATE UNIQUE INDEX "submissionTestCaseResults_submissionId_key" ON "submissionTestCaseResults"("submissionId");

-- AddForeignKey
ALTER TABLE "ProblemBoilerplate" ADD CONSTRAINT "ProblemBoilerplate_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemBoilerplate" ADD CONSTRAINT "ProblemBoilerplate_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

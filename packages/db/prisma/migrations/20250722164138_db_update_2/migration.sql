/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Language` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `structure` to the `Problem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Problem" ADD COLUMN     "structure" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Language_name_key" ON "Language"("name");

/*
  Warnings:

  - You are about to drop the column `url` on the `SubmissionFile` table. All the data in the column will be lost.
  - Added the required column `storageKey` to the `SubmissionFile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SubmissionFile" DROP COLUMN "url",
ADD COLUMN     "storageKey" TEXT NOT NULL;

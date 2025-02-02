/*
  Warnings:

  - You are about to drop the column `addedById` on the `Stream` table. All the data in the column will be lost.
  - Added the required column `addedBy` to the `Stream` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Stream" DROP CONSTRAINT "Stream_addedById_fkey";

-- AlterTable
ALTER TABLE "Stream" DROP COLUMN "addedById",
ADD COLUMN     "addedBy" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Stream" ADD CONSTRAINT "Stream_addedBy_fkey" FOREIGN KEY ("addedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

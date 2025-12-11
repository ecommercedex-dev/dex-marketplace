/*
  Warnings:

  - You are about to drop the column `fullName` on the `buyer` table. All the data in the column will be lost.
  - Added the required column `name` to the `buyer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "buyer" DROP COLUMN "fullName",
ADD COLUMN     "name" TEXT NOT NULL;

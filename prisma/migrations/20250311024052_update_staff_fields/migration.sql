/*
  Warnings:

  - You are about to drop the column `name` on the `Staff` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `Staff` table. All the data in the column will be lost.
  - Added the required column `address` to the `Staff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dateOfBirth` to the `Staff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `Staff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `Staff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `payRate` to the `Staff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phoneNumber` to the `Staff` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Staff" DROP COLUMN "name",
DROP COLUMN "role",
ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isDriver" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "payRate" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "phoneNumber" TEXT NOT NULL,
ALTER COLUMN "password" DROP NOT NULL;

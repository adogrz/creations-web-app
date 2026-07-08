/*
  Warnings:

  - You are about to drop the column `priceMax` on the `costumes` table. All the data in the column will be lost.
  - You are about to drop the column `priceMin` on the `costumes` table. All the data in the column will be lost.
  - You are about to drop the column `shortDescription` on the `costumes` table. All the data in the column will be lost.
  - Added the required column `price` to the `costumes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "costumes" DROP COLUMN "priceMax",
DROP COLUMN "priceMin",
DROP COLUMN "shortDescription",
ADD COLUMN     "price" INTEGER NOT NULL,
ALTER COLUMN "description" DROP NOT NULL;

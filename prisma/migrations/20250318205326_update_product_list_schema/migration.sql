/*
  Warnings:

  - You are about to drop the column `addon` on the `ProductList` table. All the data in the column will be lost.
  - You are about to drop the column `list_of_ing` on the `ProductList` table. All the data in the column will be lost.
  - You are about to drop the column `meat1` on the `ProductList` table. All the data in the column will be lost.
  - You are about to drop the column `meat2` on the `ProductList` table. All the data in the column will be lost.
  - You are about to drop the column `option1` on the `ProductList` table. All the data in the column will be lost.
  - You are about to drop the column `option2` on the `ProductList` table. All the data in the column will be lost.
  - You are about to drop the column `serveware` on the `ProductList` table. All the data in the column will be lost.
  - You are about to drop the column `sku_search` on the `ProductList` table. All the data in the column will be lost.
  - You are about to drop the column `timer_a` on the `ProductList` table. All the data in the column will be lost.
  - You are about to drop the column `timer_b` on the `ProductList` table. All the data in the column will be lost.
  - You are about to drop the column `variant_sku` on the `ProductList` table. All the data in the column will be lost.
  - You are about to drop the column `clockIn` on the `Shift` table. All the data in the column will be lost.
  - You are about to drop the column `clockOut` on the `Shift` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `Shift` table. All the data in the column will be lost.
  - Added the required column `name` to the `ProductList` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalCost` to the `ProductList` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `Shift` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "ProductList_variant_sku_key";

-- DropIndex
DROP INDEX "Shift_date_idx";

-- AlterTable
ALTER TABLE "ProductList" DROP COLUMN "addon",
DROP COLUMN "list_of_ing",
DROP COLUMN "meat1",
DROP COLUMN "meat2",
DROP COLUMN "option1",
DROP COLUMN "option2",
DROP COLUMN "serveware",
DROP COLUMN "sku_search",
DROP COLUMN "timer_a",
DROP COLUMN "timer_b",
DROP COLUMN "variant_sku",
ADD COLUMN     "name" TEXT NOT NULL,
DROP COLUMN "totalCost",
ADD COLUMN     "totalCost" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "Shift" DROP COLUMN "clockIn",
DROP COLUMN "clockOut",
DROP COLUMN "date",
ADD COLUMN     "endTime" TIMESTAMP(3),
ADD COLUMN     "startTime" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "StockItem" ADD COLUMN     "bakery" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ProductListSubItem" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "packSize" TEXT NOT NULL,
    "ctnQty" TEXT NOT NULL,
    "lastPrice" TEXT NOT NULL,
    "productListId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductListSubItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProductListSubItem" ADD CONSTRAINT "ProductListSubItem_productListId_fkey" FOREIGN KEY ("productListId") REFERENCES "ProductList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

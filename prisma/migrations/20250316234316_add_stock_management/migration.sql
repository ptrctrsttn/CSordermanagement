/*
  Warnings:

  - You are about to drop the column `description` on the `StockItem` table. All the data in the column will be lost.
  - You are about to drop the `Ingredient` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductStockItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StockItemIngredient` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Supplier` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `totalCost` to the `StockItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Ingredient" DROP CONSTRAINT "Ingredient_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "ProductStockItem" DROP CONSTRAINT "ProductStockItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "ProductStockItem" DROP CONSTRAINT "ProductStockItem_stockItemId_fkey";

-- DropForeignKey
ALTER TABLE "StockItemIngredient" DROP CONSTRAINT "StockItemIngredient_ingredientId_fkey";

-- DropForeignKey
ALTER TABLE "StockItemIngredient" DROP CONSTRAINT "StockItemIngredient_stockItemId_fkey";

-- DropIndex
DROP INDEX "StockItem_name_key";

-- AlterTable
ALTER TABLE "StockItem" DROP COLUMN "description",
ADD COLUMN     "totalCost" DOUBLE PRECISION NOT NULL;

-- DropTable
DROP TABLE "Ingredient";

-- DropTable
DROP TABLE "ProductStockItem";

-- DropTable
DROP TABLE "StockItemIngredient";

-- DropTable
DROP TABLE "Supplier";

-- CreateTable
CREATE TABLE "StockSubItem" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "stockItemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockSubItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GilmoursItem" (
    "id" TEXT NOT NULL,
    "purchaseDate" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "productDescription" TEXT NOT NULL,
    "packSize" TEXT NOT NULL,
    "uom" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "qty" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GilmoursItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BidfoodItem" (
    "id" TEXT NOT NULL,
    "productCode" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "packSize" TEXT NOT NULL,
    "ctnQty" TEXT NOT NULL,
    "uom" TEXT NOT NULL,
    "qty" TEXT NOT NULL,
    "lastPricePaid" TEXT NOT NULL,
    "totalExGst" TEXT NOT NULL,
    "account" TEXT NOT NULL,
    "contains" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BidfoodItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtherItem" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "supplier" TEXT NOT NULL,
    "pricePerUnit" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OtherItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GilmoursItem_sku_key" ON "GilmoursItem"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "BidfoodItem_productCode_key" ON "BidfoodItem"("productCode");

-- CreateIndex
CREATE UNIQUE INDEX "OtherItem_sku_key" ON "OtherItem"("sku");

-- AddForeignKey
ALTER TABLE "StockSubItem" ADD CONSTRAINT "StockSubItem_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "StockItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

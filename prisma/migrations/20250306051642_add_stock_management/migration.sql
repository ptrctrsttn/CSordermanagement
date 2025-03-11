/*
  Warnings:

  - You are about to drop the column `quantity` on the `Ingredient` table. All the data in the column will be lost.
  - You are about to drop the column `stockItemId` on the `Ingredient` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Ingredient` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `StockItem` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `StockItem` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `StockItem` table. All the data in the column will be lost.
  - You are about to drop the `_ProductToStockItem` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[sku]` on the table `Ingredient` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `StockItem` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `lastUpdated` to the `Ingredient` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `Ingredient` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplierId` to the `Ingredient` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SupplierType" AS ENUM ('GILMOURS', 'BIDFOOD', 'OTHER');

-- DropForeignKey
ALTER TABLE "Ingredient" DROP CONSTRAINT "Ingredient_stockItemId_fkey";

-- DropForeignKey
ALTER TABLE "_ProductToStockItem" DROP CONSTRAINT "_ProductToStockItem_A_fkey";

-- DropForeignKey
ALTER TABLE "_ProductToStockItem" DROP CONSTRAINT "_ProductToStockItem_B_fkey";

-- AlterTable
ALTER TABLE "Ingredient" DROP COLUMN "quantity",
DROP COLUMN "stockItemId",
DROP COLUMN "updatedAt",
ADD COLUMN     "lastUpdated" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "sku" TEXT,
ADD COLUMN     "supplierId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "StockItem" DROP COLUMN "category",
DROP COLUMN "price",
DROP COLUMN "unit";

-- DropTable
DROP TABLE "_ProductToStockItem";

-- CreateTable
CREATE TABLE "StockItemIngredient" (
    "id" TEXT NOT NULL,
    "stockItemId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockItemIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductStockItem" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "stockItemId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductStockItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SupplierType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ingredient_sku_key" ON "Ingredient"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "StockItem_name_key" ON "StockItem"("name");

-- AddForeignKey
ALTER TABLE "StockItemIngredient" ADD CONSTRAINT "StockItemIngredient_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "StockItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockItemIngredient" ADD CONSTRAINT "StockItemIngredient_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductStockItem" ADD CONSTRAINT "ProductStockItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductStockItem" ADD CONSTRAINT "ProductStockItem_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "StockItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingredient" ADD CONSTRAINT "Ingredient_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

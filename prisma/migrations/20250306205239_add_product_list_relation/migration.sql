/*
  Warnings:

  - You are about to drop the column `rawData` on the `Order` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "rawData";

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_sku_fkey" FOREIGN KEY ("sku") REFERENCES "ProductList"("variant_sku") ON DELETE SET NULL ON UPDATE CASCADE;

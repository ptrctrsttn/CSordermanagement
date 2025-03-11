-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_sku_fkey";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "note" TEXT;

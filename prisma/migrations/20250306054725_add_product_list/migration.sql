-- CreateTable
CREATE TABLE "ProductList" (
    "id" TEXT NOT NULL,
    "addon" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "totalCost" TEXT,
    "list_of_ing" TEXT,
    "meat1" TEXT,
    "meat2" TEXT,
    "option1" TEXT,
    "option2" TEXT,
    "serveware" TEXT,
    "timer_a" TEXT,
    "timer_b" TEXT,
    "sku_search" TEXT,
    "variant_sku" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductList_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductList_variant_sku_key" ON "ProductList"("variant_sku");

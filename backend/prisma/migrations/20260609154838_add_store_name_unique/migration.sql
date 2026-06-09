-- AlterTable: add unique constraint on vendors.store_name
CREATE UNIQUE INDEX "vendors_store_name_key" ON "vendors"("store_name");

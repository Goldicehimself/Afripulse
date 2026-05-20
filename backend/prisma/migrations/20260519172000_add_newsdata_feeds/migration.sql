-- AlterTable
ALTER TABLE "Article" ADD COLUMN "externalId" TEXT;
ALTER TABLE "Article" ADD COLUMN "feedKey" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "Article_externalId_key" ON "Article"("externalId");

-- CreateIndex
CREATE INDEX "Article_feedKey_idx" ON "Article"("feedKey");

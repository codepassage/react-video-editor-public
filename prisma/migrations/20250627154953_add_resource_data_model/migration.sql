-- AlterTable
ALTER TABLE "Template" ALTER COLUMN "typeId" DROP DEFAULT;

-- CreateTable
CREATE TABLE "ResourceData" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "data" JSONB NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "itemCount" INTEGER NOT NULL DEFAULT 0,
    "hasNested" BOOLEAN NOT NULL DEFAULT false,
    "maxDepth" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResourceData_name_idx" ON "ResourceData"("name");

-- CreateIndex
CREATE INDEX "ResourceData_createdAt_idx" ON "ResourceData"("createdAt");

-- CreateIndex
CREATE INDEX "ResourceData_hasNested_idx" ON "ResourceData"("hasNested");

-- CreateIndex
CREATE INDEX "ResourceData_version_idx" ON "ResourceData"("version");

-- AddForeignKey
ALTER TABLE "ResourceData" ADD CONSTRAINT "ResourceData_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

/*
  Warnings:

  - Added the required column `typeId` to the `Template` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "TemplateType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplateType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TemplateType_name_idx" ON "TemplateType"("name");

-- Insert default TemplateType data
INSERT INTO "TemplateType" ("id", "name", "description") VALUES 
('00000000-0000-0000-0000-000000000001', '1 단계', '첫 번째 단계 템플릿'),
('00000000-0000-0000-0000-000000000002', '2 단계', '두 번째 단계 템플릿');

-- Add typeId column with default value first
ALTER TABLE "Template" ADD COLUMN "typeId" TEXT DEFAULT '00000000-0000-0000-0000-000000000001';

-- Update all existing templates to have a default typeId (1 단계)
UPDATE "Template" SET "typeId" = '00000000-0000-0000-0000-000000000001' WHERE "typeId" IS NULL;

-- Now make the column NOT NULL
ALTER TABLE "Template" ALTER COLUMN "typeId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Template_typeId_idx" ON "Template"("typeId");

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "TemplateType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

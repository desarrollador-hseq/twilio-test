-- CreateTable
CREATE TABLE "CampaignArea" (
    "campaignId" INTEGER NOT NULL,
    "areaId" INTEGER NOT NULL,

    PRIMARY KEY ("campaignId", "areaId"),
    CONSTRAINT "CampaignArea_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CampaignArea_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Campaign" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,
    "templateId" INTEGER NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'whatsapp',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "targetAllAreas" BOOLEAN NOT NULL DEFAULT true,
    "mediaFileName" TEXT,
    "contentVariables" TEXT,
    "scheduledAt" DATETIME,
    "sentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Campaign_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Campaign_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Campaign" ("channel", "companyId", "contentVariables", "createdAt", "deletedAt", "id", "mediaFileName", "name", "scheduledAt", "sentAt", "status", "templateId", "updatedAt") SELECT "channel", "companyId", "contentVariables", "createdAt", "deletedAt", "id", "mediaFileName", "name", "scheduledAt", "sentAt", "status", "templateId", "updatedAt" FROM "Campaign";
DROP TABLE "Campaign";
ALTER TABLE "new_Campaign" RENAME TO "Campaign";
CREATE INDEX "Campaign_companyId_idx" ON "Campaign"("companyId");
CREATE INDEX "Campaign_deletedAt_idx" ON "Campaign"("deletedAt");
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "CampaignArea_areaId_idx" ON "CampaignArea"("areaId");

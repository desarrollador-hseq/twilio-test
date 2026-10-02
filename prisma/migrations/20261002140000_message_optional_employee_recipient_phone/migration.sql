-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Message" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "campaignId" INTEGER,
    "employeeId" INTEGER,
    "recipientPhone" TEXT,
    "templateId" INTEGER NOT NULL,
    "messageSid" TEXT,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "errorMessage" TEXT,
    "contentVariables" TEXT,
    "sentAt" DATETIME,
    "deliveredAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Message_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Message_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Message_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Message" ("id", "campaignId", "employeeId", "templateId", "messageSid", "status", "errorMessage", "contentVariables", "sentAt", "deliveredAt", "createdAt", "updatedAt") SELECT "id", "campaignId", "employeeId", "templateId", "messageSid", "status", "errorMessage", "contentVariables", "sentAt", "deliveredAt", "createdAt", "updatedAt" FROM "Message";
DROP TABLE "Message";
ALTER TABLE "new_Message" RENAME TO "Message";
CREATE UNIQUE INDEX "Message_messageSid_key" ON "Message"("messageSid");
CREATE INDEX "Message_campaignId_idx" ON "Message"("campaignId");
CREATE INDEX "Message_employeeId_idx" ON "Message"("employeeId");
CREATE INDEX "Message_recipientPhone_idx" ON "Message"("recipientPhone");
CREATE INDEX "Message_status_idx" ON "Message"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

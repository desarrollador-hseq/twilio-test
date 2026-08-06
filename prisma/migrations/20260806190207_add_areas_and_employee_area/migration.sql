-- CreateTable
CREATE TABLE "Area" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "nameNormalized" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Area_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Employee" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyId" INTEGER NOT NULL,
    "areaId" INTEGER,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "nationalId" TEXT NOT NULL,
    "mobilePhone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "canSendWhatsapp" BOOLEAN NOT NULL DEFAULT true,
    "canSendEmail" BOOLEAN NOT NULL DEFAULT true,
    "unsubscribedAt" DATETIME,
    "unsubscribeReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Employee_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Employee_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Employee" ("active", "canSendEmail", "canSendWhatsapp", "companyId", "createdAt", "deletedAt", "email", "firstName", "id", "lastName", "mobilePhone", "nationalId", "unsubscribeReason", "unsubscribedAt", "updatedAt") SELECT "active", "canSendEmail", "canSendWhatsapp", "companyId", "createdAt", "deletedAt", "email", "firstName", "id", "lastName", "mobilePhone", "nationalId", "unsubscribeReason", "unsubscribedAt", "updatedAt" FROM "Employee";
DROP TABLE "Employee";
ALTER TABLE "new_Employee" RENAME TO "Employee";
CREATE INDEX "Employee_companyId_idx" ON "Employee"("companyId");
CREATE INDEX "Employee_areaId_idx" ON "Employee"("areaId");
CREATE INDEX "Employee_deletedAt_idx" ON "Employee"("deletedAt");
CREATE INDEX "Employee_active_idx" ON "Employee"("active");
CREATE UNIQUE INDEX "Employee_companyId_nationalId_key" ON "Employee"("companyId", "nationalId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Area_companyId_idx" ON "Area"("companyId");

-- CreateIndex
CREATE INDEX "Area_deletedAt_idx" ON "Area"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Area_companyId_nameNormalized_key" ON "Area"("companyId", "nameNormalized");

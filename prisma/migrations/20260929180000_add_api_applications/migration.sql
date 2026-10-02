-- CreateTable
CREATE TABLE "ApiApplication" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tokenPrefix" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" DATETIME,
    "revokedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ApiApplication_tokenHash_key" ON "ApiApplication"("tokenHash");

-- CreateIndex
CREATE INDEX "ApiApplication_active_idx" ON "ApiApplication"("active");

-- CreateIndex
CREATE INDEX "ApiApplication_revokedAt_idx" ON "ApiApplication"("revokedAt");

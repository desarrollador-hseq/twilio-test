-- Rename Company columns
ALTER TABLE "Company" RENAME COLUMN "razonSocial" TO "legalName";
ALTER TABLE "Company" RENAME COLUMN "nit" TO "taxId";

-- Rename Employee columns
ALTER TABLE "Employee" RENAME COLUMN "nombres" TO "firstName";
ALTER TABLE "Employee" RENAME COLUMN "apellidos" TO "lastName";
ALTER TABLE "Employee" RENAME COLUMN "cedula" TO "nationalId";
ALTER TABLE "Employee" RENAME COLUMN "telefonoCelular" TO "mobilePhone";
ALTER TABLE "Employee" RENAME COLUMN "correo" TO "email";
ALTER TABLE "Employee" RENAME COLUMN "activo" TO "active";
ALTER TABLE "Employee" RENAME COLUMN "puedeEnviarWhatsapp" TO "canSendWhatsapp";
ALTER TABLE "Employee" RENAME COLUMN "puedeEnviarCorreo" TO "canSendEmail";

-- Recreate indexes that reference renamed columns
DROP INDEX IF EXISTS "Company_nit_key";
CREATE UNIQUE INDEX "Company_taxId_key" ON "Company"("taxId");

DROP INDEX IF EXISTS "Employee_companyId_cedula_key";
CREATE UNIQUE INDEX "Employee_companyId_nationalId_key" ON "Employee"("companyId", "nationalId");

DROP INDEX IF EXISTS "Employee_activo_idx";
CREATE INDEX "Employee_active_idx" ON "Employee"("active");

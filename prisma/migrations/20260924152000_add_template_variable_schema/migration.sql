-- AlterTable
ALTER TABLE "Template" ADD COLUMN "variableSchema" TEXT;

-- Plantillas existentes: preset saludo + imagen (comportamiento anterior)
UPDATE "Template"
SET "variableSchema" = '[{"key":"1","label":"Nombre del destinatario","kind":"employee","source":"firstName","required":true},{"key":"2","label":"Imagen o video","kind":"media","required":false}]'
WHERE "variableSchema" IS NULL;

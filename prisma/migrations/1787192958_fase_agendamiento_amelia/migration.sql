ALTER TABLE "Usuario" ADD COLUMN "ameliaProviderId" INTEGER UNIQUE;

ALTER TABLE "Caso" ADD COLUMN "emailEvaluado" TEXT, ADD COLUMN "telefonoEvaluado" TEXT;

ALTER TABLE "Sesion" ADD COLUMN "ameliaAppointmentId" INTEGER UNIQUE;

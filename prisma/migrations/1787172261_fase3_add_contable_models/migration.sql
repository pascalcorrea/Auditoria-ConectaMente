-- CreateEnum EstadoPago
CREATE TYPE "EstadoPago" AS ENUM ('pendiente', 'pagado');

-- CreateEnum EstadoFactura
CREATE TYPE "EstadoFactura" AS ENUM ('pendiente', 'facturada', 'pagada');

-- AlterTable Usuario
ALTER TABLE "Usuario" ADD COLUMN "tarifaCasoClp" INTEGER;

-- AlterTable Organizacion
ALTER TABLE "Organizacion" ADD COLUMN "tarifaCasoClp" INTEGER;

-- CreateTable PagoMedico
CREATE TABLE "PagoMedico" (
    "id" TEXT NOT NULL,
    "medicoId" TEXT NOT NULL,
    "casoId" TEXT NOT NULL,
    "montoClp" INTEGER NOT NULL,
    "estado" "EstadoPago" NOT NULL DEFAULT 'pendiente',
    "fechaPago" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PagoMedico_pkey" PRIMARY KEY ("id")
);

-- CreateTable FacturaOrganizacion
CREATE TABLE "FacturaOrganizacion" (
    "id" TEXT NOT NULL,
    "organizacionId" TEXT NOT NULL,
    "periodoInicio" TIMESTAMP(3) NOT NULL,
    "periodoFin" TIMESTAMP(3) NOT NULL,
    "casosIncluidos" INTEGER NOT NULL,
    "montoClp" INTEGER NOT NULL,
    "estado" "EstadoFactura" NOT NULL DEFAULT 'pendiente',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "facturadoEn" TIMESTAMP(3),

    CONSTRAINT "FacturaOrganizacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex PagoMedico_medicoId_idx
CREATE INDEX "PagoMedico_medicoId_idx" ON "PagoMedico"("medicoId");

-- CreateIndex PagoMedico_estado_idx
CREATE INDEX "PagoMedico_estado_idx" ON "PagoMedico"("estado");

-- CreateIndex PagoMedico_casoId_key
CREATE UNIQUE INDEX "PagoMedico_casoId_key" ON "PagoMedico"("casoId");

-- CreateIndex FacturaOrganizacion_organizacionId_idx
CREATE INDEX "FacturaOrganizacion_organizacionId_idx" ON "FacturaOrganizacion"("organizacionId");

-- CreateIndex FacturaOrganizacion_estado_idx
CREATE INDEX "FacturaOrganizacion_estado_idx" ON "FacturaOrganizacion"("estado");

-- AddForeignKey PagoMedico
ALTER TABLE "PagoMedico" ADD CONSTRAINT "PagoMedico_medicoId_fkey" FOREIGN KEY ("medicoId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey PagoMedico
ALTER TABLE "PagoMedico" ADD CONSTRAINT "PagoMedico_casoId_fkey" FOREIGN KEY ("casoId") REFERENCES "Caso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey FacturaOrganizacion
ALTER TABLE "FacturaOrganizacion" ADD CONSTRAINT "FacturaOrganizacion_organizacionId_fkey" FOREIGN KEY ("organizacionId") REFERENCES "Organizacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

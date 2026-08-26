-- CreateEnum
CREATE TYPE "CanalEnvio" AS ENUM ('whatsapp', 'email');

-- CreateEnum
CREATE TYPE "EstadoEnvio" AS ENUM ('enviado', 'entregado', 'leido', 'fallido');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('pendiente', 'pagado');

-- CreateEnum
CREATE TYPE "EstadoFactura" AS ENUM ('pendiente', 'facturada', 'pagada');

-- AlterTable
ALTER TABLE "Informe" ALTER COLUMN "firmaProveedor" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Organizacion" ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "tarifaCasoClp" INTEGER;

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "tarifaCasoClp" INTEGER;

-- CreateTable
CREATE TABLE "LogEnvio" (
    "id" TEXT NOT NULL,
    "canal" "CanalEnvio" NOT NULL,
    "tipo" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "destinatarioUsuarioId" TEXT,
    "casoId" TEXT,
    "asunto" TEXT,
    "cuerpo" TEXT,
    "estado" "EstadoEnvio" NOT NULL DEFAULT 'enviado',
    "error" TEXT,
    "enviadoPorId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogEnvio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateIndex
CREATE INDEX "LogEnvio_casoId_idx" ON "LogEnvio"("casoId");

-- CreateIndex
CREATE INDEX "LogEnvio_destinatarioUsuarioId_idx" ON "LogEnvio"("destinatarioUsuarioId");

-- CreateIndex
CREATE INDEX "LogEnvio_creadoEn_idx" ON "LogEnvio"("creadoEn");

-- CreateIndex
CREATE UNIQUE INDEX "PagoMedico_casoId_key" ON "PagoMedico"("casoId");

-- CreateIndex
CREATE INDEX "PagoMedico_medicoId_idx" ON "PagoMedico"("medicoId");

-- CreateIndex
CREATE INDEX "PagoMedico_estado_idx" ON "PagoMedico"("estado");

-- CreateIndex
CREATE INDEX "FacturaOrganizacion_organizacionId_idx" ON "FacturaOrganizacion"("organizacionId");

-- CreateIndex
CREATE INDEX "FacturaOrganizacion_estado_idx" ON "FacturaOrganizacion"("estado");

-- AddForeignKey
ALTER TABLE "LogEnvio" ADD CONSTRAINT "LogEnvio_destinatarioUsuarioId_fkey" FOREIGN KEY ("destinatarioUsuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogEnvio" ADD CONSTRAINT "LogEnvio_casoId_fkey" FOREIGN KEY ("casoId") REFERENCES "Caso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogEnvio" ADD CONSTRAINT "LogEnvio_enviadoPorId_fkey" FOREIGN KEY ("enviadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoMedico" ADD CONSTRAINT "PagoMedico_medicoId_fkey" FOREIGN KEY ("medicoId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoMedico" ADD CONSTRAINT "PagoMedico_casoId_fkey" FOREIGN KEY ("casoId") REFERENCES "Caso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaOrganizacion" ADD CONSTRAINT "FacturaOrganizacion_organizacionId_fkey" FOREIGN KEY ("organizacionId") REFERENCES "Organizacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- CreateEnum
CREATE TYPE "TipoOrganizacion" AS ENUM ('isapre', 'compin', 'empresa', 'seguro', 'subcontratista');

-- CreateEnum
CREATE TYPE "EstadoCaso" AS ENUM ('recibido', 'en_revision', 'informe_en_validacion', 'entregado');

-- CreateEnum
CREATE TYPE "PrioridadCaso" AS ENUM ('normal', 'urgente');

-- CreateEnum
CREATE TYPE "EstadoSesion" AS ENUM ('agendada', 'en_curso', 'realizada', 'incumplida_medico', 'incumplida_evaluado', 'reprogramada', 'cancelada');

-- CreateEnum
CREATE TYPE "FirmaProveedor" AS ENUM ('firmaweb', 'sovos', 'otro');

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "especialidad" TEXT,
ADD COLUMN     "organizacionId" TEXT;

-- CreateTable
CREATE TABLE "Organizacion" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoOrganizacion" NOT NULL,
    "plazoSlaDias" INTEGER NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organizacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Caso" (
    "id" TEXT NOT NULL,
    "organizacionId" TEXT NOT NULL,
    "medicoId" TEXT,
    "estado" "EstadoCaso" NOT NULL DEFAULT 'recibido',
    "tipoLicencia" TEXT NOT NULL,
    "fechaIngreso" TIMESTAMP(3) NOT NULL,
    "fechaLimite" TIMESTAMP(3) NOT NULL,
    "prioridad" "PrioridadCaso" NOT NULL DEFAULT 'normal',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Caso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sesion" (
    "id" TEXT NOT NULL,
    "casoId" TEXT NOT NULL,
    "fechaProgramada" TIMESTAMP(3) NOT NULL,
    "dailyRoomUrl" TEXT,
    "estado" "EstadoSesion" NOT NULL DEFAULT 'agendada',
    "consentimientoTimestamp" TIMESTAMP(3),
    "grabacionUrl" TEXT,
    "medicoHoraConexion" TIMESTAMP(3),
    "medicoHoraDesconexion" TIMESTAMP(3),
    "evaluadoHoraConexion" TIMESTAMP(3),
    "evaluadoHoraDesconexion" TIMESTAMP(3),
    "duracionEfectivaSegundos" INTEGER,

    CONSTRAINT "Sesion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Informe" (
    "id" TEXT NOT NULL,
    "casoId" TEXT NOT NULL,
    "archivoUrl" TEXT NOT NULL,
    "generadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generadoPor" TEXT NOT NULL,
    "firmaProveedor" "FirmaProveedor" NOT NULL,
    "firmaTimestamp" TIMESTAMP(3),
    "firmaDocumentoId" TEXT,
    "archivoFirmadoUrl" TEXT,

    CONSTRAINT "Informe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogDescarga" (
    "id" TEXT NOT NULL,
    "informeId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogDescarga_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Caso_fechaLimite_idx" ON "Caso"("fechaLimite");

-- CreateIndex
CREATE INDEX "Caso_organizacionId_idx" ON "Caso"("organizacionId");

-- CreateIndex
CREATE INDEX "Caso_estado_idx" ON "Caso"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "Sesion_casoId_key" ON "Sesion"("casoId");

-- CreateIndex
CREATE UNIQUE INDEX "Informe_casoId_key" ON "Informe"("casoId");

-- CreateIndex
CREATE INDEX "Usuario_organizacionId_idx" ON "Usuario"("organizacionId");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_organizacionId_fkey" FOREIGN KEY ("organizacionId") REFERENCES "Organizacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Caso" ADD CONSTRAINT "Caso_organizacionId_fkey" FOREIGN KEY ("organizacionId") REFERENCES "Organizacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Caso" ADD CONSTRAINT "Caso_medicoId_fkey" FOREIGN KEY ("medicoId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sesion" ADD CONSTRAINT "Sesion_casoId_fkey" FOREIGN KEY ("casoId") REFERENCES "Caso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Informe" ADD CONSTRAINT "Informe_casoId_fkey" FOREIGN KEY ("casoId") REFERENCES "Caso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Informe" ADD CONSTRAINT "Informe_generadoPor_fkey" FOREIGN KEY ("generadoPor") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogDescarga" ADD CONSTRAINT "LogDescarga_informeId_fkey" FOREIGN KEY ("informeId") REFERENCES "Informe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogDescarga" ADD CONSTRAINT "LogDescarga_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

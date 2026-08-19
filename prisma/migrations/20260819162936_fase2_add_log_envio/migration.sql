-- CreateEnum
CREATE TYPE "CanalEnvio" AS ENUM ('whatsapp', 'email');

-- CreateEnum
CREATE TYPE "EstadoEnvio" AS ENUM ('enviado', 'entregado', 'leido', 'fallido');

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

-- AddForeignKey
ALTER TABLE "LogEnvio" ADD CONSTRAINT "LogEnvio_destinatarioUsuarioId_fkey" FOREIGN KEY ("destinatarioUsuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogEnvio" ADD CONSTRAINT "LogEnvio_casoId_fkey" FOREIGN KEY ("casoId") REFERENCES "Caso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogEnvio" ADD CONSTRAINT "LogEnvio_enviadoPorId_fkey" FOREIGN KEY ("enviadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "LogEnvio_casoId_idx" ON "LogEnvio"("casoId");

-- CreateIndex
CREATE INDEX "LogEnvio_destinatarioUsuarioId_idx" ON "LogEnvio"("destinatarioUsuarioId");

-- CreateIndex
CREATE INDEX "LogEnvio_creadoEn_idx" ON "LogEnvio"("creadoEn");

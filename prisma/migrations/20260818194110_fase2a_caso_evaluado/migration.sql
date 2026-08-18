/*
  Warnings:

  - Added the required column `fechaEmisionLicencia` to the `Caso` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nombreEvaluado` to the `Caso` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rutEvaluado` to the `Caso` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Caso" ADD COLUMN     "fechaEmisionLicencia" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "nombreEvaluado" TEXT NOT NULL,
ADD COLUMN     "rutEvaluado" TEXT NOT NULL;

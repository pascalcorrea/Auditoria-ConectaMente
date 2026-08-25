import { prisma } from './prisma'
import type { TipoOrganizacion } from '@/lib/types'

export async function listarOrganizaciones() {
  return prisma.organizacion.findMany({
    include: {
      _count: {
        select: { usuarios: true, casos: true },
      },
    },
    orderBy: { nombre: 'asc' },
  })
}

export async function crearOrganizacion(data: { nombre: string; rut: string; contacto: string; tipo: TipoOrganizacion; plazoSlaDias: number }) {
  return prisma.organizacion.create({
    data,
  })
}

export async function actualizarOrganizacion(id: string, data: { nombre?: string; contacto?: string }) {
  return prisma.organizacion.update({
    where: { id },
    data,
  })
}

export async function obtenerOrganizacionConUsuarios(id: string) {
  return prisma.organizacion.findUnique({
    where: { id },
    include: {
      usuarios: {
        select: { id: true, nombre: true, email: true, rol: true },
      },
    },
  })
}

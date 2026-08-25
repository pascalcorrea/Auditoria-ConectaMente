import { prisma } from './prisma'
import type { Rol } from '@/lib/types'

export async function listarUsuarios(filtro?: { rol?: Rol; activo?: boolean }) {
  return prisma.usuario.findMany({
    where: {
      ...(filtro?.rol && { rol: filtro.rol }),
      ...(filtro?.activo !== undefined && { activo: filtro.activo }),
    },
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
      activo: true,
      organizacionId: true,
    },
    orderBy: { nombre: 'asc' },
  })
}

export async function crearUsuario(data: { nombre: string; email: string; rol: Rol; organizacionId?: string }) {
  return prisma.usuario.create({
    data: {
      nombre: data.nombre,
      email: data.email,
      rol: data.rol,
      organizacionId: data.organizacionId,
      passwordHash: '',
      activo: false,
    },
  })
}

export async function actualizarUsuario(id: string, data: { nombre?: string; rol?: Rol; activo?: boolean }) {
  return prisma.usuario.update({
    where: { id },
    data,
  })
}

export async function desactivarUsuario(id: string) {
  return prisma.usuario.update({
    where: { id },
    data: { activo: false },
  })
}

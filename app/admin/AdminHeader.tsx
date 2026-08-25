import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import styles from './admin.module.css'

interface AdminHeaderProps {
  title: string
  onReload?: () => void
  reloadDisabled?: boolean
}

export default function AdminHeader({ title, onReload, reloadDisabled }: AdminHeaderProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  function handleLogout() {
    fetch('/api/auth/signout', { method: 'POST' }).finally(() => {
      startTransition(() => { router.push('/login'); router.refresh() })
    })
  }

  function handleReload() {
    if (onReload) {
      onReload()
    } else {
      window.location.reload()
    }
  }

  return (
    <div className={styles.adminHeader}>
      <span style={{
        fontSize: 16,
        fontWeight: 400,
        color: '#0D1626',
        letterSpacing: '-0.3px',
      }}>
        {title}
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          className={styles.iconButton}
          onClick={handleReload}
          disabled={reloadDisabled}
          title="Recargar datos"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          <span className={styles.adminHeaderBtnLabel}>Recargar</span>
        </button>

        <button className={styles.logoutButton} onClick={handleLogout} title="Cerrar sesión">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  )
}

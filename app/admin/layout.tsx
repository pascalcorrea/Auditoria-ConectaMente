import type { ReactNode } from 'react'
import AdminSidebar from './AdminSidebar'
import styles from './admin.module.css'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <AdminSidebar />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', background: '#EDF0F5' }}>
        {/* Only show default header for the main admin page; subpages handle their own headers via layouts */}
        {children}
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import styles from './admin.module.css'

function ic(active: boolean, hovered: boolean): string {
  return (active || hovered) ? '#0CB87E' : '#9BAABC'
}

function IconDashboard({ c }: { c: string }) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}

function IconCases({ c }: { c: string }) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  )
}

function IconAssignment({ c }: { c: string }) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function IconUsers({ c }: { c: string }) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function IconOrganizations({ c }: { c: string }) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="18" rx="2" />
      <line x1="8" y1="3" x2="8" y2="21" />
      <line x1="2" y1="9" x2="22" y2="9" />
      <line x1="2" y1="15" x2="22" y2="15" />
    </svg>
  )
}

function IconAnalytics({ c }: { c: string }) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
      <path d="M12 5 L16 9 L12 13 L8 9 Z" />
    </svg>
  )
}

function IconCompliance({ c }: { c: string }) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconToggle({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ transition: 'transform 0.22s ease', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

const CATEGORIES = [
  {
    label: 'General',
    tabs: [
      { href: '/admin', label: 'Panel', Icon: IconDashboard },
    ],
  },
  {
    label: 'Gestión',
    tabs: [
      { href: '/admin/casos', label: 'Casos', Icon: IconCases },
      { href: '/admin/asignacion', label: 'Asignación', Icon: IconAssignment },
      { href: '/admin/cumplimiento', label: 'Cumplimiento', Icon: IconCompliance },
    ],
  },
  {
    label: 'Configuración',
    tabs: [
      { href: '/admin/usuarios', label: 'Usuarios', Icon: IconUsers },
      { href: '/admin/organizaciones', label: 'Organizaciones', Icon: IconOrganizations },
      { href: '/admin/analytics', label: 'Análisis', Icon: IconAnalytics },
    ],
  },
]

const TABS = CATEGORIES.flatMap(c => c.tabs)

export default function AdminSidebar() {
  const pathname = usePathname()
  const [hovered, setHovered] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('admin_sidebar_expanded')
    if (saved === 'true') setExpanded(true)
  }, [])

  function toggle() {
    const next = !expanded
    setExpanded(next)
    localStorage.setItem('admin_sidebar_expanded', String(next))
  }

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  const W = expanded ? 220 : 64

  return (
    <>
      <div
        className={styles.desktopSidebar}
        style={{
          width: W,
          flexShrink: 0,
          background: '#ffffff',
          borderRight: '1px solid rgba(15,23,42,0.07)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'hidden',
          transition: 'width 0.22s cubic-bezier(.4,0,.2,1)',
        }}
      >
        <div style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '18px 13px 16px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: 36, height: 36,
            flexShrink: 0,
            borderRadius: 10,
            overflow: 'hidden',
            boxShadow: '0 0 0 1.5px rgba(12,184,126,0.18), 0 2px 8px rgba(0,0,0,0.06)',
          }}>
            <Image src="/favicon.ico" alt="ConectaMente" width={36} height={36} style={{ display: 'block' }} />
          </div>
          {expanded && (
            <span style={{
              fontSize: 13.5,
              fontWeight: 600,
              color: '#0D1626',
              whiteSpace: 'nowrap',
              letterSpacing: '-0.3px',
            }}>
              ConectaMente
            </span>
          )}
        </div>

        <div style={{ height: 1, background: 'rgba(15,23,42,0.07)', flexShrink: 0, margin: '0 12px' }} />

        <nav style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '8px 8px 4px',
        }}>
          {CATEGORIES.map((cat, ci) => (
            <div key={cat.label}>
              {expanded ? (
                <div style={{
                  fontSize: 9.5,
                  fontWeight: 700,
                  letterSpacing: '0.09em',
                  textTransform: 'uppercase',
                  color: '#CBD5E1',
                  padding: ci === 0 ? '4px 6px 5px' : '12px 6px 5px',
                  whiteSpace: 'nowrap',
                  userSelect: 'none',
                }}>
                  {cat.label}
                </div>
              ) : (
                ci > 0 && (
                  <div style={{ height: 1, background: 'rgba(15,23,42,0.06)', margin: '7px 5px' }} />
                )
              )}

              {cat.tabs.map(({ href, label, Icon }) => {
                const active = isActive(href)
                const isHov = hovered === href
                const color = ic(active, isHov)
                return (
                  <Link
                    key={href}
                    href={href}
                    title={expanded ? undefined : label}
                    onMouseEnter={() => setHovered(href)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 9,
                      height: 38,
                      borderRadius: 9,
                      padding: expanded ? '0 10px 0 12px' : '0',
                      justifyContent: expanded ? 'flex-start' : 'center',
                      background: active
                        ? 'rgba(12,184,126,0.09)'
                        : isHov ? '#F0FDF8' : 'transparent',
                      transition: 'background 0.13s ease',
                      textDecoration: 'none',
                      marginBottom: 2,
                      overflow: 'hidden',
                    }}
                  >
                    {active && (
                      <span style={{
                        position: 'absolute',
                        left: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 3,
                        height: 18,
                        borderRadius: '0 3px 3px 0',
                        background: '#0CB87E',
                        boxShadow: '0 0 6px rgba(12,184,126,0.40)',
                      }} />
                    )}

                    <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                      <Icon c={color} />
                    </span>

                    {expanded && (
                      <span style={{
                        fontSize: 13,
                        color: active ? '#0CB87E' : '#374151',
                        fontWeight: active ? 500 : 400,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {label}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <div style={{
          flexShrink: 0,
          padding: '10px 10px 12px',
          borderTop: '1px solid rgba(15,23,42,0.07)',
        }}>
          <button
            onClick={toggle}
            title={expanded ? 'Colapsar menú' : 'Expandir menú'}
            style={{
              width: '100%',
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: expanded ? 'space-between' : 'center',
              gap: 8,
              padding: expanded ? '0 12px' : '0',
              background: '#F1F5F9',
              border: '1.5px solid rgba(15,23,42,0.09)',
              borderRadius: 9,
              cursor: 'pointer',
              color: '#64748B',
              fontSize: 12,
              fontWeight: 500,
              fontFamily: 'inherit',
              transition: 'background 0.13s, border-color 0.13s, color 0.13s',
              letterSpacing: '-0.1px',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#E4F9F2'
              e.currentTarget.style.borderColor = '#0CB87E'
              e.currentTarget.style.color = '#0CB87E'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#F1F5F9'
              e.currentTarget.style.borderColor = 'rgba(15,23,42,0.09)'
              e.currentTarget.style.color = '#64748B'
            }}
          >
            {expanded && (
              <span style={{ whiteSpace: 'nowrap' }}>Colapsar</span>
            )}
            <IconToggle expanded={expanded} />
          </button>
        </div>
      </div>

      <nav className={styles.mobileNav}>
        {TABS.map(({ href, label, Icon }) => {
          const active = isActive(href)
          const color = active ? '#0CB87E' : '#94A3B8'
          return (
            <Link
              key={href}
              href={href}
              className={`${styles.mobileNavItem}${active ? ' ' + styles.mobileNavItemActive : ''}`}
            >
              <Icon c={color} />
              <span className={styles.mobileNavLabel}>{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}

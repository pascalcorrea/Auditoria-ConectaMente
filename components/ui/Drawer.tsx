'use client'

import { ReactNode, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  widthClassName?: string
  children: ReactNode
}

export function Drawer({ open, onClose, title, widthClassName = 'w-[480px]', children }: DrawerProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  // Block body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }

    if (open) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  // Handle click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (overlayRef.current && e.target === overlayRef.current) {
        onClose()
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClick)
    }

    return () => {
      document.removeEventListener('mousedown', handleClick)
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-40 bg-black/30" ref={overlayRef}>
      <div className={`fixed right-0 top-0 h-full z-50 bg-white shadow-2xl transform transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'} ${widthClassName}`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-border p-4">
          <h2 className="text-sm font-medium text-brand-text">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 text-brand-textSecondary hover:text-brand-text transition"
            aria-label="Cerrar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        {/* Content */}
        <div className="overflow-y-auto" style={{ height: 'calc(100% - 56px)' }}>
          <div className="p-4">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  )
}

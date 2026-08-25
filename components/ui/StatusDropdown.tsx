'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface StatusDropdownOption {
  value: string
  label: string
  dot?: string
}

interface StatusDropdownProps {
  value: string
  options: StatusDropdownOption[]
  onChange: (value: string) => void
  disabled?: boolean
}

export function StatusDropdown({ value, options, onChange, disabled = false }: StatusDropdownProps) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  // Update dropdown position when open
  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPos({
        top: rect.bottom + 8,
        left: rect.left,
      })
    }
  }, [open])

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  function handleSelect(optValue: string) {
    onChange(optValue)
    setOpen(false)
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        disabled={disabled}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-brand-border bg-white text-brand-text hover:border-brand-accent transition disabled:opacity-55 disabled:cursor-not-allowed"
      >
        {selectedOption?.dot && (
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: selectedOption.dot }}
          />
        )}
        <span>{selectedOption?.label || 'Seleccionar'}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-textSecondary">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown Portal */}
      {open && dropdownPos && createPortal(
        <div
          className="fixed bg-white border border-brand-border rounded-lg shadow-lg py-1 z-50"
          style={{
            top: `${dropdownPos.top}px`,
            left: `${dropdownPos.left}px`,
            minWidth: '200px',
          }}
        >
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className="w-full text-left px-4 py-2 text-sm text-brand-text hover:bg-brand-bg transition flex items-center gap-2"
            >
              {option.dot && (
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: option.dot }}
                />
              )}
              <span>{option.label}</span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  )
}

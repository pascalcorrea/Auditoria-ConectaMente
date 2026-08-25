'use client'

import { useEffect, useRef, useState } from 'react'

interface DateRangeFilterProps {
  from: string
  to: string
  onChange: (from: string, to: string) => void
  label?: string
}

// Helper: Format date to YYYY-MM-DD (local time, no timezone issues)
function toYMDfc(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Helper: Parse YYYY-MM-DD to Date
function fromYMDfc(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// Helper: Format range for display
function formatRangeLabel(from: string, to: string): string {
  if (!from && !to) return 'Todas las fechas'

  const fromDate = from ? fromYMDfc(from) : null
  const toDate = to ? fromYMDfc(to) : null

  if (fromDate && toDate && toYMDfc(fromDate) === toYMDfc(toDate)) {
    return fromDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  }

  const parts = []
  if (fromDate) parts.push(fromDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }))
  if (toDate) parts.push(toDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }))

  return parts.join(' — ') || 'Todas las fechas'
}

// Helper: Get Spanish month name
function getMonthName(month: number): string {
  const names = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  return names[month]
}

// Helper: Get day names
const dayNames = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom']

// Helper: Build calendar days for a month
interface CalendarDay {
  date: number
  isCurrentMonth: boolean
  dateStr: string
}

function buildCalendarDays(year: number, month: number): CalendarDay[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()

  // Monday = 0, Sunday = 6 in JavaScript (getDay), but we need Monday = 0
  let startWeekday = firstDay.getDay() - 1
  if (startWeekday === -1) startWeekday = 6

  const days: CalendarDay[] = []

  // Previous month's trailing days
  const prevLastDay = new Date(year, month, 0).getDate()
  for (let i = startWeekday - 1; i >= 0; i--) {
    const date = prevLastDay - i
    days.push({
      date,
      isCurrentMonth: false,
      dateStr: toYMDfc(new Date(year, month - 1, date)),
    })
  }

  // Current month
  for (let date = 1; date <= daysInMonth; date++) {
    days.push({
      date,
      isCurrentMonth: true,
      dateStr: toYMDfc(new Date(year, month, date)),
    })
  }

  // Next month's leading days
  const remaining = 42 - days.length // 6 rows × 7 days
  for (let date = 1; date <= remaining; date++) {
    days.push({
      date,
      isCurrentMonth: false,
      dateStr: toYMDfc(new Date(year, month + 1, date)),
    })
  }

  return days
}

export function DateRangeFilter({ from, to, onChange, label = 'Período' }: DateRangeFilterProps) {
  const [open, setOpen] = useState(false)
  const [selection, setSelection] = useState<{ start?: string; end?: string }>({})
  const [hoverDate, setHoverDate] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })
  const containerRef = useRef<HTMLDivElement>(null)

  // Update selection when props change
  useEffect(() => {
    setSelection({ start: from || undefined, end: to || undefined })
  }, [from, to])

  // Handle day click
  function handleDayClick(dateStr: string) {
    if (!selection.start) {
      setSelection({ start: dateStr })
    } else if (!selection.end) {
      const start = selection.start
      const end = dateStr
      if (start <= end) {
        onChange(start, end)
        setSelection({ start, end })
        setOpen(false)
      } else {
        onChange(end, start)
        setSelection({ start: end, end: start })
        setOpen(false)
      }
    } else {
      setSelection({ start: dateStr })
    }
  }

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
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

  const calendarDays = buildCalendarDays(currentMonth.year, currentMonth.month)
  const start = selection.start
  const end = selection.end

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Label */}
      <label className="block text-xs font-medium uppercase tracking-wide text-brand-textSecondary mb-1.5">
        {label}
      </label>

      {/* Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full rounded-lg border border-brand-border bg-white px-3 py-2.5 text-sm text-brand-text outline-none transition hover:border-brand-accent focus:border-brand-accent focus:bg-white focus:ring-2 focus:ring-brand-accent/20 flex items-center justify-between"
      >
        <span>{formatRangeLabel(from, to)}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-textSecondary">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>

      {/* Calendar Dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-brand-border rounded-lg shadow-lg p-4 z-50 w-80">
          {/* Month/Year Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => {
                setCurrentMonth((prev) => {
                  const m = prev.month - 1
                  if (m < 0) return { year: prev.year - 1, month: 11 }
                  return { ...prev, month: m }
                })
              }}
              className="p-1 text-brand-textSecondary hover:text-brand-text transition"
              aria-label="Mes anterior"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <h3 className="text-sm font-medium text-brand-text">
              {getMonthName(currentMonth.month)} {currentMonth.year}
            </h3>
            <button
              onClick={() => {
                setCurrentMonth((prev) => {
                  const m = prev.month + 1
                  if (m > 11) return { year: prev.year + 1, month: 0 }
                  return { ...prev, month: m }
                })
              }}
              className="p-1 text-brand-textSecondary hover:text-brand-text transition"
              aria-label="Próximo mes"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Day Names */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((name: any) => (
              <div key={name} className="text-center text-xs font-medium text-brand-textSecondary h-6 flex items-center justify-center">
                {name}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day: any) => {
              const isStart = day.dateStr === start
              const isEnd = day.dateStr === end
              const isBetween = start && end && day.dateStr > start && day.dateStr < end
              const isHovered = hoverDate && start && day.dateStr > start && day.dateStr <= hoverDate
              const isCurrentMonth = day.isCurrentMonth

              return (
                <button
                  key={day.dateStr}
                  onClick={() => handleDayClick(day.dateStr)}
                  onMouseEnter={() => setHoverDate(day.dateStr)}
                  onMouseLeave={() => setHoverDate(null)}
                  className={`h-8 text-xs font-medium rounded transition flex items-center justify-center ${
                    !isCurrentMonth ? 'text-brand-textMuted' : 'text-brand-text'
                  } ${isStart || isEnd ? 'bg-brand-accent text-white font-semibold' : ''} ${
                    isBetween || isHovered ? 'bg-brand-accentSoft text-brand-text' : ''
                  } ${!isStart && !isEnd && !isBetween && !isHovered && isCurrentMonth ? 'hover:bg-brand-bg' : ''}`}
                >
                  {day.date}
                </button>
              )
            })}
          </div>

          {/* Clear Button */}
          {(from || to) && (
            <button
              onClick={() => {
                onChange('', '')
                setSelection({})
                setOpen(false)
              }}
              className="mt-4 w-full text-center text-sm text-brand-textSecondary hover:text-brand-accent transition"
            >
              Limpiar selección
            </button>
          )}
        </div>
      )}
    </div>
  )
}

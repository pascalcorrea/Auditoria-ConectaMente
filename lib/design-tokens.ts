export const colors = {
  brand: {
    accent: '#0CB87E',
    accentHover: '#0A9A69',
    accentSoft: '#E4F9F2',
    text: '#0D1626',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    bg: '#F8FAFC',
    bgHover: '#F1F5F9',
    border: 'rgba(15, 23, 42, 0.10)',
    borderSoft: 'rgba(15, 23, 42, 0.07)',
    danger: '#EF4444',
    dangerSoft: '#FEF2F2',
    // Semantic badge palette — matches ConectaMente's STATUS_COLOR
    // convention (E:\Dev\ConectaMente-2's AdminDashboard.tsx): índigo for
    // neutral/in-progress states, gray for inactive, red for
    // negative/cancelled, green (accent) for positive/completed.
    neutral: '#6366F1',
    neutralSoft: '#EEEDFF',
    inactive: '#6B7280',
    inactiveSoft: '#F3F4F6',
  },
} as const

export const fontFamily = {
  sans: ['DM Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
}

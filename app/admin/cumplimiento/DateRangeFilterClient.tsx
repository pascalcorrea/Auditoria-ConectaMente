'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { DateRangeFilter } from '@/components/ui/DateRangeFilter'

export function DateRangeFilterClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const desde = searchParams.get('desde') || ''
  const hasta = searchParams.get('hasta') || ''

  function handleDateRangeChange(from: string, to: string) {
    const params = new URLSearchParams(searchParams)

    if (from) params.set('desde', from)
    else params.delete('desde')

    if (to) params.set('hasta', to)
    else params.delete('hasta')

    router.push(`?${params.toString()}`)
  }

  return <DateRangeFilter from={desde} to={hasta} onChange={handleDateRangeChange} label="Rango de fecha límite" />
}

import AdminHeader from '../AdminHeader'

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminHeader title="Análisis" />
      {children}
    </>
  )
}

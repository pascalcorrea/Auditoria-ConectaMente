import AdminHeader from '../AdminHeader'

export default function CumplimientoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminHeader title="Cumplimiento" />
      {children}
    </>
  )
}

import AdminHeader from '../AdminHeader'

export default function CasosLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminHeader title="Casos" />
      {children}
    </>
  )
}

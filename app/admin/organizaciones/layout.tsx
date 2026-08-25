import AdminHeader from '../AdminHeader'

export default function OrganizacionesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminHeader title="Organizaciones" />
      {children}
    </>
  )
}

import AdminHeader from '../AdminHeader'

export default function AsignacionLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminHeader title="Asignación" />
      {children}
    </>
  )
}

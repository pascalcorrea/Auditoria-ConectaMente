import AdminHeader from '../AdminHeader'

export default function ComunicacionesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminHeader title="Comunicaciones" />
      {children}
    </>
  )
}

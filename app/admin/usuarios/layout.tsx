import AdminHeader from '../AdminHeader'

export default function UsuariosLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminHeader title="Usuarios" />
      {children}
    </>
  )
}

import AdminHeader from '../AdminHeader'
import Link from 'next/link'

export default function ContableLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminHeader title="Contabilidad" />
      <div className="flex-1 overflow-auto p-7">
        <div className="mb-6 flex gap-2 border-b border-brand-borderSoft pb-4">
          <Link href="/admin/contable/pagos-medicos">
            <span className="inline-block rounded-lg border border-transparent px-3 py-2 text-sm font-medium text-brand-text hover:border-brand-borderSoft hover:bg-brand-bg">
              Pagos a médicos
            </span>
          </Link>
          <Link href="/admin/contable/facturacion">
            <span className="inline-block rounded-lg border border-transparent px-3 py-2 text-sm font-medium text-brand-text hover:border-brand-borderSoft hover:bg-brand-bg">
              Facturación
            </span>
          </Link>
        </div>
        {children}
      </div>
    </>
  )
}

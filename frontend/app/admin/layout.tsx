import AdminHeader from './components/AdminHeader'
import AuthProtection from './components/AuthProtection'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProtection>
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />
        <main>{children}</main>
      </div>
    </AuthProtection>
  )
}

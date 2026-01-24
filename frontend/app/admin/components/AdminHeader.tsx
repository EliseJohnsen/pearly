'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AdminHeader() {
  const pathname = usePathname()

  const navItems = [
    { href: '/preview', label: 'Opprett mønster / produkt' },
    { href: '/admin/patterns', label: 'Mønstre' },
    { href: '/admin/orders', label: 'Bestillinger' },
  ]

  return (
    <header className="bg-white border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center space-x-8">
          <div className="flex-shrink-0">
            <span className="text-xl font-bold text-gray-900">Admin</span>
          </div>
          <div className="flex space-x-4">
            {navItems.map((item) => {
              const isActive = pathname?.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>
    </header>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Dialog,
  DialogPanel,
} from '@headlessui/react'
import {
  Bars3Icon,
  XMarkIcon,
  ShoppingBagIcon,
} from '@heroicons/react/24/outline'
import { useCart } from '@/app/contexts/CartContext'
import { useNavigationByType } from '@/app/hooks/useSanityData'
import { useUIString } from '@/app/hooks/useSanityData'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { data: mainNav, loading: mainNavLoading } = useNavigationByType('main')
  const { data: ctaNav, loading: ctaNavLoading } = useNavigationByType('cta')
  const { totalItems } = useCart()

  const openMainMenuText = useUIString('open_main_menu')
  const loadingText = useUIString('loading')

  return (
    <header className="bg-primary">
      <nav aria-label="Global" className="mx-auto max-w-7xl px-4 py-2 md:p-4 lg:px-8">
        <div className="flex items-center justify-between md:justify-start md:gap-8">
          {/* Hamburger menu - mobile only, far left */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden -m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-primary-light"
          >
            <span className="sr-only">{openMainMenuText}</span>
            <Bars3Icon aria-hidden="true" className="size-6" />
          </button>

          {/* Logo - far left on desktop, center on mobile */}
          <div className="flex-1 md:flex-none flex justify-center md:justify-start h-auto">
            <Link href="/">
              <img
                src="/Pearly_navnetrekk 1.svg"
                alt="Pearly logo"
                className="h-12 md:h-18"

              />
            </Link>
          </div>

          {/* Desktop nav + shopping bag - hidden on mobile */}
          <div className="hidden md:flex md:flex-1 md:items-center md:justify-end md:gap-6">
            {mainNavLoading ? (
              <div className="text-sm/6 font-semibold text-gray-900">{loadingText}</div>
            ) : mainNav ? (
              mainNav.map((item) => (
                <Link
                  key={item._id}
                  href={item.href || '/'}
                  className={`text-sm/6 font-semibold text-white underline-offset-4 hover:underline ${pathname === item.href ? 'underline' : ''}`}
                >
                  {item.title.toUpperCase()}
                </Link>
              ))
            ) : null}
            <Link href="/handlekurv" className="relative text-white hover:underline">
              <ShoppingBagIcon className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary-red text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Link>
          </div>

          {/* Shopping bag - mobile only, far right */}
          <Link href="/handlekurv" className="md:hidden relative text-primary-light hover:text-white transition-colors">
            <ShoppingBagIcon className="w-6 h-6" />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary-red text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {totalItems > 9 ? '9+' : totalItems}
              </span>
            )}
          </Link>
        </div>
      </nav>

      {/* Mobile menu */}
      <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="lg:hidden">
        <div className="fixed inset-0 z-50" />
        <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white p-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
          <div className="flex items-center justify-between">
            <Link href="/" className="-m-1.5 p-1.5">
              <span className="text-2xl font-bold text-primary-red">Feel pearly</span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="-m-2.5 rounded-md p-2.5 text-gray-700"
            >
              <span className="sr-only">Close menu</span>
              <XMarkIcon aria-hidden="true" className="size-6" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-gray-500/10">
              <div className="space-y-2 py-6">
                {/* Main navigation in mobile */}
                {!mainNavLoading && mainNav && mainNav.map((item) => (
                  <Link
                    key={item._id}
                    href={item.href || '/'}
                    onClick={() => setMobileMenuOpen(false)}
                    className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
                  >
                    {item.title}
                  </Link>
                ))}

                {/* CTA navigation in mobile */}
                {!ctaNavLoading && ctaNav && ctaNav.map((item) => (
                  <Link
                    key={item._id}
                    href={item.href || '/'}
                    onClick={() => setMobileMenuOpen(false)}
                    className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
                  >
                    {item.title}
                  </Link>
                ))}

                {/* Cart link in mobile */}
                <Link
                  href="/handlekurv"
                  onClick={() => setMobileMenuOpen(false)}
                  className="-mx-3 flex items-center gap-2 rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
                >
                  <ShoppingBagIcon className="w-5 h-5" />
                  Handlekurv
                  {totalItems > 0 && (
                    <span className="bg-primary-red text-white text-xs font-bold rounded-full px-2 py-0.5">
                      {totalItems}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </div>
        </DialogPanel>
      </Dialog>
    </header>
  )
}

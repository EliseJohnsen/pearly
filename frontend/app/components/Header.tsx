'use client'

import { useState, useEffect } from 'react'
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
  ChevronRightIcon,
} from '@heroicons/react/24/outline'
import { useCart } from '@/app/contexts/CartContext'
import { useNavigationByType, useUIString } from '@/app/hooks/useSanityData'

interface HeaderProps {
  startTransparent?: boolean
}

export default function Header({ startTransparent = false }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [visible, setVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [scrollUpDistance, setScrollUpDistance] = useState(0)
  const [atTop, setAtTop] = useState(true)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setAtTop(currentScrollY < 10)
      if (currentScrollY < 10) {
        setVisible(true)
        setScrollUpDistance(0)
      } else if (currentScrollY > lastScrollY) {
        setVisible(false)
        setScrollUpDistance(0)
      } else {
        const distance = scrollUpDistance + (lastScrollY - currentScrollY)
        setScrollUpDistance(distance)
        if (distance > 60) setVisible(true)
      }
      setLastScrollY(currentScrollY)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY, scrollUpDistance])
  const pathname = usePathname()
  const { data: mainNav, loading: mainNavLoading } = useNavigationByType('main')
  const { data: ctaNav, loading: ctaNavLoading } = useNavigationByType('cta')
  const { totalItems } = useCart()

  const openMainMenuText = useUIString('open_main_menu')
  const loadingText = useUIString('loading')

  return (
    <>
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${visible ? 'translate-y-0' : '-translate-y-full'} ${startTransparent && atTop ? 'bg-transparent' : 'bg-primary'}`}>
      <nav aria-label="Global" className="mx-auto max-w-[95rem] px-4 py-2 md:py-0 md:h-[74px] lg:px-8">
        <div className="flex items-center justify-between md:justify-start md:gap-8 md:h-full">
          {/* Hamburger/Close button - mobile only, far left */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden -m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-white"
          >
            <span className="sr-only">{openMainMenuText}</span>
            <span className="relative w-6 h-6">
              <Bars3Icon className={`absolute inset-0 size-6 transition-all duration-300 ${mobileMenuOpen ? 'opacity-0 rotate-90' : 'opacity-100 rotate-0'}`} />
              <XMarkIcon className={`absolute inset-0 size-6 transition-all duration-300 ${mobileMenuOpen ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'}`} />
            </span>
          </button>

          {/* Logo - far left on desktop, center on mobile */}
          <div className="flex-1 md:flex-none flex justify-center md:justify-start h-auto">
            <Link href="/">
              <img
                src="/Pearly_navnetrekk 1.svg"
                alt="Pearly logo"
                className="h-12 md:h-[48px]"
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
                  className={`text-base font-semibold text-white underline-offset-4 hover:underline ${pathname === item.href ? 'underline' : ''}`}
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
          <Link href="/handlekurv" className="md:hidden relative text-white transition-colors">
            <ShoppingBagIcon className="w-6 h-6" />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary-red text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {totalItems > 9 ? '9+' : totalItems}
              </span>
            )}
          </Link>
        </div>
      </nav>

      {/* Mobile menu - slides in from left, below header */}
      <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="md:hidden">
        {/* Dark overlay - only covers the right strip */}
        <div className="fixed inset-0 top-16 bg-black/30 z-40" aria-hidden="true" />
        <DialogPanel transition className="fixed top-16 left-0 bottom-0 z-50 w-[85%] max-w-sm overflow-y-auto bg-white shadow-2xl transition-transform ease-in-out duration-300 data-[closed]:-translate-x-full">
          <nav>
            {/* Main navigation */}
            {!mainNavLoading && mainNav && mainNav.map((item) => (
              <Link
                key={item._id}
                href={item.href || '/'}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-6 py-5 border-b border-gray-200 text-sm font-bold tracking-widest text-gray-900 uppercase hover:bg-gray-50 active:bg-gray-100"
              >
                {item.title}
                <ChevronRightIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </Link>
            ))}

            {/* CTA navigation */}
            {!ctaNavLoading && ctaNav && ctaNav.map((item) => (
              <Link
                key={item._id}
                href={item.href || '/'}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-6 py-5 border-b border-gray-200 text-sm font-bold tracking-widest text-gray-900 uppercase hover:bg-gray-50 active:bg-gray-100"
              >
                {item.title}
                <ChevronRightIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </Link>
            ))}
          </nav>
        </DialogPanel>
      </Dialog>
    </header>
    {!startTransparent && <div className="h-16 md:h-[74px]" />}
    </>
  )
}

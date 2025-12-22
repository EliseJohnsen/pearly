'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Dialog,
  DialogPanel,
} from '@headlessui/react'
import {
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import {useNavigationByType} from '@/app/hooks/useSanityData'
import {useUIString} from '@/app/hooks/useSanityData'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const {data: mainNav, loading: mainNavLoading} = useNavigationByType('main')
  const {data: ctaNav, loading: ctaNavLoading} = useNavigationByType('cta')

  const openMainMenuText = useUIString('open_main_menu')
  const loadingText = useUIString('loading')
  const feelingPearlyText = useUIString('feelin_pearly')

  return (
    <header className="bg-primary">
      <nav aria-label="Global" className="mx-auto grid grid-cols-7 gap-4 max-w-7xl items-center justify-between p-6 lg:px-8">
        <div className="col-span-2">
          <div className="justify-evenly hidden lg:flex">
            {/* Main navigation items */}
            {mainNavLoading ? (
              <div className="text-sm/6 font-semibold text-gray-900">{ loadingText }</div>
            ) : mainNav && mainNav.length > 0 ? (
              mainNav
                .filter((item) => item.order <= 2)
                .map((item) => (
                <Link
                  key={item._id}
                  href={item.href || '/'}
                  className="text-sm/6 font-semibold text-primary-light hover:text-white transition-colors"
                >
                  {item.title.toUpperCase()}
                </Link>
              ))
            ) : null}
          </div>
        </div>

        <div className="items-center col-span-3 justify-items-center">

          <h1 className='text-7xl font-bold tracking-tight text-primary-light leading-tight'>
            <Link href="/">
              { feelingPearlyText }
            </Link>
          </h1>

          {!ctaNavLoading && ctaNav && ctaNav.length > 0 && ctaNav.map((item) => (
            <Link
              key={item._id}
              href={item.href || '/'}
              className={`text-sm/6 font-semibold ${
                item.variant === 'primary'
                  ? 'bg-primary-red text-white px-4 py-2 rounded-md hover:bg-primary-red/90'
                  : 'text-gray-900 hover:text-gray-700'
              } transition-colors`}
            >
              {item.title}
            </Link>
          ))}
        </div>
        <div className="col-span-2 sm:justify-end">
          <div className="flex justify-evenly hidden lg:flex">
            {mainNavLoading ? (
              <div className="text-sm/6 font-semibold text-gray-900">{ loadingText }</div>
            ) : mainNav && mainNav.length > 2 ? (
              mainNav
                .filter((item) => item.order > 2)
                .map((item) => (
                  <Link
                    key={item._id}
                    href={item.href || '/'}
                    className="text-sm/6 font-semibold text-primary-light hover:text-white transition-colors"
                  >
                    {item.title.toUpperCase()}
                  </Link>
                ))
            ) : null}
          </div>
          <div className="lg:hidden float-end">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
            >
              <span className="sr-only">{ openMainMenuText }</span>
              <Bars3Icon aria-hidden="true" className="size-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="lg:hidden">
        <div className="fixed inset-0 z-50" />
        <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white p-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
          <div className="flex items-center justify-between">
            <Link href="/" className="-m-1.5 p-1.5">
              <span className="text-2xl font-bold text-primary-red">feelin pearly</span>
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
              </div>
            </div>
          </div>
        </DialogPanel>
      </Dialog>
    </header>
  )
}

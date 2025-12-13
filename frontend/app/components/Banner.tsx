import { XMarkIcon } from '@heroicons/react/20/solid'

export default function Banner() {
  return (
    <div className="relative isolate flex items-center gap-x-6 overflow-hidden bg-primary-dark-pink px-6 py-2.5 sm:px-3.5 sm:before:flex-1">
      <div className="flex flex-auto items-center gap-x-4 gap-y-2">
        <p className="text-sm/6 text-color-primary-red font-bold">
          Inspirasjon
        </p>
      </div>
    </div>
  )
}

import { CloudArrowUpIcon, LockClosedIcon, ServerIcon } from '@heroicons/react/20/solid'
import Image from 'next/image'

export default function Example() {
  return (
    <div className="overflow-hidden bg-background">
      <div className="">
        <div className="lg:max-w-none">
          <div className="relative">
            <div className="absolute top-1/2 left-12 -translate-y-1/4 bg-primary-pink p-8 rounded-xl shadow-2xl max-w-md">
              <p className="text-5xl lg:text-7xl font-semibold tracking-tight text-primary-red leading-tight">
                Get your hands pearly
              </p>
            </div>
            <Image
              alt="beads"
              src="/images/unicorn.png"
              width={2432}
              height={1442}
              className="justify-self-end w-3/4 max-w-none shadow-xl ring-1 ring-gray-400/10"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import {useUIString, useUIStringsByCategory} from '@/app/hooks/useSanityData'

/**
 * Example component showing how to use UI strings from Sanity
 *
 * Usage:
 * 1. In Sanity Studio, create UI strings with keys like "forms.submit", "buttons.cancel", etc.
 * 2. Add both Norwegian (nb) and English (en) versions
 * 3. Use the useUIString hook to fetch individual strings by key
 * 4. Use the useUIStringsByCategory hook to fetch all strings in a category
 */
export default function UIStringExample() {
  // Fetch a single UI string by key
  const submitText = useUIString('forms.submit')
  const cancelText = useUIString('buttons.cancel')

  // Fetch all strings in a category
  const {data: formStrings, loading} = useUIStringsByCategory('forms')

  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="font-bold mb-2">Individual UI Strings:</h3>
        <button className="px-4 py-2 bg-blue-500 text-white rounded mr-2">
          {submitText}
        </button>
        <button className="px-4 py-2 bg-gray-300 text-gray-700 rounded">
          {cancelText}
        </button>
      </div>

      <div>
        <h3 className="font-bold mb-2">All strings in "forms" category:</h3>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <ul className="list-disc pl-5">
            {formStrings?.map((string) => (
              <li key={string._id}>
                <span className="font-mono text-sm">{string.key}</span>: {string.value}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

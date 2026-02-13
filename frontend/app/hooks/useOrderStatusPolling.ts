'use client'

import { useEffect, useState, useRef } from 'react'

export interface OrderStatus {
  order_id: number
  order_number: string
  status: string
  payment_status: string
  total_amount: number | null
  currency: string | null
}

interface UseOrderStatusPollingResult {
  orderStatus: OrderStatus | null
  loading: boolean
  error: string | null
  timedOut: boolean
}

const TIMEOUT_MS = 15000 // 15 seconds
const getPollingInterval = (attemptCount: number): number => {
  if (attemptCount <= 2) return 500
  if (attemptCount <= 4) return 1000
  if (attemptCount <= 7) return 2000
  if (attemptCount <= 12) return 3000
  return 5000
}

export function useOrderStatusPolling(
  reference: string | null
): UseOrderStatusPollingResult {
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timedOut, setTimedOut] = useState(false)

  const attemptCountRef = useRef(0)
  const startTimeRef = useRef<number>(Date.now())
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!reference) {
      setError('Mangler ordrereferanse')
      setLoading(false)
      return
    }

    // Reset state when reference changes
    setOrderStatus(null)
    setLoading(true)
    setError(null)
    setTimedOut(false)
    attemptCountRef.current = 0
    startTimeRef.current = Date.now()

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    let isCancelled = false

    const fetchStatus = async (): Promise<void> => {
      if (isCancelled) return

      // Check if timeout has been reached
      const elapsed = Date.now() - startTimeRef.current
      if (elapsed >= TIMEOUT_MS) {
        setTimedOut(true)
        setLoading(false)
        return
      }

      attemptCountRef.current += 1

      try {
        const response = await fetch(`${apiUrl}/api/checkout/${reference}`)

        if (!response.ok) {
          throw new Error('Kunne ikke hente ordrestatus')
        }

        const data: OrderStatus = await response.json()

        if (isCancelled) return

        setOrderStatus(data)

        // Stop polling if payment status is no longer pending
        if (data.payment_status !== 'pending') {
          setLoading(false)
          return
        }

        // Schedule next poll with exponential backoff
        const interval = getPollingInterval(attemptCountRef.current)
        pollingIntervalRef.current = setTimeout(() => {
          fetchStatus()
        }, interval)
      } catch (err) {
        if (isCancelled) return

        console.error('Error fetching order status:', err)
        setError(err instanceof Error ? err.message : 'En feil oppstod')
        setLoading(false)
      }
    }

    // Set up global timeout
    timeoutRef.current = setTimeout(() => {
      isCancelled = true
      if (pollingIntervalRef.current) {
        clearTimeout(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      setTimedOut(true)
      setLoading(false)
    }, TIMEOUT_MS)

    // Start polling
    fetchStatus()

    // Cleanup on unmount
    return () => {
      isCancelled = true
      if (pollingIntervalRef.current) {
        clearTimeout(pollingIntervalRef.current)
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [reference])

  return { orderStatus, loading, error, timedOut }
}

/**
 * Get session token from cookie
 */
export function getSessionToken(): string | null {
  if (typeof document === 'undefined') {
    return null
  }

  const cookies = document.cookie.split(';')
  const sessionCookie = cookies.find(cookie => cookie.trim().startsWith('session_token='))

  if (!sessionCookie) {
    return null
  }

  return sessionCookie.split('=')[1]
}

/**
 * Create authenticated fetch headers
 */
export function getAuthHeaders(): HeadersInit {
  const token = getSessionToken()

  if (!token) {
    return {
      'Content-Type': 'application/json',
    }
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}

/**
 * Authenticated fetch wrapper
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = getAuthHeaders()

  return fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  })
}

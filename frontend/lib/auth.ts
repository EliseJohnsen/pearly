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
 * Note: Does not set Content-Type - let the browser set it automatically
 * based on the body type (e.g., multipart/form-data for FormData)
 */
export function getAuthHeaders(): HeadersInit {
  const token = getSessionToken()

  if (!token) {
    return {}
  }

  return {
    'Authorization': `Bearer ${token}`,
  }
}

/**
 * Authenticated fetch wrapper
 * Automatically includes credentials and authorization headers
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = getAuthHeaders()

  return fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      ...headers,
      ...options.headers,
    },
  })
}

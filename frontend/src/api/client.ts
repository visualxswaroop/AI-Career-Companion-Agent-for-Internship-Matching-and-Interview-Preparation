// ─────────────────────────────────────────────────────────────────────────────
// Centralized API Client
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

export class ApiRequestError extends Error {
  status: number
  detail: any

  constructor(status: number, message: string, detail?: any) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.detail = detail
  }
}

export function formatErrorMessage(err: unknown): string {
  if (err instanceof ApiRequestError) {
    if (typeof err.detail === 'string') {
      return err.detail
    }
    if (Array.isArray(err.detail)) {
      return err.detail.map(d => d.msg || d.message || JSON.stringify(d)).join(', ')
    }
    return err.message
  }
  if (err instanceof Error) {
    return err.message
  }
  return 'An unexpected network error occurred. Please try again.'
}

interface RequestOptions extends RequestInit {
  token?: string | null
}

export async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers = {}, ...rest } = options

  const fullUrl = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  }

  if (token) {
    reqHeaders['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(fullUrl, {
    headers: reqHeaders,
    ...rest,
  })

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T
  }

  let data: any = null
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json()
    } catch {
      data = null
    }
  } else {
    try {
      const text = await response.text()
      data = text ? { message: text } : null
    } catch {
      data = null
    }
  }

  if (!response.ok) {
    const errorMsg =
      (data && (typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail))) ||
      (data && data.message) ||
      `Request failed with status ${response.status}`

    throw new ApiRequestError(response.status, errorMsg, data?.detail)
  }

  return data as T
}

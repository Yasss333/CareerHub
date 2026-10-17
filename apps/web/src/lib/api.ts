const getToken = (): string => localStorage.getItem('token') || ''

export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
}

export async function api<T = any>(path: string, options: ApiOptions = {}): Promise<T> {
  const token = getToken()
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData
  const headers: Record<string, string> = isFormData ? {} : { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`/api${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body !== undefined ? (isFormData ? options.body as FormData : JSON.stringify(options.body)) : undefined,
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error((data && (data.message || data.error)) || `Request failed (${response.status})`)
  }

  return data as T
}

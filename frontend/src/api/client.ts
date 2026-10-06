type QueryValue = string | number | null | undefined
export type QueryParams = Record<string, QueryValue>

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

interface RequestOptions {
  method?: HttpMethod
  params?: QueryParams
  body?: unknown
}

interface ValidationIssue {
  loc: (string | number)[]
  msg: string
}

export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: Record<string, string>

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

export function buildQueryString(params: QueryParams): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    search.append(key, String(value))
  }
  const query = search.toString()
  return query ? `?${query}` : ''
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', params = {}, body } = options
  const response = await fetch(buildRequestUrl(path, params), buildRequestInit(method, body))
  if (!response.ok) throw await toApiError(response)
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

function buildRequestUrl(path: string, params: QueryParams): string {
  // Read per call so the base URL can differ between environments and tests.
  const baseUrl = import.meta.env.VITE_API_URL ?? ''
  return `${baseUrl}${path}${buildQueryString(params)}`
}

function buildRequestInit(method: HttpMethod, body: unknown): RequestInit {
  if (body === undefined) return { method }
  return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
}

async function toApiError(response: Response): Promise<ApiError> {
  const detail = await readErrorDetail(response)
  if (typeof detail === 'string') return new ApiError(response.status, detail)
  if (isValidationIssueList(detail)) {
    return new ApiError(response.status, detail[0].msg, mapFieldErrors(detail))
  }
  return new ApiError(response.status, `Request failed with status ${response.status}`)
}

async function readErrorDetail(response: Response): Promise<unknown> {
  try {
    const body: unknown = await response.json()
    return typeof body === 'object' && body !== null ? (body as { detail?: unknown }).detail : undefined
  } catch {
    // Proxies and cold starts can return HTML instead of JSON.
    return undefined
  }
}

function isValidationIssueList(detail: unknown): detail is ValidationIssue[] {
  return Array.isArray(detail) && detail.length > 0 && typeof detail[0]?.msg === 'string'
}

function mapFieldErrors(issues: ValidationIssue[]): Record<string, string> {
  const fieldErrors: Record<string, string> = {}
  for (const issue of issues) {
    const field = String(issue.loc.at(-1))
    fieldErrors[field] ??= issue.msg
  }
  return fieldErrors
}

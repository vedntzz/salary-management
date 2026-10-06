import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiRequest, buildQueryString } from './client'

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('buildQueryString', () => {
  it('test_build_query_string_joins_params_with_leading_question_mark', () => {
    // Arrange / Act
    const query = buildQueryString({ country: 'India', page: 2 })

    // Assert
    expect(query).toBe('?country=India&page=2')
  })

  it('test_build_query_string_skips_undefined_null_and_empty_values', () => {
    // Arrange / Act
    const query = buildQueryString({ search: '', country: undefined, department: null, page: 1 })

    // Assert
    expect(query).toBe('?page=1')
  })

  it('test_build_query_string_keeps_zero', () => {
    // Arrange / Act
    const query = buildQueryString({ page: 0 })

    // Assert
    expect(query).toBe('?page=0')
  })

  it('test_build_query_string_returns_empty_string_when_all_values_empty', () => {
    // Arrange / Act
    const query = buildQueryString({ search: '', country: undefined })

    // Assert
    expect(query).toBe('')
  })

  it('test_build_query_string_encodes_special_characters', () => {
    // Arrange / Act
    const query = buildQueryString({ search: 'O\'Neil & co' })

    // Assert
    expect(query).toBe('?search=O%27Neil+%26+co')
  })
})

describe('apiRequest', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    vi.stubEnv('VITE_API_URL', 'http://api.test')
  })

  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('test_api_request_prefixes_path_with_vite_api_url_and_appends_params', async () => {
    // Arrange
    fetchMock.mockResolvedValue(jsonResponse(200, []))

    // Act
    await apiRequest('/api/employees', { params: { country: 'India', search: '' } })

    // Assert
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/api/employees?country=India',
      expect.anything(),
    )
  })

  it('test_api_request_returns_parsed_json_on_success', async () => {
    // Arrange
    fetchMock.mockResolvedValue(jsonResponse(200, { id: 7 }))

    // Act
    const body = await apiRequest<{ id: number }>('/api/employees/7')

    // Assert
    expect(body).toEqual({ id: 7 })
  })

  it('test_api_request_sends_json_body_with_method', async () => {
    // Arrange
    fetchMock.mockResolvedValue(jsonResponse(201, { id: 1 }))

    // Act
    await apiRequest('/api/employees', { method: 'POST', body: { full_name: 'Asha Rao' } })

    // Assert
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.method).toBe('POST')
    expect(init.body).toBe(JSON.stringify({ full_name: 'Asha Rao' }))
    expect(new Headers(init.headers).get('Content-Type')).toBe('application/json')
  })

  it('test_api_request_returns_undefined_for_204_no_content', async () => {
    // Arrange
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))

    // Act
    const body = await apiRequest('/api/employees/7', { method: 'DELETE' })

    // Assert
    expect(body).toBeUndefined()
  })

  it('test_api_request_throws_api_error_with_status_and_detail_on_non_2xx', async () => {
    // Arrange
    fetchMock.mockResolvedValue(jsonResponse(409, { detail: 'Email already exists' }))

    // Act
    const error = await apiRequest('/api/employees', { method: 'POST', body: {} }).catch((e) => e)

    // Assert
    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(409)
    expect(error.message).toBe('Email already exists')
  })

  it('test_api_request_uses_first_validation_message_when_detail_is_a_list', async () => {
    // Arrange
    const detail = [{ loc: ['body', 'email'], msg: 'value is not a valid email address' }]
    fetchMock.mockResolvedValue(jsonResponse(422, { detail }))

    // Act
    const error = await apiRequest('/api/employees', { method: 'POST', body: {} }).catch((e) => e)

    // Assert
    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(422)
    expect(error.message).toBe('value is not a valid email address')
  })

  it('test_api_error_field_errors_maps_422_detail_by_last_loc_element', async () => {
    // Arrange
    const detail = [
      { loc: ['body', 'email'], msg: 'value is not a valid email address' },
      { loc: ['body', 'salary_amount'], msg: 'Input should be greater than 0' },
    ]
    fetchMock.mockResolvedValue(jsonResponse(422, { detail }))

    // Act
    const error = await apiRequest('/api/employees', { method: 'POST', body: {} }).catch((e) => e)

    // Assert
    expect(error.fieldErrors).toEqual({
      email: 'value is not a valid email address',
      salary_amount: 'Input should be greater than 0',
    })
  })

  it('test_api_error_field_errors_is_empty_when_detail_is_a_string', async () => {
    // Arrange
    fetchMock.mockResolvedValue(jsonResponse(409, { detail: 'Email already exists' }))

    // Act
    const error = await apiRequest('/api/employees', { method: 'POST', body: {} }).catch((e) => e)

    // Assert
    expect(error.fieldErrors).toEqual({})
  })

  it('test_api_request_falls_back_to_generic_message_when_body_is_not_json', async () => {
    // Arrange
    fetchMock.mockResolvedValue(
      new Response('<html>Bad Gateway</html>', { status: 502, statusText: 'Bad Gateway' }),
    )

    // Act
    const error = await apiRequest('/api/employees').catch((e) => e)

    // Assert
    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(502)
    expect(error.message).toBe('Request failed with status 502')
  })
})

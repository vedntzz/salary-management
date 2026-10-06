import { describe, expect, it } from 'vitest'
import { ApiError } from '@/api/client'
import { shouldRetryRequest } from './queryClient'

describe('shouldRetryRequest', () => {
  it('test_should_retry_request_never_retries_404', () => {
    // Arrange
    const error = new ApiError(404, 'Employee not found')

    // Act
    const retries = shouldRetryRequest(0, error)

    // Assert
    expect(retries).toBe(false)
  })

  it('test_should_retry_request_never_retries_422', () => {
    // Arrange
    const error = new ApiError(422, 'value is not a valid email address', { email: 'value is not a valid email address' })

    // Act
    const retries = shouldRetryRequest(0, error)

    // Assert
    expect(retries).toBe(false)
  })

  it('test_should_retry_request_retries_500_exactly_once', () => {
    // Arrange
    const error = new ApiError(500, 'Database unavailable')

    // Act
    const decisions = [shouldRetryRequest(0, error), shouldRetryRequest(1, error)]

    // Assert
    expect(decisions).toEqual([true, false])
  })

  it('test_should_retry_request_retries_network_error_exactly_once', () => {
    // Arrange
    const error = new TypeError('Failed to fetch')

    // Act
    const decisions = [shouldRetryRequest(0, error), shouldRetryRequest(1, error)]

    // Assert
    expect(decisions).toEqual([true, false])
  })
})

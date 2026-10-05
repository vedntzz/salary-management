import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('shows the ACME Salary Management heading', () => {
    // Arrange / Act
    render(<App />)

    // Assert
    expect(screen.getByRole('heading', { name: 'ACME Salary Management' })).toBeInTheDocument()
  })
})

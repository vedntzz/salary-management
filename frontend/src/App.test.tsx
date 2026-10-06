import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { createTestQueryClient } from './test/queryClient'

function renderAppAt(path: string) {
  window.history.pushState({}, '', path)
  render(<App queryClient={createTestQueryClient()} />)
}

async function clickSidebarLink(name: string) {
  const sidebar = screen.getByRole('navigation')
  await userEvent.click(within(sidebar).getByRole('link', { name }))
}

describe('App shell', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/')
    // Shell tests only check navigation, so page data can stay loading forever.
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => {})))
  })

  it('test_sidebar_shows_employees_and_insights_links', () => {
    // Arrange / Act
    renderAppAt('/employees')

    // Assert
    const sidebar = screen.getByRole('navigation')
    expect(within(sidebar).getByRole('link', { name: 'Employees' })).toBeInTheDocument()
    expect(within(sidebar).getByRole('link', { name: 'Insights' })).toBeInTheDocument()
  })

  it('test_sidebar_employees_link_renders_employees_page', async () => {
    // Arrange
    renderAppAt('/insights')

    // Act
    await clickSidebarLink('Employees')

    // Assert
    expect(screen.getByRole('heading', { name: 'Employees' })).toBeInTheDocument()
  })

  it('test_sidebar_insights_link_renders_insights_page', async () => {
    // Arrange
    renderAppAt('/employees')

    // Act
    await clickSidebarLink('Insights')

    // Assert
    expect(screen.getByRole('heading', { name: 'Insights' })).toBeInTheDocument()
  })

  it('test_router_redirects_root_to_employees', () => {
    // Arrange / Act
    renderAppAt('/')

    // Assert
    expect(window.location.pathname).toBe('/employees')
    expect(screen.getByRole('heading', { name: 'Employees' })).toBeInTheDocument()
  })

  it('test_router_shows_not_found_for_unknown_route', () => {
    // Arrange / Act
    renderAppAt('/no-such-page')

    // Assert
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  })
})

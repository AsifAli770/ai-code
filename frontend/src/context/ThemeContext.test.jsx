import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import ThemeToggle from '../components/ui/ThemeToggle'
import { ThemeProvider } from './ThemeContext'

const renderToggle = () =>
  render(
    <ThemeProvider>
      <ThemeToggle showLabels />
    </ThemeProvider>,
  )

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
})

describe('ThemeProvider + ThemeToggle', () => {
  it('defaults to the light theme', () => {
    renderToggle()
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(screen.getByRole('radio', { name: /light/i }).getAttribute('aria-checked')).toBe('true')
  })

  it('switches to dark and remembers the choice', () => {
    renderToggle()
    fireEvent.click(screen.getByRole('radio', { name: /dark/i }))
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(localStorage.getItem('mintverse.theme')).toBe('dark')
  })

  it('restores the saved preference on load', () => {
    localStorage.setItem('mintverse.theme', 'dark')
    renderToggle()
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('"system" follows the OS setting (light when it can’t be detected)', () => {
    renderToggle()
    fireEvent.click(screen.getByRole('radio', { name: /system/i }))
    expect(localStorage.getItem('mintverse.theme')).toBe('system')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('ignores an invalid stored value', () => {
    localStorage.setItem('mintverse.theme', 'purple')
    renderToggle()
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })
})

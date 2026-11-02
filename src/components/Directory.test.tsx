import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Directory } from './Directory'
import { UNITS, filterUnits } from '../lib/units'

describe('Directory', () => {
  it('lists every unit and filters by search text', () => {
    const onSelect = vi.fn()
    render(<Directory units={UNITS} selectedId={null} onSelect={onSelect} onClose={() => {}} />)
    expect(screen.getAllByTestId('directory-item')).toHaveLength(UNITS.length)

    fireEvent.change(screen.getByTestId('directory-search'), { target: { value: 'grand isle' } })
    const items = screen.getAllByTestId('directory-item')
    expect(items).toHaveLength(1)
    expect(items[0]).toHaveTextContent('Station Grand Isle')

    fireEvent.click(items[0])
    expect(onSelect).toHaveBeenCalledWith('station-grand-isle')
  })

  it('filters by unit type chips', () => {
    render(<Directory units={UNITS} selectedId={null} onSelect={() => {}} onClose={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Air Station', pressed: false }))
    const items = screen.getAllByTestId('directory-item')
    expect(items.length).toBe(UNITS.filter((u) => u.unitType === 'Air Station').length)
    items.forEach((el) => expect(el).toHaveTextContent('Air Station'))
  })

  it('shows an empty state for no matches', () => {
    render(<Directory units={UNITS} selectedId={null} onSelect={() => {}} onClose={() => {}} />)
    fireEvent.change(screen.getByTestId('directory-search'), { target: { value: 'zzzz' } })
    expect(screen.queryAllByTestId('directory-item')).toHaveLength(0)
    expect(screen.getByText(/No units match/)).toBeInTheDocument()
  })
})

describe('filterUnits', () => {
  it('matches city and state case-insensitively and sorts by name', () => {
    const r = filterUnits(UNITS, { text: 'LA', types: [] })
    expect(r.length).toBeGreaterThanOrEqual(5)
    const names = r.map((u) => u.name)
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)))
  })
})

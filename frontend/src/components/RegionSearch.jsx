import { useEffect, useId, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { geocodePlace } from '../api'
import useDebounce from '../hooks/useDebounce'

export default function RegionSearch({ onSelect }) {
  const listId = useId()
  const containerRef = useRef(null)
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const query = useDebounce(text, 300)

  const { data: options = [], isFetching } = useQuery({
    queryKey: ['geocode', query],
    queryFn: () => geocodePlace(query),
    enabled: open && query.trim().length >= 2,
  })

  useEffect(() => {
    const handleClick = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const choose = (option) => {
    const label = [option.name, option.admin1, option.country].filter(Boolean).join(', ')
    onSelect({ lat: option.lat, lon: option.lon, label })
    setText(label)
    setOpen(false)
  }

  return (
    <div className="region-search" ref={containerRef}>
      <label htmlFor="region-input">Region</label>
      <input
        id="region-input"
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        autoComplete="off"
        placeholder="Search a city, e.g. Phoenix, Chennai, Madrid"
        value={text}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setText(event.target.value)
          setOpen(true)
        }}
      />
      {open && query.trim().length >= 2 && (
        <ul className="region-search-list" id={listId} role="listbox">
          {options.length === 0 && (
            <li className="region-search-empty">{isFetching ? 'Searching...' : 'No matches'}</li>
          )}
          {options.map((option, index) => (
            <li key={`${option.name}-${index}`} role="option">
              <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => choose(option)}>
                <strong>{option.name}</strong>
                <span>{[option.admin1, option.country].filter(Boolean).join(', ')}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

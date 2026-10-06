import type { EmployeeListParams } from '@/api/employees'
import { useDebouncedCallback, useFilterOptions, useTextFollowingUrl, type EmployeeFilterKey } from './hooks'

const SEARCH_DEBOUNCE_MS = 300

const CONTROL_CLASS =
  'h-8 rounded-sm border border-input bg-card px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40'

const FILTERS: { key: EmployeeFilterKey; label: string; optionsKey: 'countries' | 'departments' | 'job_titles' }[] = [
  { key: 'country', label: 'Country', optionsKey: 'countries' },
  { key: 'department', label: 'Department', optionsKey: 'departments' },
  { key: 'job_title', label: 'Title', optionsKey: 'job_titles' },
]

function SearchInput({ urlSearch, onSearch }: { urlSearch: string; onSearch: (search: string) => void }) {
  // Local state keeps typing instant; only the debounced value reaches the URL and the API.
  const [text, setText] = useTextFollowingUrl(urlSearch)
  const sendSearch = useDebouncedCallback(onSearch, SEARCH_DEBOUNCE_MS)
  return (
    <input
      type="search"
      aria-label="Search employees"
      placeholder="Search name, email or code"
      value={text}
      onChange={(event) => {
        setText(event.target.value)
        sendSearch(event.target.value)
      }}
      className={`${CONTROL_CLASS} w-64`}
    />
  )
}

interface FilterSelectProps {
  label: string
  value: string
  values: string[]
  onChange: (value: string) => void
}

function FilterSelect({ label, value, values, onChange }: FilterSelectProps) {
  const id = `filter-${label.toLowerCase()}`
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </label>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className={CONTROL_CLASS}>
        <option value="">All</option>
        {values.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}

interface EmployeeFiltersProps {
  params: EmployeeListParams
  onSearchChange: (search: string) => void
  onFilterChange: (key: EmployeeFilterKey, value: string) => void
}

export function EmployeeFilters({ params, onSearchChange, onFilterChange }: EmployeeFiltersProps) {
  const { data: options } = useFilterOptions()
  return (
    <div className="flex flex-wrap items-end gap-3">
      <SearchInput urlSearch={params.search} onSearch={onSearchChange} />
      {FILTERS.map((filter) => (
        <FilterSelect
          key={filter.key}
          label={filter.label}
          value={params[filter.key]}
          values={options?.[filter.optionsKey] ?? []}
          onChange={(value) => onFilterChange(filter.key, value)}
        />
      ))}
    </div>
  )
}

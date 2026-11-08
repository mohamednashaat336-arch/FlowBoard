import { Search } from 'lucide-react'

export default function SearchInput({ label = 'Search', className = '', ...props }) {
  return (
    <label className={`fb-search ${className}`.trim()}>
      <span className="visually-hidden">{label}</span>
      <Search className="fb-search__icon" aria-hidden="true" />
      <input className="form-control" type="search" placeholder={label} {...props} />
    </label>
  )
}

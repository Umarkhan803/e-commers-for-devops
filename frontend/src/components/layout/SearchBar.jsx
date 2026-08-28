import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CornerDownLeft, Loader2, Search, TrendingUp, X } from 'lucide-react'
import { fetchSuggestions } from '../../api/products'
import { useAsyncData, useDebouncedValue } from '../../hooks/useAsyncData'
import { cn, formatPrice } from '../../lib/utils'

const TRENDING = ['AirPods', 'Galaxy', 'Smartwatch', 'Earbuds', 'MacBook']

/**
 * Header search with live suggestions from `GET /products/suggest`. Keystrokes
 * are debounced and each new request aborts the last, so the list never flickers
 * back to a stale result.
 */
export default function SearchBar({ className, autoFocus = false, onNavigate }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  const debouncedQuery = useDebouncedValue(query.trim(), 200)

  const { data, isLoading } = useAsyncData(
    (signal) => fetchSuggestions(debouncedQuery, { signal }),
    [debouncedQuery],
    { skip: debouncedQuery.length === 0 },
  )

  const results = debouncedQuery.length === 0 ? [] : (data?.products ?? [])

  useEffect(() => {
    setHighlight(0)
  }, [debouncedQuery])

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  const go = (path) => {
    setOpen(false)
    inputRef.current?.blur()
    onNavigate?.()
    navigate(path)
  }

  const submitSearch = () => {
    if (!query.trim()) return
    go(`/shop?q=${encodeURIComponent(query.trim())}`)
  }

  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setHighlight((current) => Math.min(current + 1, results.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlight((current) => Math.max(current - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const target = results[highlight]
      if (open && target) go(`/product/${target.slug}`)
      else submitSearch()
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div
        className={cn(
          'flex h-11 items-center gap-2 rounded-lg border bg-ink-50 px-3.5 transition-all duration-150',
          open
            ? 'border-brand-600 bg-white shadow-[inset_0_0_0_1px_var(--color-brand-600)]'
            : 'border-transparent hover:bg-ink-100',
        )}
      >
        <Search className="size-4 shrink-0 text-ink-400" aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          autoFocus={autoFocus}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search products, brands and categories"
          aria-label="Search products"
          aria-expanded={open}
          aria-controls="search-suggestions"
          role="combobox"
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {isLoading && query ? (
          <Loader2 className="size-3.5 shrink-0 animate-spin text-ink-400" aria-hidden="true" />
        ) : null}
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              inputRef.current?.focus()
            }}
            aria-label="Clear search"
            className="rounded-lg p-1 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
          >
            <X className="size-3.5" />
          </button>
        ) : (
          <kbd className="hidden shrink-0 rounded border border-ink-200 bg-ink-50 px-1.5 py-0.5 text-[0.625rem] font-semibold text-ink-400 lg:block">
            /
          </kbd>
        )}
      </div>

      {open ? (
        <div
          id="search-suggestions"
          role="listbox"
          className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-lg bg-white shadow-pop animate-scale-in"
        >
          {query.trim().length === 0 ? (
            <div className="p-4">
              <p className="mb-2.5 flex items-center gap-1.5 text-[0.6875rem] font-bold uppercase tracking-wider text-ink-400">
                <TrendingUp className="size-3.5" />
                Trending searches
              </p>
              <div className="flex flex-wrap gap-2">
                {TRENDING.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => go(`/shop?q=${encodeURIComponent(term)}`)}
                    className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-700 transition hover:border-brand-400 hover:bg-brand-50 hover:text-brand-800"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-6 text-center">
              {isLoading ? (
                <p className="text-sm text-ink-500">Searching…</p>
              ) : (
                <>
                  <p className="text-sm font-semibold text-ink-800">No matches for “{query}”</p>
                  <p className="mt-1 text-xs text-ink-500">
                    Check the spelling or try a broader term like “audio”.
                  </p>
                </>
              )}
            </div>
          ) : (
            <>
              <ul className="max-h-[22rem] overflow-y-auto py-2">
                {results.map((product, index) => (
                  <li key={product.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={index === highlight}
                      onMouseEnter={() => setHighlight(index)}
                      onClick={() => go(`/product/${product.slug}`)}
                      className={cn(
                        'flex w-full items-center gap-3 px-3 py-2.5 text-left transition',
                        index === highlight ? 'bg-brand-50' : 'hover:bg-ink-50',
                      )}
                    >
                      <img
                        src={product.image}
                        alt=""
                        className="size-11 shrink-0 rounded-lg border border-ink-100 bg-white object-contain p-1"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-ink-900">
                          {product.name}
                        </span>
                        <span className="block text-xs text-ink-400">
                          {product.brand} · {product.categoryName}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm font-bold text-ink-900">
                        {formatPrice(product.price)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={submitSearch}
                className="flex w-full items-center justify-between gap-2 border-t border-ink-100 bg-ink-50/70 px-4 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
              >
                See all results for “{query}”
                <CornerDownLeft className="size-4" />
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}

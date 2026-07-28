import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Runs an async producer and tracks its loading and error state, aborting the
 * in-flight request whenever the dependencies change so a slow response can
 * never overwrite a newer one.
 *
 * @param producer  receives an AbortSignal, returns a promise
 * @param deps      re-runs when these change
 * @param options.initialData  value returned before the first resolve
 * @param options.skip         when true, no request is made
 */
export function useAsyncData(producer, deps, { initialData = null, skip = false } = {}) {
  const [data, setData] = useState(initialData)
  const [error, setError] = useState(null)
  const [isLoading, setLoading] = useState(!skip)
  const [reloadToken, setReloadToken] = useState(0)

  const producerRef = useRef(producer)
  producerRef.current = producer

  useEffect(() => {
    if (skip) {
      setLoading(false)
      return undefined
    }

    const controller = new AbortController()
    let active = true

    setLoading(true)
    setError(null)

    producerRef
      .current(controller.signal)
      .then((result) => {
        if (active) {
          setData(result)
          setLoading(false)
        }
      })
      .catch((caught) => {
        // An abort is an intentional cancellation, not a failure to report.
        if (!active || controller.signal.aborted || caught.name === 'AbortError') return
        setError(caught)
        setLoading(false)
      })

    return () => {
      active = false
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, skip, reloadToken])

  const reload = useCallback(() => setReloadToken((token) => token + 1), [])

  return { data, error, isLoading, reload, setData }
}

/** Delays a rapidly-changing value so it can drive network requests. */
export function useDebouncedValue(value, delay = 250) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

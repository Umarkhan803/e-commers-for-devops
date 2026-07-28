import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import * as account from '../api/account'
import { readStorage, writeStorage } from '../lib/utils'
import { useAuth } from './AuthContext'

const STORAGE_KEY = 'nova.wishlist.v1'

const WishlistContext = createContext(null)

/**
 * Saved items live on the account once signed in, and in localStorage before
 * that. Guest entries keep both the id and the slug so they can be pushed to the
 * server on sign-in — the API addresses products by slug, the UI checks by id.
 */
export function WishlistProvider({ children }) {
  const { isAuthenticated, isRestoring } = useAuth()

  const [entries, setEntries] = useState(() => readStorage(STORAGE_KEY, []))
  const [products, setProducts] = useState([])
  const mergedFor = useRef(null)

  useEffect(() => {
    if (!isAuthenticated) writeStorage(STORAGE_KEY, entries)
  }, [entries, isAuthenticated])

  useEffect(() => {
    if (isRestoring) return

    if (!isAuthenticated) {
      setProducts([])
      mergedFor.current = null
      return
    }

    let active = true

    const sync = async () => {
      try {
        // Hand any guest saves to the account, then take the server as truth.
        const pending = readStorage(STORAGE_KEY, [])
        if (pending.length && mergedFor.current !== 'done') {
          await Promise.allSettled(
            pending.map((entry) => account.addToWishlist(entry.slug)).filter(Boolean),
          )
          writeStorage(STORAGE_KEY, [])
          mergedFor.current = 'done'
        }

        const saved = await account.fetchWishlist()
        if (!active) return
        setProducts(saved)
        setEntries(saved.map((product) => ({ id: product.id, slug: product.slug })))
      } catch {
        /* leave the local list alone if the account cannot be reached */
      }
    }

    sync()
    return () => {
      active = false
    }
  }, [isAuthenticated, isRestoring])

  /** @returns {Promise<boolean>} true when the product ended up saved. */
  const toggle = useCallback(
    async (product) => {
      const identifier = typeof product === 'string' ? product : product.id
      const slug = typeof product === 'string' ? product : product.slug
      const isSaved = entries.some((entry) => entry.id === identifier || entry.slug === slug)

      if (isAuthenticated) {
        try {
          const saved = isSaved
            ? await account.removeFromWishlist(slug)
            : await account.addToWishlist(slug)
          setProducts(saved)
          setEntries(saved.map((entry) => ({ id: entry.id, slug: entry.slug })))
          return !isSaved
        } catch {
          return isSaved
        }
      }

      setEntries((current) =>
        isSaved
          ? current.filter((entry) => entry.id !== identifier && entry.slug !== slug)
          : [...current, { id: identifier, slug }],
      )
      return !isSaved
    },
    [entries, isAuthenticated],
  )

  const has = useCallback(
    (identifier) => entries.some((entry) => entry.id === identifier || entry.slug === identifier),
    [entries],
  )

  const value = useMemo(
    () => ({ entries, products, count: entries.length, toggle, has }),
    [entries, products, toggle, has],
  )

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (!context) throw new Error('useWishlist must be used inside <WishlistProvider>')
  return context
}

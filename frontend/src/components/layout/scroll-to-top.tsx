import { useEffect } from "react"
import { useLocation } from "react-router-dom"

/** Scroll window to top on every client-side route change. */
export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

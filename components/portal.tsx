"use client"

import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'

export function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const portalRoot = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const div = document.createElement('div')
    div.className = 'portal-root'
    document.body.appendChild(div)
    portalRoot.current = div
    setMounted(true)

    return () => {
      if (div && document.body.contains(div)) {
        document.body.removeChild(div)
      }
    }
  }, [])

  return mounted && portalRoot.current ? createPortal(children, portalRoot.current) : null
} 
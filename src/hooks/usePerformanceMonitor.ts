"use client"

import { useEffect, useRef } from "react"

export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0)
  const startTime = useRef(Date.now())

  useEffect(() => {
    renderCount.current += 1

    if (process.env.NODE_ENV === "development") {
      console.log(`${componentName} rendered ${renderCount.current} times`)

      // Log render time
      const renderTime = Date.now() - startTime.current
      if (renderTime > 16) {
        // More than 1 frame at 60fps
        console.warn(`${componentName} slow render: ${renderTime}ms`)
      }
    }
  })

  useEffect(() => {
    startTime.current = Date.now()
  })

  return {
    renderCount: renderCount.current,
  }
}

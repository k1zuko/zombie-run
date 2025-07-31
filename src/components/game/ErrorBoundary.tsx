"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Game Error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-red-900" />
          <div className="relative z-10 max-w-md mx-auto p-4">
            <Card className="bg-black/80 backdrop-blur-xl border border-red-800/50">
              <CardContent className="p-6 text-center">
                <div className="text-6xl mb-4">💀</div>
                <h2 className="text-2xl font-bold text-white mb-4">Hantu Error Muncul!</h2>
                <p className="text-gray-300 mb-6">
                  Terjadi kesalahan dalam game. Silakan refresh halaman atau kembali ke menu utama.
                </p>
                <div className="space-y-3">
                  <Button
                    onClick={() => window.location.reload()}
                    className="w-full bg-red-800/80 hover:bg-red-700/80 text-white"
                  >
                    🔄 Refresh Game
                  </Button>
                  <Button
                    onClick={() => (window.location.href = "/")}
                    variant="outline"
                    className="w-full bg-black/40 border-red-800/50 text-white hover:bg-red-900/20"
                  >
                    🏠 Kembali ke Menu
                  </Button>
                </div>
                {process.env.NODE_ENV === "development" && this.state.error && (
                  <details className="mt-4 text-left">
                    <summary className="text-red-400 cursor-pointer">Debug Info</summary>
                    <pre className="text-xs text-gray-400 mt-2 overflow-auto">{this.state.error.stack}</pre>
                  </details>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

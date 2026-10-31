import { Component, type ErrorInfo, type ReactNode } from 'react'

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: '',
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'Something went wrong.',
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('UI crash:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <h1 className="font-display text-2xl text-charcoal">
            Something went wrong
          </h1>
          <p className="mt-2 text-sm text-muted">{this.state.message}</p>
          <button
            type="button"
            className="mt-6 rounded-xl bg-charcoal px-4 py-2 text-sm text-warm-white"
            onClick={() => {
              try {
                localStorage.removeItem('lfi_guest_session_v1')
              } catch {
                // ignore
              }
              window.location.href = '/'
            }}
          >
            Clear session and reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

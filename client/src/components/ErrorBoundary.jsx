import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <h1 className="text-xl font-semibold text-ink">Something went wrong</h1>
        <p className="text-sm text-muted">Reload the page to continue.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong"
        >
          Reload
        </button>
      </div>
    )
  }
}

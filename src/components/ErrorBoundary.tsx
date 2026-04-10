import { Component, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    if (import.meta.env.DEV) {
      console.error('[Talk Foot]', error, info.componentStack ?? '')
    } else {
      console.error('[Talk Foot] erreur applicative (détails masqués en production)')
    }
  }

  render() {
    if (this.state.error) {
      const stack = this.state.error.stack
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-slate-100 p-6">
          <p className="text-lg font-bold text-slate-800">Une erreur s&apos;est produite</p>
          <pre className="max-w-full overflow-auto rounded-lg bg-slate-200 p-4 text-sm text-slate-700">
            {this.state.error.message}
          </pre>
          {import.meta.env.DEV && stack ? (
            <pre className="max-h-[40vh] max-w-full overflow-auto rounded-lg border border-slate-300 bg-white p-4 text-left text-xs text-slate-600">
              {stack}
            </pre>
          ) : null}
          <button
            type="button"
            className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700"
            onClick={() => window.location.reload()}
          >
            Recharger la page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

import { Component, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-slate-100 p-6">
          <p className="text-lg font-bold text-slate-800">Une erreur s'est produite</p>
          <pre className="max-w-full overflow-auto rounded-lg bg-slate-200 p-4 text-sm text-slate-700">
            {this.state.error.message}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

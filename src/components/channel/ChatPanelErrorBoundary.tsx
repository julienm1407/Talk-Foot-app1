import { Component, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  light?: boolean
}

type State = { error: Error | null }

/**
 * Isole les crashs du fil / formulaire tchat : le reste du canal match reste utilisable.
 */
export class ChatPanelErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    if (import.meta.env.DEV) {
      console.error('[Talk Foot] chat panel', error, info.componentStack ?? '')
    } else {
      console.error('[Talk Foot] erreur tchat (détails masqués en production)')
    }
  }

  render() {
    if (this.state.error) {
      const L = this.props.light
      return (
        <div
          className={`rounded-lg border p-3 text-center ${
            L ? 'border-amber-300 bg-amber-50 text-amber-950' : 'border-amber-400/50 bg-[#1a2f45] text-amber-100'
          }`}
          role="alert"
        >
          <p className="text-xs font-bold">Le tchat a rencontré un problème d&apos;affichage.</p>
          <p className="mt-1 text-[11px] font-semibold opacity-90">
            Tu peux réessayer sans quitter le match.
          </p>
          {import.meta.env.DEV ? (
            <pre className="mx-auto mt-2 max-h-24 max-w-full overflow-auto rounded bg-black/10 p-2 text-left text-[10px]">
              {this.state.error.message}
            </pre>
          ) : null}
          <button
            type="button"
            className={`mt-2 rounded-lg border px-3 py-1.5 text-[11px] font-bold ${
              L
                ? 'border-amber-500 bg-white text-amber-950 hover:bg-amber-100'
                : 'border-amber-300/70 bg-[#0a1f35] text-amber-100 hover:bg-[#122a42]'
            }`}
            onClick={() => this.setState({ error: null })}
          >
            Réafficher le tchat
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

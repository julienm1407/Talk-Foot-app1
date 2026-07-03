import { Component, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  fallback: ReactNode
}

type State = { crashed: boolean }

/** Un message ou avatar corrompu ne doit pas faire planter tout le fil. */
export class ChatMessageErrorBoundary extends Component<Props, State> {
  state: State = { crashed: false }

  static getDerivedStateFromError() {
    return { crashed: true }
  }

  componentDidCatch(error: Error) {
    if (import.meta.env.DEV) {
      console.warn('[Talk Foot] message chat ignoré (rendu)', error.message)
    }
  }

  render() {
    if (this.state.crashed) return this.props.fallback
    return this.props.children
  }
}

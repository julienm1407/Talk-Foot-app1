export type AdminSectionId =
  | 'overview'
  | 'editorial'
  | 'moderation'
  | 'operations'
  | 'team'
  | 'newsletter'

export type AdminSectionDef = {
  id: AdminSectionId
  label: string
  description: string
}

export const ADMIN_SECTIONS: AdminSectionDef[] = [
  {
    id: 'overview',
    label: 'Vue d’ensemble',
    description: 'Indicateurs clés et actions prioritaires.',
  },
  {
    id: 'editorial',
    label: 'Rédaction',
    description: 'Créer, relire et publier les articles.',
  },
  {
    id: 'moderation',
    label: 'Modération',
    description: 'Commentaires signalés et contenus sensibles.',
  },
  {
    id: 'operations',
    label: 'Opérations',
    description: 'Remboursements Stripe et gestion utilisateurs.',
  },
  {
    id: 'team',
    label: 'Équipe',
    description: 'Rôles éditoriaux et accès rédaction.',
  },
  {
    id: 'newsletter',
    label: 'Newsletter',
    description: 'Campagnes e-mail aux abonnés.',
  },
]

export function refundStatusLabel(status: string): string {
  if (status === 'pending') return 'En attente'
  if (status === 'in_progress') return 'En cours'
  if (status === 'resolved') return 'Résolu'
  if (status === 'rejected') return 'Refusé'
  return status
}

export function stripeDashboardUrl(paymentRef: string | null): string | null {
  if (!paymentRef?.trim()) return null
  const ref = paymentRef.trim()
  if (ref.startsWith('pi_')) {
    return `https://dashboard.stripe.com/payments/${ref}`
  }
  if (ref.startsWith('cs_')) {
    return `https://dashboard.stripe.com/checkout/sessions/${ref}`
  }
  return `https://dashboard.stripe.com/search?query=${encodeURIComponent(ref)}`
}

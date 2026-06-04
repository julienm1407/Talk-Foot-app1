import type { AvatarSlotKey } from '../features/avatar2d/types'
import type { SubscriptionTierId } from '../types/subscription'

export type SubscriptionPlanFeature = {
  id: string
  label: string
  /** Affiché barré / grisé si false */
  included: boolean
  /** Fonctionnalité annoncée mais pas encore codée */
  comingSoon?: boolean
}

export type SubscriptionPlanDefinition = {
  id: SubscriptionTierId
  name: string
  priceLabel: string
  priceCents: number | null
  tagline: string
  accentClass: string
  features: SubscriptionPlanFeature[]
  limits: {
    maxGroupsCreated: number
    maxGroupsJoined: number | null
    maxGroupMembers: number
    maxPublicSalonMembers: number | null
    debatesPerWeek: number | null
    debatesPerDay: number | null
    chatCooldownSeconds: number
    dailyChatMessages: number | null
    monthlyTokens: number
    liveMatchTokensPerHour: number
    betTokenMultiplier: number
    modularAvatarSlots: AvatarSlotKey[] | 'all'
  }
  flags: {
    canCreateDebates: boolean
    canCreateLiveMatch: boolean
    canStreamSalon: boolean
    canJoinVoiceSalons: boolean
    groupThemeCustomization: boolean
    groupEmoteCustomization: boolean
    verifiedBadge: boolean
    vipCosmetics: boolean
    vipSalonAccess: boolean
    noAds: boolean
    ambassadorStatus: boolean
    monthlyTokenGrant: boolean
    unlimitedChatMessages: boolean
    canWriteArticles: boolean
    canCreatePrivateLiveMatches: boolean
    creatorMonetization: boolean
    handRaiseOnLive: boolean
  }
}

/** Catalogue boutique identique pour les 3 formules ; l’écart se joue sur l’acquisition de jetons. */
export const BOUTIQUE_FULL_ACCESS_ALL_TIERS = true

export const SUBSCRIPTION_PLANS: Record<SubscriptionTierId, SubscriptionPlanDefinition> = {
  freemium: {
    id: 'freemium',
    name: 'Freemium',
    priceLabel: 'Gratuit',
    priceCents: null,
    tagline: 'Découvre Talk Foot et rejoins la communauté.',
    accentClass: 'from-slate-600 to-slate-800',
    limits: {
      maxGroupsCreated: 2,
      maxGroupsJoined: 5,
      maxGroupMembers: 200,
      maxPublicSalonMembers: null,
      debatesPerWeek: 0,
      debatesPerDay: 0,
      chatCooldownSeconds: 15,
      dailyChatMessages: 100,
      monthlyTokens: 0,
      liveMatchTokensPerHour: 40,
      betTokenMultiplier: 1,
      modularAvatarSlots: 'all',
    },
    flags: {
      canCreateDebates: false,
      canCreateLiveMatch: false,
      canStreamSalon: false,
      canJoinVoiceSalons: false,
      groupThemeCustomization: false,
      groupEmoteCustomization: false,
      verifiedBadge: false,
      vipCosmetics: true,
      vipSalonAccess: false,
      noAds: false,
      ambassadorStatus: false,
      monthlyTokenGrant: false,
      unlimitedChatMessages: false,
      canWriteArticles: false,
      canCreatePrivateLiveMatches: false,
      creatorMonetization: false,
      handRaiseOnLive: true,
    },
    features: [
      { id: 'boutique', label: 'Boutique complète (tous les articles)', included: true },
      { id: 'skin', label: 'Skin de base (peau, cheveux, coupe)', included: true },
      { id: 'groups', label: '2 groupes créés · 5 rejoints max', included: true },
      { id: 'group-basic', label: 'Groupe : photo, nom et # uniquement', included: true },
      { id: 'tokens-live', label: '40 jetons / h sur les live matchs', included: true },
      { id: 'tokens-earn', label: 'Progression jetons standard (paris, live)', included: true },
      { id: 'chat-cd', label: 'Cooldown tchat 15 s · 100 messages / jour', included: true },
      { id: 'debates', label: 'Création de débats', included: false },
      { id: 'monthly-tokens', label: 'Jetons mensuels offerts', included: false },
      { id: 'bet-x2', label: 'Jetons paris ×2', included: false },
      { id: 'ads', label: 'Sans publicité', included: false },
    ],
  },
  supporter_plus: {
    id: 'supporter_plus',
    name: 'Ultras',
    priceLabel: '4,99 € / mois',
    priceCents: 499,
    tagline: 'Plus de tribunes, moins de limites, badge vérifié.',
    accentClass: 'from-violet-600 to-indigo-800',
    limits: {
      maxGroupsCreated: 10,
      maxGroupsJoined: null,
      maxGroupMembers: 1000,
      maxPublicSalonMembers: 1000,
      debatesPerWeek: 1,
      debatesPerDay: null,
      chatCooldownSeconds: 0,
      dailyChatMessages: null,
      monthlyTokens: 250,
      liveMatchTokensPerHour: 40,
      betTokenMultiplier: 2,
      modularAvatarSlots: 'all',
    },
    flags: {
      canCreateDebates: true,
      canCreateLiveMatch: false,
      canStreamSalon: false,
      canJoinVoiceSalons: false,
      groupThemeCustomization: true,
      groupEmoteCustomization: false,
      verifiedBadge: true,
      vipCosmetics: true,
      vipSalonAccess: true,
      noAds: true,
      ambassadorStatus: false,
      monthlyTokenGrant: true,
      unlimitedChatMessages: true,
      canWriteArticles: false,
      canCreatePrivateLiveMatches: false,
      creatorMonetization: false,
      handRaiseOnLive: true,
    },
    features: [
      { id: 'boutique', label: 'Boutique complète — débloque plus vite (plus de jetons)', included: true },
      { id: 'debate-w', label: '1 débat créé par semaine', included: true },
      { id: 'groups', label: '10 groupes créés · rejoindre illimité', included: true },
      { id: 'group-theme', label: 'Personnalisation esthétique du groupe (pas les emotes)', included: true },
      { id: 'badge', label: 'Badge vérifié · encart photo profil', included: true },
      { id: 'vip', label: 'Salons vérifiés / VIP', included: true },
      { id: 'tokens-m', label: '250 jetons / mois (maillots & shorts plus rapides)', included: true },
      { id: 'bet-x2', label: 'Jetons paris ×2', included: true },
      { id: 'no-ads', label: 'Fin des pubs (hors articles)', included: true },
      { id: 'salon-1k', label: 'Salon public jusqu’à 1000 personnes', included: true },
      { id: 'live-create', label: 'Créer un live match', included: false },
    ],
  },
  ambassador: {
    id: 'ambassador',
    name: 'Ambassadeur',
    priceLabel: '14,99 € / mois',
    priceCents: 1499,
    tagline: 'Créateur : stream, voix, débats quotidiens, statut ambassadeur.',
    accentClass: 'from-amber-500 to-orange-700',
    limits: {
      maxGroupsCreated: Number.POSITIVE_INFINITY,
      maxGroupsJoined: null,
      maxGroupMembers: Number.POSITIVE_INFINITY,
      maxPublicSalonMembers: null,
      debatesPerWeek: null,
      debatesPerDay: 1,
      chatCooldownSeconds: 0,
      dailyChatMessages: null,
      monthlyTokens: 1000,
      liveMatchTokensPerHour: 40,
      betTokenMultiplier: 2,
      modularAvatarSlots: 'all',
    },
    flags: {
      canCreateDebates: true,
      canCreateLiveMatch: true,
      canStreamSalon: true,
      canJoinVoiceSalons: true,
      groupThemeCustomization: true,
      groupEmoteCustomization: true,
      verifiedBadge: true,
      vipCosmetics: true,
      vipSalonAccess: true,
      noAds: true,
      ambassadorStatus: true,
      monthlyTokenGrant: true,
      unlimitedChatMessages: true,
      canWriteArticles: true,
      canCreatePrivateLiveMatches: true,
      creatorMonetization: true,
      handRaiseOnLive: true,
    },
    features: [
      { id: 'boutique', label: 'Boutique complète — progression jetons maximale', included: true },
      { id: 'all-plus', label: 'Tout Supporter+ + emotes groupe', included: true },
      { id: 'debate-d', label: '1 débat par jour', included: true },
      { id: 'groups-inf', label: 'Groupes créés illimités', included: true },
      { id: 'ambassador', label: 'Statut ambassadeur', included: true },
      { id: 'stream', label: 'Stream sur tes salons · salons vocaux', included: true },
      { id: 'salon-inf', label: 'Salons publics sans limite', included: true },
      { id: 'tokens-m', label: '1000 jetons / mois (collection rapide)', included: true },
      { id: 'articles', label: 'Rédiger des articles sur l’app', included: true },
      {
        id: 'live-priv',
        label: 'Salon live privé (lien invité depuis la tribune)',
        included: true,
      },
      {
        id: 'monetize',
        label: 'Rémunération créations (articles / lives)',
        included: true,
        comingSoon: true,
      },
    ],
  },
}

export const SUBSCRIPTION_TIER_ORDER: SubscriptionTierId[] = [
  'freemium',
  'supporter_plus',
  'ambassador',
]

export function getSubscriptionPlan(tier: SubscriptionTierId): SubscriptionPlanDefinition {
  return SUBSCRIPTION_PLANS[tier]
}

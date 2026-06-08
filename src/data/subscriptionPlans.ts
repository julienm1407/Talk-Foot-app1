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
  /** Sous-titre court sous le nom (ex. « gratuit »). */
  nameHint?: string
  /** Emoji d’en-tête carte formules. */
  tierEmoji?: string
  /** Préfixe des puces avantages (✅, ⭐, 👑). */
  featureIcon?: string
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
    name: 'Supporter',
    nameHint: 'gratuit',
    tierEmoji: '🟢',
    featureIcon: '✅',
    priceLabel: '',
    priceCents: null,
    tagline: 'Pour profiter de TalkFoot et rejoindre la communauté.',
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
      { id: 'groups-create', label: 'Crée jusqu’à 2 tribunes', included: true },
      { id: 'groups-join', label: '5 tribunes max au total (créées incluses)', included: true },
      { id: 'avatar-base', label: 'Personnalisation de base de ton avatar', included: true },
      { id: 'tokens-live', label: '40 jetons / heure pendant les matchs', included: true },
      { id: 'chat-day', label: '100 messages par jour', included: true },
      { id: 'progress', label: 'Progression classique (paris, live…)', included: true },
    ],
  },
  supporter_plus: {
    id: 'supporter_plus',
    name: 'Ultra',
    tierEmoji: '🟣',
    featureIcon: '⭐',
    priceLabel: '4,99 € / mois',
    priceCents: 499,
    tagline: 'Pour les membres les plus actifs.',
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
      { id: 'badge', label: 'Badge vérifié sur ton profil', included: true },
      { id: 'groups-create', label: 'Crée jusqu’à 10 groupes', included: true },
      { id: 'groups-join', label: 'Rejoins autant de groupes que tu veux', included: true },
      { id: 'vip', label: 'Salons privés VIP', included: true },
      { id: 'tokens-m', label: '250 jetons offerts chaque mois', included: true },
      { id: 'bet-x2', label: 'Double récompense sur les pronostics', included: true },
      { id: 'salon-1k', label: 'Accès aux salons publics jusqu’à 1000 personnes', included: true },
      { id: 'group-theme', label: 'Plus de personnalisation pour tes groupes', included: true },
      { id: 'debate-w', label: '1 débat créé par semaine', included: true },
    ],
  },
  ambassador: {
    id: 'ambassador',
    name: 'Ambassadeur',
    tierEmoji: '🟠',
    featureIcon: '👑',
    priceLabel: '14,99 € / mois',
    priceCents: 1499,
    tagline: 'Pour les créateurs et les leaders de communauté.',
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
      { id: 'ambassador', label: 'Statut Ambassadeur exclusif', included: true },
      { id: 'groups-inf', label: 'Groupes illimités', included: true },
      { id: 'debate-d', label: '1 débat créé chaque jour', included: true },
      { id: 'voice', label: 'Salons vocaux pour tes groupes', included: true },
      { id: 'salon-inf', label: 'Salons publics sans limite', included: true },
      { id: 'tokens-m', label: '1000 jetons offerts chaque mois', included: true },
      { id: 'articles', label: 'Articles et contenus sur TalkFoot', included: true },
      { id: 'live-priv', label: 'Live privé avec lien d’invitation', included: true },
      {
        id: 'monetize',
        label: 'Récompenses créateurs',
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

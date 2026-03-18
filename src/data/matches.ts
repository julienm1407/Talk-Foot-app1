import type { Match } from '../types/match'

const now = Date.now()
const inMinutes = (m: number) => new Date(now + m * 60_000).toISOString()

export const matchesToday: Match[] = [
  {
    id: 'm-psg-om',
    competition: { id: 'ligue-1', name: 'Ligue 1', shortName: 'L1' },
    home: {
      id: 'psg',
      name: 'Paris SG',
      shortName: 'PSG',
      colors: { primary: '#1b1f3a', secondary: '#e11d48' },
    },
    away: {
      id: 'om',
      name: 'Marseille',
      shortName: 'OM',
      colors: { primary: '#0ea5e9', secondary: '#ffffff' },
    },
    kickoffAt: inMinutes(35),
    status: 'upcoming',
  },
  {
    id: 'm-rma-fcb',
    competition: { id: 'laliga', name: 'LaLiga', shortName: 'LL' },
    home: {
      id: 'rma',
      name: 'Real Madrid',
      shortName: 'RMA',
      colors: { primary: '#ffffff', secondary: '#fbbf24' },
    },
    away: {
      id: 'fcb',
      name: 'Barcelona',
      shortName: 'FCB',
      colors: { primary: '#1e3a8a', secondary: '#dc2626' },
    },
    kickoffAt: inMinutes(-12),
    status: 'live',
    minute: 12,
    score: { home: 0, away: 1 },
  },
  {
    id: 'm-mci-liv',
    competition: { id: 'epl', name: 'Premier League', shortName: 'EPL' },
    home: {
      id: 'mci',
      name: 'Man City',
      shortName: 'MCI',
      colors: { primary: '#60a5fa', secondary: '#111827' },
    },
    away: {
      id: 'liv',
      name: 'Liverpool',
      shortName: 'LIV',
      colors: { primary: '#ef4444', secondary: '#111827' },
    },
    kickoffAt: inMinutes(125),
    status: 'upcoming',
  },
  {
    id: 'm-inter-juve',
    competition: { id: 'serie-a', name: 'Serie A', shortName: 'SA' },
    home: {
      id: 'int',
      name: 'Inter',
      shortName: 'INT',
      colors: { primary: '#2563eb', secondary: '#111827' },
    },
    away: {
      id: 'juv',
      name: 'Juventus',
      shortName: 'JUV',
      colors: { primary: '#111827', secondary: '#f9fafb' },
    },
    kickoffAt: inMinutes(290),
    status: 'upcoming',
  },
]

export const upcomingMatches: Match[] = [
  ...matchesToday,
  {
    id: 'm-bvb-bay',
    competition: { id: 'bund', name: 'Bundesliga', shortName: 'BUN' },
    home: {
      id: 'bvb',
      name: 'Dortmund',
      shortName: 'BVB',
      colors: { primary: '#fbbf24', secondary: '#111827' },
    },
    away: {
      id: 'bay',
      name: 'Bayern',
      shortName: 'FCB',
      colors: { primary: '#dc2626', secondary: '#111827' },
    },
    kickoffAt: inMinutes(24 * 60),
    status: 'upcoming',
  },
]


import rawClubRelatedLinks from './clubRelatedLinks.json'

export type ClubRelatedExternalLink = {
  id: string
  clubIds: string[]
  title: string
  excerpt: string
  url: string
  source: string
}

const links = rawClubRelatedLinks as ClubRelatedExternalLink[]

export function getExternalClubReadingLinks(clubId: string, limit = 5): ClubRelatedExternalLink[] {
  if (!clubId) return []
  return links.filter((item) => item.clubIds.includes(clubId)).slice(0, Math.max(1, limit))
}

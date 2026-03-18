import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { useSupporterGroups } from '../hooks/useSupporterGroups'

export function GroupPage() {
  const { groupId } = useParams()
  const { byId } = useSupporterGroups()
  const group = groupId ? byId(groupId) : null

  const [channelId, setChannelId] = useState('general')

  const channel = useMemo(() => {
    if (!group) return null
    return group.channels.find((c) => c.id === channelId) ?? group.channels[0]
  }, [channelId, group])

  if (!group) {
    return (
      <Card className="p-6">
        <div className="text-lg font-black tracking-tight text-slate-900">
          Serveur introuvable
        </div>
        <div className="mt-2 text-sm font-medium text-slate-600">
          Ce serveur n’existe pas (ou a été supprimé).
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <Card
        className="overflow-hidden p-0"
        elevation="soft"
      >
        <div
          className="relative px-5 py-5 sm:px-6"
          style={
            {
              ['--p' as any]: group.theme.primary,
              ['--s' as any]: group.theme.secondary,
            } as React.CSSProperties
          }
        >
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
            style={{
              background:
                group.theme.background === 'stripe'
                  ? `linear-gradient(90deg, color-mix(in srgb, var(--p) 22%, transparent), transparent 60%), repeating-linear-gradient(135deg, color-mix(in srgb, var(--p) 14%, transparent) 0 10px, transparent 10px 20px)`
                  : group.theme.background === 'smoke'
                    ? `radial-gradient(900px 240px at 12% 0%, color-mix(in srgb, var(--p) 26%, transparent), transparent 62%), radial-gradient(900px 260px at 88% 0%, color-mix(in srgb, var(--s) 18%, transparent), transparent 64%)`
                    : `linear-gradient(90deg, color-mix(in srgb, var(--p) 18%, transparent), transparent 70%)`,
            }}
          />
          <div className="relative flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div
                  className="grid size-12 place-items-center rounded-3xl text-xl font-black text-white shadow-sm"
                  style={{
                    background: `linear-gradient(135deg, ${group.theme.primary}, ${group.theme.secondary})`,
                  }}
                  aria-hidden="true"
                >
                  {group.emoji}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-2xl font-black tracking-tight text-slate-900">
                    {group.name}
                  </div>
                  <div className="mt-0.5 text-sm font-semibold text-slate-700/70">
                    {group.location ? `${group.location} • ` : ''}
                    {group.members} membres • {group.intensity}% ambiance
                  </div>
                </div>
              </div>
              <div className="mt-3 max-w-[60ch] text-sm font-semibold text-slate-700/80">
                “{group.motto}”
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge className="border-slate-200 bg-white/80 text-slate-900">
                {group.createdBy === 'me' ? 'Ton serveur' : 'Public'}
              </Badge>
              <Button variant="soft" className="rounded-3xl">
                Personnaliser
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 lg:grid-cols-[320px_1fr]">
        <Card className="p-4 sm:p-5" elevation="soft">
          <div className="text-[11px] font-black tracking-[0.18em] text-slate-700/70">
            SALONS
          </div>
          <div className="mt-3 space-y-2">
            {group.channels.map((c) => (
              <button
                key={c.id}
                className={
                  channelId === c.id
                    ? 'w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm'
                    : 'w-full rounded-3xl border border-slate-200/70 bg-white/70 px-4 py-3 text-left hover:bg-white'
                }
                onClick={() => setChannelId(c.id)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-black text-slate-900">
                      {c.emoji} {c.name}
                    </div>
                    <div className="mt-0.5 truncate text-xs font-semibold text-slate-700/70">
                      {c.description}
                    </div>
                  </div>
                  <span className="text-xs font-black text-slate-500">→</span>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-4 sm:p-5" elevation="soft">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-[11px] font-black tracking-[0.18em] text-slate-700/70">
                {channel?.emoji} {channel?.name}
              </div>
              <div className="mt-1 text-lg font-black tracking-tight text-slate-900">
                Salon du groupe
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-700/70">
                {channel?.description}
              </div>
            </div>
            <Badge className="border-slate-200 bg-white/80 text-slate-900">
              Mock
            </Badge>
          </div>

          <div className="mt-4 rounded-3xl border border-slate-200/80 bg-white/70 p-4">
            <div className="text-sm font-semibold text-slate-700/80">
              Exemple de personnalisation:
            </div>
            <div className="mt-2 text-sm font-black text-slate-900">
              Thème: {group.theme.background} • couleurs du groupe
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span
                className="inline-flex size-6 rounded-full border border-slate-200"
                style={{ background: group.theme.primary }}
              />
              <span
                className="inline-flex size-6 rounded-full border border-slate-200"
                style={{ background: group.theme.secondary }}
              />
              <span className="text-sm font-semibold text-slate-700/70">
                {group.theme.primary} / {group.theme.secondary}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}


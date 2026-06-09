import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import { DebatePickerModal } from '../group/DebatePickerModal'
import { useSupporterGroups } from '../../hooks/useSupporterGroups'
import { useCustomGroupDebates } from '../../hooks/useCustomGroupDebates'
import { useModalBackdropGuard } from '../../utils/modalBackdropGuard'
import { getModalPortalRoot } from '../../utils/modalPortalRoot'
import { cn } from '../../utils/cn'

type Phase = 'pick-group' | 'create'

export function CreateDebateHubModal({
  open,
  onClose,
  canCreateDebate,
  onBlockedCreate,
}: {
  open: boolean
  onClose: () => void
  canCreateDebate: boolean
  onBlockedCreate: () => void
}) {
  const navigate = useNavigate()
  const { groups, isJoined } = useSupporterGroups()
  const [phase, setPhase] = useState<Phase>('pick-group')
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const { shouldIgnoreBackdropClose, backdropPointerEvents } = useModalBackdropGuard(open)
  const { customForGroup, addCustomDebate } = useCustomGroupDebates(selectedGroupId ?? undefined)

  const eligibleGroups = useMemo(
    () => groups.filter((g) => isJoined(g.id) || g.createdBy === 'me'),
    [groups, isJoined],
  )

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    if (eligibleGroups.length === 1) {
      setSelectedGroupId(eligibleGroups[0]!.id)
      setPhase('create')
      return
    }
    setSelectedGroupId(null)
    setPhase('pick-group')
  }, [open, eligibleGroups])

  if (!open) return null

  if (phase === 'create' && selectedGroupId) {
    return (
      <DebatePickerModal
        open
        initialTab="create"
        groupId={selectedGroupId}
        customForGroup={customForGroup}
        canCreateDebate={canCreateDebate}
        onClose={onClose}
        onBlockedCreate={onBlockedCreate}
        onPick={(debateId) => {
          navigate(`/group/${selectedGroupId}?debate=${encodeURIComponent(debateId)}`)
        }}
        onPublishCustom={(input) => {
          const r = addCustomDebate(input)
          if (!r.ok) {
            onBlockedCreate()
            return null
          }
          return r.debate
        }}
      />
    )
  }

  const portalTarget = getModalPortalRoot()
  if (!portalTarget) return null

  return createPortal(
    <div
      className={cn(
        'pointer-events-auto fixed inset-0 z-[1] grid w-full touch-manipulation place-items-center overflow-hidden',
        'h-[100dvh] max-h-[100dvh]',
        'p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]',
      )}
      data-no-swipe="true"
      data-tf-modal="true"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-debate-hub-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        style={{ pointerEvents: backdropPointerEvents }}
        onClick={() => {
          if (shouldIgnoreBackdropClose()) return
          onClose()
        }}
        aria-label="Fermer"
      />
      <div className="relative z-10 flex max-h-[min(calc(100dvh-2rem-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)),40rem)] w-full max-w-[min(100%,26rem)] flex-col overflow-hidden rounded-tf-3xl border border-slate-200/90 bg-white p-4 shadow-[0_24px_80px_-12px_rgba(15,23,42,0.35)] sm:p-5">
        <div className="shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Nouveau débat</p>
              <h2 id="create-debate-hub-title" className="mt-1 text-lg font-black text-slate-900">
                Choisir une tribune
              </h2>
              <p className="mt-1 text-xs font-semibold text-slate-600">
                Le débat sera publié dans la tribune Général du groupe choisi.
              </p>
            </div>
            <Button variant="ghost" className="h-9 shrink-0 rounded-2xl" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]">
          {eligibleGroups.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-5 text-center">
              <p className="text-sm font-black text-slate-800">Aucune tribune disponible</p>
              <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-600">
                Rejoins ou crée un groupe supporters pour publier un débat — il apparaîtra ici et dans le classement.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <Link
                  to="/groups"
                  onClick={onClose}
                  className="tf-interactive-press inline-flex min-h-11 items-center justify-center rounded-2xl bg-tf-dark px-4 text-sm font-black text-white"
                >
                  Voir les tribunes
                </Link>
                <Link
                  to="/groups?tab=discover"
                  onClick={onClose}
                  className="tf-interactive-press inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-800"
                >
                  Parcourir les groupes
                </Link>
              </div>
            </div>
          ) : (
            <ul className="space-y-2" role="list">
              {eligibleGroups.map((g) => (
                <li key={g.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGroupId(g.id)
                      setPhase('create')
                    }}
                    className="tf-interactive-press w-full rounded-2xl border border-slate-200/90 bg-white px-3 py-3 text-left transition hover:border-violet-300 hover:bg-violet-50/50"
                  >
                    <span className="text-lg" aria-hidden>
                      {g.emoji}
                    </span>
                    <span className="mt-1 block text-sm font-black text-slate-900">{g.name}</span>
                    <span className="mt-0.5 block text-xs font-semibold text-slate-600">
                      {g.createdBy === 'me' ? 'Ta tribune' : 'Membre'} · {g.location}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>,
    portalTarget,
  )
}

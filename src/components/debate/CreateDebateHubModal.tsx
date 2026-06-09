import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import { DebatePickerModal } from '../group/DebatePickerModal'
import { useSupporterGroups } from '../../hooks/useSupporterGroups'
import { useCustomGroupDebates } from '../../hooks/useCustomGroupDebates'
import { useModalBackdropGuard } from '../../utils/modalBackdropGuard'
import { getModalPortalRoot } from '../../utils/modalPortalRoot'
import { debatePageHref } from '../../utils/debateAccess'
import { cn } from '../../utils/cn'

type Phase = 'choose' | 'pick-group' | 'create'

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
  const [phase, setPhase] = useState<Phase>('choose')
  const [selectedGroupId, setSelectedGroupId] = useState<string | null | undefined>(undefined)
  const { shouldIgnoreBackdropClose, backdropPointerEvents } = useModalBackdropGuard(open)

  const hookGroupId =
    phase === 'create' && selectedGroupId !== undefined ? selectedGroupId : undefined
  const { customForGroup, addCustomDebate } = useCustomGroupDebates(hookGroupId)

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
    setPhase('choose')
    setSelectedGroupId(undefined)
  }, [open])

  if (!open) return null

  if (phase === 'create' && selectedGroupId !== undefined) {
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
          navigate(debatePageHref(debateId))
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
                {phase === 'pick-group' ? 'Associer à une tribune' : 'Lancer un débat ouvert'}
              </h2>
              <p className="mt-1 text-xs font-semibold text-slate-600">
                {phase === 'pick-group'
                  ? 'Optionnel : étiquette vers une communauté (PSG, CDM…). L’accès reste ouvert à tous.'
                  : 'Espace temporaire autour d’un sujet — participation immédiate, sans rejoindre de groupe.'}
              </p>
            </div>
            <Button variant="ghost" className="h-9 shrink-0 rounded-2xl" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]">
          {phase === 'choose' ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedGroupId(null)
                  setPhase('create')
                }}
                className="tf-interactive-press w-full rounded-2xl border-2 border-violet-300/70 bg-violet-50 px-3 py-4 text-left transition hover:border-violet-400 hover:bg-violet-100/80"
              >
                <span className="text-lg" aria-hidden>
                  💬
                </span>
                <span className="mt-1 block text-sm font-black text-slate-900">Débat ouvert (recommandé)</span>
                <span className="mt-0.5 block text-xs font-semibold text-slate-600">
                  Sans tribune liée — visible par toute la communauté Talk Foot.
                </span>
              </button>
              <button
                type="button"
                onClick={() => setPhase('pick-group')}
                className="tf-interactive-press w-full rounded-2xl border border-slate-200/90 bg-white px-3 py-4 text-left transition hover:border-violet-300 hover:bg-violet-50/50"
              >
                <span className="text-lg" aria-hidden>
                  👥
                </span>
                <span className="mt-1 block text-sm font-black text-slate-900">Associer à une tribune</span>
                <span className="mt-0.5 block text-xs font-semibold text-slate-600">
                  Étiquette vers un groupe — le débat reste accessible sans adhésion.
                </span>
              </button>
            </div>
          ) : (
            <ul className="space-y-2" role="list">
              {eligibleGroups.length === 0 ? (
                <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-5 text-center">
                  <p className="text-sm font-black text-slate-800">Aucune tribune disponible</p>
                  <p className="mt-2 text-xs font-semibold text-slate-600">
                    Crée un débat ouvert ci-dessus, ou rejoins une tribune depuis l’onglet Groupes.
                  </p>
                  <Button
                    type="button"
                    variant="soft"
                    className="mt-3 w-full rounded-2xl font-black"
                    onClick={() => {
                      setSelectedGroupId(null)
                      setPhase('create')
                    }}
                  >
                    Débat sans tribune
                  </Button>
                </li>
              ) : (
                eligibleGroups.map((g) => (
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
                ))
              )}
            </ul>
          )}
        </div>
      </div>
    </div>,
    portalTarget,
  )
}

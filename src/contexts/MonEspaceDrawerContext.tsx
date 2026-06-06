import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAppearance } from './AppearanceContext'
import { useSupporterGroups } from '../hooks/useSupporterGroups'
import { HomeMonEspacePanel } from '../components/home/HomeMonEspacePanel'
import { CreateGroupModal } from '../components/group/CreateGroupModal'
import { cn } from '../utils/cn'
import { getModalPortalRoot } from '../utils/modalPortalRoot'
import { useModalBackdropGuard } from '../utils/modalBackdropGuard'

type Ctx = {
  isMonEspaceDrawerOpen: boolean
  openMonEspaceDrawer: () => void
  closeMonEspaceDrawer: () => void
  toggleMonEspaceDrawer: () => void
}

const MonEspaceDrawerContext = createContext<Ctx | null>(null)

export function useMonEspaceDrawer() {
  const v = useContext(MonEspaceDrawerContext)
  if (!v) throw new Error('useMonEspaceDrawer doit être utilisé sous MonEspaceDrawerProvider')
  return v
}

/** TopBar / éléments partagés : no-op si le provider n’est pas monté (évite écran vide). */
export function useMonEspaceDrawerOptional(): Ctx | null {
  return useContext(MonEspaceDrawerContext)
}

export function MonEspaceDrawerProvider({ children }: { children: ReactNode }) {
  const { appearance } = useAppearance()
  const L = appearance === 'light'
  const navigate = useNavigate()
  const location = useLocation()
  const { groups, createGroup } = useSupporterGroups()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const { shouldIgnoreBackdropClose, backdropPointerEvents } = useModalBackdropGuard(drawerOpen)

  const myCreatedGroups = useMemo(() => groups.filter((g) => g.createdBy === 'me'), [groups])

  const openMonEspaceDrawer = useCallback(() => setDrawerOpen(true), [])
  const closeMonEspaceDrawer = useCallback(() => setDrawerOpen(false), [])
  const toggleMonEspaceDrawer = useCallback(() => setDrawerOpen((v) => !v), [])

  const ctx = useMemo(
    () => ({
      isMonEspaceDrawerOpen: drawerOpen,
      openMonEspaceDrawer,
      closeMonEspaceDrawer,
      toggleMonEspaceDrawer,
    }),
    [drawerOpen, openMonEspaceDrawer, closeMonEspaceDrawer, toggleMonEspaceDrawer],
  )

  useEffect(() => {
    closeMonEspaceDrawer()
  }, [location.pathname, location.search, closeMonEspaceDrawer])

  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMonEspaceDrawer()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [drawerOpen, closeMonEspaceDrawer])

  const portalTarget = drawerOpen ? getModalPortalRoot() : null

  const drawerUi =
    drawerOpen && portalTarget
      ? createPortal(
        <div
          className="pointer-events-auto fixed inset-0 z-[1] touch-manipulation xl:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mon-espace-drawer-title"
          data-tf-modal="true"
          data-no-swipe="true"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            style={{ pointerEvents: backdropPointerEvents }}
            aria-label="Fermer Mon espace"
            onClick={() => {
              if (shouldIgnoreBackdropClose()) return
              closeMonEspaceDrawer()
            }}
          />
          <div
            className={cn(
              'absolute left-0 top-0 z-10 flex h-full w-[min(88vw,20rem)] max-w-[20rem] flex-col shadow-2xl',
              L ? 'bg-[color:var(--tf-page-bg-light)]' : 'bg-tf-dark',
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={cn(
                'flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2.5',
                L ? 'border-tf-dark/10' : 'border-white/10',
              )}
            >
              <h2
                id="mon-espace-drawer-title"
                className={cn('font-display text-sm font-black tracking-tight', L ? 'text-tf-dark' : 'text-white')}
              >
                Mon espace
              </h2>
              <button
                type="button"
                onClick={closeMonEspaceDrawer}
                className={cn(
                  'rounded-lg px-2.5 py-1.5 text-xs font-black transition',
                  L
                    ? 'bg-tf-dark/5 text-tf-dark hover:bg-tf-dark/10'
                    : 'bg-white/10 text-white hover:bg-white/15',
                )}
              >
                Fermer
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] p-2.5 pb-6">
              <HomeMonEspacePanel
                as="section"
                showTopHeading={false}
                mobileDrawer
                myCreatedGroups={myCreatedGroups}
                onNavigate={closeMonEspaceDrawer}
                onCreateTribune={() => {
                  closeMonEspaceDrawer()
                  setCreateOpen(true)
                }}
                className="rounded-2xl"
              />
            </div>
          </div>
        </div>,
        portalTarget,
      )
      : null

  return (
    <MonEspaceDrawerContext.Provider value={ctx}>
      {children}

      {drawerUi}

      <CreateGroupModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={async (g) => {
          const r = await createGroup(g)
          if (!r.ok) return r
          navigate(`/group/${r.group.id}`)
          setCreateOpen(false)
          return { ok: true as const }
        }}
      />
    </MonEspaceDrawerContext.Provider>
  )
}

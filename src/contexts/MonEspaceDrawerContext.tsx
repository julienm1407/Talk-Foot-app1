import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppearance } from './AppearanceContext'
import { useSupporterGroups } from '../hooks/useSupporterGroups'
import { HomeMonEspacePanel } from '../components/home/HomeMonEspacePanel'
import { CreateGroupModal } from '../components/group/CreateGroupModal'
import { cn } from '../utils/cn'

type Ctx = {
  openMonEspaceDrawer: () => void
  closeMonEspaceDrawer: () => void
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
  const { groups, createGroup } = useSupporterGroups()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  const myCreatedGroups = useMemo(() => groups.filter((g) => g.createdBy === 'me'), [groups])

  const openMonEspaceDrawer = useCallback(() => setDrawerOpen(true), [])
  const closeMonEspaceDrawer = useCallback(() => setDrawerOpen(false), [])

  const ctx = useMemo(
    () => ({ openMonEspaceDrawer, closeMonEspaceDrawer }),
    [openMonEspaceDrawer, closeMonEspaceDrawer],
  )

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

  return (
    <MonEspaceDrawerContext.Provider value={ctx}>
      {children}

      {drawerOpen ? (
        <div
          className="fixed inset-0 z-[55] xl:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mon-espace-drawer-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            aria-label="Fermer Mon espace"
            onClick={closeMonEspaceDrawer}
          />
          <div
            className={cn(
              'absolute left-0 top-0 flex h-full w-[min(100%,22rem)] flex-col shadow-2xl',
              L ? 'bg-[color:var(--tf-page-bg-light)]' : 'bg-tf-dark',
            )}
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
                myCreatedGroups={myCreatedGroups}
                onCreateTribune={() => {
                  closeMonEspaceDrawer()
                  setCreateOpen(true)
                }}
                className="rounded-2xl"
              />
            </div>
          </div>
        </div>
      ) : null}

      <CreateGroupModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={(g) => {
          const r = createGroup(g)
          if (!r.ok) return r
          navigate(`/group/${r.group.id}`)
          setCreateOpen(false)
          return { ok: true as const }
        }}
      />
    </MonEspaceDrawerContext.Provider>
  )
}

import { useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { findBoutiqueCatalogItem } from '../utils/boutiqueCatalog'
import { profileStudioHref } from '../utils/boutiquePurchaseFlow'
import { shopItemToModularAssetId } from '../utils/boutiqueModularState'
import { PageLoader } from '../components/ui/PageLoader'
import { cn } from '../utils/cn'
import { TF_FOCUS_VISIBLE } from '../theme/designSystem'

/** Ancienne URL de confirmation — redirige vers le studio profil. */
export function BoutiquePurchaseSuccessPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const itemId = searchParams.get('item')

  const item = itemId ? findBoutiqueCatalogItem(itemId) : undefined
  const modularAssetId = item ? shopItemToModularAssetId(item) : null
  const studioHref = profileStudioHref(modularAssetId, itemId ?? undefined)

  useEffect(() => {
    if (item) navigate(studioHref, { replace: true })
  }, [item, studioHref, navigate])

  if (item) return <PageLoader />

  return (
    <Card className="mx-auto max-w-lg p-6 text-center" elevation="soft">
      <h1 className="font-display text-xl font-black text-tf-dark">Achat enregistré</h1>
      <p className="mt-2 text-sm font-medium text-tf-grey">Retrouve ton article dans le studio personnage.</p>
      <Link
        to="/profile#avatar-modulaire"
        className={cn(
          'mt-4 inline-flex min-h-tf-touch items-center justify-center rounded-2xl bg-tf-dark px-5 py-3 text-sm font-black text-white',
          TF_FOCUS_VISIBLE,
        )}
      >
        Ouvrir le studio
      </Link>
    </Card>
  )
}

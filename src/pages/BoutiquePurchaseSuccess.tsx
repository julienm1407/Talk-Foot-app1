import { Link, useSearchParams } from 'react-router-dom'
import { BoutiquePurchaseCelebration } from '../components/shop/BoutiquePurchaseCelebration'
import { Card } from '../components/ui/Card'
import { findBoutiqueCatalogItem } from '../utils/boutiqueCatalog'
import { cn } from '../utils/cn'
import { TF_FOCUS_VISIBLE } from '../theme/designSystem'

/**
 * Écran de félicitations après un achat boutique (entre paiement et studio profil).
 */
export function BoutiquePurchaseSuccessPage() {
  const [searchParams] = useSearchParams()
  const itemId = searchParams.get('item')
  const currencyRaw = searchParams.get('currency')
  const returnTo = searchParams.get('return') ?? '/boutique'

  const item = itemId ? findBoutiqueCatalogItem(itemId) : undefined
  const currency = currencyRaw === 'tokens' ? 'tokens' : currencyRaw === 'medals' ? 'medals' : null

  if (item && currency) {
    return <BoutiquePurchaseCelebration item={item} currency={currency} returnTo={returnTo} />
  }

  return (
    <Card className="mx-auto max-w-lg p-6 text-center" elevation="soft">
      <h1 className="font-display text-xl font-black text-tf-dark">Achat enregistré</h1>
      <p className="mt-2 text-sm font-medium text-tf-grey">
        Retrouve ton article dans le studio personnage.
      </p>
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

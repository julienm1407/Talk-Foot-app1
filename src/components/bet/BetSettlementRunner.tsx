import { useGlobalBetSettlement } from '../../hooks/useGlobalBetSettlement'

/** Monte le règlement automatique des paris (aucun rendu). */
export function BetSettlementRunner() {
  useGlobalBetSettlement()
  return null
}

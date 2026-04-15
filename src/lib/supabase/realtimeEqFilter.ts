/** Filtre `postgres_changes` (colonne = eq.valeur). Encode la valeur si besoin. */
export function postgresChangesEqFilter(column: string, value: string): string {
  if (/^[a-zA-Z0-9_.-]+$/.test(value)) {
    return `${column}=eq.${value}`
  }
  return `${column}=eq.${encodeURIComponent(value)}`
}

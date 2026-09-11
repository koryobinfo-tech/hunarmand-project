export const TJS_PER_USD = 10.9;

export function formatSomoni(amount: number) {
  return `${amount.toFixed(2)} сомонӣ`;
}

export function formatUsdFromSomoni(amount: number) {
  return `$${(amount / TJS_PER_USD).toFixed(2)}`;
}

export function formatMoney(amount: number) {
  return `${formatSomoni(amount)} / ${formatUsdFromSomoni(amount)}`;
}

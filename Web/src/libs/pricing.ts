// Shared helpers for the "sale price + offer price + GST" pricing model used across
// Products, Chadhava listings, E-Puja packages and Kundli listings.
//
// Rule: `price` is the sale price. When `offerPrice` is set and lower than `price`, the
// storefront shows `price` struck through and charges/displays `offerPrice` as the real price.
// If `offerPrice` is missing (or not lower), `price` is simply the price — nothing is crossed out.

export type Priced = {
  price: number
  offerPrice?: number | null
  gstPercentage?: number | null
  gstInclusive?: boolean | null
}

// The amount actually charged / the "big" price shown on the card.
export function effectivePrice(item: Priced): number {
  if (item.offerPrice !== undefined && item.offerPrice !== null && item.offerPrice > 0 && item.offerPrice < item.price) {
    return item.offerPrice
  }

  return item.price
}

// Whether the sale price should be rendered struck-through next to the offer price.
export function hasOfferDiscount(item: Priced): boolean {
  return (
    item.offerPrice !== undefined &&
    item.offerPrice !== null &&
    item.offerPrice > 0 &&
    item.offerPrice < item.price
  )
}

// Short label for GST, e.g. "Incl. of 18% GST" or "+18% GST" or null when no GST applies.
export function gstLabel(item: Priced): string | null {
  const pct = item.gstPercentage

  if (!pct || pct <= 0) return null

  return item.gstInclusive === false ? `+${pct}% GST` : `Incl. of ${pct}% GST`
}

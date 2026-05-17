/**
 * Product catalog — Mission Grave Goods.
 *
 * Source of truth for the storefront UI until Stripe Products is wired (phase 5).
 *
 * TODO (phase 5): replace this hand-maintained list with a fetch from Stripe
 * Products API (cached server-side). Slug stays as the join key — Stripe
 * `product.metadata.slug` maps back to the asset filename in /public/stickers/.
 *
 * Pricing and spec are placeholder ($4, 3" die-cut vinyl). Replace with real
 * values from Sticky Brand orders + Stripe before launch.
 */

export type Product = {
  /** slug — matches /public/stickers/<id>.png */
  id: string;
  /** display name on cards + product pages */
  title: string;
  /** physical spec line ("3\" die-cut vinyl") */
  spec: string;
  /** price in USD; placeholder until Stripe */
  price: number;
  /** hex tint for the card panel radial gradient (matches sticker accent) */
  ring: string;
};

export const PRODUCTS: readonly Product[] = [
  {
    id: "protect-trans-kids",
    title: "Protect Trans Kids",
    spec: '3" die-cut vinyl',
    price: 4,
    ring: "#5BCEFA",
  },
  {
    id: "cops-arent-your-friends",
    title: "Cops Aren't Your Friends",
    spec: '3" die-cut vinyl',
    price: 4,
    ring: "#2ad6a0",
  },
  {
    id: "you-are-not-immune",
    title: "You Are Not Immune to Propaganda",
    spec: '3" die-cut vinyl',
    price: 4,
    ring: "#150b1c",
  },
  {
    id: "class-consciousness",
    title: "All The Cool Kids Have Class Consciousness",
    spec: '3" die-cut vinyl',
    price: 4,
    ring: "#f4ecd8",
  },
  {
    id: "follow-your-leader",
    title: "Follow Your Leader",
    spec: '3" die-cut vinyl',
    price: 4,
    ring: "#f4ecd8",
  },
  {
    id: "devour-feculence",
    title: "Devour Feculence",
    spec: '3" die-cut vinyl',
    price: 4,
    ring: "#a3e635",
  },
  {
    id: "throbbing-middle-finger",
    title: "Throbbing Middle Finger to God",
    spec: '3" die-cut vinyl',
    price: 4,
    ring: "#150b1c",
  },
  {
    id: "deny-defend-depose",
    title: "Deny Defend Depose",
    spec: '3" die-cut vinyl',
    price: 4,
    ring: "#a8c8f0",
  },
  {
    id: "scream-fuck-die",
    title: "Scream Fuck Die",
    spec: '3" die-cut vinyl',
    price: 4,
    ring: "#34d399",
  },
  {
    id: "magical-stardust",
    title: "Magical Piece of Stardust",
    spec: '3" die-cut vinyl',
    price: 4,
    ring: "#f0bcc7",
  },
  {
    id: "i-did-that",
    title: "I Did That",
    spec: '3" die-cut vinyl',
    price: 4,
    ring: "#f4ecd8",
  },
] as const;

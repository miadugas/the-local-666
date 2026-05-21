// Backend-owned product seed data, ported from web/src/data/products.ts.
// The local DB is the catalog source of truth once seeded; this file only
// populates an empty table on first boot.

export type SeedProduct = {
  slug: string;
  title: string;
  spec: string;
  priceCents: number;
  accentHex: string;
  description: string | null;
  displayOrder: number;
};

export const SEED_PRODUCTS: readonly SeedProduct[] = [
  {
    slug: "protect-trans-kids",
    title: "Protect Trans Kids",
    spec: '3" die-cut vinyl',
    priceCents: 400,
    accentHex: "#5BCEFA",
    description:
      "Trans kids exist, trans kids deserve protection, trans kids are not a debate. Slap this on a laptop, a locker, or every door at your kid's school district HQ.",
    displayOrder: 0,
  },
  {
    slug: "cops-arent-your-friends",
    title: "Cops Aren't Your Friends",
    spec: '3" die-cut vinyl',
    priceCents: 400,
    accentHex: "#2ad6a0",
    description:
      "They're not. They never have been. Stick it somewhere a friendly officer might see it — your bumper, your laptop, the door of the cafe with the 'free coffee for cops' sign.",
    displayOrder: 1,
  },
  {
    slug: "you-are-not-immune",
    title: "You Are Not Immune to Propaganda",
    spec: '3" die-cut vinyl',
    priceCents: 400,
    accentHex: "#150b1c",
    description: null,
    displayOrder: 2,
  },
  {
    slug: "class-consciousness",
    title: "All The Cool Kids Have Class Consciousness",
    spec: '3" die-cut vinyl',
    priceCents: 400,
    accentHex: "#f4ecd8",
    description: null,
    displayOrder: 3,
  },
  {
    slug: "follow-your-leader",
    title: "Follow Your Leader",
    spec: '3" die-cut vinyl',
    priceCents: 400,
    accentHex: "#f4ecd8",
    description: null,
    displayOrder: 4,
  },
  {
    slug: "devour-feculence",
    title: "Devour Feculence",
    spec: '3" die-cut vinyl',
    priceCents: 400,
    accentHex: "#a3e635",
    description: null,
    displayOrder: 5,
  },
  {
    slug: "throbbing-middle-finger",
    title: "Throbbing Middle Finger to God",
    spec: '3" die-cut vinyl',
    priceCents: 400,
    accentHex: "#150b1c",
    description: null,
    displayOrder: 6,
  },
  {
    slug: "deny-defend-depose",
    title: "Deny Defend Depose",
    spec: '3" die-cut vinyl',
    priceCents: 400,
    accentHex: "#a8c8f0",
    description: null,
    displayOrder: 7,
  },
  {
    slug: "scream-fuck-die",
    title: "Scream Fuck Die",
    spec: '3" die-cut vinyl',
    priceCents: 400,
    accentHex: "#34d399",
    description: null,
    displayOrder: 8,
  },
  {
    slug: "magical-stardust",
    title: "Magical Piece of Stardust",
    spec: '3" die-cut vinyl',
    priceCents: 400,
    accentHex: "#f0bcc7",
    description:
      "You are a magical piece of stardust having a small terrestrial moment. Behave accordingly. Pairs well with bathroom mirrors and the back of any van that's seen too many highway miles.",
    displayOrder: 9,
  },
  {
    slug: "i-did-that",
    title: "I Did That",
    spec: '3" die-cut vinyl',
    priceCents: 400,
    accentHex: "#f4ecd8",
    description: null,
    displayOrder: 10,
  },
] as const;

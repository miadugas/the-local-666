<script setup lang="ts">
const LINK_GROUPS = [
  {
    heading: "Shop",
    links: [
      "All stickers",
      "Tarot & saints",
      "ACAB",
      "Queer joy",
      "Lil demons",
      "Gift cards",
    ],
  },
  {
    heading: "About",
    links: [
      "Our story",
      "Mutual aid log",
      "Press",
      "Wholesale",
      "Flea market dates",
    ],
  },
  {
    heading: "Help",
    links: [
      "Shipping",
      "Returns",
      "Lost in the post",
      "Contact a human",
      "FAQ",
    ],
  },
];
</script>

<template>
  <footer class="site-footer">
    <div class="footer-inner">
      <div class="grid">
        <div class="brand-col">
          <a href="/" class="brand">Grave Goods</a>
          <p class="tagline">
            est. for the haunted. Hand-printed in Denver on stolen Cheyenne,
            Arapaho, and Ute land. Pronouns negotiable.
          </p>
        </div>

        <div v-for="group in LINK_GROUPS" :key="group.heading" class="link-col">
          <p class="group-heading">{{ group.heading }}</p>
          <ul>
            <li v-for="link in group.links" :key="link">
              <a href="#">{{ link }}</a>
            </li>
          </ul>
        </div>
      </div>

      <div class="rail">
        <span>© Grave Goods — a worker-owned grave</span>
        <span>★ no gods, no masters, no minimum order ★</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  background: var(--bg-sunken);
  border-top: 1px solid var(--border);
  margin-top: clamp(2rem, 5vw, 4rem);
}
.footer-inner {
  width: min(1120px, 92vw);
  margin: 0 auto;
  padding: clamp(2rem, 5vw, 3.5rem) 0 1.5rem;
}

.grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr 1fr;
  gap: clamp(1.5rem, 4vw, 3rem);
}

.brand {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: 1.5rem;
  letter-spacing: 0.04em;
  color: var(--fg);
  text-decoration: none;
}

.tagline {
  margin: 0.85rem 0 0;
  font-size: 0.85rem;
  line-height: 1.6;
  color: var(--fg-muted);
  max-width: 34ch;
}

.group-heading {
  margin: 0 0 0.75rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--fg-muted);
}

.link-col ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.link-col a {
  font-size: 0.92rem;
  color: var(--fg);
  text-decoration: none;
  transition: color 160ms var(--ease-out);
}
.link-col a:hover {
  color: var(--accent-soft);
}

.rail {
  margin-top: clamp(2rem, 4vw, 3rem);
  padding-top: 1.25rem;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  font-size: 0.78rem;
  color: var(--fg-faint);
  letter-spacing: 0.06em;
}

@media (max-width: 800px) {
  .grid {
    grid-template-columns: 1fr 1fr;
  }
  .brand-col {
    grid-column: 1 / -1;
  }
}
</style>

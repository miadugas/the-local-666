<script setup lang="ts">
import { useCartStore } from "../stores/cart";

const cart = useCartStore();

// RouterLinks so nav works from any page (incl. the content pages where the
// Header now lives). Hash items route home first, then scrollBehavior (router)
// scrolls to the section; About is a real route.
const NAV = [
  { label: "Shop", to: { path: "/", hash: "#shop" } },
  { label: "Manifesto", to: { path: "/", hash: "#manifesto" } },
  { label: "About", to: { path: "/about" } },
];
</script>

<template>
  <header class="site-header">
    <RouterLink to="/" class="brand" aria-label="Grave Goods — home">
      grave<span class="brand-accent">goods</span>
    </RouterLink>

    <nav class="site-nav" aria-label="Primary">
      <RouterLink v-for="item in NAV" :key="item.label" :to="item.to">
        {{ item.label }}
      </RouterLink>
    </nav>

    <button type="button" class="cart-btn" @click="cart.open()">
      Cart · {{ cart.count }}
    </button>
  </header>
</template>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1rem clamp(1rem, 4vw, 2.25rem);
  background: var(--color-pitch);
  border-bottom: var(--border-bone);
}

.brand {
  font-family: var(--font-brand);
  font-size: clamp(1.3rem, 2.6vw, 1.625rem);
  letter-spacing: 0.01em;
  color: var(--fg);
  text-decoration: none;
  line-height: 1;
}
.brand-accent {
  color: var(--color-acid-pink);
}

.site-nav {
  display: flex;
  gap: clamp(1rem, 3vw, 1.75rem);
  flex-wrap: wrap;
}

.site-nav a {
  color: var(--fg);
  text-decoration: none;
  font-family: var(--font-body);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  transition: color var(--duration-fast) var(--ease-snap);
}

.site-nav a:hover {
  color: var(--color-acid-blue);
}

.cart-btn {
  background: var(--color-acid-pink);
  color: var(--color-ink);
  border: var(--border-ink);
  /* 44px min for touch — meets iOS tap-target guideline */
  min-height: 44px;
  padding: 0.5rem 0.95rem;
  font-family: var(--font-body);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  cursor: pointer;
  box-shadow: var(--shadow-block-bone);
  transition: transform var(--duration-fast) var(--ease-snap);
}

.cart-btn:hover {
  transform: translate(-1px, -1px);
}
.cart-btn:active {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 var(--color-bone);
}

/* :focus-visible handled globally in global.css */

@media (max-width: 640px) {
  .site-nav {
    display: none; /* hamburger toggle out of scope for v1 */
  }
}
</style>

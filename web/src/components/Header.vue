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
    <RouterLink to="/" class="brand" aria-label="The Local 666 — home">
      <img src="/brand/wordmark.png" alt="" class="brand-logo" />
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
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  line-height: 0;
}
.brand-logo {
  height: clamp(26px, 4.5vw, 40px);
  width: auto;
  display: block;
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

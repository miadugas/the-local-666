<script setup lang="ts">
const NAV = [
  { label: "Stickers", href: "#" },
  { label: "Tarot", href: "#" },
  { label: "ACAB", href: "#" },
  { label: "Queer joy", href: "#" },
  { label: "Demons", href: "#" },
  { label: "Mutual aid", href: "#" },
  { label: "The zine", href: "#" },
];
</script>

<template>
  <header class="site-header">
    <a href="/" class="brand">Grave Goods</a>

    <nav class="site-nav" aria-label="Primary">
      <a v-for="item in NAV" :key="item.label" :href="item.href">
        {{ item.label }}
      </a>
    </nav>

    <div class="header-actions">
      <button type="button" class="icon-btn" aria-label="Search">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </button>
      <button type="button" class="icon-btn" aria-label="Account">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </button>
      <button type="button" class="cart-btn" aria-label="Cart">
        Cart
        <span class="cart-count">· $0</span>
      </button>
    </div>
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
  padding: 1rem clamp(1rem, 4vw, 3rem);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  background: rgba(8, 8, 8, 0.78);
  border-bottom: 1px solid var(--border);
}

.brand {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: clamp(1.2rem, 2.4vw, 1.65rem);
  letter-spacing: 0.04em;
  color: var(--fg);
  text-decoration: none;
}

.site-nav {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.site-nav a {
  color: var(--fg-muted);
  text-decoration: none;
  font-size: 0.92rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  transition: color 160ms var(--ease-out);
}

.site-nav a:hover {
  color: var(--accent);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.icon-btn {
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 9999px;
  width: 2.25rem;
  height: 2.25rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--fg);
  transition:
    border-color 160ms,
    background 160ms;
}
.icon-btn:hover {
  border-color: var(--border-strong);
  background: rgba(239, 231, 218, 0.06);
}

.cart-btn {
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 9999px;
  padding: 0.5rem 0.95rem;
  font-family: var(--font-body);
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--fg);
  cursor: pointer;
  transition:
    border-color 160ms,
    background 160ms,
    color 160ms;
}
.cart-btn:hover {
  border-color: var(--accent);
  background: rgba(255, 78, 43, 0.1);
  color: var(--accent-soft);
}
.cart-count {
  opacity: 0.65;
  margin-left: 0.25rem;
}
</style>

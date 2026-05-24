<script setup lang="ts">
// Purely presentational.
</script>

<template>
  <footer class="site-footer">
    <nav class="footer-nav" aria-label="Footer">
      <RouterLink to="/">Shop</RouterLink>
      <RouterLink to="/shipping">Shipping &amp; Returns</RouterLink>
      <RouterLink to="/privacy">Privacy</RouterLink>
      <RouterLink to="/about">About</RouterLink>
      <a href="mailto:hello@thelocal666.com">Contact</a>
    </nav>
    <div class="footer-meta">
      <span class="left">© The Local 666 · Made by hand</span>
      <span class="center">hail thyself</span>
      <span class="right">Bulk-printed in Denver, Colorado</span>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 2rem clamp(1rem, 4vw, 2.25rem);
  background: var(--color-pitch);
  border-top: var(--border-bone);
}

.footer-nav {
  display: flex;
  flex-wrap: wrap;
  gap: clamp(1rem, 3vw, 1.75rem);
}
.footer-nav a {
  font-family: var(--font-body);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  color: var(--fg);
  text-decoration: none;
  transition: color var(--duration-fast) var(--ease-snap);
}
.footer-nav a:hover {
  color: var(--color-acid-blue);
}

.footer-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}
.left,
.right {
  font-family: var(--font-zine);
  font-size: 0.7rem;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--fg);
}
.center {
  font-family: var(--font-brand);
  font-size: 1rem;
  color: var(--color-acid-pink);
  text-transform: none;
  letter-spacing: 0.01em;
}

@media (max-width: 640px) {
  .footer-meta {
    flex-direction: column;
    text-align: center;
  }
}
</style>

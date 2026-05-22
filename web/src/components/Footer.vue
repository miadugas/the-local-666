<script setup lang="ts">
// Purely presentational.
</script>

<template>
  <footer class="site-footer">
    <span class="left">© Grave Goods · Made by hand</span>
    <span class="center">hail thyself</span>
    <span class="right">Bulk-printed in Denver, Colorado</span>
  </footer>
</template>

<style scoped>
.site-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 2rem clamp(1rem, 4vw, 2.25rem);
  background: var(--color-pitch);
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
  .site-footer {
    flex-direction: column;
    text-align: center;
  }
}
</style>

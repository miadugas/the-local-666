<script setup lang="ts">
import ContentPage from "../components/ContentPage.vue";
</script>

<template>
  <ContentPage title="Nothing buried here" eyebrow="Error 404">
    <p>
      This grave's empty. Whatever you were digging for got moved, deleted, or
      never clawed its way out in the first place.
    </p>
    <RouterLink to="/" class="back-link">← Back to the shop</RouterLink>
  </ContentPage>
</template>

<style scoped>
/* Secondary CTA: bone fill, ink text, ink border, acid-blue offset shadow. */
.back-link {
  display: inline-block;
  margin-top: 0.5rem;
  background: var(--color-bone);
  color: var(--color-ink) !important;
  border: var(--border-ink);
  box-shadow: 4px 4px 0 var(--color-acid-blue);
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  text-decoration: none;
  padding: 0.7rem 1.1rem;
  transition: transform var(--duration-fast) var(--ease-snap);
}
.back-link:hover {
  transform: translate(-1px, -1px);
}
.back-link:active {
  transform: translate(2px, 2px);
}
</style>

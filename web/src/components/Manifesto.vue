<script setup lang="ts">
// Purely presentational.
</script>

<template>
  <section id="manifesto" class="manifesto" aria-label="Manifesto">
    <span class="eyebrow tape">The part where we get serious</span>
    <p class="quote">
      We don't sell merch. We sell vinyl
      <em class="hl">visible dissent</em>
      — and we are never, ever going to ask you to manifest abundance.
    </p>
  </section>
</template>

<style scoped>
.manifesto {
  padding: clamp(3rem, 8vw, 5rem) clamp(1rem, 4vw, 2.25rem);
  background: var(--color-pitch);
  border-bottom: var(--border-bone);
  text-align: center;
}

.eyebrow {
  --tape-color: var(--color-acid-lime);
  --tape-rotate: var(--rotate-stencil);
  --tape-mask: url(/torn-tape-3.svg);
  margin-bottom: 1.75rem;
}

.quote {
  font-family: var(--font-brand);
  font-size: clamp(1.75rem, 4.5vw, 2.375rem);
  line-height: 1.25;
  max-width: 720px;
  margin: 0 auto;
  color: var(--fg);
}

.hl {
  background: var(--color-acid-pink);
  color: var(--color-ink);
  font-style: normal;
  padding: 0 0.5rem;
  transform: rotate(-1deg);
  display: inline-block;
}
</style>

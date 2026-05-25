<script setup lang="ts">
// Purely presentational.
</script>

<template>
  <section id="manifesto" class="manifesto" aria-label="Manifesto">
    <span class="eyebrow tape">The part where we get serious</span>
    <p class="quote">
      We don't sell merch. We sell
      <em class="hl">visible dissent</em>
      — and we are never, ever going to ask you to manifest abundance.
    </p>
    <p class="pledge">
      <strong class="pledge-amt">25%</strong> of net profit, every quarter — to
      mutual aid and the people doing the work this moment is trying to crush.
      After the lights stay on, a quarter of every dollar goes back to where
      it's needed.
      <RouterLink to="/about" class="pledge-link"
        >See where it goes →</RouterLink
      >
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
  --tape-color: var(--color-acid-orange);
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

.pledge {
  font-family: var(--font-body);
  font-weight: 500;
  font-size: 1rem;
  line-height: 1.6;
  max-width: 60ch;
  margin: 2rem auto 0;
  text-align: left;
  color: color-mix(in oklab, var(--color-bone) 88%, transparent);
}

.pledge-amt {
  font-family: var(--font-display);
  font-weight: 400;
  font-size: 1.4rem;
  color: var(--color-acid-lime);
  letter-spacing: 0.01em;
}

.pledge-link {
  font-family: var(--font-body);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--color-acid-pink);
  text-decoration: none;
  white-space: nowrap;
}
.pledge-link:hover {
  text-decoration: underline;
}
</style>

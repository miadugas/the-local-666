<script setup lang="ts">
// No script state — purely presentational.
</script>

<template>
  <section class="hero">
    <span class="eyebrow tape">Vol. I · A Catalog of Refusals</span>

    <h1 class="headline">
      Solidarity is <br />
      Eternal
    </h1>

    <p class="lede">
      Die-cut vinyl, built for daily abuse — not your junk drawer. Slap them on
      laptops, lockers, gas pumps, hearses, and the back of every cop car you
      can find.
    </p>

    <div class="ctas">
      <a href="#shop" class="cta cta-primary">Shop all</a>
      <a href="#manifesto" class="cta cta-secondary">Read the manifesto</a>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  overflow: hidden;
  padding: clamp(3rem, 8vw, 5rem) clamp(1rem, 4vw, 2.25rem)
    clamp(4rem, 9vw, 6rem);
  text-align: center;
  background:
    radial-gradient(
      circle at 20% 80%,
      rgba(255, 45, 138, 0.18),
      transparent 45%
    ),
    radial-gradient(
      circle at 80% 20%,
      rgba(0, 212, 255, 0.14),
      transparent 45%
    ),
    var(--color-pitch);
  border-bottom: var(--border-bone);
}

.eyebrow {
  --tape-color: var(--color-acid-orange);
  --tape-rotate: var(--rotate-stencil);
  --tape-mask: url(/torn-tape-2.svg);
  margin-bottom: 1.5rem;
  z-index: 1;
}

.headline {
  position: relative;
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 8vw, 4.875rem);
  line-height: 0.9;
  color: var(--fg);
  text-shadow:
    4px 4px 0 var(--color-acid-pink),
    8px 8px 0 var(--color-acid-blue);
  margin: 0 0 1.5rem;
  z-index: 1;
}

.lede {
  position: relative;
  font-size: 1rem;
  line-height: 1.55;
  max-width: 540px;
  margin: 0 auto 2rem;
  color: var(--fg);
  font-weight: 500;
  z-index: 1;
}

.ctas {
  position: relative;
  display: flex;
  gap: 0.875rem;
  justify-content: center;
  flex-wrap: wrap;
  z-index: 1;
}

.cta {
  font-family: var(--font-body);
  font-size: 0.8rem;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  font-weight: 700;
  padding: 0.875rem 1.625rem;
  border: var(--border-ink);
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  transition: transform var(--duration-fast) var(--ease-snap);
}

.cta-primary {
  background: var(--color-acid-pink);
  color: var(--color-ink);
  box-shadow: var(--shadow-block-bone);
}

.cta-secondary {
  background: var(--color-bone);
  color: var(--color-ink);
  box-shadow: var(--shadow-block-blue);
}

.cta:hover {
  transform: translate(-1px, -1px);
}
.cta:active {
  transform: translate(2px, 2px);
}

/* :focus-visible handled globally in global.css */

@media (max-width: 640px) {
  .headline {
    font-size: 3rem;
    text-shadow:
      3px 3px 0 var(--color-acid-pink),
      6px 6px 0 var(--color-acid-blue);
  }
}
</style>

<script setup lang="ts">
// No script state — purely presentational.
</script>

<template>
  <section class="hero">
    <span class="splatter" aria-hidden="true"></span>

    <span class="eyebrow">Vol. I · A Catalog of Refusals</span>

    <h1 class="headline">
      Stickers for<br />
      the positively<br />
      damned
    </h1>

    <p class="lede">
      Die-cut vinyl from a punk-leftist sticker shop. Slapped on laptops,
      lockers, gas pumps, hearses, and the back of every cop car we can find.
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

/* Hand-tuned splatter constellation. Don't add a transform: translate to
   "true center" — it pushes every dot onto half-pixels and they anti-alias
   into mush. The 3px off-center is intentional. */
.splatter {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 6px;
  height: 6px;
  background: var(--color-acid-pink);
  border-radius: 50%;
  pointer-events: none;
  opacity: 0.7;
  box-shadow:
    80px 40px 0 -1px var(--color-acid-blue),
    -120px 80px 0 var(--color-acid-yellow),
    200px -20px 0 -2px var(--color-acid-lime),
    -80px -60px 0 -1px var(--color-acid-pink),
    300px 100px 0 -2px var(--color-acid-blue),
    -200px 30px 0 0 var(--color-acid-yellow),
    120px -100px 0 -1px var(--color-acid-lime),
    -260px -120px 0 -2px var(--color-acid-pink),
    260px 160px 0 -1px var(--color-acid-blue);
}

.eyebrow {
  position: relative;
  display: inline-block;
  font-family: var(--font-zine);
  background: var(--color-acid-yellow);
  color: var(--color-ink);
  padding: 0.25rem 0.85rem;
  font-size: 0.7rem;
  letter-spacing: var(--tracking-shout);
  text-transform: uppercase;
  transform: rotate(var(--rotate-stencil));
  border: var(--border-ink);
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

.cta:focus-visible {
  outline: 3px solid var(--color-acid-blue);
  outline-offset: 3px;
}

@media (max-width: 640px) {
  .headline {
    font-size: 3rem;
    text-shadow:
      3px 3px 0 var(--color-acid-pink),
      6px 6px 0 var(--color-acid-blue);
  }
}
</style>

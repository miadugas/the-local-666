<script setup lang="ts">
// Concept B hero — atmospheric, Cinzel monumental headline + 3 translucent
// panel cards on the right. No riso sample, no off-register, no halftones.
</script>

<template>
  <section class="hero">
    <div class="hero-inner">
      <div class="hero-copy">
        <p class="eyebrow">Drop one · for the haunted</p>
        <h1>No gods. Just stickers.</h1>
        <p class="lede">
          Small-batch handmade die-cut vinyl. Half the profits go to bail funds.
          The other half buys more ink.
        </p>
        <div class="hero-actions">
          <a href="#shop" class="btn btn-primary">Shop the drop</a>
          <a href="#manifesto" class="btn btn-secondary">Read the manifesto</a>
        </div>
      </div>

      <aside class="hero-cards" aria-label="What we're about">
        <article class="hero-card">
          <p class="card-eyebrow">Featured drop</p>
          <div class="featured">
            <img
              src="/stickers/protect-trans-kids.png"
              alt="Protect Trans Kids sticker"
              draggable="false"
            />
            <div>
              <h3>Protect Trans Kids</h3>
              <p class="card-meta">3" die-cut vinyl · $4</p>
            </div>
          </div>
        </article>

        <article class="hero-card">
          <p class="card-eyebrow">Mutual aid</p>
          <p class="card-body">
            50% of profits go to the Colorado Freedom Fund. We do not manifest
            abundance. We pay bail.
          </p>
        </article>

        <article class="hero-card">
          <p class="card-eyebrow">Two people · Denver</p>
          <p class="card-body">
            Printed in a mile-high basement by a pack of two queer lesbo's and a
            cat named Circe.
          </p>
        </article>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.hero {
  padding: clamp(2.5rem, 7vw, 6rem) 0 clamp(3rem, 8vw, 7rem);
}
.hero-inner {
  width: min(1120px, 92vw);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: clamp(2rem, 5vw, 4rem);
  align-items: center;
}

.eyebrow {
  margin: 0 0 0.75rem;
  text-transform: uppercase;
  font-size: 0.78rem;
  letter-spacing: 0.15em;
  color: var(--accent-soft);
}

.hero-copy h1 {
  margin: 0;
  max-width: 11ch;
  font-family: var(--font-display);
  font-weight: 900;
  font-size: clamp(2.4rem, 7vw, 5rem);
  line-height: 0.98;
  letter-spacing: 0.01em;
  color: var(--fg);
}

.lede {
  margin: 1.4rem 0 0;
  max-width: 56ch;
  font-size: 1.05rem;
  line-height: 1.55;
  color: var(--fg-muted);
}

.hero-actions {
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
  margin-top: 1.6rem;
}

.btn {
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 0.85rem;
  letter-spacing: 0.04em;
  text-decoration: none;
  padding: 0.7rem 1.25rem;
  border-radius: 9999px;
  border: 1px solid transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    transform 220ms var(--ease-out),
    box-shadow 220ms var(--ease-out),
    background 220ms var(--ease-out),
    color 220ms var(--ease-out);
}
.btn-primary {
  background: linear-gradient(145deg, var(--accent), var(--accent-deep));
  color: #fff9f1;
  box-shadow: var(--shadow-glow-ember);
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow:
    var(--shadow-glow-ember),
    0 24px 48px rgba(255, 95, 50, 0.3);
}
.btn-secondary {
  background: transparent;
  color: var(--fg);
  border-color: var(--border);
}
.btn-secondary:hover {
  transform: translateY(-2px);
  border-color: var(--border-strong);
  background: rgba(239, 231, 218, 0.05);
}

.hero-cards {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.hero-card {
  padding: 1.1rem 1.2rem;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(6px);
}

.card-eyebrow {
  margin: 0 0 0.55rem;
  font-size: 0.7rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent-soft);
  font-weight: 600;
}

.hero-card h3 {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.05rem;
  letter-spacing: 0.02em;
  color: var(--fg);
}

.card-meta {
  margin: 0.15rem 0 0;
  font-size: 0.8rem;
  color: var(--fg-muted);
  letter-spacing: 0.04em;
}

.card-body {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.5;
  color: var(--fg-muted);
}

.featured {
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 0.85rem;
  align-items: center;
}
.featured img {
  width: 56px;
  height: 56px;
  object-fit: contain;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.55));
}

@media (max-width: 880px) {
  .hero-inner {
    grid-template-columns: 1fr;
  }
}
</style>

<script setup lang="ts">
import SectionRule from "./SectionRule.vue";
</script>

<template>
  <section id="manifesto" class="manifesto">
    <div class="manifesto-inner">
      <SectionRule
        kicker="A statement"
        title="No gods. No masters. No minimum order."
      />

      <div class="grid">
        <blockquote class="pull">
          <p>
            We're a two-person operation in Denver. We print stickers, we send
            half the profits to bail funds, and we're never going to ask you to
            manifest abundance.
          </p>
        </blockquote>

        <div class="body">
          <p>
            The shop is named after the objects buried with the dead — small
            useful things meant for the next world. Ours are smaller, more
            useful, and for this one. Queer rights · ACAB · free Palestine · sex
            worker solidarity.
          </p>

          <div class="actions">
            <a href="#" class="btn-outline">Read our mutual-aid log</a>
            <a href="#" class="btn-ghost">Press &amp; wholesale</a>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.manifesto {
  padding: clamp(2.5rem, 6vw, 5rem) 0;
}
.manifesto-inner {
  width: min(1120px, 92vw);
  margin: 0 auto;
}

.grid {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: clamp(1.5rem, 4vw, 3rem);
  align-items: start;
}

.pull {
  margin: 0;
  padding: 1.5rem 1.6rem;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-soft);
}
.pull p {
  margin: 0;
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 500;
  font-size: clamp(1.15rem, 2vw, 1.45rem);
  line-height: 1.45;
  color: var(--fg);
  letter-spacing: 0.01em;
}

.body p {
  margin: 0;
  font-size: 1rem;
  line-height: 1.65;
  color: var(--fg-muted);
}

.actions {
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
  margin-top: 1.4rem;
}

.btn-outline,
.btn-ghost {
  font-family: var(--font-body);
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 0.65rem 1.1rem;
  border-radius: 9999px;
  text-decoration: none;
  cursor: pointer;
  transition:
    transform 200ms var(--ease-out),
    background 200ms,
    color 200ms,
    border-color 200ms;
}
.btn-outline {
  background: transparent;
  color: var(--fg);
  border: 1px solid var(--border);
}
.btn-outline:hover {
  transform: translateY(-2px);
  border-color: var(--accent);
  color: var(--accent-soft);
}

.btn-ghost {
  background: transparent;
  color: var(--fg-muted);
  border: 1px solid transparent;
  padding-left: 0.6rem;
  padding-right: 0.6rem;
  text-decoration: underline;
  text-decoration-thickness: 1.5px;
  text-underline-offset: 4px;
}
.btn-ghost:hover {
  color: var(--accent-soft);
}

@media (max-width: 800px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
